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

//##### POST #####
/**
 * Permet de créer une review pour un événement
 */
export const postReview = async (req: Request, res: Response) => {
  // On récupère l'id de l'événement depuis l'url
  const eventId = req.params.id;
  if (typeof eventId !== 'string') {
    res.status(400).json({ error: "Identifiant d'événement invalide." });
    return;
  }
  // On récupère les données du body (json)
  const { rating, comment } = req.body;

  try {
    if (rating === undefined) {
      res.status(400).json({
        message:
          "Le champ 'rating' est obligatoire pour la création d'une review",
      });
      return;
    }
    //on vérifie si l'événement existe
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    if (!event) {
      res.status(400).json({
        message: `L'événement avec l'id '${eventId}' n'existe pas`,
      });
      return;
    }

    //On récupère l'utilisateur
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié.' });
      return;
    }

    const reviewToCreate = await prisma.userReview.create({
      data: {
        rating: rating,
        comment: comment,
        FK_EventId: eventId,
        FK_userId: userId,
        createdBy: userId,
      },
    });

    res.status(201).json({
      message: 'Review créée avec succès.',
      result: reviewToCreate,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création de la review.',
      error: error,
    });
  }
};
