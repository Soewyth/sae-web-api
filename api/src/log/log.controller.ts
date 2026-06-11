import type {Request, Response} from "express";
import {prisma} from "../client.js";

//##### GET #####
/**
 * Récupère les logs.
 * Si l'utilisateur est admin, renvoie tous les logs.
 * Sinon, renvoie uniquement les logs concernant l'utilisateur.
 */
export const getLogs = async (req: Request, res: Response) => {
    try {
        //On récupère l'utilisateur authentifié
        const userId = req.userId
        if (!userId) {
            res.status(401).json({ message: "Utilisateur non authentifié." })
            return
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            res.status(404).json({ message: "Utilisateur introuvable." })
            return
        }

        //Admin -> tous les logs, sinon -> uniquement ses logs
        const logs = user.isAdmin
            ? await prisma.log.findMany()
            : await prisma.log.findMany({ where: { FK_userId: userId } });
        res.status(200).json({
            message: 'Liste des logs récupérée avec succès.',
            result: logs
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des logs.',
            error: error
        })
    }
}