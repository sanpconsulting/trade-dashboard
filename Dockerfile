FROM node:20-alpine

# Mettre en place le répertoire de travail
WORKDIR /app

# Copier le package.json et le package-lock.json (s'il existe)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Compiler l'application pour la production (TypeScript -> JavaScript & Vite build pour le client)
RUN npm run build

# Exposer le port de l'application
EXPOSE 3000

# Démarrer le serveur Node.js compilé
CMD ["npm", "start"]
