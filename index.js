const { Client, GatewayIntentBits, ActivityType, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Collection pour stocker les commandes
client.commands = new Collection();

// Chargement automatique des commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Commande chargée: ${command.data.name}`);
    } else {
        console.log(`⚠️  La commande dans ${filePath} manque de propriétés requises.`);
    }
}

// Gestionnaire d'événements pour les interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Aucune commande trouvée pour ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: 'Il y a eu une erreur lors de l\'exécution de cette commande!', 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: 'Il y a eu une erreur lors de l\'exécution de cette commande!', 
                ephemeral: true 
            });
        }
    }
});

// Événement ready avec Rich Presence
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} est connecté!`);
    
    // Configuration de la Rich Presence
    client.user.setPresence({
        activities: [{
            name: '/help pour voir les commandes',
            type: ActivityType.Playing
        }],
        status: 'online'
    });
    
    console.log('🎮 Rich Presence configurée');
    console.log(`📊 Bot présent sur ${client.guilds.cache.size} serveurs`);
});

// Gestion des erreurs
client.on('error', error => {
    console.error('Erreur Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Promesse rejetée non gérée:', error);
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN); 