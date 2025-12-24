import { Router } from 'express';
import { getAllUsers } from '../controllers/userController';

const router = Router();

// בעתיד נוסיף כאן Middleware שבודק אם המשתמש הוא Admin
router.get('/', getAllUsers);

export default router;