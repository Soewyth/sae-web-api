import type { Request, Response } from 'express';
import { EnumType } from '@prisma/client';
import { prisma } from '../client.js';

//##### GET #####
/**
 * Récupère tous les types d'événements
 */
export const getEventTypes = (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Liste des types d'événements récupérée avec succès.",
    result: Object.values(EnumType),
  });
};

/**
 * Récupère tous les événements
 */
export const getEvents = async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json({
      message: 'Liste des événements récupérée avec succès.',
      result: events,
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Une erreur est survenue lors de la récupération des événements.',
      error: error,
    });
  }
};

/**
 * Récupérer un événement en particulier par son id
 */
export const getEventById = async (req: Request, res: Response) => {
  // On récupère l'id
  const eventId = req.params.id;
  if (typeof eventId !== 'string') {
    res.status(400).json({ error: "Identifiant d'événement invalide." });
    return;
  }
  try {
    //On regarde si l'événement existe
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    if (!event) {
      res.status(404).json({
        error: `Événement avec l'id "${eventId}" non trouvée.`,
      });
      return;
    } else {
      res.status(200).json({
        message: 'Événement récupéré avec succès.',
        result: event,
      });
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération de l'événement.",
      error: error,
    });
  }
};

/**
 * Récupérer les reviews d'un événement
 */
export const getReviewsByEvent = async (req: Request, res: Response) => {
  // on récupère l'id de l'événement
  const eventId = req.params.id;
  if (typeof eventId !== 'string') {
    res.status(400).json({ error: "Identifiant d'événement invalide." });
    return;
  }
  try {
    //On regarde si l'événement existe
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    if (!event) {
      res.status(404).json({
        error: `Événement avec l'id "${eventId}" non trouvée.`,
      });
      return;
    } else {
      // On récupère les reviews de l'événement
      const reviews = await prisma.userReview.findMany({
        where: {
          FK_EventId: eventId,
        },
      });
      if (!reviews) {
        res.status(404).json({
          error: `Reviews non trouvés pour l'événement "${event.title}".`,
        });
        return;
      } else {
        res.status(200).json({
          message: `Reviews de l'événement "${event.title}" récupérés avec succès.`,
          result: reviews,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération des reviews d'un événement.",
      error: error,
    });
  }
};

//##### POST #####
/**
 * Permet de créer un événement
 */
export const postEvent = async (req: Request, res: Response) => {
  // On récupère les données du body (json)
  const {
    type,
    startDate,
    endDate,
    description,
    isOutdoor,
    nbGuests,
    title,
    weather,
    FK_cityId,
  } = req.body;

  try {
    if (
      !type ||
      !startDate ||
      !endDate ||
      isOutdoor === undefined ||
      isOutdoor === null ||
      !nbGuests ||
      !title ||
      !FK_cityId
    ) {
      res.status(400).json({
        message:
          "Certains champs obligatoire sont manquants pour la création d'un événement",
      });
      return;
    }
    //on vérifie si la ville existe
    const city = await prisma.city.findUnique({
      where: {
        id: FK_cityId,
      },
    });
    if (!city) {
      res.status(400).json({
        message: `La ville avec l'id '${FK_cityId} n'existe pas`,
      });
      return;
    }

    //On récupère l'utilisateur
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié.' });
      return;
    }

    const eventToCreate = await prisma.event.create({
      data: {
        type: type,
        startDate: startDate,
        endDate: endDate,
        description: description,
        isOutdoor: isOutdoor,
        nbGuests: nbGuests,
        title: title,
        weather: weather,
        FK_cityId: FK_cityId,
        createdBy: userId,
      },
    });

    res.status(201).json({
      message: 'Événement créé avec succès.',
      result: eventToCreate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Une erreur est survenue lors de la création de l'événement.",
      error: error,
    });
  }
};

//##### PUT #####
/**
 * Permet de modifier un événement
 */
export const putEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (typeof eventId !== 'string') {
    res.status(400).json({ error: "Identifiant d'événement invalide." });
    return;
  }
  //On récupère les données du body
  const {
    type,
    startDate,
    endDate,
    description,
    isOutdoor,
    nbGuests,
    title,
    weather,
    FK_cityId,
  } = req.body;

  try {
    //On vérifie si l'event existe
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    if (!event) {
      res.status(404).json({
        message: `Événement avec l'id '${eventId}' introuvable.`,
      });
      return;
    }
    //On vérifie si la ville existe
    const city = await prisma.city.findUnique({
      where: {
        id: FK_cityId,
      },
    });
    if (!city) {
      res.status(404).json({
        message: `Ville avec l'id '${FK_cityId}' introuvable.`,
      });
      return;
    }

    const eventToUpdate = await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        type: type,
        startDate: startDate,
        endDate: endDate,
        description: description,
        isOutdoor: isOutdoor,
        nbGuests: nbGuests,
        title: title,
        weather: weather,
        FK_cityId: FK_cityId,
      },
    });
    res.status(200).json({
      message: `Événement '${title}' avec l'id '${eventId}' mis à jour.`,
      event: eventToUpdate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la modification de l'événement",
      error: error,
    });
  }
};

//##### DELETE #####
/**
 * Permet de supprimer un événement
 */
export const deleteEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (typeof eventId !== 'string') {
    res.status(400).json({ error: "Identifiant d'événement invalide." });
    return;
  }
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });
    if (!event) {
      res.status(404).json({
        message: `Événement avec l'id '${eventId}' introuvable.`,
      });
      return;
    } else {
      const eventToDelete = await prisma.event.delete({
        where: {
          id: eventId,
        },
      });
      res.status(200).json({
        message: `Événement '${eventToDelete.title}' supprimé.`,
        event: eventToDelete,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de l'événement",
      error: error,
    });
  }
};
