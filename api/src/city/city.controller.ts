import type {Request, Response} from 'express';
import {prisma} from "../client.js";

//##### GET #####
/**
 * Récupérer la liste de toutes les villes
 */
export const getCities = async (_req: Request, res: Response) => {
    try {
        const cities = await prisma.city.findMany();
        res.status(200).json({
            message: 'Liste des villes récupérée avec succès.',
            result: cities
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des villes.',
            error: error
        })
    }
}

/**
 * Récupérer une ville en particulier par son id
 */
export const getCityById = async (req: Request, res: Response) => {
    // On récupère l'id
    const cityId = req.params.cityId
    if (typeof cityId !== 'string') {
        res.status(400).json({ error: "Identifiant de ville invalide." })
        return
    }
    try {
        //On regarde si la ville existe
        const city = await prisma.city.findUnique({
            where: {
                id: cityId
            }
        });
        if (!city) {
            res.status(404).json({
                error: `Ville avec l'id "${cityId}" non trouvée.`
            });
            return
        } else {
            res.status(200).json({
                message: 'Ville récupérée avec succès.',
                result: city
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération de la ville.',
            error: error
        })
    }
}

/**
 * Récupérer les événements d'une ville
 */
export const getEventByCity = async (req: Request, res: Response)=> {
    // On récupère l'id de la ville
    const cityId = req.params.cityId
    if (typeof cityId !== 'string') {
        res.status(400).json({ error: "Identifiant de ville invalide." })
        return
    }
    try {
        //On regarde si la ville existe
        const city = await prisma.city.findUnique({
            where: {
                id: cityId
            }
        });
        if (!city) {
            res.status(404).json({
                error: `Ville avec l'id "${cityId}" non trouvée.`
            });
            return
        } else {
            //On récupère les événements
            const events = await prisma.event.findMany({
                where: {
                    FK_cityId: cityId
                }
            })
            if (!events) {
                res.status(404).json({
                    error: `Événements non trouvés pour la ville "${city.name}".`
                });
                return
            } else {
                res.status(200).json({
                    message: `Événements de la ville "${city.name}" récupérés avec succès.`,
                    result: events
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des événements d\'une ville.',
            error: error
        })
    }
}