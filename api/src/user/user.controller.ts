import type { Request, Response } from 'express';
import prisma from '../client';
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
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des utilisateurs.' });
    }
}

// Get user by ID
export async function getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = Number(id);

    if (isNaN(userId)) {
        res.status(400).json({ error: "L'ID doit être un nombre valide." });
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
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de l\'utilisateur.' });
    }
}

// Update user by ID
export async function updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const userId = Number(id);
    const { email, password, username } = req.body;

    if (isNaN(userId)) {
        res.status(400).json({ error: "L'ID doit être un nombre valide." });
        return;
    }

    // one field must be provided
    if (!email && !password && !username) {
        res.status(400).json({ error: "Au moins un champ 'email', 'password' ou 'username' doit être fourni." });
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
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur.' });
    }
}

// Delete user by ID
export async function deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    const userId = Number(id);

    if (isNaN(userId)) {
        res.status(400).json({ error: "L'ID doit être un nombre valide." });
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
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de l\'utilisateur.' });
    }
}