import { initApi } from './src/api/endpoints.mjs'
import { telegramJobs } from './src/telegram/bootstrap.mjs'
import { openSShTunel } from './ssh.mjs';
import { sheetJobs } from './src/sheets/bootstrap.mjs';
import { remonlineJobs } from './src/remonline/bootstrap.mjs';
import { remonlineTokenToEnv } from './src/remonline/remonline.api.mjs';
import { bqJobs } from './src/bq/bootstrap.mjs';
import { driversCustomTariffJobs } from './src/web.api/bootstrap.mjs';
import {getPoolState, pool} from './src/api/pool.mjs';
import { bitrixJobs } from './src/bitrix/bootstrap.mjs';
import {getBrandingCardsInfo} from "./src/web.api/web.api.utlites.mjs";
import {createAndUpdateDriverBrandingCards} from "./src/bitrix/modules/create-and-update-driver-branding-cards.mjs";
import {createDriverBrandingCardItem} from "./src/bitrix/bitrix.utils.mjs";
import {
    resetBrandingCardJob
} from "./src/bitrix/jobs/reset-driver-branding-cards-job.mjs";
import {cleanUpBrandingCards} from "./src/bitrix/bitrix.queries.mjs";

await openSShTunel;

await initApi({ pool });
// telegramJobs();
// sheetJobs();
// bqJobs();
// pool.getPoolState();
// getPoolState();
// await remonlineTokenToEnv();
// remonlineJobs();

await createAndUpdateDriverBrandingCards();
// await createDriverBrandingCardItem();
// driversCustomTariffJobs();
// bitrixJobs();