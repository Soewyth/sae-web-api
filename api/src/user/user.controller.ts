import type { Request, Response } from 'express';
import {prisma} from "../client.js";
import bcrypt from 'bcrypt';
import 'dotenv/config';

// Get all users
export async function getUsers(req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true
            }
        });

        res.status(200).json({
            message: 'Liste des utilisateurs récupérée avec succès.',
            result: users
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération des utilisateurs.',
            error: error
        });
    }
}

// Get user by ID
export async function getUserById(req: Request, res: Response) {
    const userId = req.params.userId;
    if (typeof userId !== 'string') {
        res.status(400).json({ error: "Identifiant d'utilisateur invalide." });
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true
            }
        });

        if (!user) {
            res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé.` });
            return;
        }

        res.status(200).json({
            message: 'Utilisateur récupéré avec succès.',
            result: user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la récupération de l\'utilisateur.',
            error: error
        });
    }
}

// Update user by ID
export async function updateUser(req: Request, res: Response) {
    const userId = req.params.userId;
    if (typeof userId !== 'string') {
        res.status(400).json({ error: "Identifiant d'utilisateur invalide." });
        return;
    }
    const { email, password, username } = req.body;
    // one field must be provided
    if (!email && !password && !username) {
        res.status(400).json({ error: "Les champs 'email', 'password' et 'username' doivent être fournis." });
        return;
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé.` });
            return;
        }

        // Check if email is already taken by another user
        if (email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: email }
            });

            if (emailExists && emailExists.id !== userId) {
                res.status(400).json({ error: `Un utilisateur avec l'email '${email}' existe déjà.` });
                return;
            }
        }

        // Prepare update data
        const updateData: { email?: string; password?: string; username?: string } = {};

        if (email) {
            updateData.email = email;
        }

        if (username) {
            updateData.username = username;
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update the user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true
            }
        });

        res.status(200).json({
            message: 'Utilisateur mis à jour avec succès.',
            result: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur.',
            error: error
        });
    }
}

// Delete user by ID
export async function deleteUser(req: Request, res: Response) {
    const userId = req.params.userId;
    if (typeof userId !== 'string') {
        res.status(400).json({ error: "Identifiant d'utilisateur invalide." });
        return;
    }

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            res.status(404).json({ error: `Utilisateur avec l'ID ${userId} non trouvé.` });
            return;
        }

        // Delete the user
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        res.status(500).json({
            message: 'Une erreur est survenue lors de la suppression de l\'utilisateur.',
            error: error
        });
    }
}