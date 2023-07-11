require('dotenv').config();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DB_URL });

module.exports = {
    query: async (text, params, callback) => {
        return pool.query(text, params, callback);
    },
    end: async () => {
        pool.end();
    }
}
