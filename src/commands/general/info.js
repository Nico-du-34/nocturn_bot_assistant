const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Affiche les informations du serveur'),

    async execute(interaction, client) {
        const guild = interaction.guild;
        const guildConfig = await client.database.getGuild(guild.id);

        const infoEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`📊 Informations sur ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { 
                    name: '👑 Propriétaire', 
                    value: `<@${guild.ownerId}>`, 
                    inline: true 
                },
                { 
                    name: '📅 Créé le', 
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, 
                    inline: true 
                },
                { 
                    name: '🆔 ID du serveur', 
                    value: guild.id, 
                    inline: true 
                },
                { 
                    name: '👥 Membres', 
                    value: `${guild.memberCount} membres`, 
                    inline: true 
                },
                { 
                    name: '💬 Canaux', 
                    value: `${guild.channels.cache.size} canaux`, 
                    inline: true 
                },
                { 
                    name: '🎭 Rôles', 
                    value: `${guild.roles.cache.size} rôles`, 
                    inline: true 
                },
                { 
                    name: '🚀 Boost Level', 
                    value: `${guild.premiumTier}/3`, 
                    inline: true 
                },
                { 
                    name: '💎 Boosts', 
                    value: `${guild.premiumSubscriptionCount || 0} boosts`, 
                    inline: true 
                },
                { 
                    name: '🔧 Prefix', 
                    value: guildConfig?.prefix || '!', 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Demandé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Ajouter les informations sur les canaux
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        infoEmbed.addFields({
            name: '📋 Détails des Canaux',
            value: `💬 Textuels: ${textChannels}\n🔊 Vocaux: ${voiceChannels}\n📁 Catégories: ${categories}`,
            inline: false
        });

        // Ajouter les informations sur les emojis
        const emojis = guild.emojis.cache;
        const regularEmojis = emojis.filter(e => !e.animated).size;
        const animatedEmojis = emojis.filter(e => e.animated).size;

        infoEmbed.addFields({
            name: '😀 Emojis',
            value: `📷 Réguliers: ${regularEmojis}\n🎬 Animés: ${animatedEmojis}\n📊 Total: ${emojis.size}`,
            inline: false
        });

        // Ajouter les informations sur les fonctionnalités
        const features = guild.features.map(feature => 
            feature.replace(/_/g, ' ').toLowerCase()
                .replace(/\b\w/g, l => l.toUpperCase())
        );

        if (features.length > 0) {
            infoEmbed.addFields({
                name: '✨ Fonctionnalités',
                value: features.join(', '),
                inline: false
            });
        }

        await interaction.reply({ embeds: [infoEmbed] });
    }
}; 