import fs from 'fs'
import ssh2 from 'ssh2'
import net from 'net'
import { initApi } from './src/api/endpoints.mjs'
import { bootCron } from './src/cron/boot.mjs'

//https://github.com/mscdex/ssh2/issues/67
const { Client } = ssh2;
const c = new Client();

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

proxy.listen(process.env.PROXY_PORT, process.env.PROXY_HOST);

const privateKey = fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH);
c.connect({
    host: process.env.SSH_HOST,
    port: 22,
    username: process.env.SSH_USER,
    privateKey
});

c.on('ready', async function () {
    ready = true;
    await initApi();
    await bootCron();
});
