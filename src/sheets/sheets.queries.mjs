import { db } from '../shared/sqlite.mjs';

export async function savePlanRow({ trips, autopark_id }) {
  const result = await db.run(
    'INSERT INTO plan(trips,autopark_id) VALUES (:trips,:autopark_id)',
    {
      ':trips': trips,
      ':autopark_id': autopark_id,
    }
  );
  return { result };
}

export async function markAllAsNotLastVersion() {
  const result = await db.run('UPDATE plan SET is_last_version = false');
  return { result };
}
