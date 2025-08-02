const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            // Récupérer la configuration du serveur
            const guildConfig = await client.database.getGuild(member.guild.id);
            
            if (!guildConfig || !guildConfig.welcome_channel || !guildConfig.welcome_message) {
                return; // Pas de configuration de bienvenue
            }

            const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcome_channel);
            if (!welcomeChannel) {
                console.error(`❌ Canal de bienvenue non trouvé: ${guildConfig.welcome_channel}`);
                return;
            }

            // Créer l'embed de bienvenue
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 Bienvenue!')
                .setDescription(formatWelcomeMessage(guildConfig.welcome_message, member))
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: `${member.guild.name} • Membre #${member.guild.memberCount}`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Ajouter des informations supplémentaires
            welcomeEmbed.addFields(
                { 
                    name: '👤 Utilisateur', 
                    value: `${member.user.tag}`, 
                    inline: true 
                },
                { 
                    name: '📅 Compte créé le', 
                    value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, 
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

            // Envoyer le message de bienvenue
            await welcomeChannel.send({
                content: `Bienvenue ${member}! 🎉`,
                embeds: [welcomeEmbed]
            });

            // Log de l'événement
            await logMemberEvent(client, member.guild.id, 'member_join', member.id, null, 
                `${member.user.tag} a rejoint le serveur`);

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message de bienvenue:', error);
        }
    }
};

/**
 * Formate le message de bienvenue avec les variables
 * @param {string} message - Le message de base
 * @param {GuildMember} member - Le membre qui a rejoint
 * @returns {string} Le message formaté
 */
function formatWelcomeMessage(message, member) {
    return message
        .replace(/{user}/g, member.toString())
        .replace(/{user.tag}/g, member.user.tag)
        .replace(/{user.name}/g, member.user.username)
        .replace(/{user.mention}/g, member.toString())
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