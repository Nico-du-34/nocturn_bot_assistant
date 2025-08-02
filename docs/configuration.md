# Configuration - Nocturn Bot Assistant

Ce guide vous explique comment configurer et personnaliser votre bot Discord.

## 🔧 Configuration de Base

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

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

### Obtention des Tokens

#### 1. Bot Token
1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application ou sélectionnez une existante
3. Allez dans l'onglet "Bot"
4. Cliquez sur "Reset Token" pour obtenir votre token
5. Copiez le token dans `BOT_TOKEN`

#### 2. Client ID
1. Dans la même page, copiez l'ID de l'application
2. Ajoutez-le dans `CLIENT_ID`

#### 3. Guild ID (Optionnel)
1. Activez le mode développeur dans Discord
2. Clic droit sur votre serveur → "Copier l'identifiant"
3. Ajoutez-le dans `GUILD_ID` pour le développement

## 🎫 Configuration du Système de Tickets

### 1. Configuration Initiale

Utilisez la commande `/ticket setup` pour configurer le système :

```
/ticket setup category:#catégorie-tickets log_channel:#logs support_role:@Support
```

### 2. Création du Panel

Utilisez `/ticket panel` pour créer un panel de tickets :

```
/ticket panel channel:#tickets
```

### 3. Catégories Disponibles

Le système supporte automatiquement ces catégories :
- 🛠️ Support Général
- 🐛 Signalement de Bug
- 💡 Suggestion
- 🔐 Problème de Compte

## 🎉 Configuration des Giveaways

### Création d'un Giveaway

```
/giveaway create prize:"Nitro Discord" winners:1 duration:24h description:"Giveaway Nitro Discord!" requirements:"Être membre depuis 7 jours"
```

### Formats de Durée Supportés

- `30s` - 30 secondes
- `5m` - 5 minutes
- `2h` - 2 heures
- `1d` - 1 jour
- `1w` - 1 semaine

## 👋 Configuration des Messages de Bienvenue/Aurevoir

### Messages de Bienvenue

```
/config welcome channel:#bienvenue message:"Bienvenue {user} sur {server}! Tu es notre {memberCount.ordinal} membre!"
```

### Messages d'Aurevoir

```
/config goodbye channel:#aurevoir message:"Aurevoir {user}! Merci d'avoir fait partie de {server}!"
```

### Variables Disponibles

| Variable | Description |
|----------|-------------|
| `{user}` | Mention de l'utilisateur |
| `{user.tag}` | Tag Discord de l'utilisateur |
| `{user.name}` | Nom d'utilisateur |
| `{server}` | Nom du serveur |
| `{memberCount}` | Nombre total de membres |
| `{memberCount.ordinal}` | Nombre avec suffixe ordinal (1er, 2ème, etc.) |

## 🔧 Configuration du Prefix

### Changer le Prefix

```
/config prefix nouveau_prefix:!
```

### Prefix par Défaut

Le prefix par défaut est `!` mais peut être changé par serveur.

## 🌐 Configuration du Dashboard

### Accès au Dashboard

1. Démarrez le bot
2. Ouvrez `http://localhost:3000`
3. Connectez-vous avec votre compte Discord
4. Sélectionnez un serveur à gérer

### Configuration HTTPS (Production)

Pour la production, configurez HTTPS :

```env
DASHBOARD_CALLBACK_URL=https://yourdomain.com/api/auth/callback
```

## 📊 Permissions Requises

### Permissions du Bot

Le bot nécessite ces permissions :
- **Administrator** (recommandé pour le développement)
- Ou permissions spécifiques :
  - Manage Guild
  - Send Messages
  - Embed Links
  - Manage Channels
  - Manage Roles
  - View Channels
  - Read Message History

### Permissions Utilisateur

Pour utiliser les commandes de configuration :
- **Manage Guild** pour configurer le serveur
- **Manage Channels** pour créer des tickets
- **Manage Roles** pour gérer les rôles

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne partagez jamais votre token** de bot
2. **Utilisez des permissions minimales** en production
3. **Sauvegardez régulièrement** votre base de données
4. **Surveillez les logs** pour détecter les problèmes

### Variables Sensibles

Ces variables ne doivent jamais être partagées :
- `BOT_TOKEN`
- `DASHBOARD_SECRET`
- `DATABASE_URL` (si utilisée)

## 🗄️ Configuration de la Base de Données

### SQLite (Développement)

Configuration par défaut, aucune action requise :

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./database.db
```

### MariaDB (Production)

1. Installez MariaDB sur votre serveur
2. Créez une base de données :
   ```sql
   CREATE DATABASE nocturn_bot;
   CREATE USER 'nocturn_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON nocturn_bot.* TO 'nocturn_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Configurez votre `.env` :
   ```env
   DATABASE_TYPE=mysql
   DATABASE_URL=mysql://nocturn_user:your_password@localhost:3306/nocturn_bot
   ```

## 🔄 Sauvegarde et Restauration

### Sauvegarde SQLite

```bash
cp database.db database_backup_$(date +%Y%m%d_%H%M%S).db
```

### Sauvegarde MariaDB

```bash
mysqldump -u nocturn_user -p nocturn_bot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauration

```bash
# SQLite
cp database_backup.db database.db

# MariaDB
mysql -u nocturn_user -p nocturn_bot < backup.sql
```

## 🚨 Dépannage

### Problèmes Courants

#### Bot ne répond pas
- Vérifiez que le token est correct
- Vérifiez les permissions du bot
- Vérifiez que les intents sont activés

#### Erreurs de base de données
- Vérifiez les permissions d'écriture
- Vérifiez la configuration de la base de données
- Redémarrez le bot

#### Dashboard inaccessible
- Vérifiez que le port 3000 est libre
- Vérifiez la configuration des variables d'environnement
- Vérifiez les logs du serveur

### Logs

Les logs sont affichés dans la console. Pour plus de détails :

```bash
npm start > bot.log 2>&1
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez cette documentation
2. Consultez les [Issues GitHub](https://github.com/your-repo/issues)
3. Rejoignez notre [Serveur Discord](https://discord.gg/your-server)
4. Contactez-nous par email : support@nocturn-bot.com 