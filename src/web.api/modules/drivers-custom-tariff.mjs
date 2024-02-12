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

    const autoParksIds = [
        '2bfb0c23-33d8-4bc3-ab03-442d6ba13712',
        '2964e082-0e86-4695-b5f5-98915d190518',
        'c6dc6608-1cb3-488d-97f6-3f1132732bb9',
        '472c4d3e-3fe7-45ea-9c94-a77f364bbd86',
        '65844e7d-5e8a-4582-9ac3-c8cdaa988726',
        '5571b3ea-1ccf-4f41-bbe0-0f12ee8dfb17',
        'e4df553f-4ec2-43a8-b012-4795259e983a',
        'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0',
        '34a2020d-d412-461c-ba0a-86e45f9afc78',
        'b0328dc5-71be-485d-b6ec-786d9ce52112',
        '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad',
        'd78cf363-5b82-41b2-8a53-79bb74969ba7',
        '052da49c-2175-4033-8010-c8e1f9a755ab'
    ]

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

    const { discountTariffsForAutoparks } = await getDiscountTariffsForAutoparksByDay({ dayOfWeek, companyId, autoParksIds });


    const { driversForCustomTerms } = await getDriversForCustomTerms({ isoDate, companyId, autoParksIds });
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

