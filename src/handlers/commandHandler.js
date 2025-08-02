const fs = require('fs');
const path = require('path');

/**
 * Charge toutes les commandes depuis le dossier commands
 * @param {Client} client - Le client Discord
 */
async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    // Vérifier si le dossier commands existe
    if (!fs.existsSync(commandsPath)) {
        console.log('⚠️  Dossier commands non trouvé, création...');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);

    if (commandFolders.length === 0) {
        console.log('⚠️  Aucune commande trouvée dans le dossier commands');
        return;
    }

    console.log(`📁 Chargement des commandes...`);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const stat = fs.statSync(folderPath);

        if (stat.isDirectory()) {
            // Charger les commandes dans les sous-dossiers
            await loadCommandsFromFolder(client, folderPath, folder);
        } else if (folder.endsWith('.js')) {
            // Charger les commandes directement dans le dossier commands
            await loadCommand(client, folderPath);
        }
    }
}

/**
 * Charge les commandes depuis un dossier spécifique
 * @param {Client} client - Le client Discord
 * @param {string} folderPath - Chemin du dossier
 * @param {string} category - Catégorie des commandes
 */
async function loadCommandsFromFolder(client, folderPath, category) {
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
        console.log(`⚠️  Aucune commande trouvée dans ${category}`);
        return;
    }

    console.log(`📂 Catégorie: ${category} (${commandFiles.length} commande(s))`);

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        await loadCommand(client, filePath, category);
    }
}

/**
 * Charge une commande spécifique
 * @param {Client} client - Le client Discord
 * @param {string} filePath - Chemin du fichier de commande
 * @param {string} category - Catégorie de la commande
 */
async function loadCommand(client, filePath, category = 'Général') {
    try {
        const command = require(filePath);

        // Vérifier que la commande a les propriétés requises
        if (!command.data || !command.execute) {
            console.log(`⚠️  Commande ignorée: ${filePath} - propriétés manquantes`);
            return;
        }

        // Ajouter la catégorie à la commande
        command.category = category;

        // Ajouter la commande à la collection
        client.commands.set(command.data.name, command);

        // Ajouter les alias s'ils existent
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
                client.aliases.set(alias, command.data.name);
            });
        }

        console.log(`✅ Commande chargée: /${command.data.name} (${category})`);

    } catch (error) {
        console.error(`❌ Erreur lors du chargement de la commande ${filePath}:`, error);
    }
}

/**
 * Obtient toutes les commandes groupées par catégorie
 * @param {Client} client - Le client Discord
 * @returns {Object} Commandes groupées par catégorie
 */
function getCommandsByCategory(client) {
    const categories = {};

    client.commands.forEach(command => {
        const category = command.category || 'Autres';
        
        if (!categories[category]) {
            categories[category] = [];
        }

        categories[category].push({
            name: command.data.name,
            description: command.data.description,
            options: command.data.options || []
        });
    });

    return categories;
}

module.exports = { 
    loadCommands, 
    getCommandsByCategory 
}; 