import express, { type Request, type Response } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getUserHoldings,
  setUserBalance,
  resetUserHoldings,
  executeBuyOrder,
  executeSellOrder,
} from '../services/holdings.js';

const router = express.Router();

// GET /holdings (protected)
router.get('/getHoldings', authMiddleware, (req: Request, res: Response) => {
  // authMiddleware attaches user to req.user
  const user = (req as any).user;
  // Fetch and return the user's holdings from the database
  getUserHoldings(user.id)
    .then((holdings) => {
      res.status(200).json({ holdings });
    })
    .catch((err: any) => {
      res.status(500).json({ error: err?.message || 'Failed to get holdings' });
    });
});

// POST /holdings/setBalance (protected)
router.post(
  '/setBalance',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { balance } = req.body;
      // Update the user's balance in the database
      await setUserBalance(user.id, balance);
      res.status(200).json({ message: 'Balance updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to set balance' });
    }
  }
);

// POST /holdings/resetHoldings (protected)
router.post(
  '/resetHoldings',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      // Reset the user's holdings in the database
      await resetUserHoldings(user.id);
      res.status(200).json({ message: 'Holdings reset successfully' });
    } catch (err: any) {
      res
        .status(400)
        .json({ error: err?.message || 'Failed to reset holdings' });
    }
  }
);

// BUY /holdings/buy (protected)
router.post('/buy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, coin, price } = req.body;
    // Execute the buy order logic
    await executeBuyOrder(user.id, coin, amount, price);
    res.status(200).json({ message: 'Buy order executed successfully' });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err?.message || 'Failed to execute buy order' });
  }
});

// SELL /holdings/sell (protected)
router.post('/sell', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, coin, price } = req.body;
    // Execute the sell order logic
    await executeSellOrder(user.id, coin, amount, price);
    res.status(200).json({ message: 'Sell order executed successfully' });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err?.message || 'Failed to execute sell order' });
  }
});

export default router;
