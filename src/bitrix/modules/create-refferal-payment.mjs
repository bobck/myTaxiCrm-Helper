import { getActiveRefferals } from "../bitrix.queries.mjs";
import {
    createPayment,
    addCommentToEntity
} from "../bitrix.utils.mjs";
import { getDriverRidesCountByWeek } from "../../web.api/web.api.utlites.mjs";

import { DateTime } from "luxon";

const paymentsStageId = 'DT1102_44:NEW'
export const referralTypeId = '1098'

// const positionCodes = {
//     payments: {
//         driver: '2684',
//         cm: '2686',
//         dm: '2688',
//         qm: '2690'
//     },
//     referrals: {
//         driver: '2676',
//         cm: '2678',
//         dm: '2680',
//         qm: '2682'
//     }
// }

// const positionCodesReferralsToPayments = {
//     '2676': '2684',
//     '2678': '2686',
//     '2680': '2688',
//     '2682': '2690'
// }

const positionTextReferralsToPayments = {
    'водитель': '2684',
    'кеш менеджер': '2686',
    'драйвер менеджер': '2688',
    'кволити менеджер': '2690'
}

const cityTextRecruitToPayments = {
    'Київ': '2880',
    'Харків': '2882',
    'Одеса': '2884',
    'Дніпро': '2886',
    'Львів': '2888',
    'Запоріжжя': '2890',
    'Вінниця': '2892',
    'Чернігів': '2894',
    'Полтава': '2896',
    'Івано-Франківськ': '2898',
    'Миколаїв': '2900',
    'Кривий Ріг': '2902',
    'Хмельницький': '2904',
    'Житомир': '2906',
    'Рівне': '2908',
    'Чернівці': '2910',
    'Тернопіль': '2912',
    'Херсон': '2914',
    'Луцьк': '2916',
    'Кропивницький': '2918',
    'Ужгород': '2920',
    'Біла Церква': '2922',
    'Кременчуг': '2926',
    'Черкаси': '2928',
    'Каменець - Подільский': '2930',
    'Маріуполь': '2932',
    'Інше Місто': '2934',
    'Дрогобич': '2936',
    'Мукачево': '2938',
    'Умань': '2940',
    'Warsaw': '2942',
    'Krakow': '2944',
    'Gdańsk': '2946',
    'Wrocław': '2948',
    'Toruń': '2950',
    'Katowice': '2952',
    'Chorzów': '2954',
    'Dąbrowa Górnicza': '2956',
    'Sosnowiec': '2958',
    'Poznań': '2960',
    'Łódź': '2962',
    'Gorzów Wielkopolski': '2964',
    'Dubai': '2966'
}

const assignedByMailToId = {
    'vubir2020@gmail.com': '51212',
    'minaieva.ii@gmail.com': '14150'
}

export async function createRefferalPayment() {
    const { activeRefferals } = await getActiveRefferals();

    if (activeRefferals.length == 0) {
        return
    }

    const dateTime = DateTime.now().setZone('Europe/Kyiv').minus({ weeks: 1 })
    const { weekNumber, year } = dateTime

    console.log({ time: new Date(), message: 'createRefferalPayment', weekNumber, year, activeRefferals: activeRefferals.length });

    for (let refferal of activeRefferals) {
        let bonusTarget = 150;

        const {
            driver_id,
            auto_park_id,
            referral_id,
            first_name,
            last_name,
            contact_id,
            created_at,
            referrer_phone,
            referrer_name,
            referrer_position,
            city_id,
            assigned_by_id
        } = refferal

        const createdAtDateTime = DateTime.fromFormat(created_at, 'yyyy-MM-dd HH:mm:ss');

        const {
            year: createdAtYear,
            weekNumber: createdAtWeek
        } = createdAtDateTime


        if (createdAtWeek == weekNumber) {
            bonusTarget = 50;
        }

        const { rides_count } = await getDriverRidesCountByWeek({ auto_park_id, driver_id, year, weekNumber })

        if (rides_count < bonusTarget) {

            const comment = `Недостатньо поїздок для виплати бонусу за ${weekNumber} тиждень\n\nЦіль поїздок: ${bonusTarget}\nВиконано поїздок: ${rides_count}`
            await addCommentToEntity({
                entityId: referral_id,
                typeId: referralTypeId,
                comment
            });

            continue
        }

        const title = `${first_name} ${last_name} | Виплата 300 грн. | Тиждень ${weekNumber}`
        const contactId = contact_id

        const city = cityTextRecruitToPayments[city_id]
        const assignedBy = assignedByMailToId[assigned_by_id]
        const referrerPhone = referrer_phone
        const referrerName = referrer_name
        const referrerPosition = positionTextReferralsToPayments[referrer_position]

        const { id: itemId } = await createPayment({
            title,
            stageId: paymentsStageId,
            city,
            contactId,
            assignedBy,
            referrerPhone,
            referrerName,
            referrerPosition
        })

        const comment = `Додано виплату за ${weekNumber} тиждень\nЦіль поїздок: ${bonusTarget}\nВиконано поїздок: ${rides_count}\n\nПосилання на виплату:\nhttps://taxify.bitrix24.eu/page/referal/viplati/type/1102/details/${itemId}/`

        await addCommentToEntity({
            entityId: referral_id,
            typeId: referralTypeId,
            comment
        });
    }
}

if (process.env.ENV == "TEST") {
    await createRefferalPayment();
}
