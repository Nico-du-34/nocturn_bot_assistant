const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { query } = require('../database/connection.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Gère les rôles par réaction')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Crée un nouveau message de rôles par réaction')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Le canal où envoyer le message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Le titre du message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('La description du message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('La couleur de l\'embed (format hexadécimal)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajoute un rôle à un message existant')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('L\'ID du message')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à ajouter')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('L\'emoji pour ce rôle')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description du rôle')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste tous les messages de rôles par réaction'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Supprime un rôle d\'un message')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('L\'ID du message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('L\'emoji du rôle à supprimer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Supprime un message de rôles par réaction')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('L\'ID du message à supprimer')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'create':
                    await this.createReactionRoleMessage(interaction);
                    break;
                case 'add':
                    await this.addReactionRole(interaction);
                    break;
                case 'list':
                    await this.listReactionRoles(interaction);
                    break;
                case 'remove':
                    await this.removeReactionRole(interaction);
                    break;
                case 'delete':
                    await this.deleteReactionRoleMessage(interaction);
                    break;
            }
        } catch (error) {
            console.error('Erreur dans reactionrole:', error);
            await interaction.reply({ 
                content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', 
                ephemeral: true 
            });
        }
    },

    async createReactionRoleMessage(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#0099ff';

        // Vérifier les permissions
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.reply({ 
                content: '❌ Je n\'ai pas la permission de gérer les rôles.', 
                ephemeral: true 
            });
        }

        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
            return await interaction.reply({ 
                content: '❌ Je n\'ai pas la permission d\'envoyer des messages dans ce canal.', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ 
                text: 'Cliquez sur les boutons ci-dessous pour obtenir vos rôles', 
                iconURL: interaction.guild.iconURL() 
            });

        const message = await channel.send({ embeds: [embed] });

        // Sauvegarder en base de données
        await query(
            'INSERT INTO reaction_role_messages (guild_id, message_id, channel_id, title, description, color) VALUES (?, ?, ?, ?, ?, ?)',
            [guildId, message.id, channel.id, title, description, color]
        );

        await interaction.reply({ 
            content: `✅ Message de rôles par réaction créé avec succès dans ${channel}!\nID du message: \`${message.id}\``, 
            ephemeral: true 
        });
    },

    async addReactionRole(interaction) {
        const messageId = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');
        const description = interaction.options.getString('description') || '';

        // Vérifier que le message existe
        const messageData = await query(
            'SELECT * FROM reaction_role_messages WHERE guild_id = ? AND message_id = ?',
            [interaction.guild.id, messageId]
        );

        if (messageData.length === 0) {
            return await interaction.reply({ 
                content: '❌ Message de rôles par réaction non trouvé.', 
                ephemeral: true 
            });
        }

        // Vérifier que le rôle n'est pas déjà configuré pour cet emoji
        const existingRole = await query(
            'SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?',
            [interaction.guild.id, messageId, emoji]
        );

        if (existingRole.length > 0) {
            return await interaction.reply({ 
                content: '❌ Cet emoji est déjà utilisé pour un autre rôle sur ce message.', 
                ephemeral: true 
            });
        }

        // Ajouter le rôle en base de données
        await query(
            'INSERT INTO reaction_roles (guild_id, message_id, channel_id, role_id, emoji, description) VALUES (?, ?, ?, ?, ?, ?)',
            [interaction.guild.id, messageId, messageData[0].channel_id, role.id, emoji, description]
        );

        // Mettre à jour le message
        try {
            const channel = await interaction.guild.channels.fetch(messageData[0].channel_id);
            const message = await channel.messages.fetch(messageId);
            
            // Ajouter la réaction
            await message.react(emoji);
            
            await interaction.reply({ 
                content: `✅ Rôle ${role} ajouté avec l'emoji ${emoji} au message!`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du message:', error);
            await interaction.reply({ 
                content: '⚠️ Rôle ajouté en base de données mais erreur lors de la mise à jour du message.', 
                ephemeral: true 
            });
        }
    },

    async listReactionRoles(interaction) {
        const messages = await query(
            'SELECT * FROM reaction_role_messages WHERE guild_id = ? ORDER BY created_at DESC',
            [interaction.guild.id]
        );

        if (messages.length === 0) {
            return await interaction.reply({ 
                content: '📝 Aucun message de rôles par réaction trouvé sur ce serveur.', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Messages de rôles par réaction')
            .setColor('#0099ff')
            .setTimestamp();

        for (const msg of messages) {
            const roles = await query(
                'SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ?',
                [interaction.guild.id, msg.message_id]
            );

            let rolesText = 'Aucun rôle configuré';
            if (roles.length > 0) {
                rolesText = roles.map(r => `${r.emoji} <@&${r.role_id}>`).join('\n');
            }

            embed.addFields({
                name: `${msg.title} (ID: ${msg.message_id})`,
                value: `**Description:** ${msg.description}\n**Rôles:**\n${rolesText}`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async removeReactionRole(interaction) {
        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');

        // Supprimer de la base de données
        const result = await query(
            'DELETE FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?',
            [interaction.guild.id, messageId, emoji]
        );

        if (result.affectedRows === 0) {
            return await interaction.reply({ 
                content: '❌ Rôle par réaction non trouvé.', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: `✅ Rôle avec l'emoji ${emoji} supprimé du message!`, 
            ephemeral: true 
        });
    },

    async deleteReactionRoleMessage(interaction) {
        const messageId = interaction.options.getString('message_id');

        // Supprimer de la base de données
        const result = await query(
            'DELETE FROM reaction_role_messages WHERE guild_id = ? AND message_id = ?',
            [interaction.guild.id, messageId]
        );

        if (result.affectedRows === 0) {
            return await interaction.reply({ 
                content: '❌ Message de rôles par réaction non trouvé.', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: `✅ Message de rôles par réaction supprimé!`, 
            ephemeral: true 
        });
    }
}; 