import pg from 'pg';
import fs from 'fs'
import ssh2 from 'ssh2'
import net from 'net'

import express from 'express'

const app = express()

const { Client } = ssh2;
const c = new Client();

const proxyPort = 9090;
const proxyHost = '127.0.0.1';
let ready = false;

const proxy = net.createServer(function (sock) {
    if (!ready) {
        return sock.destroy()
    }

    c.forwardOut(sock.remoteAddress,
        sock.remotePort,
        process.env.PG_HOST,
        process.env.PG_PORT,
        function (err, stream) {
            if (err) {
                return sock.destroy()
            }
            sock.pipe(stream);
            stream.pipe(sock);
        });
});

proxy.listen(proxyPort, proxyHost);

const privateKey = fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH);
c.connect({
    host: process.env.SSH_HOST,
    port: 22,
    username: process.env.SSH_USER,
    privateKey
});

c.on('ready', async function () {
    ready = true;
    const conString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${proxyHost}:${proxyPort}/${process.env.PG_DB}`;
    const client = new pg.Client(conString);

    client.connect(function (err) {
        console.log({ err });
    });

    app.get('/calculatedStatements', async function (req, res) {
        const { startWeek, endWeek } = req.query;

        if (!startWeek || !endWeek) {
            res.statusCode = 400;
            return res.send(JSON.stringify({
                error: "startWeek or endWeek is missing"
            }))

        }

        const sql = fs.readFileSync('./sql/calculated_statements.sql').toString();
        try {
            const result = await client.query(sql, [startWeek, endWeek])
            const { rows } = result
            return res.send(JSON.stringify(rows))
        } catch (err) {
            console.error(err)
            res.statusCode = 404;

            return res.send(JSON.stringify(err))
        }
    })

    app.get('/cashboxTransactions', async function (req, res) {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.statusCode = 400;
            return res.send(JSON.stringify({
                error: "startDate or startDate is missing"
            }))
        }

        const sql = fs.readFileSync('./sql/cashbox_transactions.sql').toString();
        try {
            const result = await client.query(sql, [startDate, endDate])
            const { rows } = result
            return res.send(JSON.stringify(rows))
        } catch (err) {
            console.error(err)
            res.statusCode = 404;
            return res.send(JSON.stringify(err))
        }
    })

});


app.listen(3000)