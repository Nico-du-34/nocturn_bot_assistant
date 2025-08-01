const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Chargement de toutes les commandes
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`📝 Commande chargée pour déploiement: ${command.data.name}`);
    } else {
        console.log(`⚠️  La commande dans ${filePath} manque de propriétés 'data' requises.`);
    }
}

// Configuration du REST
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Fonction pour déployer les commandes
(async () => {
    try {
        console.log(`🚀 Début du déploiement de ${commands.length} commandes slash...`);

        // Déploiement global des commandes
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} commandes slash déployées avec succès!`);
        console.log('📋 Commandes déployées:');
        data.forEach(cmd => console.log(`   - /${cmd.name}: ${cmd.description}`));
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement des commandes:', error);
    }
})(); 