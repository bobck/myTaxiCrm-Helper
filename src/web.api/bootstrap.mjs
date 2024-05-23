import {
    deleteDriversCustomTariffJob
} from './jobs/delete-drivers-custom-tarrif-job.mjs'

import {
    setDriversCustomTariffJob
} from './jobs/set-drivers-custom-tarrif-job.mjs'

import {
    setDriversCustomBonusJob
} from './jobs/set-drivers-custom-bonus-job.mjs'

import {
    deleteDriversCustomBonusJob
} from './jobs/delete-drivers-custom-bonus-job.mjs'

import { createCRMApplicationsFromRemonlineTransactionJob } from './jobs/create-applications-from-remonline-transactions.mjs'


export function driversCustomTariffJobs() {
    try {
        deleteDriversCustomTariffJob.start();
        setDriversCustomTariffJob.start();

        setDriversCustomBonusJob.start();
        deleteDriversCustomBonusJob.start();
        console.log('driversCustomTariff And Bonus Jobs runs...')

        createCRMApplicationsFromRemonlineTransactionJob.start();
        console.log('createCRMApplicationsFromRemonlineTransaction Job runs...')
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        deleteDriversCustomTariffJob.stop();
        setDriversCustomTariffJob.stop();

        setDriversCustomBonusJob.stop();
        deleteDriversCustomBonusJob.stop();

        createCRMApplicationsFromRemonlineTransactionJob.stop();
        driversCustomTariffJobs();
    }
}