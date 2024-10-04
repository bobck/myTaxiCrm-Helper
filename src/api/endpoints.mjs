

import express from 'express'
import { referralValidadion } from '../bitrix/modules/referral-validation.mjs';

export async function initApi({ pool }) {
    const app = express()
    app.use(express.json());

    app.post('/query', async function (req, res) {
        const { body } = req
        const { sql } = body

        if (!sql) {
            res.statusCode = 400;
            return res.send(JSON.stringify({
                error: "sql is missing"
            }))
        }

        try {
            const result = await pool.query(sql)
            const { rows } = result
            return res.send(JSON.stringify(rows))
        } catch (err) {
            res.statusCode = 404;
            return res.send(JSON.stringify(err))
        }
    })

    app.post('/referral', async (req, res) => {
        const { query } = req;
        const {
            task_id,
            doc_id,
            first_name,
            last_name,
            contract,
            deal_id
        } = query;

        console.log({ message: 'Simple POST request logger', query })

        await referralValidadion({
            task_id,
            doc_id,
            first_name,
            last_name,
            contract,
            deal_id
        });

        res.statusCode = 200;
        return res.send(JSON.stringify({ status: 'ok' }))
    });

    app.listen(3000)

    console.log({
        message: 'Express listening',
        time: new Date()
    })

}
