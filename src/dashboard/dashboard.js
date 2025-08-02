const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');

class Dashboard {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.port = process.env.DASHBOARD_PORT || 3000;
        this.secret = process.env.DASHBOARD_SECRET || 'your-secret-key';
        
        this.setupMiddleware();
        this.setupPassport();
        this.setupRoutes();
    }

    /**
     * Configure le middleware Express
     */
    setupMiddleware() {
        // Middleware de base
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Configuration des sessions
        this.app.use(session({
            secret: this.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 heures
            }
        }));

        // Initialisation de Passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Middleware pour rendre le client Discord disponible
        this.app.use((req, res, next) => {
            req.client = this.client;
            next();
        });
    }

    /**
     * Configure Passport pour l'authentification Discord
     */
    setupPassport() {
        passport.use(new DiscordStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.DASHBOARD_SECRET,
            callbackURL: process.env.DASHBOARD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
            scope: ['identify', 'guilds']
        }, (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }));

        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((user, done) => {
            done(null, user);
        });
    }

    /**
     * Configure les routes du dashboard
     */
    setupRoutes() {
        // Route d'accueil
        this.app.get('/', this.isAuthenticated, (req, res) => {
            res.render('dashboard', {
                user: req.user,
                guilds: req.user.guilds.filter(guild => 
                    guild.permissions && guild.permissions.includes('MANAGE_GUILD')
                )
            });
        });

        // Route de connexion
        this.app.get('/login', (req, res) => {
            res.render('login');
        });

        // Route d'authentification Discord
        this.app.get('/auth/discord', passport.authenticate('discord'));

        // Callback d'authentification Discord
        this.app.get('/auth/discord/callback', 
            passport.authenticate('discord', { failureRedirect: '/login' }),
            (req, res) => {
                res.redirect('/');
            }
        );

        // Route de déconnexion
        this.app.get('/logout', (req, res) => {
            req.logout();
            res.redirect('/login');
        });

        // API Routes
        this.setupAPIRoutes();

        // Route 404
        this.app.use((req, res) => {
            res.status(404).render('404');
        });
    }

    /**
     * Configure les routes API
     */
    setupAPIRoutes() {
        // Route pour récupérer les informations d'un serveur
        this.app.get('/api/guild/:guildId', this.isAuthenticated, async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const guild = this.client.guilds.cache.get(guildId);
                
                if (!guild) {
                    return res.status(404).json({ error: 'Serveur non trouvé' });
                }

                // Vérifier les permissions
                const member = await guild.members.fetch(req.user.id);
                if (!member.permissions.has('MANAGE_GUILD')) {
                    return res.status(403).json({ error: 'Permissions insuffisantes' });
                }

                // Récupérer la configuration depuis la base de données
                const config = await this.client.database.getGuild(guildId);

                res.json({
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL({ dynamic: true }),
                    memberCount: guild.memberCount,
                    channels: guild.channels.cache.size,
                    roles: guild.roles.cache.size,
                    config: config
                });

            } catch (error) {
                console.error('❌ Erreur API guild:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // Route pour mettre à jour la configuration d'un serveur
        this.app.post('/api/guild/:guildId/config', this.isAuthenticated, async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const { prefix, welcomeChannel, welcomeMessage, goodbyeChannel, goodbyeMessage } = req.body;

                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) {
                    return res.status(404).json({ error: 'Serveur non trouvé' });
                }

                // Vérifier les permissions
                const member = await guild.members.fetch(req.user.id);
                if (!member.permissions.has('MANAGE_GUILD')) {
                    return res.status(403).json({ error: 'Permissions insuffisantes' });
                }

                // Mettre à jour la configuration
                await this.client.database.run(
                    `UPDATE guilds SET 
                        prefix = ?, 
                        welcome_channel = ?, 
                        welcome_message = ?,
                        goodbye_channel = ?,
                        goodbye_message = ?
                     WHERE id = ?`,
                    [prefix, welcomeChannel, welcomeMessage, goodbyeChannel, goodbyeMessage, guildId]
                );

                res.json({ success: true, message: 'Configuration mise à jour' });

            } catch (error) {
                console.error('❌ Erreur API config:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // Route pour récupérer les statistiques
        this.app.get('/api/stats', this.isAuthenticated, async (req, res) => {
            try {
                const stats = {
                    totalGuilds: this.client.guilds.cache.size,
                    totalUsers: this.client.users.cache.size,
                    uptime: this.client.uptime,
                    ping: this.client.ws.ping
                };

                res.json(stats);

            } catch (error) {
                console.error('❌ Erreur API stats:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // Route pour récupérer les tickets
        this.app.get('/api/guild/:guildId/tickets', this.isAuthenticated, async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const tickets = await this.client.database.all(
                    'SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC LIMIT 50',
                    [guildId]
                );

                res.json(tickets);

            } catch (error) {
                console.error('❌ Erreur API tickets:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // Route pour récupérer les giveaways
        this.app.get('/api/guild/:guildId/giveaways', this.isAuthenticated, async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const giveaways = await this.client.database.all(
                    'SELECT * FROM giveaways WHERE guild_id = ? ORDER BY created_at DESC LIMIT 50',
                    [guildId]
                );

                res.json(giveaways);

            } catch (error) {
                console.error('❌ Erreur API giveaways:', error);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });
    }

    /**
     * Middleware pour vérifier l'authentification
     */
    isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    }

    /**
     * Démarre le serveur dashboard
     */
    async start() {
        try {
            // Configurer le moteur de template (EJS)
            this.app.set('view engine', 'ejs');
            this.app.set('views', path.join(__dirname, 'views'));

            // Démarrer le serveur
            this.app.listen(this.port, () => {
                console.log(`🌐 Dashboard démarré sur http://localhost:${this.port}`);
            });

        } catch (error) {
            console.error('❌ Erreur lors du démarrage du dashboard:', error);
        }
    }
}

module.exports = Dashboard; 