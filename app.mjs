import { initApi } from './src/api/endpoints.mjs'
import { telegramJobs } from './src/telegram/bootstrap.mjs'
import { openSShTunel } from './ssh.mjs';
import { sheetJobs } from './src/sheets/bootstrap.mjs';
import { remonlineJobs } from './src/remonline/bootstrap.mjs';
import { remonlineTokenToEnv } from './src/remonline/remonline.api.mjs';
import { bqJobs } from './src/bq/bootstrap.mjs';

await openSShTunel;
await initApi();
telegramJobs();
sheetJobs();
bqJobs();

await remonlineTokenToEnv();
remonlineJobs();