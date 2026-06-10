import type {Request, Response} from "express";
import {prisma} from "../client.js";

//##### GET #####
/**
 * Récupère tous les événements
 */
export const getEvents = async (_req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany();
        res.status(200).json({
            message: 'Liste des événements récupérée avec succès.',
            result: events
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des événements.',
            error: error
        })
    }
}

/**
 * Récupérer un événement en particulier par son id
 */
export const getCityById = async (req: Request, res: Response) => {
    // On récupère l'id
    const eventId = req.params.eventId
    try {
        //On regarde si l'événement existe
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        if (!event) {
            res.status(404).json({
                error: `Événement avec l'id "${eventId}" non trouvée.`
            });
            return
        } else {
            res.status(200).json({
                message: 'Événement récupéré avec succès.',
                result: event
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération de l\'événement.',
            error: error
        })
    }
}

/**
 * Récupérer les reviews d'un événement
 */
export const getReviewsByEvent = async (req: Request, res: Response) => {
    // on récupère l'id de l'événement
    const eventId = req.params.eventId
    try {
        //On regarde si l'événement existe
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        if (!event) {
            res.status(404).json({
                error: `Événement avec l'id "${eventId}" non trouvée.`
            });
            return
        } else {
            // On récupère les reviews de l'événement
            const reviews = await prisma.userReview.findMany({
                where: {
                    FK_EventId: eventId
                }
            })
            if (!reviews) {
                res.status(404).json({
                    error: `Reviews non trouvés pour l'événement "${event.title}".`
                });
                return
            } else {
                res.status(200).json({
                    message: `Reviews de l'événement "${event.title}" récupérés avec succès.`,
                    result: reviews
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des reviews d\'un événement.',
            error: error
        })
    }
}

//##### POST #####
/**
 * Permet de créer un événement
 */
/*export const postEvent = async (req: Request, res: Response) => {
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
        imageUrl,
        FK_cityId
    } = req.body

    try {
        if (!type || !startDate || !endDate || !isOutdoor || !nbGuests || !title || !FK_cityId) {
            res.status(400).json({
                message: "Certains champs obligatoire sont manquants pour la création d'un événement"
            })
        }
        const eventTitle = await prisma.event.
    }
}*/

//##### PUT #####

//##### DELETE #####