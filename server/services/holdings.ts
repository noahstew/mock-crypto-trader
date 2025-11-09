import { query } from '../db.js';

interface Portfolio {
  user_id: string; // Changed from number to string for UUID
  available_balance: string;
  starting_balance: string;
}

interface Holding {
  id: number;
  user_id: string; // Changed from number to string for UUID
  symbol: string;
  amount: string;
  avg_purchase_price: string;
}

interface Transaction {
  id: number;
  user_id: string; // Changed from number to string for UUID
  symbol: string;
  transaction_type: 'buy' | 'sell';
  amount: string;
  price: string;
  total_cost: string;
  created_at: Date;
}

// Get or create user portfolio
export async function getOrCreatePortfolio(userId: string): Promise<Portfolio> {
  const { rows } = await query<Portfolio>(
    'SELECT * FROM portfolios WHERE user_id = $1',
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Create new portfolio with default starting balance
  const { rows: newRows } = await query<Portfolio>(
    `INSERT INTO portfolios (user_id, available_balance, starting_balance) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [userId, 50000, 50000]
  );

  return newRows[0];
}

// Get user holdings
export async function getUserHoldings(userId: string): Promise<Holding[]> {
  const { rows } = await query<Holding>(
    'SELECT * FROM holdings WHERE user_id = $1 AND amount > 0 ORDER BY symbol',
    [userId]
  );
  return rows;
}

// Get user transactions
export async function getUserTransactions(
  userId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const { rows } = await query<Transaction>(
    'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return rows;
}

// Execute a buy order
export async function executeBuyOrder(
  userId: string,
  symbol: string,
  amount: number,
  price: number
): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
  const totalCost = amount * price;

  // Get portfolio
  const portfolio = await getOrCreatePortfolio(userId);
  const availableBalance = parseFloat(portfolio.available_balance);

  // Check if user has enough balance
  if (availableBalance < totalCost) {
    return {
      success: false,
      message: `Insufficient balance. Need $${totalCost.toFixed(
        2
      )}, have $${availableBalance.toFixed(2)}`,
    };
  }

  try {
    // Start transaction
    await query('BEGIN');

    // Update portfolio balance
    await query(
      'UPDATE portfolios SET available_balance = available_balance - $1 WHERE user_id = $2',
      [totalCost, userId]
    );

    // Check if holding exists
    const { rows: existingHolding } = await query<Holding>(
      'SELECT * FROM holdings WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );

    if (existingHolding.length > 0) {
      // Update existing holding with new average price
      const holding = existingHolding[0];
      const currentAmount = parseFloat(holding.amount);
      const currentAvgPrice = parseFloat(holding.avg_purchase_price);
      const totalValue = currentAmount * currentAvgPrice + totalCost;
      const newAmount = currentAmount + amount;
      const newAvgPrice = totalValue / newAmount;

      await query(
        'UPDATE holdings SET amount = $1, avg_purchase_price = $2 WHERE user_id = $3 AND symbol = $4',
        [newAmount, newAvgPrice, userId, symbol]
      );
    } else {
      // Create new holding
      await query(
        'INSERT INTO holdings (user_id, symbol, amount, avg_purchase_price) VALUES ($1, $2, $3, $4)',
        [userId, symbol, amount, price]
      );
    }

    // Record transaction
    const { rows: transactionRows } = await query<Transaction>(
      `INSERT INTO transactions (user_id, symbol, transaction_type, amount, price, total_cost) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, symbol, 'buy', amount, price, totalCost]
    );

    // Commit transaction
    await query('COMMIT');

    return {
      success: true,
      message: `Successfully bought ${amount} ${symbol} at $${price.toFixed(
        2
      )} each`,
      transaction: transactionRows[0],
    };
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    throw error;
  }
}

// Execute a sell order
export async function executeSellOrder(
  userId: string,
  symbol: string,
  amount: number,
  price: number
): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
  const totalRevenue = amount * price;

  // Check if user has enough of the asset
  const { rows: existingHolding } = await query<Holding>(
    'SELECT * FROM holdings WHERE user_id = $1 AND symbol = $2',
    [userId, symbol]
  );

  if (existingHolding.length === 0) {
    return {
      success: false,
      message: `You don't own any ${symbol}`,
    };
  }

  const currentAmount = parseFloat(existingHolding[0].amount);
  if (currentAmount < amount) {
    return {
      success: false,
      message: `Insufficient ${symbol}. You have ${currentAmount}, trying to sell ${amount}`,
    };
  }

  try {
    // Start transaction
    await query('BEGIN');

    // Update portfolio balance
    await query(
      'UPDATE portfolios SET available_balance = available_balance + $1 WHERE user_id = $2',
      [totalRevenue, userId]
    );

    // Update holding
    const newAmount = currentAmount - amount;
    if (newAmount > 0.00000001) {
      // Keep if amount is significant
      await query(
        'UPDATE holdings SET amount = $1 WHERE user_id = $2 AND symbol = $3',
        [newAmount, userId, symbol]
      );
    } else {
      // Remove holding if fully sold
      await query('DELETE FROM holdings WHERE user_id = $1 AND symbol = $2', [
        userId,
        symbol,
      ]);
    }

    // Record transaction
    const { rows: transactionRows } = await query<Transaction>(
      `INSERT INTO transactions (user_id, symbol, transaction_type, amount, price, total_cost) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, symbol, 'sell', amount, price, totalRevenue]
    );

    // Commit transaction
    await query('COMMIT');

    return {
      success: true,
      message: `Successfully sold ${amount} ${symbol} at $${price.toFixed(
        2
      )} each`,
      transaction: transactionRows[0],
    };
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    throw error;
  }
}
