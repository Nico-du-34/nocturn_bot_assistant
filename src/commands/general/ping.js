const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot'),

    async execute(interaction, client) {
        const sent = await interaction.reply({ 
            content: '🏓 Pinging...', 
            fetchReply: true 
        });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const pingEmbed = new EmbedBuilder()
            .setColor(getPingColor(latency))
            .setTitle('🏓 Pong!')
            .setDescription('Voici les informations de latence du bot:')
            .addFields(
                { 
                    name: '📡 Latence Bot', 
                    value: `${latency}ms`, 
                    inline: true 
                },
                { 
                    name: '🌐 Latence API', 
                    value: `${apiLatency}ms`, 
                    inline: true 
                },
                { 
                    name: '📊 Statut', 
                    value: getPingStatus(latency), 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.editReply({ 
            content: null, 
            embeds: [pingEmbed] 
        });
    }
};

/**
 * Obtient la couleur en fonction de la latence
 * @param {number} latency - La latence en millisecondes
 * @returns {number} La couleur hexadécimale
 */
function getPingColor(latency) {
    if (latency < 100) return 0x00FF00; // Vert
    if (latency < 200) return 0xFFFF00; // Jaune
    if (latency < 300) return 0xFFA500; // Orange
    return 0xFF0000; // Rouge
}

/**
 * Obtient le statut en fonction de la latence
 * @param {number} latency - La latence en millisecondes
 * @returns {string} Le statut
 */
function getPingStatus(latency) {
    if (latency < 100) return '🟢 Excellent';
    if (latency < 200) return '🟡 Bon';
    if (latency < 300) return '🟠 Moyen';
    return '🔴 Faible';
} 