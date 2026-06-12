import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { EnumMethod } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../client.js';
import '../env.js';

const LOGGED_METHODS = Object.values(EnumMethod) as string[];

// Champs sensibles à ne jamais persister dans les logs
const REDACTED_FIELDS = ['password'];

/**
 * Journalise chaque appel API dans la table Log : méthode, route,
 * paramètres (query string et corps) et utilisateur si un token est fourni.
 * L'écriture est asynchrone pour ne pas ralentir la requête.
 */
export const logRequest = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!LOGGED_METHODS.includes(req.method)) {
    next();
    return;
  }

  // Identifier l'utilisateur si un token valide est présent (sinon log anonyme)
  let userId: string | null = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
      };
      userId = decoded.userId;
    } catch {
      // Token invalide ou expiré : on journalise la requête sans utilisateur
    }
  }

  const details: Record<string, unknown> = {};
  if (Object.keys(req.query).length > 0) {
    details.query = req.query;
  }
  if (
    req.body &&
    typeof req.body === 'object' &&
    Object.keys(req.body).length > 0
  ) {
    const body: Record<string, unknown> = { ...req.body };
    for (const field of REDACTED_FIELDS) {
      if (field in body) {
        body[field] = '***';
      }
    }
    details.body = body;
  }

  prisma.log
    .create({
      data: {
        method: req.method as EnumMethod,
        route: req.path,
        ...(Object.keys(details).length > 0 && {
          details: details as Prisma.InputJsonObject,
        }),
        FK_userId: userId,
        createdBy: userId,
      },
    })
    .catch((error) => {
      console.error("Échec de journalisation de l'appel API:", error);
    });

  next();
};
