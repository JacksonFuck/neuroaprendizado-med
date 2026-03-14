require('dotenv').config();
const pool = require('./server/config/db');
pool.query("UPDATE users SET role='admin'")
    .then(() => console.log("Admins set"))
    .catch(console.error)
    .finally(() => process.exit());
