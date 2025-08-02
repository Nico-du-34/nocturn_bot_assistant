const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} est en ligne!`);
        console.log(`📊 Bot présent sur ${client.guilds.cache.size} serveur(s)`);
        console.log(`👥 ${client.users.cache.size} utilisateur(s) total`);

        // Initialiser les serveurs dans la base de données
        const { getCommandsByCategory } = require('../handlers/commandHandler');
        
        for (const guild of client.guilds.cache.values()) {
            try {
                await client.database.createGuild(guild.id, guild.name);
                console.log(`✅ Serveur ajouté à la base de données: ${guild.name}`);
            } catch (error) {
                console.error(`❌ Erreur lors de l'ajout du serveur ${guild.name}:`, error);
            }
        }

        // Définir l'activité du bot
        client.user.setActivity({
            name: `${client.guilds.cache.size} serveurs | /help`,
            type: ActivityType.Watching
        });

        // Mettre à jour l'activité toutes les 5 minutes
        setInterval(() => {
            client.user.setActivity({
                name: `${client.guilds.cache.size} serveurs | /help`,
                type: ActivityType.Watching
            });
        }, 5 * 60 * 1000);

        // Démarrer le système de vérification des giveaways
        startGiveawayChecker(client);
    }
};

/**
 * Vérifie et termine les giveaways expirés
 * @param {Client} client - Le client Discord
 */
function startGiveawayChecker(client) {
    setInterval(async () => {
        try {
            const activeGiveaways = await client.database.getActiveGiveaways();
            
            for (const giveaway of activeGiveaways) {
                if (new Date(giveaway.end_time) <= new Date()) {
                    await endGiveaway(client, giveaway);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la vérification des giveaways:', error);
        }
    }, 30 * 1000); // Vérifier toutes les 30 secondes
}

/**
 * Termine un giveaway et annonce les gagnants
 * @param {Client} client - Le client Discord
 * @param {Object} giveaway - Les données du giveaway
 */
async function endGiveaway(client, giveaway) {
    try {
        const guild = client.guilds.cache.get(giveaway.guild_id);
        if (!guild) return;

        const channel = guild.channels.cache.get(giveaway.channel_id);
        if (!channel) return;

        const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
        if (!message) return;

        // Récupérer les participants
        const participants = await client.database.getGiveawayParticipants(giveaway.id);
        
        if (participants.length === 0) {
            // Aucun participant
            const noParticipantsEmbed = {
                color: 0xFF0000,
                title: '🎉 Giveaway Terminé',
                description: `**${giveaway.prize}**\n\nAucun participant! Le giveaway est annulé.`,
                footer: { text: 'Giveaway terminé' },
                timestamp: new Date()
            };

            await message.edit({ embeds: [noParticipantsEmbed] });
            await client.database.endGiveaway(giveaway.id);
            return;
        }

        // Sélectionner les gagnants
        const winners = [];
        const participantsArray = participants.map(p => p.user_id);
        
        for (let i = 0; i < Math.min(giveaway.winner_count, participantsArray.length); i++) {
            const randomIndex = Math.floor(Math.random() * participantsArray.length);
            const winner = participantsArray.splice(randomIndex, 1)[0];
            winners.push(winner);
        }

        // Créer l'embed de fin
        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
        
        const endEmbed = {
            color: 0x00FF00,
            title: '🎉 Giveaway Terminé!',
            description: `**Prix:** ${giveaway.prize}\n\n**Gagnant(s):** ${winnerMentions}\n\nFélicitations!`,
            footer: { text: `${winners.length} gagnant(s) sur ${participants.length} participant(s)` },
            timestamp: new Date()
        };

        await message.edit({ embeds: [endEmbed] });
        
        // Annoncer les gagnants
        await channel.send({
            content: `🎉 Félicitations ${winnerMentions}! Vous avez gagné **${giveaway.prize}**!`,
            allowedMentions: { users: winners }
        });

        // Marquer le giveaway comme terminé
        await client.database.endGiveaway(giveaway.id);

    } catch (error) {
        console.error('❌ Erreur lors de la fin du giveaway:', error);
    }
} 