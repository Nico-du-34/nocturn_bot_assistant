const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        try {
            // Récupérer la configuration du serveur
            const guildConfig = await client.database.getGuild(member.guild.id);
            
            if (!guildConfig || !guildConfig.goodbye_channel || !guildConfig.goodbye_message) {
                return; // Pas de configuration d'aurevoir
            }

            const goodbyeChannel = member.guild.channels.cache.get(guildConfig.goodbye_channel);
            if (!goodbyeChannel) {
                console.error(`❌ Canal d'aurevoir non trouvé: ${guildConfig.goodbye_channel}`);
                return;
            }

            // Créer l'embed d'aurevoir
            const goodbyeEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('👋 Aurevoir!')
                .setDescription(formatGoodbyeMessage(guildConfig.goodbye_message, member))
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: `${member.guild.name} • Membre #${member.guild.memberCount}`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Ajouter des informations supplémentaires
            goodbyeEmbed.addFields(
                { 
                    name: '👤 Utilisateur', 
                    value: `${member.user.tag}`, 
                    inline: true 
                },
                { 
                    name: '📅 A rejoint le', 
                    value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Inconnu', 
                    inline: true 
                },
                { 
                    name: '⏱️ Temps passé', 
                    value: member.joinedAt ? getTimeSpent(member.joinedAt) : 'Inconnu', 
                    inline: true 
                },
                { 
                    name: '🎯 Rôles', 
                    value: member.roles.cache.size > 1 ? 
                        member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ') : 
                        'Aucun rôle', 
                    inline: false 
                }
            );

            // Envoyer le message d'aurevoir
            await goodbyeChannel.send({
                content: `Aurevoir ${member.user.username}! 👋`,
                embeds: [goodbyeEmbed]
            });

            // Log de l'événement
            await logMemberEvent(client, member.guild.id, 'member_leave', member.id, null, 
                `${member.user.tag} a quitté le serveur`);

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message d\'aurevoir:', error);
        }
    }
};

/**
 * Formate le message d'aurevoir avec les variables
 * @param {string} message - Le message de base
 * @param {GuildMember} member - Le membre qui a quitté
 * @returns {string} Le message formaté
 */
function formatGoodbyeMessage(message, member) {
    return message
        .replace(/{user}/g, member.user.username)
        .replace(/{user.tag}/g, member.user.tag)
        .replace(/{user.name}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{memberCount}/g, member.guild.memberCount)
        .replace(/{memberCount.ordinal}/g, getOrdinal(member.guild.memberCount));
}

/**
 * Obtient le suffixe ordinal d'un nombre
 * @param {number} num - Le nombre
 * @returns {string} Le suffixe ordinal
 */
function getOrdinal(num) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Calcule le temps passé sur le serveur
 * @param {Date} joinedAt - Date d'arrivée
 * @returns {string} Temps formaté
 */
function getTimeSpent(joinedAt) {
    const now = new Date();
    const diff = now - joinedAt;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} jour(s), ${hours} heure(s)`;
    } else if (hours > 0) {
        return `${hours} heure(s), ${minutes} minute(s)`;
    } else {
        return `${minutes} minute(s)`;
    }
}

/**
 * Enregistre un événement de membre dans les logs
 * @param {Client} client - Le client Discord
 * @param {string} guildId - ID du serveur
 * @param {string} action - Action effectuée
 * @param {string} userId - ID de l'utilisateur
 * @param {string} targetId - ID de la cible (optionnel)
 * @param {string} details - Détails de l'action
 */
async function logMemberEvent(client, guildId, action, userId, targetId, details) {
    try {
        await client.database.run(
            'INSERT INTO logs (guild_id, action, user_id, target_id, details) VALUES (?, ?, ?, ?, ?)',
            [guildId, action, userId, targetId, details]
        );
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du log:', error);
    }
} 