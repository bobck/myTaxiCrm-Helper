import { getOrders } from '../remonline.utils.mjs';
import { remonlineTokenToEnv } from "../remonline.api.mjs";
import { insertRowsAsStream } from '../../bq/bq-utils.mjs';

function _remOnlineOrdersMap({ data }) {
    const array = data.map(order => {

        const { id, id_label, created_at, done_at, closed_at, client, asset, malfunction, price, parts, operations, order_type, status, custom_fields, payed, resources } = order
        const { id: status_id, name: status_name } = status
        const { f5294177, f5294178, f5823446, f5823447 } = custom_fields

        const { uid } = asset || {} //uid - номер авто
        const total_price = price
        const createdDate = new Date(created_at).toISOString().replace('T', ' ').replace('Z', '')
        const partsArray = parts.map(part => {
            const { id, engineerId, title, cost, price, discount_value, amount, warranty, warranty_period } = part
            return { item_id: id, engineer_id: engineerId, title, item_cost: cost, item_price: price, discount_value, item_amount: amount, warranty, warranty_period, operation: 'part' }
        })
        const operationsArray = operations.map(part => {
            const { id, engineerId, title, cost, price, discount_value, amount, warranty, warranty_period } = part
            return { item_id: id, engineer_id: engineerId, title, item_cost: cost, item_price: price, discount_value, item_amount: amount, warranty, warranty_period, operation: 'operation' }
        })
        const partsAndOperations = [...partsArray, ...operationsArray]

        if (partsAndOperations.length == 0) {
            partsAndOperations.push({ item_id: null, engineer_id: null, title: null, item_cost: null, item_price: null, discount_value: null, item_amount: null, warranty: null, warranty_period: null, operation: null })
        }

        const partsAndOperationsWithOrderInfo = partsAndOperations.map(partPeration => {
            return { order_id: id, id_label, Created_Time: createdDate, created_at_unix: created_at, client_id: client.id, car_plate_num: uid, malfunction, order_price: total_price, parts_count: parts.length, operations_count: operations.length, ...partPeration, order_type_id: order_type.id, status_id, status: status_name, fleet_group: f5294177, mileage_string: f5294178, mapon_service_id_closed: f5823446, mapon_service_id_opened: f5823447, payed, done_at, closed_at }
        })
        return partsAndOperationsWithOrderInfo
    }).flat()
    return array
}

export async function closedSids() {

    console.log({ time: new Date(), message: 'closedSids' })

    const statuses = ['1342652', '1342656'];

    const { orders } = await getOrders({ statuses });
    console.log(`${orders.length} orders get from api`);

    const rows = _remOnlineOrdersMap({ data: orders })

    try {
        await insertRowsAsStream({ rows, bqTableId: 'order' })
    } catch (e) {
        console.log({ e })

        console.log({ e: e.errors[0]?.errors })
    }

}


if (process.env.ENV == "TEST") {
    await remonlineTokenToEnv();
    closedSids();
}
