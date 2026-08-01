/**
 * Playground: проверка влияния переименования колонок в driver_report_cards.
 *
 * Контекст: в аналитической схеме period_from / period_to у driver_report_cards
 * заменяют на date (view переезжает на новую таблицу). Всё, что читает старые
 * колонки, должно сломаться.
 *
 * Что делает скрипт (только чтение, ничего не пишет):
 *  1) определяет, driver_report_cards — это таблица или view, и если view — на что смотрит;
 *  2) выводит реальный список колонок (есть ли period_from / period_to / date);
 *  3) ищет "новую табличку" (любые relations c именем *report_card*);
 *  4) гоняет EXPLAIN (без ANALYZE — данные не читаются) по всем SQL проекта,
 *     которые ссылаются на driver_report_cards, и показывает, что именно падает.
 *
 * Запуск:
 *   node -r dotenv/config playground-drc.mjs
 */

import fs from 'fs';
import { pool } from './src/api/pool.mjs';

const REL = 'driver_report_cards';
const CHANGED_COLS = ['period_from', 'period_to'];
const NEW_COL = 'date';

// SQL-файлы проекта, которые ссылаются на driver_report_cards, с фиктивными
// параметрами правильных типов — чтобы EXPLAIN прошёл анализ запроса.
const SQL_TARGETS = [
  {
    file: 'src/sql/get_bolt_drivers_to_ban.sql',
    // $1 period_from(date), $2 week(int), $3 year(int), $4 driver_ids(uuid[])
    params: ['2026-06-01', 25, 2026, ['00000000-0000-0000-0000-000000000000']],
  },
  {
    file: 'src/sql/drivers_with_fuel_cards.sql',
    // $1 date
    params: ['2026-06-01'],
  },
  {
    file: 'src/sql/get_driver_trips_count_by_period.sql',
    // $1 driver_id(uuid), $2 auto_park_id(uuid), $3 from(ts), $4 to(ts)
    params: [
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      '2026-06-01',
      '2026-06-08',
    ],
  },
  {
    file: 'src/sql/poland_bookkeeping.sql',
    // $1 from(date), $2 to(date), $3 auto_park_id(uuid)
    params: ['2026-06-01', '2026-06-30', '00000000-0000-0000-0000-000000000000'],
  },
  {
    file: 'src/sql/gdc-report/mileages_and_hours_online.sql',
    // $1 week(int), $2 year(int)
    params: [25, 2026],
  },
];

const line = (s = '') => console.log(s);
const hr = () => line('─'.repeat(72));

async function relationKind(client) {
  const { rows } = await client.query(
    `SELECT n.nspname AS schema,
            c.relkind,
            CASE c.relkind
              WHEN 'r' THEN 'TABLE'
              WHEN 'v' THEN 'VIEW'
              WHEN 'm' THEN 'MATERIALIZED VIEW'
              WHEN 'p' THEN 'PARTITIONED TABLE'
              WHEN 'f' THEN 'FOREIGN TABLE'
              ELSE c.relkind::text
            END AS kind
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = $1
      ORDER BY (n.nspname = 'public') DESC, n.nspname`,
    [REL]
  );
  return rows;
}

async function columns(client, schema) {
  const { rows } = await client.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position`,
    [schema, REL]
  );
  return rows;
}

async function viewDef(client, schema) {
  const { rows } = await client.query(
    `SELECT pg_get_viewdef(format('%I.%I', $1::text, $2::text)::regclass, true) AS def`,
    [schema, REL]
  );
  return rows[0]?.def ?? null;
}

async function discoverReportCardRelations(client) {
  const { rows } = await client.query(
    `SELECT n.nspname AS schema,
            c.relname AS name,
            CASE c.relkind WHEN 'r' THEN 'TABLE' WHEN 'v' THEN 'VIEW'
                           WHEN 'm' THEN 'MATVIEW' WHEN 'p' THEN 'PART.TABLE'
                           ELSE c.relkind::text END AS kind,
            EXISTS (SELECT 1 FROM information_schema.columns col
                     WHERE col.table_schema = n.nspname
                       AND col.table_name = c.relname
                       AND col.column_name = 'date') AS has_date,
            EXISTS (SELECT 1 FROM information_schema.columns col
                     WHERE col.table_schema = n.nspname
                       AND col.table_name = c.relname
                       AND col.column_name = 'period_from') AS has_period_from
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname ILIKE '%report_card%'
        AND c.relkind IN ('r','v','m','p')
      ORDER BY n.nspname, c.relname`
  );
  return rows;
}

// Статический скан: ссылки именно на driver_report_cards (алиас drc) по
// переименованным колонкам. EXPLAIN может упасть раньше по другой причине
// (отсутствующий car_routes/car_owners), поэтому грепаем исходник напрямую.
// Важно: целимся в `drc.<col>`, чтобы НЕ ловить cr.period_from / coh.period_from
// (это car_routes / car_odometer_history — отдельная проблема) и алиасы `AS period_from`.
function staticChangedRefs(sql) {
  const hits = [];
  const re = new RegExp(`\\bdrc\\.(${CHANGED_COLS.join('|')})\\b`, 'i');
  sql.split('\n').forEach((l, i) => {
    if (re.test(l)) hits.push({ ln: i + 1, text: l.trim() });
  });
  return hits;
}

async function explainCheck(client, target) {
  let sql;
  try {
    sql = fs.readFileSync(target.file).toString();
  } catch (e) {
    return { ok: false, stage: 'read', message: e.message, refs: [] };
  }
  const refs = staticChangedRefs(sql);
  // EXPLAIN без ANALYZE: планировщик резолвит имена/типы колонок, но НЕ выполняет запрос.
  try {
    await client.query(`EXPLAIN ${sql}`, target.params);
    return { ok: true, refs };
  } catch (e) {
    return {
      ok: false,
      stage: 'explain',
      code: e.code,
      message: e.message,
      position: e.position,
      refs,
    };
  }
}

async function main() {
  const client = await pool.connect();
  try {
    hr();
    line(`DB: ${process.env.PG_HOST}/${process.env.PG_DB} as ${process.env.PG_USER}`);
    line(`Проверяем relation: ${REL}`);
    hr();

    // 0) Куда реально смотрит неквалифицированное имя (search_path)
    const sp = (await client.query('SHOW search_path')).rows[0].search_path;
    let resolved = '(не резолвится)';
    try {
      resolved = (
        await client.query(`SELECT $1::regclass::text AS r`, [REL])
      ).rows[0].r;
    } catch (e) {
      resolved = `ERROR: ${e.message}`;
    }
    line(`\n0) search_path = ${sp}`);
    line(`   Неквалифицированное "${REL}" в коде резолвится в → ${resolved}`);

    // 1) Тип объекта
    const kinds = await relationKind(client);
    if (!kinds.length) {
      line(`❌ relation "${REL}" не найден ни в одной схеме!`);
      return;
    }
    const primary = kinds[0];
    line(`\n1) Что такое ${REL}:`);
    for (const k of kinds) {
      line(`   • ${k.schema}.${REL} → ${k.kind}`);
    }

    // 2) Колонки + ключевая проверка
    const cols = await columns(client, primary.schema);
    const colNames = cols.map((c) => c.column_name);
    line(`\n2) Колонки ${primary.schema}.${REL} (${colNames.length}):`);
    line('   ' + colNames.join(', '));

    line('\n   Ключевая проверка:');
    for (const c of CHANGED_COLS) {
      const present = colNames.includes(c);
      line(`   • ${c.padEnd(12)} ${present ? '✅ есть (старая схема)' : '❌ НЕТ (удалена/переименована)'}`);
    }
    const hasDate = colNames.includes(NEW_COL);
    line(`   • ${NEW_COL.padEnd(12)} ${hasDate ? '✅ есть (новая схема)' : '— нет'}`);

    const broken = CHANGED_COLS.filter((c) => !colNames.includes(c));
    line('');
    if (broken.length && hasDate) {
      line(`   ⇒ ПЕРЕИМЕНОВАНИЕ ПРОИЗОШЛО: нет [${broken.join(', ')}], появилась "${NEW_COL}".`);
    } else if (broken.length) {
      line(`   ⇒ Колонок [${broken.join(', ')}] больше нет (новой "${NEW_COL}" тоже не видно).`);
    } else {
      line(`   ⇒ Пока СТАРАЯ схема: ${CHANGED_COLS.join(' и ')} ещё на месте.`);
    }

    // 2b) Если это view — на что оно смотрит
    if (primary.kind.includes('VIEW')) {
      const def = await viewDef(client, primary.schema);
      line(`\n2b) Определение VIEW ${primary.schema}.${REL}:`);
      line(
        def
          ? def
              .split('\n')
              .map((l) => '     ' + l)
              .join('\n')
          : '   (не удалось получить определение)'
      );
    }

    // 3) Поиск "новой таблички"
    const related = await discoverReportCardRelations(client);
    line(`\n3) Все relations похожие на report_card:`);
    for (const r of related) {
      const flags = [
        r.has_date ? 'date✓' : 'date✗',
        r.has_period_from ? 'period_from✓' : 'period_from✗',
      ].join(' ');
      line(`   • ${r.schema}.${r.name}  [${r.kind}]  (${flags})`);
    }

    // 4) EXPLAIN по реальным SQL проекта
    hr();
    line(`4) EXPLAIN-проверка SQL проекта (без выполнения), которые читают ${REL}:\n`);
    let brokenCount = 0;
    for (const t of SQL_TARGETS) {
      const res = await explainCheck(client, t);
      const refsChanged = res.refs.length > 0; // файл реально читает period_from/period_to
      const explainColErr =
        !res.ok &&
        (res.code === '42703' ||
          /period_from|period_to/i.test(res.message || ''));

      // Приговор: сломается, если EXPLAIN упал на колонке ИЛИ файл статически
      // ссылается на переименованные колонки (даже если EXPLAIN упал по другой причине).
      const willBreak = explainColErr || refsChanged;
      if (willBreak) brokenCount++;

      if (res.ok) {
        line(`   ✅ PASS    ${t.file}`);
      } else if (explainColErr) {
        line(`   💥 BROKEN  ${t.file}`);
        line(`              EXPLAIN: [${res.code}] ${res.message}`);
      } else if (refsChanged) {
        line(`   💥 BROKEN  ${t.file}  (по ссылкам на колонки)`);
        line(`              EXPLAIN упал раньше по другой причине: [${res.code}] ${res.message}`);
      } else {
        line(`   ⚠️  FAIL   ${t.file}  (не связано с переименованием)`);
        line(`              [${res.code}] ${res.message}`);
      }
      if (refsChanged) {
        for (const r of res.refs) line(`                · L${r.ln}: ${r.text}`);
      }
    }
    line('');
    hr();
    line(`Итог: ${brokenCount}/${SQL_TARGETS.length} SQL сломаются из-за переименования period_from/period_to → ${NEW_COL}.`);
    hr();
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
