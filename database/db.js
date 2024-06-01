require('dotenv').config();
const pg = require('pg');
const pool = new pg.Pool({
    connectionString: process.env.DB_URL,
    ssl: false
});

module.exports = {
    transaction: async (block) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await block(client);
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },
    query: async (text, params, callback) => {
        return pool.query(text, params, callback);
    },
    end: async () => {
        pool.end();
    }
}
