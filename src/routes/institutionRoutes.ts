import { Router } from 'express';
import { createInstitution, getAllInstitutions } from '../controllers/institutionController';

const router = Router();

router.post('/create-institution', createInstitution);
router.get('/get-all-institutions', getAllInstitutions);

export default router;