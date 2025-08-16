#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configuration du système de gestion DAO${NC}"
echo "================================================"

# Vérifier si MongoDB est installé
echo -e "${YELLOW}📊 Vérification de MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    echo -e "${RED}❌ MongoDB n'est pas installé. Veuillez l'installer d'abord.${NC}"
    echo "   Installation sur Ubuntu/Debian: sudo apt install mongodb"
    echo "   Installation sur macOS: brew install mongodb/brew/mongodb-community"
    echo "   Installation sur Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/"
    exit 1
else
    echo -e "${GREEN}✅ MongoDB trouvé${NC}"
fi

# Démarrer MongoDB (si pas déjà démarré)
echo -e "${YELLOW}🔧 Démarrage de MongoDB...${NC}"
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅ MongoDB est déjà en cours d'exécution${NC}"
else
    echo -e "${BLUE}🔄 Démarrage de MongoDB...${NC}"
    sudo systemctl start mongod 2>/dev/null || brew services start mongodb/brew/mongodb-community 2>/dev/null || mongod --fork --logpath /var/log/mongodb.log
fi

# Installer les dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

# Copier les fichiers d'environnement
echo -e "${YELLOW}⚙️ Configuration des variables d'environnement...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
    echo -e "${YELLOW}⚠️ Veuillez modifier le fichier .env avec vos configurations (email, JWT secret, etc.)${NC}"
else
    echo -e "${BLUE}ℹ️ Fichier .env existe déjà${NC}"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Fichier backend/.env créé${NC}"
else
    echo -e "${BLUE}ℹ️ Fichier backend/.env existe déjà${NC}"
fi

# Générer un secret JWT sécurisé
echo -e "${YELLOW}🔐 Génération du secret JWT...${NC}"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\\n")
if [ -f .env ]; then
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production-minimum-32-characters/$JWT_SECRET/" .env
    rm .env.bak 2>/dev/null
fi
if [ -f backend/.env ]; then
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production-minimum-32-characters/$JWT_SECRET/" backend/.env
    rm backend/.env.bak 2>/dev/null
fi
echo -e "${GREEN}✅ Secret JWT généré${NC}"

echo ""
echo -e "${GREEN}🎉 Installation terminée !${NC}"
echo "================================================"
echo ""
echo -e "${BLUE}📋 Prochaines étapes :${NC}"
echo ""
echo -e "${YELLOW}1. Configuration email (optionnel) :${NC}"
echo "   Modifiez les variables SMTP_* dans les fichiers .env"
echo "   Pour Gmail : activez l'authentification à 2 facteurs et créez un mot de passe d'application"
echo ""
echo -e "${YELLOW}2. Démarrer l'application :${NC}"
echo "   pnpm dev      # ou npm run dev"
echo ""
echo -e "${YELLOW}3. Créer l'utilisateur admin (première fois uniquement) :${NC}"
echo "   cd backend && npm run create-admin"
echo ""
echo -e "${YELLOW}4. Accès à l'application :${NC}"
echo "   Frontend : http://localhost:8080"
echo "   Backend API : http://localhost:8080/api"
echo ""
echo -e "${YELLOW}5. Connexion admin par défaut :${NC}"
echo "   Email : admin@2snd.fr"
echo "   Mot de passe : admin123"
echo "   ${RED}⚠️ Changez ce mot de passe après la première connexion !${NC}"
echo ""
echo -e "${GREEN}✨ Bonne utilisation !${NC}"
