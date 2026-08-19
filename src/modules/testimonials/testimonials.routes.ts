import { Router } from "express";
import { getTestimonials } from "./testimonials.controller.ts";

const router = Router();
/**
 * @openapi
 * /testimonials:
 *   get:
 *     summary: Get all testimonials
 *     tags:
 *       - Testimonials
 *     responses:
 *       200:
 *         description: List of all testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   testimonial:
 *                     type: string
 *                   ownerId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get("/", getTestimonials);

export default router;
