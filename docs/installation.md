# Guide d'Installation - Nocturn Bot Assistant

Ce guide vous accompagnera dans l'installation et la configuration de Nocturn Bot Assistant.

## 📋 Prérequis

### Système
- **Node.js** 16.0.0 ou supérieur
- **npm** ou **yarn** pour la gestion des dépendances
- **Git** pour cloner le repository

### Discord
- Un **compte Discord** avec les permissions d'administrateur sur un serveur
- Un **bot Discord** créé sur le [Portail Développeur Discord](https://discord.com/developers/applications)

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone <repository-url>
cd nocturn-bot-assistant
```

### 2. Installer les Dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration

#### Créer le fichier .env

```bash
cp env.example .env
```

#### Configurer les Variables d'Environnement

Éditez le fichier `.env` avec vos paramètres :

```env
# Configuration du Bot Discord
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Configuration de la Base de Données
DATABASE_TYPE=sqlite
DATABASE_PATH=./database.db

# Configuration du Dashboard
DASHBOARD_PORT=3000
DASHBOARD_SECRET=your_dashboard_secret_here
DASHBOARD_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Configuration des Permissions
OWNER_ID=your_owner_id_here
```

### 4. Configuration du Bot Discord

#### Créer une Application Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur "New Application"
3. Donnez un nom à votre application
4. Allez dans l'onglet "Bot"
5. Cliquez sur "Add Bot"
6. Copiez le **Token** et ajoutez-le dans votre `.env`

#### Configurer les Intents

Dans l'onglet "Bot" du portail développeur, activez les intents suivants :
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

#### Inviter le Bot

1. Allez dans l'onglet "OAuth2" > "URL Generator"
2. Sélectionnez les scopes :
   - ✅ `bot`
   - ✅ `applications.commands`
3. Sélectionnez les permissions :
   - ✅ Administrator (pour le développement)
   - Ou sélectionnez les permissions spécifiques :
     - Manage Guild
     - Send Messages
     - Embed Links
     - Manage Channels
     - Manage Roles
4. Copiez l'URL générée et ouvrez-la dans votre navigateur
5. Sélectionnez votre serveur et autorisez le bot

### 5. Déployer les Slash Commands

```bash
# Pour le développement (serveur spécifique)
npm run deploy guild

# Pour la production (global)
npm run deploy global
```

### 6. Démarrer le Bot

```bash
# Mode développement (avec redémarrage automatique)
npm run dev

# Mode production
npm start
```

## 🔧 Configuration Avancée

### Base de Données

#### SQLite (Développement - Par Défaut)
Aucune configuration supplémentaire nécessaire. La base de données sera créée automatiquement.

#### MariaDB (Production)
1. Installez MariaDB sur votre serveur
2. Créez une base de données : `CREATE DATABASE nocturn_bot;`
3. Modifiez votre `.env` :

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@localhost:3306/nocturn_bot
```

### Dashboard Web

Le dashboard est accessible par défaut sur `http://localhost:3000`

#### Configuration HTTPS (Production)

1. Obtenez un certificat SSL
2. Configurez un reverse proxy (nginx, Apache)
3. Modifiez votre `.env` :

```env
DASHBOARD_CALLBACK_URL=https://yourdomain.com/api/auth/callback
```

## 🧪 Test de l'Installation

### 1. Vérifier la Connexion

Une fois le bot démarré, vous devriez voir :
```
✅ Bot connecté à Discord
✅ Base de données initialisée
✅ Événements chargés
✅ Commandes chargées
✅ Dashboard démarré
```

### 2. Tester les Commandes

Dans votre serveur Discord, testez :
- `/help` - Affiche la liste des commandes
- `/ping` - Test de latence
- `/info` - Informations du serveur

### 3. Accéder au Dashboard

1. Ouvrez `http://localhost:3000`
2. Connectez-vous avec votre compte Discord
3. Sélectionnez un serveur à gérer

## 🚨 Dépannage

### Erreurs Courantes

#### "Bot Token Invalid"
- Vérifiez que le token dans `.env` est correct
- Régénérez le token si nécessaire

#### "Missing Permissions"
- Vérifiez que le bot a les permissions nécessaires
- Utilisez le lien d'invitation avec les bonnes permissions

#### "Database Error"
- Vérifiez la configuration de la base de données
- Assurez-vous que le dossier a les permissions d'écriture

#### "Dashboard Not Loading"
- Vérifiez que le port 3000 n'est pas utilisé
- Vérifiez la configuration des variables d'environnement

### Logs

Les logs sont affichés dans la console. Pour plus de détails, vérifiez :
- Les erreurs dans la console
- Les permissions du bot
- La configuration du fichier `.env`

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez cette documentation
2. Consultez les [Issues GitHub](https://github.com/your-repo/issues)
3. Rejoignez notre [Serveur Discord](https://discord.gg/your-server)
4. Contactez-nous par email : support@nocturn-bot.com

## 🔄 Mise à Jour

Pour mettre à jour le bot :

```bash
git pull origin main
npm install
npm run deploy guild  # ou global
npm start
```

## 📝 Notes Importantes

- **Sécurité** : Ne partagez jamais votre token de bot
- **Sauvegarde** : Sauvegardez régulièrement votre base de données
- **Permissions** : Utilisez le minimum de permissions nécessaires en production
- **Monitoring** : Surveillez les logs pour détecter les problèmes 