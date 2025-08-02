# Nocturn Bot Assistant

Un bot Discord multi-fonctionnalités avec système de tickets, giveaways, messages automatiques et dashboard web.

## 🚀 Fonctionnalités

### 🎫 Système de Tickets
- Panel de création de tickets en embed
- Système de catégories (Support, Bug, Suggestion)
- Gestion des permissions par rôle
- Système de transcriptions

### 🎉 Système de Giveaway
- Création de giveaways avec embed
- Système de participation automatique
- Gestion des conditions de participation
- Notifications automatiques

### 👋 Messages de Bienvenue/Aurevoir
- Messages personnalisables par serveur
- Embeds avec images de profil
- Système de compteur de membres

### 📝 Messages Embed
- Commandes pour créer des embeds personnalisés
- Templates prédéfinis
- Système de sauvegarde

### ⚙️ Configuration Multi-Serveur
- Prefix configurable par serveur
- Paramètres personnalisables
- Système de permissions avancé

### 🌐 Dashboard Web
- Interface web pour la gestion
- Statistiques en temps réel
- Configuration des paramètres
- Gestion des tickets

## 📋 Prérequis

- Node.js 16.0.0 ou supérieur
- Discord Bot Token
- Base de données MariaDB (optionnel pour le développement)

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd nocturn-bot-assistant
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration**
```bash
cp .env.example .env
# Éditer le fichier .env avec vos paramètres
```

4. **Déployer les slash commands**
```bash
npm run deploy
```

5. **Lancer le bot**
```bash
npm start
# ou pour le développement
npm run dev
```

## ⚙️ Configuration

### Variables d'environnement (.env)
```env
# Bot Configuration
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id

# Database
DATABASE_URL=mysql://user:password@localhost:3306/nocturn_bot
# ou pour SQLite (développement)
DATABASE_TYPE=sqlite
DATABASE_PATH=./database.db

# Dashboard
DASHBOARD_PORT=3000
DASHBOARD_SECRET=your_dashboard_secret
DASHBOARD_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Webhook (optionnel)
WEBHOOK_URL=your_webhook_url
```

## 📁 Structure du Projet

```
nocturn-bot-assistant/
├── src/
│   ├── commands/           # Commandes slash
│   ├── events/            # Événements Discord
│   ├── handlers/          # Gestionnaires
│   ├── database/          # Base de données
│   ├── dashboard/         # Dashboard web
│   ├── utils/             # Utilitaires
│   └── index.js           # Point d'entrée
├── docs/                  # Documentation
├── database.db           # Base SQLite (développement)
└── package.json
```

## 🎮 Commandes Disponibles

### Générales
- `/help` - Affiche la liste des commandes
- `/ping` - Test de latence
- `/info` - Informations sur le serveur

### Tickets
- `/ticket setup` - Configure le système de tickets
- `/ticket create` - Crée un ticket
- `/ticket close` - Ferme un ticket

### Giveaways
- `/giveaway create` - Crée un giveaway
- `/giveaway end` - Termine un giveaway
- `/giveaway list` - Liste les giveaways actifs

### Configuration
- `/config prefix` - Change le prefix du serveur
- `/config welcome` - Configure les messages de bienvenue
- `/config goodbye` - Configure les messages d'aurevoir

## 🔧 Développement

### Ajouter une nouvelle commande
1. Créer un fichier dans `src/commands/`
2. Suivre la structure des commandes existantes
3. Ajouter la documentation dans `docs/`

### Ajouter un nouvel événement
1. Créer un fichier dans `src/events/`
2. Suivre la structure des événements existants

## 📚 Documentation

La documentation complète se trouve dans le dossier `docs/` :
- [Guide d'installation](docs/installation.md)
- [Configuration](docs/configuration.md)
- [API Reference](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Discord** : [Serveur de support](https://discord.gg/your-server)
- **Email** : support@nocturn-bot.com
- **Issues** : [GitHub Issues](https://github.com/your-repo/issues)

## 🔄 Changelog

### v1.0.0
- Système de tickets complet
- Système de giveaways
- Messages de bienvenue/aurevoir
- Dashboard web
- Configuration multi-serveur
- Base de données SQLite/MariaDB 