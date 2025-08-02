const fs = require('fs');
const path = require('path');

/**
 * Charge tous les événements depuis le dossier events
 * @param {Client} client - Le client Discord
 */
async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '..', 'events');
    
    // Vérifier si le dossier events existe
    if (!fs.existsSync(eventsPath)) {
        console.log('⚠️  Dossier events non trouvé, création...');
        fs.mkdirSync(eventsPath, { recursive: true });
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    if (eventFiles.length === 0) {
        console.log('⚠️  Aucun événement trouvé dans le dossier events');
        return;
    }

    console.log(`📁 Chargement de ${eventFiles.length} événement(s)...`);

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

        console.log(`✅ Événement chargé: ${event.name}`);
    }
}

module.exports = { loadEvents }; 