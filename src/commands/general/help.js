const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCommandsByCategory } = require('../../handlers/commandHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes disponibles')
        .addStringOption(option =>
            option.setName('commande')
                .setDescription('Nom de la commande pour plus de détails')
                .setRequired(false)),

    async execute(interaction, client) {
        const commandName = interaction.options.getString('commande');

        if (commandName) {
            // Afficher les détails d'une commande spécifique
            await showCommandDetails(interaction, client, commandName);
        } else {
            // Afficher la liste générale des commandes
            await showCommandList(interaction, client);
        }
    }
};

/**
 * Affiche la liste générale des commandes
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function showCommandList(interaction, client) {
    const categories = getCommandsByCategory(client);
    
    const helpEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📚 Centre d\'Aide - Nocturn Bot')
        .setDescription('Voici toutes les commandes disponibles, organisées par catégorie.\nUtilisez `/help <commande>` pour plus de détails sur une commande spécifique.')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
            text: `Demandé par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    // Ajouter chaque catégorie
    for (const [category, commands] of Object.entries(categories)) {
        if (commands.length === 0) continue;

        const commandList = commands
            .map(cmd => `\`/${cmd.name}\` - ${cmd.description}`)
            .join('\n');

        helpEmbed.addFields({
            name: `${getCategoryEmoji(category)} ${category}`,
            value: commandList,
            inline: false
        });
    }

    // Ajouter des informations supplémentaires
    helpEmbed.addFields({
        name: '🔗 Liens Utiles',
        value: '• [Support Discord](https://discord.gg/your-server)\n• [Documentation](https://docs.nocturn-bot.com)\n• [Inviter le Bot](https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands)',
        inline: false
    });

    await interaction.reply({ embeds: [helpEmbed] });
}

/**
 * Affiche les détails d'une commande spécifique
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 * @param {string} commandName - Nom de la commande
 */
async function showCommandDetails(interaction, client, commandName) {
    const command = client.commands.get(commandName);

    if (!command) {
        return interaction.reply({
            content: `❌ Commande \`/${commandName}\` non trouvée. Utilisez \`/help\` pour voir toutes les commandes disponibles.`,
            ephemeral: true
        });
    }

    const detailEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`📖 Détails de la commande: /${command.data.name}`)
        .setDescription(command.data.description || 'Aucune description disponible.')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
            text: `Demandé par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

    // Ajouter les options de la commande
    if (command.data.options && command.data.options.length > 0) {
        const optionsList = command.data.options.map(option => {
            const required = option.required ? ' (Requis)' : ' (Optionnel)';
            return `\`${option.name}\` - ${option.description}${required}`;
        }).join('\n');

        detailEmbed.addFields({
            name: '⚙️ Options',
            value: optionsList,
            inline: false
        });
    }

    // Ajouter les alias
    if (command.aliases && command.aliases.length > 0) {
        detailEmbed.addFields({
            name: '🔗 Alias',
            value: command.aliases.map(alias => `\`${alias}\``).join(', '),
            inline: true
        });
    }

    // Ajouter la catégorie
    if (command.category) {
        detailEmbed.addFields({
            name: '📁 Catégorie',
            value: command.category,
            inline: true
        });
    }

    // Ajouter les permissions requises
    if (command.permissions && command.permissions.length > 0) {
        detailEmbed.addFields({
            name: '🔐 Permissions Requises',
            value: command.permissions.map(perm => `\`${perm}\``).join(', '),
            inline: false
        });
    }

    // Ajouter des exemples d'utilisation
    if (command.usage) {
        detailEmbed.addFields({
            name: '💡 Exemples d\'utilisation',
            value: command.usage,
            inline: false
        });
    }

    await interaction.reply({ embeds: [detailEmbed] });
}

/**
 * Obtient l'emoji correspondant à une catégorie
 * @param {string} category - Nom de la catégorie
 * @returns {string} L'emoji correspondant
 */
function getCategoryEmoji(category) {
    const emojis = {
        'Général': '🔧',
        'Tickets': '🎫',
        'Giveaways': '🎉',
        'Configuration': '⚙️',
        'Embeds': '📝',
        'Modération': '🛡️',
        'Utilitaires': '🛠️',
        'Autres': '📦'
    };

    return emojis[category] || '📁';
} 