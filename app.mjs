import { telegramJobs } from './src/telegram/bootstrap.mjs';
import { openSShTunnel } from './ssh.mjs';
import { sheetJobs } from './src/sheets/bootstrap.mjs';
import { remonlineJobs } from './src/remonline/bootstrap.mjs';
import { remonlineTokenToEnv } from './src/remonline/remonline.api.mjs';
import { bqJobs } from './src/bq/bootstrap.mjs';
import { driversCustomTariffJobs } from './src/web.api/bootstrap.mjs';

import { bitrixJobs } from './src/bitrix/bootstrap.mjs';
import { initApi } from './src/api/api.mjs';
import { startJobBoardJobs } from './src/job-boards/bootstrap.mjs';

await openSShTunnel;

await initApi();

// telegramJobs();
// sheetJobs();
bqJobs();

await remonlineTokenToEnv();
remonlineJobs();

driversCustomTariffJobs();
bitrixJobs();

startJobBoardJobs();
