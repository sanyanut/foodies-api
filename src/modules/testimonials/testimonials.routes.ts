import { Router } from "express";
import { getTestimonials } from "./testimonials.controller.ts";

const router = Router();

router.get("/", getTestimonials);

export default router;
