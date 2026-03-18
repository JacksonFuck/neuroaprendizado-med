require('dotenv').config();
const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Conectado ao VPS');
    const NVM_NODE = '/root/.nvm/versions/node/v24.13.0/bin';
    conn.exec(NVM_NODE + '/pm2 restart neuro-med --update-env && ' + NVM_NODE + '/pm2 status', (err, stream) => {
        if (err) { console.error('Exec error:', err); conn.end(); return; }
        stream.on('close', (code) => {
            console.log('\nExit code:', code);
            conn.end();
        }).on('data', (d) => {
            process.stdout.write(d.toString());
        }).stderr.on('data', (d) => {
            process.stderr.write(d.toString());
        });
    });
}).connect({
    host: process.env.VPS_HOST || '168.231.93.16',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASSWORD,
    readyTimeout: 60000
});
