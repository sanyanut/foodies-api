import { Request, Response, NextFunction } from 'express';
import * as areasService from './areas.service.ts';

export const getAreas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await areasService.getAllAreas();
    res.status(200).json(areas);
  } catch (error) {
    next(error);
  }
};