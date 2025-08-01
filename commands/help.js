const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste de toutes les commandes disponibles'),
    
    async execute(interaction) {
        const { commands } = interaction.client;
        
        // Création de l'embed principal
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Nocturn Bot Assistant - Aide')
            .setDescription('Voici la liste de toutes les commandes disponibles:')
            .setTimestamp()
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });

        // Récupération de toutes les commandes
        const commandList = commands.map(command => {
            return {
                name: `/${command.data.name}`,
                value: command.data.description || 'Aucune description disponible',
                inline: false
            };
        });

        // Ajout des commandes à l'embed
        if (commandList.length > 0) {
            embed.addFields(commandList);
        } else {
            embed.addFields({
                name: 'Aucune commande',
                value: 'Aucune commande n\'est actuellement disponible.',
                inline: false
            });
        }

        // Ajout d'informations supplémentaires
        embed.addFields({
            name: '📊 Statistiques',
            value: `• **Commandes disponibles:** ${commands.size}\n• **Serveurs:** ${interaction.client.guilds.cache.size}\n• **Latence:** ${Math.round(interaction.client.ws.ping)}ms`,
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    },
}; 