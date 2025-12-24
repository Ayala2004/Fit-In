import { Router } from 'express';
import { assignSubstitute, createPlacement, getOpenPlacements } from '../controllers/placementController';

const router = Router();

router.post('/', createPlacement);
router.get('/open', getOpenPlacements);
router.patch('/:id/assign', assignSubstitute); // the id of the placement you want to assign to

export default router;