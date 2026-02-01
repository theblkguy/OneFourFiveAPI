import express, { Request, Response } from 'express';
import { register, login } from '../services/authService';

const router = express.Router();

router.post('/register', (req: Request, res: Response) => {
  const result = register(req.body);
  if (!result.success) {
    const status = result.error === 'email_taken' ? 409 : 400;
    return res.status(status).json({ error: result.error, message: result.message });
  }
  res.status(201).json(result.data);
});

router.post('/login', (req: Request, res: Response) => {
  const result = login(req.body);
  if (!result.success) {
    const status = result.error === 'invalid_credentials' ? 401 : 400;
    return res.status(status).json({ error: result.error, message: result.message });
  }
  res.json(result.data);
});

export default router;
