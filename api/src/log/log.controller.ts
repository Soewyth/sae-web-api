import type { Request, Response } from 'express';
import { EnumMethod } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../client.js';

//##### GET #####
/**
 * Récupère les logs, du plus récent au plus ancien, avec le username de
 * l'utilisateur concerné.
 * Si l'utilisateur est admin, renvoie tous les logs et peut filtrer par
 * utilisateur (?userId=...) et par méthode (?method=GET|POST|PUT|DELETE).
 * Sinon, renvoie uniquement les logs concernant l'utilisateur.
 */
export const getLogs = async (req: Request, res: Response) => {
  try {
    //On récupère l'utilisateur authentifié
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    //Filtres optionnels
    const { userId: filterUserId, method } = req.query;
    if (
      method !== undefined &&
      (typeof method !== 'string' ||
        !Object.values(EnumMethod).includes(method as EnumMethod))
    ) {
      res.status(400).json({
        message: "Le paramètre 'method' doit valoir GET, POST, PUT ou DELETE.",
      });
      return;
    }

    //Admin -> tous les logs (filtrables), sinon -> uniquement ses logs
    const where: Prisma.LogWhereInput = {};
    if (user.isAdmin) {
      if (typeof filterUserId === 'string' && filterUserId !== '') {
        where.FK_userId = filterUserId;
      }
    } else {
      where.FK_userId = userId;
    }
    if (method) {
      where.method = method as EnumMethod;
    }

    const logs = await prisma.log.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    res.status(200).json({
      message: 'Liste des logs récupérée avec succès.',
      result: logs,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération des logs.',
      error: error,
    });
  }
};
