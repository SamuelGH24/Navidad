const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Adaptador para que funcione con la sintaxis de mysql2
module.exports = {
  async query(sql, params) {
    const result = await pool.query(sql, params);
    return [result.rows];
  },
  async getConnection() {
    const client = await pool.connect();
    return {
      async query(sql, params) {
        const result = await client.query(sql, params);
        return [result.rows];
      },
      async beginTransaction() {
        await client.query('BEGIN');
      },
      async commit() {
        await client.query('COMMIT');
      },
      async rollback() {
        await client.query('ROLLBACK');
      },
      release() {
        client.release();
      }
    };
  }
};