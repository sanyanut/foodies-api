import {Router} from 'express';
import {getIngredients} from './ingredients.controller.ts';

const router = Router();
/**
 * @openapi
 * /ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags:
 *       - Ingredients
 *     responses:
 *       200:
 *         description: List of all ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   img:
 *                     type: string
 *                     nullable: true
 */
router.get('/', getIngredients);

export default router;
