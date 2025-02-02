import { Pool } from 'https://deno.land/x/postgres/mod.ts';
import { PoolClient } from 'https://deno.land/x/postgres/client.ts';

import { sqlTableCreate } from './db-init.js';
import { filmsData } from './test-data/films.js';
import { actorsData } from './test-data/actors.js';
import { actorFilmsData } from './test-data/actor_films.js';
import 'https://deno.land/x/dotenv/load.ts';

// config db connection
let pg_port: any = Deno.env.get('PG_PORT');
if (typeof pg_port === 'string') {
  pg_port = parseInt(pg_port);
}

const config = {
  user: Deno.env.get('PG_USER'),
  database: Deno.env.get('PG_DATABASE'),
  password: Deno.env.get('PG_PASSWORD'),
  hostname: Deno.env.get('PG_HOSTNAME'),
  port: pg_port,
};

// const config = {
//   user: 'cbdwxnyo',
//   database: 'cbdwxnyo',
//   password: 'OD1zYMixCS78zN5CPHUGYZLE053VIc2i',
//   hostname: 'queenie.db.elephantsql.com',
//   port: 5432,
// };
const POOL_CONNECTIONS = 2; // breaks at 10+ due to ElephantSQL

// connect to db
const pool = new Pool(config, POOL_CONNECTIONS);

export async function createDb() {
  // drops the schema
  try {
    const client: PoolClient = await pool.connect();
    await client.queryObject({
      text: `DROP SCHEMA IF EXISTS obsidian_demo_schema CASCADE;`,
      args: [],
    });
    client.release();
  } catch (err) {
    console.log(err);
  }

  // create db
  try {
    const client: PoolClient = await pool.connect();
    await client.queryObject({
      text: sqlTableCreate,
      args: [],
    });
    client.release();
  } catch (err) {
    console.log(err);
  }

  // Seeds the DB
  try {
    const client: PoolClient = await pool.connect();
    await client.queryObject({
      text: filmsData,
      args: [],
    });
    client.release();
  } catch (err) {
    console.log(err);
  }

  try {
    const client: PoolClient = await pool.connect();
    await client.queryObject({
      text: actorsData,
      args: [],
    });
    client.release();
  } catch (err) {
    console.log(err);
  }

  try {
    const client: PoolClient = await pool.connect();
    await client.queryObject({
      text: actorFilmsData,
      args: [],
    });
    client.release();
  } catch (err) {
    console.log(err);
  }
  pool.end();
}
