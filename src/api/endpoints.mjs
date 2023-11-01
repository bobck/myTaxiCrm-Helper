

import express from 'express'
import pg from 'pg';

export async function initApi() {
    const app = express()
    app.use(express.json());

    const conString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}/${process.env.PG_DB}`;
    const client = new pg.Client(conString);

    client.connect(function (err) {
        console.log({ message: 'initApi', err });
    });

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
            const result = await client.query(sql)
            const { rows } = result
            return res.send(JSON.stringify(rows))
        } catch (err) {
            console.error(err)
            res.statusCode = 404;
            return res.send(JSON.stringify(err))
        }
    })

    app.listen(3000)
}
