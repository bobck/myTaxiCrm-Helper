

import {
    getSidsReadyToBeClosed,
    markSidsAsClosed
} from "../remonline.queries.mjs";
import { remonlineTokenToEnv } from "../remonline.api.mjs";
import { changeOrderStatus } from "../remonline.utils.mjs";

export async function moveOrdersToClose() {



    const statusesToBeClosed = JSON.parse(process.env.STATUSES_TO_BE_CLOSED);
    const result = await getSidsReadyToBeClosed({ statusesToBeClosed: statusesToBeClosed.join(',') })

    console.log({ time: new Date(), message: 'moveOrdersToClose', sidsReadyToBeClosed: result.length })

    for (let sid of result) {
        const { sid_id: id } = sid
        await changeOrderStatus({ id, statusId: process.env.CLOSED_STATUS_ID });
        await markSidsAsClosed({ id, statusId: process.env.CLOSED_STATUS_ID });
    }
}

if (process.env.ENV == "TEST") {
    await remonlineTokenToEnv();
    moveOrdersToClose();
}
