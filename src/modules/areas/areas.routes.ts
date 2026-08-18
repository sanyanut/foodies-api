import { Router } from 'express';
import { getAreas } from './areas.controller.ts';

const router = Router();

router.get('/', getAreas);

export default router;