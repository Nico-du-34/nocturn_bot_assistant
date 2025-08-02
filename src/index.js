const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');
const Database = require('./database/database');
const Dashboard = require('./dashboard/dashboard');
require('dotenv').config();

class NocturnBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildPresences
            ]
        });

        this.client.commands = new Collection();
        this.client.aliases = new Collection();
        this.client.config = {
            token: process.env.BOT_TOKEN,
            clientId: process.env.CLIENT_ID,
            guildId: process.env.GUILD_ID,
            ownerId: process.env.OWNER_ID
        };

        this.database = new Database();
        this.dashboard = new Dashboard(this.client);
    }

    async start() {
        try {
            console.log('🚀 Démarrage de Nocturn Bot Assistant...');

            // Initialiser la base de données
            await this.database.init();
            console.log('✅ Base de données initialisée');

            // Charger les événements
            await loadEvents(this.client);
            console.log('✅ Événements chargés');

            // Charger les commandes
            await loadCommands(this.client);
            console.log('✅ Commandes chargées');

            // Démarrer le dashboard
            await this.dashboard.start();
            console.log('✅ Dashboard démarré');

            // Se connecter au bot Discord
            await this.client.login(this.client.config.token);
            console.log('✅ Bot connecté à Discord');

        } catch (error) {
            console.error('❌ Erreur lors du démarrage:', error);
            process.exit(1);
        }
    }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
    console.error('❌ Erreur non gérée:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

// Démarrer le bot
const bot = new NocturnBot();
bot.start(); 