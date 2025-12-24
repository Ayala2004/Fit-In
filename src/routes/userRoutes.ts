import { Router } from 'express';
import { getAllUsers, getUserById, getUserNotifications, getUserPlacements } from '../controllers/userController';

const router = Router();

// GET /users - קבלת כולם
router.get('/', getAllUsers);

// GET /users/:id - קבלת משתמש ספציפי
router.get('/:id', getUserById);

// GET /users/:id/placements - קבלת היסטוריית שיבוצים
router.get('/:id/placements', getUserPlacements);

router.get('/:id/notifications', getUserNotifications);

export default router;