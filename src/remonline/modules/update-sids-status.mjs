
import {
    getSidsNotReadyDoBeClosed,
    updateSidStatus
} from "../remonline.queries.mjs";
import { getOrders } from "../remonline.utils.mjs";
import { remonlineTokenToEnv } from "../remonline.api.mjs";

export async function checkIsSidStatusWasUpdated() {

    const statusesToBeClosed = JSON.parse(process.env.STATUSES_TO_BE_CLOSED);
    //TODO нужно обновлять все статусы. вдруг обновится статус там где ожидается оплата
    const result = await getSidsNotReadyDoBeClosed({ statusesToBeClosed: statusesToBeClosed.join(',') })
    const ids = result.map(r => r.sid_id)
    const { orders } = await getOrders({ ids })

    console.log({ time: new Date(), message: 'checkIsSidStatusWasUpdated', sidsNotReadyDoBeClosed: result.length, orders: orders.length })

    for (let order of orders) {
        const [sameSid] = result.filter(r => order.id == r.sid_id);
        if (sameSid.status_id != order.status.id) {
            console.log(`Status was updated ${order.id}|${sameSid.sid_id} - ${order.id_label} - ${sameSid.sid_id}`)
            let isClosed = false;
            if (order.status.id == process.env.CLOSED_STATUS_ID) {
                isClosed = true;
            }
            updateSidStatus({
                statusId: order.status.id,
                isClosed,
                id: order.id
            });
        }
    }
}

if (process.env.ENV == "TEST") {
    await remonlineTokenToEnv();
    checkIsSidStatusWasUpdated();
}
