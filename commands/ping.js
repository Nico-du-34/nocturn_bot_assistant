const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot'),
    
    async execute(interaction) {
        const startTime = Date.now();
        await interaction.deferReply();
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 Pong!')
            .addFields(
                { 
                    name: 'Latence du Bot', 
                    value: `\`${Date.now() - startTime}ms\``, 
                    inline: true 
                },
                { 
                    name: 'Latence de l\'API', 
                    value: `\`${Math.round(interaction.client.ws.ping)}ms\``, 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        await interaction.editReply({ embeds: [embed] });
    },
}; 