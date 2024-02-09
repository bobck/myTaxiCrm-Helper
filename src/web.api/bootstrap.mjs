import {
    deleteDriversCustomTariffJob
} from './jobs/delete-drivers-custom-tarrif-job.mjs'

import {
    setDriversCustomTariffJob
} from './jobs/set-drivers-custom-tarrif-job.mjs'

export function driversCustomTariffJobs() {
    try {
        deleteDriversCustomTariffJob.start();
        setDriversCustomTariffJob.start();
        console.log('driversCustomTariffJobs runs...')
    } catch (error) {
        console.error('sync error, app down...')
        console.error({ time: new Date(), error });
        console.error('Trying to restart...')
        deleteDriversCustomTariffJob.stop();
        setDriversCustomTariffJob.stop();
        driversCustomTariffJobs();
    }
}