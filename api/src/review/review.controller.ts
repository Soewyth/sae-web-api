import type { Request, Response } from 'express';
import { prisma } from '../client.js';

//##### GET #####
/**
 * Récupérer tous les avis avec leur événement (et sa ville) et leur auteur
 */
export const getReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await prisma.userReview.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
        event: {
          select: {
            title: true,
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json({
      message: 'Liste des avis récupérée avec succès.',
      result: reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération des avis.',
      error: error,
    });
  }
};
