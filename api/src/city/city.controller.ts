import type { Request, Response } from 'express';
import { prisma } from '../client.js';

//##### GET #####
/**
 * Récupérer la liste de toutes les villes
 */
export const getCities = async (_req: Request, res: Response) => {
  try {
    const cities = await prisma.city.findMany();
    res.status(200).json({
      message: 'Liste des villes récupérée avec succès.',
      result: cities,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération des villes.',
      error: error,
    });
  }
};
