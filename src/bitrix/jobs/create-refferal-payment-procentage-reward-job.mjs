import { CronJob } from 'cron';
import { createRefferalPaymentProcentageReward } from '../modules/create-refferal-payment-procentage-reward.mjs';

const cronTime = '15 10 * * 1';

const timeZone = 'Europe/Kiev';

const job = CronJob.from({
    cronTime,
    timeZone,
    onTick: async () => {
        try {
            await createRefferalPaymentProcentageReward();
        } catch (error) {
            console.error('Error occurred in onTick on createRefferalPaymentProcentageReward');
            console.error({ time: new Date(), error });
        }
    }
});

export const createRefferalPaymentProcentageRewardJob = job;