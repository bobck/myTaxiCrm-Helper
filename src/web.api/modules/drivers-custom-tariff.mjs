import {
    getDiscountTariffsForAutoparksByDay,
    getDriversForCustomTerms,
    makeCRMRequestlimited
} from '../web.api.utlites.mjs'

import {
    saveCreatedDriverCustomTariffId,
    markDriverCustomTariffAsDeleted,
    getUndeletedDriversCustomTariffIds
} from '../web.api.queries.mjs';

export async function setDriversCustomTariff() {

    const currentDate = new Date();
    const timeZone = 'Europe/Kiev'

    const options = {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    const currentDateTimeInKiev = currentDate.toLocaleString('en-US', options);
    const dayOfWeek = process.env.DAYNAME || currentDate.toLocaleDateString('en-US', { timeZone, weekday: 'long' });

    const [m, d, y] = currentDateTimeInKiev.split('/');
    const isoDate = process.env.ISODATE || `${y}-${m}-${d}`

    const companyId = process.env.WEB_API_TARGET_CONPANY_ID

    const { discountTariffsForAutoparks } = await getDiscountTariffsForAutoparksByDay({ dayOfWeek, companyId });


    const { driversForCustomTerms } = await getDriversForCustomTerms({ isoDate, companyId });
    console.log({ driversForCustomTermsLength: driversForCustomTerms.length })

    const discountTariffsForAutoparksWithDriver = []

    for (let driver of driversForCustomTerms) {
        const { auto_park_id, id } = driver
        const clonedObjectWithExtraProperty = { driverId: id, ...discountTariffsForAutoparks[auto_park_id] };
        discountTariffsForAutoparksWithDriver.push(clonedObjectWithExtraProperty)
    }

    console.log({ discountTariffsForAutoparksWithDriverLength: discountTariffsForAutoparksWithDriver.length })

    for (let createDriverCustomTariffInput of discountTariffsForAutoparksWithDriver) {

        const body = {
            operationName: "CreateDriverCustomTariff",
            variables: {
                createDriverCustomTariffInput
            },
            query: "mutation CreateDriverCustomTariff($createDriverCustomTariffInput: CreateDriverCustomTariffInput!) {\n  createDriverCustomTariff(\n    createDriverCustomTariffInput: $createDriverCustomTariffInput\n  ) {\n    id\n    name\n    taxPercent\n    taxType\n    targetMarker\n    accounting\n    tariffRules {\n      id\n      rate\n      from\n      to\n      __typename\n    }\n    __typename\n  }\n}\n"
        }

        try {
            const response = await makeCRMRequestlimited({ body });
            const { data } = response

            const { createDriverCustomTariff } = data;

            const tariffId = createDriverCustomTariff.id
            const driverId = createDriverCustomTariffInput.driverId
            console.log({ tariffId, driverId })
            await saveCreatedDriverCustomTariffId({ tariffId, driverId });

        } catch (errors) {
            console.error({ date: new Date(), createDriverCustomTariffInput, errors })
            continue
        }
    }

}

export async function deleteDriversCustomTariff() {

    const { undeletedDriversCustomTariffIds } = await getUndeletedDriversCustomTariffIds();

    for (let deleteDriverCustomTariffInput of undeletedDriversCustomTariffIds) {
        console.log({ deleteDriverCustomTariffInput })
        const { tariff_id: tariffId, driver_id: driverId } = deleteDriverCustomTariffInput

        const body = {
            operationName: "DeleteDriverCustomTariff",
            variables: {
                deleteDriverCustomTariffInput: { tariffId, driverId }
            },
            "query": "mutation DeleteDriverCustomTariff($deleteDriverCustomTariffInput: DeleteDriverCustomTariffInput!) {\n  deleteDriverCustomTariff(\n    deleteDriverCustomTariffInput: $deleteDriverCustomTariffInput\n  ) {\n    success\n    __typename\n  }\n}\n"
        }

        try {
            const response = await makeCRMRequestlimited({ body });
            const { data } = response
            console.log({ data })
            await markDriverCustomTariffAsDeleted({ tariffId });

        } catch (errors) {
            console.error({ date: new Date(), tariffId, errors })
            continue

        }

    }

}

if (process.env.ENV == "TEST") {
    setDriversCustomTariff();
    // deleteDriversCustomTariff();
}

