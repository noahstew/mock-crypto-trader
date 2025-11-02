import { query } from '../db.js';

type DBHoldingsRow = {
  userId: string;
  coin: string;
  quantity: number;
  avg_price: number;
};

export async function getUserHoldings(userId: string) {
  const { rows } = await query<DBHoldingsRow>(
    'SELECT coin, quantity, avg_price FROM holdings WHERE user_id = $1',
    [userId]
  );
  return rows;
}

export async function setUserBalance(userId: string, balance: number) {
  await query('UPDATE users SET balance = $1 WHERE id = $2', [balance, userId]);
}

export async function resetUserHoldings(userId: string) {
  await query('DELETE FROM holdings WHERE user_id = $1', [userId]);
  await query(
    'INSERT INTO holdings (user_id, coin, quantity, avg_price) VALUES ($1, $2, $3, $4)',
    [userId, 'USD', 10000, 1]
  );
}

export async function executeBuyOrder(
  userId: string,
  coin: string,
  quantity: number,
  avg_price: number
) {
  await query(
    'INSERT INTO holdings (user_id, coin, quantity, avg_price) VALUES ($1, $2, $3, $4)',
    [userId, coin, quantity, avg_price]
  );
  await query(
    'UPDATE holdings SET quantity = quantity + $1, avg_price = $2 WHERE user_id = $3 AND coin = $4',
    [quantity, avg_price, userId, coin]
  );
}

export async function executeSellOrder(
  userId: string,
  coin: string,
  quantity: number,
  avg_price: number
) {
  await query('DELETE FROM holdings WHERE user_id = $1 AND coin = $2', [
    userId,
    coin,
  ]);
  await query(
    'INSERT INTO holdings (user_id, coin, quantity, avg_price) VALUES ($1, $2, $3, $4)',
    [userId, coin, -quantity, avg_price]
  );
}
