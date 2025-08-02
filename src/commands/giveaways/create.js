const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Gère les giveaways')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Crée un nouveau giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Le prix à gagner')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Nombre de gagnants')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Durée du giveaway (ex: 1h, 1d, 1w)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description du giveaway')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('requirements')
                        .setDescription('Conditions de participation')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('Termine un giveaway')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('ID du message du giveaway')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste les giveaways actifs')),

    permissions: [PermissionFlagsBits.ManageGuild],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await createGiveaway(interaction, client);
        } else if (subcommand === 'end') {
            await endGiveaway(interaction, client);
        } else if (subcommand === 'list') {
            await listGiveaways(interaction, client);
        }
    }
};

/**
 * Crée un nouveau giveaway
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function createGiveaway(interaction, client) {
    const prize = interaction.options.getString('prize');
    const winnerCount = interaction.options.getInteger('winners');
    const duration = interaction.options.getString('duration');
    const description = interaction.options.getString('description') || 'Aucune description fournie.';
    const requirements = interaction.options.getString('requirements');

    try {
        // Parser la durée
        const endTime = parseDuration(duration);
        if (!endTime) {
            return interaction.reply({
                content: '❌ Format de durée invalide. Utilisez: 30s, 5m, 2h, 1d, 1w',
                ephemeral: true
            });
        }

        // Créer l'embed du giveaway
        const giveawayEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**${prize}**\n\n${description}`)
            .addFields(
                { 
                    name: '👑 Gagnant(s)', 
                    value: `${winnerCount} gagnant(s)`, 
                    inline: true 
                },
                { 
                    name: '⏰ Se termine le', 
                    value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`, 
                    inline: true 
                },
                { 
                    name: '⏳ Temps restant', 
                    value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Créé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        if (requirements) {
            giveawayEmbed.addFields({
                name: '📋 Conditions de participation',
                value: requirements,
                inline: false
            });
        }

        // Créer le bouton de participation
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_join_${Date.now()}`)
                    .setLabel('🎉 Participer!')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
            );

        // Envoyer le message du giveaway
        const message = await interaction.channel.send({
            content: '🎉 **NOUVEAU GIVEAWAY!** 🎉',
            embeds: [giveawayEmbed],
            components: [row]
        });

        // Sauvegarder le giveaway dans la base de données
        await client.database.createGiveaway(
            interaction.guildId,
            interaction.channelId,
            message.id,
            prize,
            winnerCount,
            endTime,
            interaction.user.id,
            requirements
        );

        await interaction.reply({
            content: `✅ Giveaway créé avec succès! [Voir le giveaway](${message.url})`,
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du giveaway:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la création du giveaway.',
            ephemeral: true
        });
    }
}

/**
 * Termine un giveaway manuellement
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function endGiveaway(interaction, client) {
    const messageId = interaction.options.getString('message_id');

    try {
        // Récupérer le giveaway depuis la base de données
        const giveaway = await client.database.get(
            'SELECT * FROM giveaways WHERE message_id = ? AND guild_id = ?',
            [messageId, interaction.guildId]
        );

        if (!giveaway) {
            return interaction.reply({
                content: '❌ Giveaway non trouvé.',
                ephemeral: true
            });
        }

        // Récupérer le message
        const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!message) {
            return interaction.reply({
                content: '❌ Message du giveaway non trouvé.',
                ephemeral: true
            });
        }

        // Récupérer les participants
        const participants = await client.database.getGiveawayParticipants(giveaway.id);
        
        if (participants.length === 0) {
            // Aucun participant
            const noParticipantsEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🎉 Giveaway Terminé')
                .setDescription(`**${giveaway.prize}**\n\nAucun participant! Le giveaway est annulé.`)
                .setFooter({ text: 'Giveaway terminé' })
                .setTimestamp();

            await message.edit({ embeds: [noParticipantsEmbed], components: [] });
            await client.database.endGiveaway(giveaway.id);

            return interaction.reply({
                content: '✅ Giveaway terminé - Aucun participant.',
                ephemeral: true
            });
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
        
        const endEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Giveaway Terminé!')
            .setDescription(`**Prix:** ${giveaway.prize}\n\n**Gagnant(s):** ${winnerMentions}\n\nFélicitations!`)
            .setFooter({ text: `${winners.length} gagnant(s) sur ${participants.length} participant(s)` })
            .setTimestamp();

        await message.edit({ embeds: [endEmbed], components: [] });
        
        // Annoncer les gagnants
        await interaction.channel.send({
            content: `🎉 Félicitations ${winnerMentions}! Vous avez gagné **${giveaway.prize}**!`,
            allowedMentions: { users: winners }
        });

        // Marquer le giveaway comme terminé
        await client.database.endGiveaway(giveaway.id);

        await interaction.reply({
            content: '✅ Giveaway terminé avec succès!',
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Erreur lors de la fin du giveaway:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la fin du giveaway.',
            ephemeral: true
        });
    }
}

/**
 * Liste les giveaways actifs
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function listGiveaways(interaction, client) {
    try {
        const activeGiveaways = await client.database.all(
            'SELECT * FROM giveaways WHERE guild_id = ? AND active = 1 ORDER BY end_time ASC',
            [interaction.guildId]
        );

        if (activeGiveaways.length === 0) {
            return interaction.reply({
                content: '📭 Aucun giveaway actif pour le moment.',
                ephemeral: true
            });
        }

        const listEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎉 Giveaways Actifs')
            .setDescription(`Voici les ${activeGiveaways.length} giveaway(s) actuellement en cours:`)
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        for (const giveaway of activeGiveaways) {
            const timeLeft = `<t:${Math.floor(new Date(giveaway.end_time).getTime() / 1000)}:R>`;
            
            listEmbed.addFields({
                name: `🎁 ${giveaway.prize}`,
                value: `**ID:** ${giveaway.message_id}\n**Gagnants:** ${giveaway.winner_count}\n**Se termine:** ${timeLeft}\n**Créé par:** <@${giveaway.created_by}>`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [listEmbed] });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des giveaways:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la récupération des giveaways.',
            ephemeral: true
        });
    }
}

/**
 * Parse une durée en format string vers une Date
 * @param {string} duration - La durée (ex: 1h, 30m, 1d)
 * @returns {Date|null} La date de fin ou null si invalide
 */
function parseDuration(duration) {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhdw])$/);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return new Date(now.getTime() + value * 1000);
        case 'm': return new Date(now.getTime() + value * 60 * 1000);
        case 'h': return new Date(now.getTime() + value * 60 * 60 * 1000);
        case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        case 'w': return new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
        default: return null;
    }
} 