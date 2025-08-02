const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Configure le système de tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configure le système de tickets')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Catégorie où créer les tickets')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Canal pour les logs des tickets')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('Rôle du support')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Crée un panel de tickets')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal où créer le panel')
                        .setRequired(true))),

    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            await setupTickets(interaction, client);
        } else if (subcommand === 'panel') {
            await createTicketPanel(interaction, client);
        }
    }
};

/**
 * Configure le système de tickets
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function setupTickets(interaction, client) {
    const category = interaction.options.getChannel('category');
    const logChannel = interaction.options.getChannel('log_channel');
    const supportRole = interaction.options.getRole('support_role');

    try {
        // Vérifier que la catégorie est bien une catégorie
        if (category.type !== 4) {
            return interaction.reply({
                content: '❌ Le canal sélectionné doit être une catégorie.',
                ephemeral: true
            });
        }

        // Mettre à jour la configuration dans la base de données
        await client.database.run(
            `UPDATE guilds SET 
                ticket_category = ?, 
                ticket_log_channel = ?,
                ticket_role = ?
             WHERE id = ?`,
            [
                category.id,
                logChannel?.id || null,
                supportRole?.id || null,
                interaction.guildId
            ]
        );

        const setupEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Configuration des Tickets')
            .setDescription('Le système de tickets a été configuré avec succès!')
            .addFields(
                { 
                    name: '📁 Catégorie', 
                    value: category.name, 
                    inline: true 
                },
                { 
                    name: '📝 Logs', 
                    value: logChannel ? logChannel.name : 'Non configuré', 
                    inline: true 
                },
                { 
                    name: '👥 Rôle Support', 
                    value: supportRole ? supportRole.name : 'Non configuré', 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Configuré par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [setupEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors de la configuration des tickets:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la configuration des tickets.',
            ephemeral: true
        });
    }
}

/**
 * Crée un panel de tickets
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function createTicketPanel(interaction, client) {
    const channel = interaction.options.getChannel('channel');

    // Vérifier que le canal est un canal textuel
    if (channel.type !== 0) {
        return interaction.reply({
            content: '❌ Le canal sélectionné doit être un canal textuel.',
            ephemeral: true
        });
    }

    try {
        const panelEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎫 Système de Tickets')
            .setDescription('Bienvenue dans notre système de tickets!\n\nCliquez sur le bouton ci-dessous pour créer un ticket de support.\n\n**Catégories disponibles:**\n• 🛠️ Support Général\n• 🐛 Signalement de Bug\n• 💡 Suggestion\n• 🔐 Problème de Compte')
            .addFields(
                { 
                    name: '📋 Instructions', 
                    value: '1. Cliquez sur le bouton "Créer un Ticket"\n2. Sélectionnez la catégorie appropriée\n3. Décrivez votre problème\n4. Un membre du staff vous répondra rapidement', 
                    inline: false 
                },
                { 
                    name: '⏰ Temps de Réponse', 
                    value: 'Notre équipe s\'efforce de répondre dans les plus brefs délais (généralement moins de 24h).', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `${interaction.guild.name} • Support`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        // Créer les boutons
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create_support')
                    .setLabel('🛠️ Support Général')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_create_bug')
                    .setLabel('🐛 Signalement de Bug')
                    .setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create_suggestion')
                    .setLabel('💡 Suggestion')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_create_account')
                    .setLabel('🔐 Problème de Compte')
                    .setStyle(ButtonStyle.Secondary)
            );

        await channel.send({
            embeds: [panelEmbed],
            components: [row1, row2]
        });

        await interaction.reply({
            content: `✅ Panel de tickets créé dans ${channel}!`,
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du panel de tickets:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la création du panel de tickets.',
            ephemeral: true
        });
    }
} 