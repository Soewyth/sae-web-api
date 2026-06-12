import type { Request, Response } from 'express';
import { prisma } from '../client.js';
import '../env.js';

// Get all users
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      message: 'Liste des utilisateurs récupérée avec succès.',
      result: users,
    });
  } catch (error) {
    res.status(500).json({
      message:
        'Une erreur est survenue lors de la récupération des utilisateurs.',
      error: error,
    });
  }
}

// Get all events created by a user
export async function getEventsByUser(req: Request, res: Response) {
  const userId = req.params.id;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: "Identifiant d'utilisateur invalide." });
    return;
  }
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res
        .status(404)
        .json({ error: `Utilisateur avec l'ID ${userId} non trouvé.` });
      return;
    }

    const events = await prisma.event.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      message: `Événements de l'utilisateur '${user.username}' récupérés avec succès.`,
      result: events,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération des événements de l'utilisateur.",
      error: error,
    });
  }
}

// Delete user by ID
export async function deleteUser(req: Request, res: Response) {
  const userId = req.params.id;
  if (typeof userId !== 'string') {
    res.status(400).json({ error: "Identifiant d'utilisateur invalide." });
    return;
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res
        .status(404)
        .json({ error: `Utilisateur avec l'ID ${userId} non trouvé.` });
      return;
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la suppression de l'utilisateur.",
      error: error,
    });
  }
}
