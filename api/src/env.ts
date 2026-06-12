// Charge le .env unique situé à la racine du dépôt quand le code tourne
// depuis l'hôte (tests, prisma, dev hors Docker). Dans le conteneur, les
// variables sont déjà injectées par Docker Compose et dotenv n'écrase
// jamais une variable existante, donc ce chargement est sans effet.
import { config as loadEnv } from 'dotenv';

loadEnv({ path: ['.env', '../.env'], quiet: true });
