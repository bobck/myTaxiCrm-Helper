import {
    getDiscountBonusesByAutoparksAndIntegrationsByDay,
    getDriversForCustomTerms,
    makeCRMRequestlimited
} from '../web.api.utlites.mjs'

import {
    saveCreatedDriverBonusRuleId,
    markDriverCustomBonusRulesAsDeleted,
    getUndeletedDriversCustomBonuses
} from '../web.api.queries.mjs';

export async function setDriversCustomBonus() {

    const autoParksIds = [
        '2d3e566e-01a2-486f-ac7f-446d13f96f27',
        'eef0dbe4-38f8-4299-95e2-25586bb02a38',
        '6897e6f0-b33d-405a-b110-8c623c864cfc',
        '45dcaa21-bceb-45f2-bba9-5c72bbac441f',
        '03328f6b-1336-4ee3-8407-bf5520411136',
        '4dd93df2-c172-488c-846f-d81452ddba70',
        '2f4c5352-0296-4fba-859b-9f8955f3f2a0',
        'ee12f8cd-570e-4eab-8ec8-1ead1c619bb7',
        'd34e7c17-ccf3-49d1-875c-67e4378c4562',
        'ff2368ca-dce1-4315-af7b-9850056ab3ce'
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

    const { discountBonusesByAutoparksAndIntegrations } = await getDiscountBonusesByAutoparksAndIntegrationsByDay({ dayOfWeek, companyId, autoParksIds });

    const { driversForCustomTerms } = await getDriversForCustomTerms({ isoDate, companyId, autoParksIds });
    console.log({ driversForCustomTermsLength: driversForCustomTerms.length })

    const discountBonusesByAutoparksAndIntegrationsWithDriver = []

    for (let driver of driversForCustomTerms) {
        const { auto_park_id, id } = driver
        const autoparkBonusRows = discountBonusesByAutoparksAndIntegrations.filter(r => r.autoParkId == auto_park_id);
        console.log({ autoparkBonusRows: autoparkBonusRows.length })

        for (let autoparkBonusRow of autoparkBonusRows) {
            const clonedObjectWithExtraProperty = { driverId: id, ...autoparkBonusRow };
            discountBonusesByAutoparksAndIntegrationsWithDriver.push(clonedObjectWithExtraProperty)
        }

    }
    console.log({ discountBonusesByAutoparksAndIntegrationsWithDriverLength: discountBonusesByAutoparksAndIntegrationsWithDriver.length })

    for (let createDriverBonusRulesInput of discountBonusesByAutoparksAndIntegrationsWithDriver) {
        const body = {
            operationName: "createDriverBonusRules",
            variables: {
                createDriverBonusRulesInput
            },
            query: "mutation createDriverBonusRules($createDriverBonusRulesInput: CreateDriverBonusRulesInput!) {\n  createDriverBonusRules(\n    createDriverBonusRulesInput: $createDriverBonusRulesInput\n  ) {\n    autoParkId\n    driverId\n    bonusRules {\n      id\n      integrationIds\n      avgCheckRules {\n        from\n        to\n        __typename\n      }\n      tripsRules {\n        from\n        to\n        bonusValues\n        __typename\n      }\n      integrations {\n        type\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
        }

        try {
            const response = await makeCRMRequestlimited({ body });
            const { data } = response

            const { createDriverBonusRules } = data;
            const { bonusRules } = createDriverBonusRules

            const autoParkId = createDriverBonusRules.autoParkId
            const driverId = createDriverBonusRules.driverId
            const bonusRuleId = bonusRules[0].id

            console.log({ autoParkId, driverId, bonusRuleId })
            await saveCreatedDriverBonusRuleId({ autoParkId, driverId, bonusRuleId });

        } catch (errors) {
            console.error({ date: new Date(), createDriverBonusRulesInput, errors })
            continue
        }
    }

}

export async function deleteDriversCustomBonus() {

    const { undeletedDriversCustomBonuses } = await getUndeletedDriversCustomBonuses();

    for (let deleteDriverBonusRulesInput of undeletedDriversCustomBonuses) {
        console.log({ deleteDriverBonusRulesInput })
        const { auto_park_id: autoParkId, bonus_rule_id: bonusRuleId } = deleteDriverBonusRulesInput

        const body = {
            operationName: "deleteDriverBonusRules",
            variables: {
                deleteDriverBonusRulesInput: { autoParkId, bonusRuleId }
            },
            query: "mutation deleteDriverBonusRules($deleteDriverBonusRulesInput: DeleteDriverBonusRulesInput!) {\n  deleteDriverBonusRules(\n    deleteDriverBonusRulesInput: $deleteDriverBonusRulesInput\n  ) {\n    success\n    __typename\n  }\n}\n"
        }

        try {
            const response = await makeCRMRequestlimited({ body });
            const { data } = response
            console.log({ data })
            await markDriverCustomBonusRulesAsDeleted({ bonusRuleId });

        } catch (errors) {
            console.error({ date: new Date(), bonusRuleId, errors })
            continue

        }

    }

}

if (process.env.ENV == "TEST") {
    // setDriversCustomBonus();
    deleteDriversCustomBonus();
}
