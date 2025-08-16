# 🏗️ DAO Management System

Système de gestion des Dossiers d'Appel d'Offres (DAO) avec interface web moderne et backend MongoDB.

## 📁 Structure du Projet

```
dao-management/
├── frontend/           # Application React (port 3000)
├── backend/            # API Express + MongoDB (port 5000)
├── shared/             # Types TypeScript partagés
└── README.md          # Ce fichier
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- MongoDB 6.0+
- pnpm (recommandé) ou npm

### Installation

1. **Cloner le repository**

```bash
git clone <repository-url>
cd dao-management
```

2. **Installer les dépendances**

```bash
# Frontend
cd frontend
pnpm install

# Backend
cd ../backend
pnpm install
```

3. **Configuration**

```bash
# Backend - créer .env
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres MongoDB
```

4. **Démarrer les services**

```bash
# Terminal 1 - Backend (port 5000)
cd backend
pnpm dev

# Terminal 2 - Frontend (port 3000)
cd frontend
pnpm dev
```

## 🏛️ Architecture

### Frontend (`/frontend`)

- **Framework**: React 18 + TypeScript
- **Routing**: React Router 6 (SPA)
- **UI**: Radix UI + TailwindCSS
- **State**: React Query + Context
- **Build**: Vite

### Backend (`/backend`)

- **Framework**: Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate limiting
- **API**: RESTful JSON API

### Shared (`/shared`)

- **Types TypeScript** partagés entre frontend/backend
- **Validations Zod** communes
- **Utilitaires** de calcul métier

## 📊 Base de Données MongoDB

### Collections

- `users` - Utilisateurs et authentification
- `daos` - Dossiers d'appel d'offres
- `sessions` - Sessions utilisateur (optionnel)

### Modèles

- **User**: Gestion utilisateurs avec rôles (admin/user)
- **DAO**: Dossiers avec tâches, équipes, et progression
- **Indexes**: Optimisés pour recherche et performance

## 🔐 Authentification

- **JWT Tokens** avec expiration configurable
- **Rôles**: Admin (CRUD complet) / User (lecture/modification)
- **Protection routes** frontend et backend
- **Gestion mots de passe** avec hachage bcrypt

## 🛠️ Développement

### Scripts Disponibles

**Frontend:**

```bash
pnpm dev          # Serveur développement (port 3000)
pnpm build        # Build production
pnpm preview      # Preview build locale
pnpm typecheck    # Vérification TypeScript
```

**Backend:**

```bash
pnpm dev          # Serveur développement avec auto-reload
pnpm build        # Build TypeScript vers JavaScript
pnpm start        # Démarrer en production
pnpm typecheck    # Vérification TypeScript
```

### Structure Frontend

```
frontend/src/
├── components/     # Composants React réutilisables
├── pages/          # Pages/routes de l'application
├── contexts/       # Context React (Auth, Notifications)
├── hooks/          # Custom hooks
├── services/       # Services API et externe
├── lib/            # Utilitaires et helpers
└── App.tsx         # Point d'entrée React
```

### Structure Backend

```
backend/src/
├── models/         # Modèles MongoDB/Mongoose
├── routes/         # Routes Express par domaine
├── middleware/     # Middleware Express (auth, errors, etc.)
├── services/       # Logique métier
├── config/         # Configuration (DB, env)
└── index.ts        # Point d'entrée Express
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur actuel
- `PUT /api/auth/profile` - Mise à jour profil
- `POST /api/auth/change-password` - Changement mot de passe

### DAO Management

- `GET /api/dao` - Liste des DAOs
- `GET /api/dao/:id` - Détail d'un DAO
- `POST /api/dao` - Créer un DAO
- `PUT /api/dao/:id` - Mettre à jour un DAO
- `DELETE /api/dao/:id` - Supprimer un DAO

### User Management (Admin)

- `GET /api/users` - Liste utilisateurs
- `POST /api/users` - Créer utilisateur
- `PUT /api/users/:id` - Mettre à jour utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur

## 🔧 Configuration

### Variables d'Environnement Backend

```env
# Database
MONGODB_URI=mongodb://localhost:27017/dao-management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Déploiement

### Production Build

```bash
# Frontend
cd frontend
pnpm build
# Les fichiers sont dans frontend/dist/

# Backend
cd backend
pnpm build
# Les fichiers sont dans backend/dist/
```

### Docker (optionnel)

```bash
# Frontend
docker build -t dao-frontend ./frontend

# Backend
docker build -t dao-backend ./backend
```

## 📱 Fonctionnalités

### ✅ Implémentées

- Interface responsive mobile/desktop
- Authentification complète JWT
- Gestion des DAOs avec progression
- Système de tâches avec assignation
- Gestion d'équipes par DAO
- Export PDF/CSV
- Filtres et recherche
- Notifications temps réel
- Gestion utilisateurs (admin)
- Profils utilisateur

### 🔄 En Cours

- Améliorations responsivité mobile
- Optimisations performance
- Tests unitaires
- Documentation API

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changes (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.
