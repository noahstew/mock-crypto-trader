import express, { type Request, type Response } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { query } from '../db.js';
import {
  getUserHoldings,
  getOrCreatePortfolio,
  getUserTransactions,
  executeBuyOrder,
  executeSellOrder,
} from '../services/holdings.js';

const router = express.Router();

// POST /api/portfolio/create - Create initial portfolio (protected)
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startingBalance } = req.body;

    // Validate input
    const balance = startingBalance ? parseFloat(startingBalance) : 50000;
    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({ error: 'Invalid starting balance' });
    }

    // Check if portfolio already exists
    const { rows: existingPortfolio } = await query(
      'SELECT * FROM portfolios WHERE user_id = $1',
      [user.id]
    );

    if (existingPortfolio.length > 0) {
      return res.status(400).json({ error: 'Portfolio already exists' });
    }

    // Create new portfolio
    const { rows: newPortfolio } = await query(
      `INSERT INTO portfolios (user_id, available_balance, starting_balance) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [user.id, balance, balance]
    );

    res.status(201).json({
      message: 'Portfolio created successfully',
      portfolio: {
        availableBalance: parseFloat(newPortfolio[0].available_balance),
        startingBalance: parseFloat(newPortfolio[0].starting_balance),
      },
    });
  } catch (err: any) {
    console.error('Error creating portfolio:', err);
    res
      .status(500)
      .json({ error: err?.message || 'Failed to create portfolio' });
  }
});

// GET /api/portfolio - Get user's portfolio and holdings (protected)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Check if portfolio exists
    const { rows: portfolioRows } = await query(
      'SELECT * FROM portfolios WHERE user_id = $1',
      [user.id]
    );

    if (portfolioRows.length === 0) {
      return res.status(404).json({
        error: 'No portfolio found',
        needsSetup: true,
      });
    }

    const portfolio = portfolioRows[0];
    const holdings = await getUserHoldings(user.id);

    res.status(200).json({
      portfolio: {
        availableBalance: parseFloat(portfolio.available_balance),
        startingBalance: parseFloat(portfolio.starting_balance),
      },
      holdings: holdings.map((h) => ({
        symbol: h.symbol,
        amount: parseFloat(h.amount),
        avgPurchasePrice: parseFloat(h.avg_purchase_price),
      })),
    });
  } catch (err: any) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: err?.message || 'Failed to get portfolio' });
  }
});

// GET /api/portfolio/transactions - Get user's transaction history (protected)
router.get(
  '/transactions',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 50;

      const transactions = await getUserTransactions(user.id, limit);

      res.status(200).json({
        transactions: transactions.map((t) => ({
          id: t.id,
          symbol: t.symbol,
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          price: parseFloat(t.price),
          totalCost: parseFloat(t.total_cost),
          createdAt: t.created_at,
        })),
      });
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      res
        .status(500)
        .json({ error: err?.message || 'Failed to get transactions' });
    }
  }
);

// POST /api/portfolio/buy - Execute buy order (protected)
router.post('/buy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { symbol, amount, price } = req.body;

    // Validate input
    if (!symbol || !amount || !price) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: symbol, amount, price' });
    }

    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const result = await executeBuyOrder(
      user.id,
      symbol.toUpperCase(),
      amountNum,
      priceNum
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.status(200).json({
      message: result.message,
      transaction: result.transaction
        ? {
            id: result.transaction.id,
            symbol: result.transaction.symbol,
            type: result.transaction.transaction_type,
            amount: parseFloat(result.transaction.amount),
            price: parseFloat(result.transaction.price),
            totalCost: parseFloat(result.transaction.total_cost),
            createdAt: result.transaction.created_at,
          }
        : undefined,
    });
  } catch (err: any) {
    console.error('Error executing buy order:', err);
    res
      .status(500)
      .json({ error: err?.message || 'Failed to execute buy order' });
  }
});

// POST /api/portfolio/sell - Execute sell order (protected)
router.post('/sell', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { symbol, amount, price } = req.body;

    // Validate input
    if (!symbol || !amount || !price) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: symbol, amount, price' });
    }

    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    const result = await executeSellOrder(
      user.id,
      symbol.toUpperCase(),
      amountNum,
      priceNum
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.status(200).json({
      message: result.message,
      transaction: result.transaction
        ? {
            id: result.transaction.id,
            symbol: result.transaction.symbol,
            type: result.transaction.transaction_type,
            amount: parseFloat(result.transaction.amount),
            price: parseFloat(result.transaction.price),
            totalCost: parseFloat(result.transaction.total_cost),
            createdAt: result.transaction.created_at,
          }
        : undefined,
    });
  } catch (err: any) {
    console.error('Error executing sell order:', err);
    res
      .status(500)
      .json({ error: err?.message || 'Failed to execute sell order' });
  }
});

// POST /api/portfolio/reset - Reset account (delete all holdings and set new balance) (protected)
router.post('/reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startingBalance } = req.body;

    // Validate input
    if (
      !startingBalance ||
      isNaN(parseFloat(startingBalance)) ||
      parseFloat(startingBalance) < 0
    ) {
      return res.status(400).json({ error: 'Invalid starting balance' });
    }

    const balanceNum = parseFloat(startingBalance);

    // Start transaction
    await query('BEGIN');

    try {
      // Delete all holdings for the user
      await query('DELETE FROM holdings WHERE user_id = $1', [user.id]);

      // Delete all transactions for the user
      await query('DELETE FROM transactions WHERE user_id = $1', [user.id]);

      // Update or create portfolio with new balance
      const { rows: existingPortfolio } = await query(
        'SELECT * FROM portfolios WHERE user_id = $1',
        [user.id]
      );

      if (existingPortfolio.length > 0) {
        // Update existing portfolio
        await query(
          'UPDATE portfolios SET available_balance = $1, starting_balance = $2, updated_at = NOW() WHERE user_id = $3',
          [balanceNum, balanceNum, user.id]
        );
      } else {
        // Create new portfolio
        await query(
          'INSERT INTO portfolios (user_id, available_balance, starting_balance) VALUES ($1, $2, $3)',
          [user.id, balanceNum, balanceNum]
        );
      }

      // Commit transaction
      await query('COMMIT');

      res.status(200).json({
        message: 'Account reset successfully',
        portfolio: {
          availableBalance: balanceNum,
          startingBalance: balanceNum,
        },
      });
    } catch (err) {
      // Rollback on error
      await query('ROLLBACK');
      throw err;
    }
  } catch (err: any) {
    console.error('Error resetting account:', err);
    res.status(500).json({ error: err?.message || 'Failed to reset account' });
  }
});

export default router;
