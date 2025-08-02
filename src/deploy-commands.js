const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Fonction pour charger récursivement toutes les commandes
function loadCommands(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Récursivement charger les sous-dossiers
            loadCommands(fullPath);
        } else if (item.endsWith('.js')) {
            // Charger le fichier de commande
            try {
                const command = require(fullPath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Commande chargée: ${command.data.name}`);
                } else {
                    console.log(`⚠️  Commande ignorée: ${fullPath} - manque de propriétés requises`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${fullPath}:`, error.message);
            }
        }
    }
}

// Charger toutes les commandes depuis le dossier commands
const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

// Configuration du REST
const rest = new REST().setToken(process.env.BOT_TOKEN);

// Fonction pour déployer les commandes
async function deployCommands() {
    try {
        console.log(`🚀 Déploiement de ${commands.length} commandes...`);

        // Déployer globalement (prend jusqu'à 1 heure pour se propager)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} commandes déployées avec succès!`);
        
        // Afficher les commandes déployées
        console.log('\n📋 Commandes déployées:');
        data.forEach(cmd => {
            console.log(`  - /${cmd.name}: ${cmd.description}`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
    }
}

// Fonction pour déployer sur un serveur spécifique (plus rapide pour les tests)
async function deployGuildCommands() {
    try {
        console.log(`🚀 Déploiement de ${commands.length} commandes sur le serveur...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} commandes déployées sur le serveur avec succès!`);
        
        // Afficher les commandes déployées
        console.log('\n📋 Commandes déployées:');
        data.forEach(cmd => {
            console.log(`  - /${cmd.name}: ${cmd.description}`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
    }
}

// Fonction pour supprimer toutes les commandes
async function deleteAllCommands() {
    try {
        console.log('🗑️  Suppression de toutes les commandes...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] },
        );

        console.log('✅ Toutes les commandes supprimées!');

    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
    }
}

// Exécuter selon l'argument passé
const action = process.argv[2];

switch (action) {
    case 'global':
        deployCommands();
        break;
    case 'guild':
        deployGuildCommands();
        break;
    case 'delete':
        deleteAllCommands();
        break;
    default:
        console.log('Usage: node deploy-commands.js [global|guild|delete]');
        console.log('  global: Déployer globalement (recommandé pour la production)');
        console.log('  guild:  Déployer sur le serveur spécifique (recommandé pour les tests)');
        console.log('  delete: Supprimer toutes les commandes');
        break;
} 