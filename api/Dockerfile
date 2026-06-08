FROM node:20-alpine

WORKDIR /app

# 1. Dépendances
COPY package*.json ./
RUN npm install

# 2. Schéma Prisma (obligatoire avant generate)
COPY prisma ./prisma

# 3. Génération du client Prisma
RUN npx prisma generate

# 4. Code applicatif
COPY . .

EXPOSE 3070
CMD ["npm", "run", "dev"]