const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            // Gérer les slash commands
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction, client);
            }
            
            // Gérer les boutons
            else if (interaction.isButton()) {
                await handleButton(interaction, client);
            }
            
            // Gérer les menus de sélection
            else if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction, client);
            }
            
            // Gérer les modals
            else if (interaction.isModalSubmit()) {
                await handleModal(interaction, client);
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement de l\'interaction:', error);
            
            const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de cette commande.';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};

/**
 * Gère les slash commands
 * @param {CommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function handleSlashCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Commande non trouvée: ${interaction.commandName}`);
        return;
    }

    // Vérifier les permissions
    if (command.permissions) {
        const authorPerms = interaction.channel.permissionsFor(interaction.user);
        if (!authorPerms || !command.permissions.every(perm => authorPerms.has(perm))) {
            return interaction.reply({
                content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                ephemeral: true
            });
        }
    }

    // Vérifier si la commande est en mode développement
    if (command.devOnly && interaction.guildId !== process.env.GUILD_ID) {
        return interaction.reply({
            content: '❌ Cette commande n\'est disponible qu\'en mode développement.',
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
        
        const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de cette commande.';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}

/**
 * Gère les interactions de boutons
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 */
async function handleButton(interaction, client) {
    const [action, ...params] = interaction.customId.split('_');

    switch (action) {
        case 'ticket':
            await handleTicketButton(interaction, client, params);
            break;
            
        case 'giveaway':
            await handleGiveawayButton(interaction, client, params);
            break;
            
        case 'close':
            await handleCloseButton(interaction, client, params);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les boutons de tickets
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 * @param {Array} params - Paramètres du bouton
 */
async function handleTicketButton(interaction, client, params) {
    const [action, category] = params;

    switch (action) {
        case 'create':
            await createTicket(interaction, client, category);
            break;
            
        case 'close':
            await closeTicket(interaction, client);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action de ticket non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Crée un nouveau ticket
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 * @param {string} category - Catégorie du ticket
 */
async function createTicket(interaction, client, category = 'support') {
    const guild = interaction.guild;
    const user = interaction.user;

    // Vérifier si l'utilisateur a déjà un ticket ouvert
    const existingTicket = await client.database.get(`SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status = 'open'`, [user.id, guild.id]);
    
    if (existingTicket) {
        return interaction.reply({
            content: '❌ Vous avez déjà un ticket ouvert. Veuillez le fermer avant d\'en créer un nouveau.',
            ephemeral: true
        });
    }

    // Récupérer la configuration du serveur
    const guildConfig = await client.database.getGuild(guild.id);
    const ticketCategory = guildConfig?.ticket_category;

    try {
        // Créer le canal du ticket
        const channelName = `ticket-${user.username.toLowerCase()}`;
        const channel = await guild.channels.create({
            name: channelName,
            type: 0, // Text channel
            parent: ticketCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        });

        // Ajouter le ticket à la base de données
        await client.database.createTicket(guild.id, channel.id, user.id, category);

        // Créer l'embed de bienvenue du ticket
        const ticketEmbed = {
            color: 0x0099FF,
            title: `🎫 Ticket ${category.toUpperCase()}`,
            description: `Bienvenue ${user}! Un membre du staff vous répondra bientôt.\n\n**Catégorie:** ${category}\n**Créé par:** ${user.tag}`,
            footer: { text: 'Utilisez le bouton ci-dessous pour fermer le ticket' },
            timestamp: new Date()
        };

        const closeButton = {
            type: 1,
            components: [{
                type: 2,
                style: 4,
                label: 'Fermer le ticket',
                custom_id: 'ticket_close',
                emoji: '🔒'
            }]
        };

        await channel.send({
            content: `${user} ${guildConfig?.ticket_role ? `<@&${guildConfig.ticket_role}>` : ''}`,
            embeds: [ticketEmbed],
            components: [closeButton]
        });

        await interaction.reply({
            content: `✅ Votre ticket a été créé: ${channel}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du ticket:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la création du ticket.',
            ephemeral: true
        });
    }
}

/**
 * Ferme un ticket
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 */
async function closeTicket(interaction, client) {
    const channel = interaction.channel;
    const user = interaction.user;

    // Vérifier que c'est bien un canal de ticket
    const ticket = await client.database.getTicket(channel.id);
    if (!ticket) {
        return interaction.reply({
            content: '❌ Ce canal n\'est pas un ticket.',
            ephemeral: true
        });
    }

    try {
        // Marquer le ticket comme fermé dans la base de données
        await client.database.closeTicket(channel.id, user.id);

        // Supprimer le canal
        await channel.delete();

    } catch (error) {
        console.error('❌ Erreur lors de la fermeture du ticket:', error);
        await interaction.reply({
            content: '❌ Erreur lors de la fermeture du ticket.',
            ephemeral: true
        });
    }
}

/**
 * Gère les boutons de giveaway
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 * @param {Array} params - Paramètres du bouton
 */
async function handleGiveawayButton(interaction, client, params) {
    const [action, giveawayId] = params;

    switch (action) {
        case 'join':
            await joinGiveaway(interaction, client, giveawayId);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action de giveaway non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Rejoint un giveaway
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 * @param {string} giveawayId - ID du giveaway
 */
async function joinGiveaway(interaction, client, giveawayId) {
    const user = interaction.user;

    try {
        // Ajouter le participant
        await client.database.addGiveawayParticipant(giveawayId, user.id);

        await interaction.reply({
            content: '✅ Vous avez rejoint le giveaway! Bonne chance! 🍀',
            ephemeral: true
        });

    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            await interaction.reply({
                content: '❌ Vous participez déjà à ce giveaway!',
                ephemeral: true
            });
        } else {
            console.error('❌ Erreur lors de la participation au giveaway:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la participation au giveaway.',
                ephemeral: true
            });
        }
    }
}

/**
 * Gère les menus de sélection
 * @param {StringSelectMenuInteraction} interaction - L'interaction de menu
 * @param {Client} client - Le client Discord
 */
async function handleSelectMenu(interaction, client) {
    const [action, ...params] = interaction.customId.split('_');

    switch (action) {
        case 'ticket':
            // Gérer la sélection de catégorie de ticket
            const category = interaction.values[0];
            await createTicket(interaction, client, category);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action de menu non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les modals
 * @param {ModalSubmitInteraction} interaction - L'interaction de modal
 * @param {Client} client - Le client Discord
 */
async function handleModal(interaction, client) {
    const [action, ...params] = interaction.customId.split('_');

    switch (action) {
        case 'giveaway':
            await handleGiveawayModal(interaction, client, params);
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action de modal non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les modals de giveaway
 * @param {ModalSubmitInteraction} interaction - L'interaction de modal
 * @param {Client} client - Le client Discord
 * @param {Array} params - Paramètres du modal
 */
async function handleGiveawayModal(interaction, client, params) {
    const [action] = params;

    switch (action) {
        case 'create':
            // Traiter la création de giveaway via modal
            const prize = interaction.fields.getTextInputValue('prize');
            const duration = interaction.fields.getTextInputValue('duration');
            const winners = interaction.fields.getTextInputValue('winners');
            
            // Logique de création de giveaway...
            await interaction.reply({
                content: '✅ Giveaway créé avec succès!',
                ephemeral: true
            });
            break;
            
        default:
            await interaction.reply({
                content: '❌ Action de modal de giveaway non reconnue.',
                ephemeral: true
            });
    }
} 