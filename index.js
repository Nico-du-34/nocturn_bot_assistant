const { Client, GatewayIntentBits, ActivityType, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Création du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
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
client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} est connecté!`);
    
    // Initialiser la base de données
    try {
        const { initializeDatabase } = require('./database/connection.js');
        await initializeDatabase();
        console.log('🗄️ Base de données initialisée');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    }
    
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

// Gestion des réactions pour les rôles
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    try {
        // Récupérer la réaction complète si elle est partielle
        if (reaction.partial) {
            await reaction.fetch();
        }
        
        const { query } = require('./database/connection.js');
        
        // Vérifier si cette réaction correspond à un rôle configuré
        const roleData = await query(
            'SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ? AND is_active = TRUE',
            [reaction.message.guild.id, reaction.message.id, reaction.emoji.name || reaction.emoji.toString()]
        );
        
        if (roleData.length > 0) {
            const role = reaction.message.guild.roles.cache.get(roleData[0].role_id);
            const member = reaction.message.guild.members.cache.get(user.id);
            
            if (role && member) {
                await member.roles.add(role);
                console.log(`✅ Rôle ${role.name} ajouté à ${user.tag}`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du rôle par réaction:', error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    
    try {
        // Récupérer la réaction complète si elle est partielle
        if (reaction.partial) {
            await reaction.fetch();
        }
        
        const { query } = require('./database/connection.js');
        
        // Vérifier si cette réaction correspond à un rôle configuré
        const roleData = await query(
            'SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ? AND is_active = TRUE',
            [reaction.message.guild.id, reaction.message.id, reaction.emoji.name || reaction.emoji.toString()]
        );
        
        if (roleData.length > 0) {
            const role = reaction.message.guild.roles.cache.get(roleData[0].role_id);
            const member = reaction.message.guild.members.cache.get(user.id);
            
            if (role && member) {
                await member.roles.remove(role);
                console.log(`✅ Rôle ${role.name} retiré de ${user.tag}`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du rôle par réaction:', error);
    }
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