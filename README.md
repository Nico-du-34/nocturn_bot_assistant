# 🤖 Nocturn Bot Assistant

Un bot Discord moderne développé en Node.js avec des commandes slash, une base de données MariaDB et une Rich Presence.

## ✨ Fonctionnalités

- **Commandes Slash** : Interface moderne avec Discord
- **Base de données MariaDB** : Stockage persistant des données
- **Rich Presence** : Statut personnalisé du bot
- **Chargement automatique** : Les commandes se chargent automatiquement
- **Système d'aide intégré** : Commande `/help` qui liste toutes les commandes
- **Gestion d'erreurs** : Gestion robuste des erreurs
- **Architecture modulaire** : Code bien organisé et extensible

## 🚀 Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- MariaDB/MySQL
- Un bot Discord (créé sur le [Portail Développeur Discord](https://discord.com/developers/applications))

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone <votre-repo>
   cd nocturn_bot_assistant
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de la base de données**
   - Créez une base de données MariaDB
   - Notez les informations de connexion

4. **Configuration des variables d'environnement**
   ```bash
   cp config.env.example .env
   ```
   
   Éditez le fichier `.env` avec vos informations :
   ```env
   # Configuration Discord
   DISCORD_TOKEN=votre_token_discord_ici
   CLIENT_ID=votre_client_id_ici

   # Configuration MariaDB
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=nocturn_bot
   ```

5. **Déployer les commandes slash**
   ```bash
   npm run deploy
   ```

6. **Lancer le bot**
   ```bash
   npm start
   ```

   Pour le développement avec rechargement automatique :
   ```bash
   npm run dev
   ```

## 📁 Structure du projet

```
nocturn_bot_assistant/
├── commands/           # Dossier des commandes slash
│   ├── ping.js        # Commande ping
│   └── help.js        # Commande help
├── database/          # Configuration base de données
│   └── connection.js  # Connexion MariaDB
├── index.js           # Fichier principal du bot
├── deploy-commands.js # Script de déploiement des commandes
├── package.json       # Dépendances et scripts
├── config.env.example # Exemple de configuration
└── README.md          # Documentation
```

## 🎮 Commandes disponibles

### `/ping`
Affiche la latence du bot et de l'API Discord.

### `/help`
Affiche la liste de toutes les commandes disponibles avec leurs descriptions.

## 🔧 Ajouter une nouvelle commande

1. Créez un nouveau fichier dans le dossier `commands/`
2. Suivez cette structure :

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nomcommande')
        .setDescription('Description de la commande'),
    
    async execute(interaction) {
        // Votre code ici
        await interaction.reply('Réponse de la commande');
    },
};
```

3. Redéployez les commandes :
   ```bash
   npm run deploy
   ```

## 🗄️ Base de données

Le bot utilise MariaDB pour stocker :
- **guild_settings** : Paramètres des serveurs
- **user_stats** : Statistiques des utilisateurs

La base de données s'initialise automatiquement au premier démarrage.

## 🎨 Rich Presence

Le bot affiche une Rich Presence personnalisée avec :
- Statut "Joue à /help pour voir les commandes"
- Statut en ligne

## 🛠️ Scripts disponibles

- `npm start` : Lance le bot en production
- `npm run dev` : Lance le bot en mode développement avec nodemon
- `npm run deploy` : Déploie les commandes slash sur Discord

## 🔒 Sécurité

- Ne partagez jamais votre token Discord
- Utilisez des variables d'environnement pour les informations sensibles
- Gardez vos dépendances à jour

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence ISC.

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les dépendances sont installées
2. Vérifiez votre configuration dans le fichier `.env`
3. Assurez-vous que MariaDB est en cours d'exécution
4. Vérifiez les logs du bot pour les erreurs

## 🔄 Mise à jour

Pour mettre à jour le bot :
```bash
git pull
npm install
npm run deploy
npm start
```

---

**Développé avec ❤️ par Nocturn Bot Assistant** 