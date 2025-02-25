import { initApi } from './src/api/endpoints.mjs'
import { telegramJobs } from './src/telegram/bootstrap.mjs'
import { openSShTunel } from './ssh.mjs';
import { sheetJobs } from './src/sheets/bootstrap.mjs';
import { remonlineJobs } from './src/remonline/bootstrap.mjs';
import { remonlineTokenToEnv } from './src/remonline/remonline.api.mjs';
import { bqJobs } from './src/bq/bootstrap.mjs';
import { driversCustomTariffJobs } from './src/web.api/bootstrap.mjs';
import { pool } from './src/api/pool.mjs';
import { bitrixJobs } from './src/bitrix/bootstrap.mjs';

await openSShTunel;

await initApi({ pool });
// telegramJobs();
// sheetJobs();
// bqJobs();

await remonlineTokenToEnv();
remonlineJobs();

driversCustomTariffJobs();
bitrixJobs();