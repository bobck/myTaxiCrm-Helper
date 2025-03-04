import fs from 'fs'
import ssh2 from 'ssh2'
import net from 'net'

//https://github.com/mscdex/ssh2/issues/67
const { Client } = ssh2;

export const openSShTunel = new Promise((resolve, reject) => {
    console.log('openSShTunel...')
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
    const sshConfig={
        host: process.env.SSH_HOST,
        port: 22,
        username: process.env.SSH_USER,
        privateKey,
    }
    if(process.env.SSH_PASSPHRASE)
            sshConfig.passphrase=process.env.SSH_PASSPHRASE

    c.connect(sshConfig);

    c.on('ready', async function () {
        ready = true;
        resolve("ready");
        console.log('ssh ready')

    });
});


