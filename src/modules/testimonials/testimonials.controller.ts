import {Request, Response, NextFunction} from 'express';
import * as testimonialsService from './testimonials.service.ts';

export const getTestimonials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const testimonials = await testimonialsService.getAllTestimonials();
        res.status(200).json(testimonials);
    } catch (error) {
        next(error);
    }       
};
