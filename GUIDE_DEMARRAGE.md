# Guide de Démarrage - Système de Gestion DAO

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ et npm/pnpm
- MongoDB (local ou distant)

### 1. Installation
```bash
# Cloner et installer
git clone <votre-repo>
cd dao-management
./setup.sh  # ou suivez les étapes manuelles ci-dessous
```

### 2. Installation Manuelle (si script automatique ne fonctionne pas)

#### Installer les dépendances
```bash
pnpm install  # ou npm install
```

#### Configurer l'environnement
```bash
# Copier les fichiers d'exemple
cp .env.example .env
cp backend/.env.example backend/.env

# Générer un secret JWT sécurisé
openssl rand -base64 64
# Coller le résultat dans JWT_SECRET dans les fichiers .env
```

#### Démarrer MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS avec Homebrew
brew services start mongodb/brew/mongodb-community

# Windows
net start MongoDB
```

#### Créer l'utilisateur admin
```bash
cd backend
npm run create-admin
cd ..
```

### 3. Démarrer l'application
```bash
pnpm dev  # ou npm run dev
```

L'application sera accessible sur http://localhost:8080

## 🔐 Première Connexion

### Compte Administrateur par Défaut
- **Email** : admin@2snd.fr
- **Mot de passe** : admin123

⚠️ **Important** : Changez ce mot de passe immédiatement après la première connexion !

## ✨ Nouvelles Fonctionnalités Implémentées

### 1. **Espacement corrigé dans l'interface**
- ✅ L'espacement au début des phases a été amélioré dans la vue détaillée des DAO

### 2. **Génération de mots de passe par défaut**
- ✅ L'admin peut créer des utilisateurs avec des mots de passe temporaires générés automatiquement
- ✅ Le mot de passe est affiché à l'admin lors de la création
- ✅ Possibilité de copier le mot de passe dans le presse-papiers

### 3. **Mots de passe temporaires**
- ✅ Durée de vie : 24 heures
- ✅ Expiration automatique
- ✅ L'utilisateur doit changer son mot de passe lors de la première connexion

### 4. **Système de mail complet**
- ✅ Service email avec nodemailer
- ✅ Templates HTML professionnels
- ✅ Emails de bienvenue avec mot de passe temporaire
- ✅ Emails de réinitialisation de mot de passe
- ✅ Confirmation de changement de mot de passe

### 5. **Flux de changement de mot de passe amélioré**
- ✅ Interface simplifiée pour les mots de passe temporaires
- ✅ Alertes visuelles pour les utilisateurs avec mots de passe temporaires
- ✅ Suppression automatique du statut temporaire après changement

### 6. **Base de données MongoDB robuste**
- ✅ Migration complète vers MongoDB
- ✅ Modèles de données sécurisés
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Gestion des sessions avec JWT

## 📧 Configuration Email (Optionnelle)

### Pour Gmail
1. Activez l'authentification à 2 facteurs
2. Créez un mot de passe d'application
3. Configurez dans `.env` et `backend/.env` :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
```

### Pour d'autres fournisseurs
Adaptez `SMTP_HOST` et `SMTP_PORT` selon votre fournisseur :
- **Outlook** : smtp-mail.outlook.com:587
- **Yahoo** : smtp.mail.yahoo.com:587
- **Autre** : Consultez la documentation de votre fournisseur

## 🛠️ Commandes Utiles

```bash
# Développement
pnpm dev                    # Démarre l'app en mode développement
pnpm build                  # Build pour la production
pnpm start                  # Démarre l'app en production

# Backend uniquement
cd backend
npm run dev                 # Démarre le backend seul
npm run create-admin        # Crée un utilisateur admin
npm run setup              # Crée l'admin (alias)

# Tests
pnpm test                   # Lance les tests
pnpm typecheck             # Vérification TypeScript
```

## 🔒 Sécurité

### Variables d'environnement importantes
- `JWT_SECRET` : Clé secrète pour les tokens (64+ caractères)
- `MONGODB_URI` : URI de connexion MongoDB
- `SMTP_*` : Configurations email (ne pas committer les vrais identifiants)

### Bonnes pratiques
- Changez toujours les mots de passe par défaut
- Utilisez des secrets JWT forts en production
- Configurez MongoDB avec authentification en production
- Utilisez HTTPS en production

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier le statut
systemctl status mongod

# Voir les logs
journalctl -u mongod -f

# Redémarrer
sudo systemctl restart mongod
```

### Problèmes d'email
- Vérifiez les variables SMTP dans `.env`
- Les emails s'affichent dans la console si le service n'est pas configuré
- Gmail nécessite un mot de passe d'application, pas votre mot de passe habituel

### Erreurs de connexion
- Vérifiez que MongoDB est démarré
- Vérifiez l'URI de connexion dans `MONGODB_URI`
- Créez l'utilisateur admin avec `npm run create-admin`

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de l'application
2. Consultez ce guide
3. Contactez l'équipe de développement

---

**Bonne utilisation de votre système de gestion DAO ! 🎉**
