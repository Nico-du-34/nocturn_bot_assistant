const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure les paramètres du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('prefix')
                .setDescription('Change le prefix du serveur')
                .addStringOption(option =>
                    option.setName('nouveau_prefix')
                        .setDescription('Le nouveau prefix (1-5 caractères)')
                        .setRequired(true)
                        .setMinLength(1)
                        .setMaxLength(5)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Configure les messages de bienvenue')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal pour les messages de bienvenue')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message de bienvenue (utilisez {user}, {server}, etc.)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('goodbye')
                .setDescription('Configure les messages d\'aurevoir')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Canal pour les messages d\'aurevoir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message d\'aurevoir (utilisez {user}, {server}, etc.)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Affiche la configuration actuelle du serveur')),

    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'prefix') {
            await setPrefix(interaction, client);
        } else if (subcommand === 'welcome') {
            await setWelcome(interaction, client);
        } else if (subcommand === 'goodbye') {
            await setGoodbye(interaction, client);
        } else if (subcommand === 'view') {
            await viewConfig(interaction, client);
        }
    }
};

/**
 * Change le prefix du serveur
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function setPrefix(interaction, client) {
    const newPrefix = interaction.options.getString('nouveau_prefix');

    try {
        // Mettre à jour le prefix dans la base de données
        await client.database.updateGuildPrefix(interaction.guildId, newPrefix);

        const prefixEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Prefix Mis à Jour')
            .setDescription(`Le prefix du serveur a été changé avec succès!`)
            .addFields(
                { 
                    name: '🔧 Nouveau Prefix', 
                    value: `\`${newPrefix}\``, 
                    inline: true 
                },
                { 
                    name: '👤 Modifié par', 
                    value: interaction.user.tag, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [prefixEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors du changement de prefix:', error);
        await interaction.reply({
            content: '❌ Erreur lors du changement de prefix.',
            ephemeral: true
        });
    }
}

/**
 * Configure les messages de bienvenue
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function setWelcome(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    try {
        // Vérifier que le canal est un canal textuel
        if (channel.type !== 0) {
            return interaction.reply({
                content: '❌ Le canal sélectionné doit être un canal textuel.',
                ephemeral: true
            });
        }

        // Mettre à jour la configuration dans la base de données
        await client.database.run(
            'UPDATE guilds SET welcome_channel = ?, welcome_message = ? WHERE id = ?',
            [channel.id, message, interaction.guildId]
        );

        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Messages de Bienvenue Configurés')
            .setDescription('Les messages de bienvenue ont été configurés avec succès!')
            .addFields(
                { 
                    name: '📝 Canal', 
                    value: channel.toString(), 
                    inline: true 
                },
                { 
                    name: '💬 Message', 
                    value: message, 
                    inline: false 
                },
                { 
                    name: '🔧 Variables Disponibles', 
                    value: '`{user}`, `{user.tag}`, `{user.name}`, `{server}`, `{memberCount}`, `{memberCount.ordinal}`', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Configuré par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [welcomeEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors de la configuration des messages de bienvenue:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la configuration des messages de bienvenue.',
            ephemeral: true
        });
    }
}

/**
 * Configure les messages d'aurevoir
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function setGoodbye(interaction, client) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    try {
        // Vérifier que le canal est un canal textuel
        if (channel.type !== 0) {
            return interaction.reply({
                content: '❌ Le canal sélectionné doit être un canal textuel.',
                ephemeral: true
            });
        }

        // Mettre à jour la configuration dans la base de données
        await client.database.run(
            'UPDATE guilds SET goodbye_channel = ?, goodbye_message = ? WHERE id = ?',
            [channel.id, message, interaction.guildId]
        );

        const goodbyeEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Messages d\'Aurevoir Configurés')
            .setDescription('Les messages d\'aurevoir ont été configurés avec succès!')
            .addFields(
                { 
                    name: '📝 Canal', 
                    value: channel.toString(), 
                    inline: true 
                },
                { 
                    name: '💬 Message', 
                    value: message, 
                    inline: false 
                },
                { 
                    name: '🔧 Variables Disponibles', 
                    value: '`{user}`, `{user.tag}`, `{user.name}`, `{server}`, `{memberCount}`, `{memberCount.ordinal}`', 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Configuré par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [goodbyeEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors de la configuration des messages d\'aurevoir:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la configuration des messages d\'aurevoir.',
            ephemeral: true
        });
    }
}

/**
 * Affiche la configuration actuelle du serveur
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function viewConfig(interaction, client) {
    try {
        const guildConfig = await client.database.getGuild(interaction.guildId);

        if (!guildConfig) {
            return interaction.reply({
                content: '❌ Aucune configuration trouvée pour ce serveur.',
                ephemeral: true
            });
        }

        const configEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('⚙️ Configuration du Serveur')
            .setDescription(`Configuration actuelle de **${interaction.guild.name}**`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { 
                    name: '🔧 Prefix', 
                    value: guildConfig.prefix || '!', 
                    inline: true 
                },
                { 
                    name: '📝 Canal de Bienvenue', 
                    value: guildConfig.welcome_channel ? `<#${guildConfig.welcome_channel}>` : 'Non configuré', 
                    inline: true 
                },
                { 
                    name: '👋 Canal d\'Aurevoir', 
                    value: guildConfig.goodbye_channel ? `<#${guildConfig.goodbye_channel}>` : 'Non configuré', 
                    inline: true 
                },
                { 
                    name: '🎫 Catégorie Tickets', 
                    value: guildConfig.ticket_category ? `<#${guildConfig.ticket_category}>` : 'Non configuré', 
                    inline: true 
                },
                { 
                    name: '📋 Logs Tickets', 
                    value: guildConfig.ticket_log_channel ? `<#${guildConfig.ticket_log_channel}>` : 'Non configuré', 
                    inline: true 
                },
                { 
                    name: '👥 Rôle Support', 
                    value: guildConfig.ticket_role ? `<@&${guildConfig.ticket_role}>` : 'Non configuré', 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Ajouter les messages si ils existent
        if (guildConfig.welcome_message) {
            configEmbed.addFields({
                name: '💬 Message de Bienvenue',
                value: guildConfig.welcome_message.length > 100 ? 
                    guildConfig.welcome_message.substring(0, 100) + '...' : 
                    guildConfig.welcome_message,
                inline: false
            });
        }

        if (guildConfig.goodbye_message) {
            configEmbed.addFields({
                name: '👋 Message d\'Aurevoir',
                value: guildConfig.goodbye_message.length > 100 ? 
                    guildConfig.goodbye_message.substring(0, 100) + '...' : 
                    guildConfig.goodbye_message,
                inline: false
            });
        }

        await interaction.reply({ embeds: [configEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la configuration:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la récupération de la configuration.',
            ephemeral: true
        });
    }
} 