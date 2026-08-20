import { Request, Response, NextFunction } from 'express';
import * as categoriesService from './categories.service.ts';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoriesService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};
