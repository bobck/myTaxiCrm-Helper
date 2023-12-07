import {
    generateDriversWithFuelCardReport,
    insertRowsAsStream
} from "../bq-utils.mjs";

export async function generateAndSaveDriversWithFuelCardsReport() {
    console.log({ time: new Date(), message: 'generateAndSaveDriversWithFuelCardsReport' });

    const date = DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');
    const { rows } = await generateDriversWithFuelCardReport({ date });
    const rowsMapped = rows.map(r => {
        r.date = new Date(r.date).toISOString().split('T')[0]
        r.event_types = JSON.stringify(r.event_types)
        return r
    })
    await insertRowsAsStream(rowsMapped);
}