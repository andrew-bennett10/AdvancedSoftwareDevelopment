const { Client } = require('pg');
const { spawn } = require('child_process');
const path = require('path');

async function ensureDatabaseExists(adminConnectionString, dbName) {
  const client = new Client({ connectionString: adminConnectionString });
  await client.connect();
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (result.rows.length === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
  }
  await client.end();
}

async function runDbInit(dbUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, '..', 'dbInit.js')], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`dbInit.js exited with code ${code}`));
    });
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres_test';
  const url = new URL(dbUrl);
  const dbName = url.pathname.replace('/', '') || 'postgres_test';
  const adminUrl = `${url.protocol}//${url.username ? `${url.username}:${url.password}@` : ''}${url.hostname}:${url.port || 5432}/postgres`;

  await ensureDatabaseExists(adminUrl, dbName);
  await runDbInit(dbUrl);
  console.log('Test database ready at', dbUrl);
}

main().catch((err) => {
  console.error('Failed to prepare test database:', err);
  process.exit(1);
});
