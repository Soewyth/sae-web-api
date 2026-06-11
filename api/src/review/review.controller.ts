import type {Request, Response} from "express";
import {prisma} from "../client.js";

//##### POST #####
/**
 * Permet de créer une review pour un événement
 */
export const postReview = async (req: Request, res: Response) => {
    // On récupère l'id de l'événement depuis l'url
    const eventId = req.params.id
    if (typeof eventId !== 'string') {
        res.status(400).json({ error: "Identifiant d'événement invalide." })
        return
    }
    // On récupère les données du body (json)
    const {
        rating,
        comment
    } = req.body

    try {
        if (rating === undefined) {
            res.status(400).json({
                message: "Le champ 'rating' est obligatoire pour la création d'une review"
            })
            return
        }
        //on vérifie si l'événement existe
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        })
        if (!event) {
            res.status(400).json({
                message: `L'événement avec l'id '${eventId}' n'existe pas`
            })
            return
        }

        //On récupère l'utilisateur
        const userId = req.userId
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié." })
            return
        }

        const reviewToCreate = await prisma.userReview.create({
            data: {
                rating: rating,
                comment: comment,
                FK_EventId: eventId,
                FK_userId: userId,
                createdBy: userId
            }
        })

        res.status(201).json({
            message: 'Review créée avec succès.',
            result: reviewToCreate
        })
    } catch (error) {
        res.status(500).json({
            message: "Une erreur est survenue lors de la création de la review.",
            error: error
        })
    }
}

//##### PUT #####
/**
 * Permet de modifier une review
 */
export const putReview = async (req: Request, res: Response) => {
    const reviewId = req.params.id
    if (typeof reviewId !== 'string') {
        res.status(400).json({ error: "Identifiant de review invalide." })
        return
    }
    //On récupère les données du body
    const {
        rating,
        comment
    } = req.body

    try {
        //On vérifie si la review existe
        const review = await prisma.userReview.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!review) {
            res.status(404).json({
                message: `Review avec l'id '${reviewId}' introuvable.`
            })
            return
        }

        const reviewToUpdate = await prisma.userReview.update({
            where: {
                id: reviewId
            },
            data: {
                rating: rating,
                comment: comment
            }
        })
        res.status(200).json({
            message: `Review avec l'id '${reviewId}' mise à jour.`,
            review: reviewToUpdate
        })
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la modification de la review",
            error: error
        })
    }
}

//##### DELETE #####
/**
 * Permet de supprimer une review
 */
export const deleteReview = async (req: Request, res: Response) => {
    const reviewId = req.params.id
    if (typeof reviewId !== 'string') {
        res.status(400).json({ error: "Identifiant de review invalide." })
        return
    }
    try {
        const review = await prisma.userReview.findUnique({
            where: {
                id: reviewId
            }
        })
        if (!review) {
            res.status(404).json({
                message: `Review avec l'id '${reviewId}' introuvable.`
            })
            return
        } else {
            const reviewToDelete = await prisma.userReview.delete({
                where: {
                    id: reviewId
                }
            })
            res.status(200).json({
                message: `Review avec l'id '${reviewToDelete.id}' supprimée.`,
                review: reviewToDelete
            })
        }
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression de la review",
            error: error
        })
    }
}