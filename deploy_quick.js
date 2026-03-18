const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const FILES_TO_DEPLOY = [
    // Frontend — Plan system
    { local: 'public/plan-gate.js', remote: '/var/www/neuroaprendizado/public/plan-gate.js' },
    { local: 'public/index.html', remote: '/var/www/neuroaprendizado/public/index.html' },
    { local: 'public/app.css', remote: '/var/www/neuroaprendizado/public/app.css' },
    { local: 'public/sw.js', remote: '/var/www/neuroaprendizado/public/sw.js' },
    // Frontend — Legal pages
    { local: 'public/privacy-policy.html', remote: '/var/www/neuroaprendizado/public/privacy-policy.html' },
    { local: 'public/terms-of-use.html', remote: '/var/www/neuroaprendizado/public/terms-of-use.html' },
    // Frontend — Admin panel (plan selector)
    { local: 'public/admin.html', remote: '/var/www/neuroaprendizado/public/admin.html' },
    { local: 'public/admin.js', remote: '/var/www/neuroaprendizado/public/admin.js' },
    // Backend — Routes
    { local: 'server/routes/auth.js', remote: '/var/www/neuroaprendizado/server/routes/auth.js' },
    { local: 'server/routes/plan.js', remote: '/var/www/neuroaprendizado/server/routes/plan.js' },
    { local: 'server/routes/stripe.js', remote: '/var/www/neuroaprendizado/server/routes/stripe.js' },
    { local: 'server/routes/admin.js', remote: '/var/www/neuroaprendizado/server/routes/admin.js' },
    // Backend — Middleware & entry point
    { local: 'server/middleware/plan-gate.js', remote: '/var/www/neuroaprendizado/server/middleware/plan-gate.js' },
    { local: 'server/index.js', remote: '/var/www/neuroaprendizado/server/index.js' },
    // Database — Schema with plan columns
    { local: 'server/config/init-db.js', remote: '/var/www/neuroaprendizado/server/config/init-db.js' },
];

const BASE = __dirname;
const NVM_NODE = '/root/.nvm/versions/node/v24.13.0/bin';

const conn = new Client();
conn.on('ready', () => {
    console.log('Conectado ao VPS');
    conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err); conn.end(); return; }

        let uploaded = 0;
        FILES_TO_DEPLOY.forEach(f => {
            const localPath = path.join(BASE, f.local);
            console.log('Enviando ' + f.local + '...');
            sftp.fastPut(localPath, f.remote, (putErr) => {
                if (putErr) { console.error('Erro ao enviar ' + f.local + ':', putErr.message); }
                else { console.log('  OK ' + f.local); }
                uploaded++;
                if (uploaded === FILES_TO_DEPLOY.length) {
                    runMigration();
                }
            });
        });

        function runMigration() {
            console.log('\nExecutando migration do banco (init-db.js)...');
            const migCmd = 'cd /var/www/neuroaprendizado && ' + NVM_NODE + '/node server/config/init-db.js';
            conn.exec(migCmd, (migErr, migStream) => {
                if (migErr) { console.error('Migration error:', migErr); conn.end(); return; }
                migStream.on('close', (code) => {
                    console.log(code === 0 ? '  DB migration OK' : '  DB migration exit code: ' + code);
                    restartPM2();
                }).on('data', (d) => {
                    console.log('  ' + d.toString().trim());
                }).stderr.on('data', (d) => {
                    console.error('  ' + d.toString().trim());
                });
            });
        }

        function restartPM2() {
            console.log('\nReiniciando PM2...');
            conn.exec(NVM_NODE + '/pm2 restart neuro-med', (pmErr, pmStream) => {
                if (pmErr) { console.error('PM2 error:', pmErr); conn.end(); return; }
                pmStream.on('close', (code) => {
                    console.log(code === 0 ? '\nDeploy concluido com sucesso!' : '\nPM2 restart code: ' + code);
                    conn.end();
                }).on('data', (d) => {
                    console.log(d.toString());
                }).stderr.on('data', (d) => {
                    console.error(d.toString());
                });
            });
        }
    });
}).connect({
    host: '168.231.93.16',
    port: 22,
    username: 'root',
    password: 'Ritmosinusal120/80',
    readyTimeout: 60000
});
