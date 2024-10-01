

import express from 'express'

export async function initApi({ pool }) {
    const app = express()
    app.use(express.json());

    console.log({
        message: 'initApi...',
        time: new Date()
    })

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

    app.post('/referral', (req, res) => {
        const { query } = req;
        console.log({ message: 'Simple POST request logger', query })
        res.statusCode = 200;
        return res.send(JSON.stringify({ status: 'ok' }))
    });

    app.listen(3000)
}
