import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

type DBUserRow = { id: string; username: string; password_hash: string };
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function registerUser(username?: string, password?: string) {
  if (!username || !password) throw new Error('username and password required');

  const { rowCount } = await query('SELECT 1 FROM users WHERE username = $1', [
    username,
  ]);
  if ((rowCount ?? 0) > 0) throw new Error('user already exists');

  const passwordHash = await bcrypt.hash(password, 10);

  await query('INSERT INTO users ( username, password_hash) VALUES ($1, $2)', [
    username,
    passwordHash,
  ]);

  return { username };
}

export async function loginUser(username?: string, password?: string) {
  if (!username || !password) throw new Error('username and password required');

  const { rows } = (await query<DBUserRow>(
    'SELECT id, password_hash FROM users WHERE username = $1',
    [username]
  )) as any;

  const user = rows[0] as DBUserRow | undefined;
  if (!user) throw new Error('invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('invalid credentials');

  const token = jwt.sign({ sub: user.id, username }, JWT_SECRET, {
    expiresIn: '1h',
  });
  return token;
}

export function getUserFromToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}
