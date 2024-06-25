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

import { saveContractorsListJob } from './jobs/save-and-update-contractors.mjs'

import { createCRMApplicationsFromRemonlineTransactionJob } from './jobs/create-applications-from-remonline-transactions.mjs'

import { addNewDriversAutoparkRevenueJob } from './jobs/add-drivers-with-revenue-job.mjs'
import { updateDriversWithRevenueJob } from './jobs/update-drivers-with-revenue-job.mjs'

export function driversCustomTariffJobs() {
    try {
        deleteDriversCustomTariffJob.start();
        setDriversCustomTariffJob.start();

        setDriversCustomBonusJob.start();
        deleteDriversCustomBonusJob.start();
        console.log('driversCustomTariff And Bonus Jobs runs...')
        saveContractorsListJob.start();
        createCRMApplicationsFromRemonlineTransactionJob.start();
        console.log('createCRMApplicationsFromRemonlineTransaction Job runs...')
        updateDriversWithRevenueJob.start();
        addNewDriversAutoparkRevenueJob.start();
        console.log('add and update DriversWithRevenue Job runs...')
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        deleteDriversCustomTariffJob.stop();
        setDriversCustomTariffJob.stop();

        setDriversCustomBonusJob.stop();
        deleteDriversCustomBonusJob.stop();

        saveContractorsListJob.stop();

        createCRMApplicationsFromRemonlineTransactionJob.stop();

        updateDriversWithRevenueJob.stop();
        addNewDriversAutoparkRevenueJob.stop();
        driversCustomTariffJobs();
    }
}