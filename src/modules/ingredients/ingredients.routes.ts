import {Router} from 'express';
import {getIngredients} from './ingredients.controller.ts';

const router = Router();

router.get('/', getIngredients);

export default router;
