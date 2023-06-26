require('dotenv').config();
// import { Pool } from 'pg'
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DB_URL });

// export const query = (text, params, callback) => {
//   return pool.query(text, params, callback)
// }

module.exports = { 
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    },
}

// TODO: move all DB connections into here and then update to ES6 modules
