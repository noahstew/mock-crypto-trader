import {
  Pool,
  type QueryConfig,
  type QueryResult,
  type QueryArrayResult,
  type QueryResultRow,
} from 'pg';

declare global {
  // allow reusing the pool across HMR / tsx watch in dev
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

// Neon often requires TLS; adjust as needed for your setup.
// If Neon requires SSL without strict cert verification, use:
//   ssl: { rejectUnauthorized: false }
// For stricter setups configure certificates.
const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== 'production') globalThis.__pgPool = pool;
export function query<T extends QueryResultRow = any>(
  text: string | QueryConfig,
  params?: any[]
): Promise<QueryResult<T> | QueryArrayResult<any>> {
  return pool.query(text as any, params);
}

export function getPool(): Pool {
  return pool;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
