# 🚀 Démarrage Rapide - Nocturn Bot Assistant

Ce guide vous permettra de démarrer votre bot Discord en moins de 5 minutes !

## ⚡ Installation Express

### 1. Prérequis
- Node.js 16+ installé
- Un serveur Discord avec permissions d'administrateur

### 2. Configuration Rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd nocturn-bot-assistant

# 2. Installer les dépendances
npm install

# 3. Configurer le bot
cp env.example .env
# Éditer .env avec vos tokens Discord

# 4. Déployer les commandes
npm run deploy guild

# 5. Démarrer le bot
npm start
```

## 🔑 Configuration Minimale

Créez votre fichier `.env` avec ces informations essentielles :

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
DASHBOARD_SECRET=any_random_secret_string
```

## 🎯 Premières Commandes à Tester

Une fois le bot connecté, testez ces commandes dans votre serveur :

```
/help          # Liste toutes les commandes
/ping          # Test de latence
/info          # Informations du serveur
```

## 🎫 Configuration Rapide des Tickets

```bash
# 1. Créer une catégorie "Tickets" dans votre serveur
# 2. Utiliser la commande :
/ticket setup category:#Tickets

# 3. Créer le panel :
/ticket panel channel:#tickets
```

## 🎉 Créer votre Premier Giveaway

```bash
/giveaway create prize:"Nitro Discord" winners:1 duration:1h description:"Mon premier giveaway!"
```

## 🌐 Accéder au Dashboard

1. Ouvrez `http://localhost:3000`
2. Connectez-vous avec Discord
3. Gérez vos serveurs !

## ✅ Vérification

Votre bot est prêt si vous voyez :
- ✅ Bot connecté à Discord
- ✅ Base de données initialisée
- ✅ Événements chargés
- ✅ Commandes chargées
- ✅ Dashboard démarré

## 🆘 Besoin d'Aide ?

- 📖 [Documentation complète](docs/)
- 🔧 [Guide de configuration](docs/configuration.md)
- 🚨 [Dépannage](docs/installation.md#dépannage)

---

**🎉 Félicitations ! Votre bot Discord est maintenant opérationnel !** 