import {getDriversRides} from "../../web.api/web.api.utlites.mjs";
import {DateTime} from "luxon";

export async function createDriverBrandingCards() {
    const {rows} = await getDriversRides();
    console.log('Rows have been created');
    const cards = new Map();

    const handledCards=[];

    if(rows instanceof Array) {
        for (const row of rows) {
            if(row.total_trips){

                if(cards.has(row.driver_id)) {
                    const card = structuredClone(cards.get(row.driver_id));
                    if (new Date(row.period_from) < new Date(card.period_from)) {
                        card.period_from = row.period_from;
                    }
                    if (new Date(row.period_to) > new Date(card.period_to)) {
                        card.period_to = row.period_to;
                    }
                    card.total_trips += row.total_trips;
                    cards.set(row.driver_id,card);
                    continue;
                }

                const myTaxiDriverUrl=`https://fleets.mytaxicrm.com/${row.auto_park_id}/drivers/${row.driver_id}`
                cards.set(row.driver_id,{
                    period_from: row.period_from,
                    period_to: row.period_to,
                    phone:row.phone,
                    myTaxiDriverUrl,
                    driver_name: row.driver_name,
                    city: row.city,
                    total_trips: row.total_trips,
                })
            }


        }

        for (const card of cards) {
            const [driver_id,data] = card;
            const lastTiming = DateTime.fromJSDate(data.period_to);
            // console.log(typeof data.period_to);

            // const lastTiming=DateTime.fromISO(data.period_to.replace(' ', 'T'));
            const props={

                //'fields[ufCrm42_1728470444]'
                "UF_CRM_54_1738757291":data.driver_name,
                "UF_CRM_54_1738757436":data.city,
                "UF_CRM_54_1738757552":data.phone,
                "UF_CRM_54_1738757612":data.myTaxiDriverUrl,
                "UF_CRM_54_1738757712":data.total_trips,
                "UF_CRM_54_1738757784":lastTiming.weekNumber,
                "UF_CRM_54_1738757867":lastTiming.year
            }
            handledCards.push(props);
        }

    }
    console.log(handledCards);
    return handledCards;

}