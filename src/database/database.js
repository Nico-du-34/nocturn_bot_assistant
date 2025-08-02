const sqlite3 = require('sqlite3').verbose();
const mariadb = require('mariadb');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.type = process.env.DATABASE_TYPE || 'sqlite';
        this.connection = null;
    }

    /**
     * Initialise la base de données
     */
    async init() {
        try {
            if (this.type === 'sqlite') {
                await this.initSQLite();
            } else if (this.type === 'mysql') {
                await this.initMariaDB();
            } else {
                throw new Error(`Type de base de données non supporté: ${this.type}`);
            }

            await this.createTables();
            console.log(`✅ Base de données ${this.type} initialisée`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
            throw error;
        }
    }

    /**
     * Initialise SQLite
     */
    async initSQLite() {
        const dbPath = process.env.DATABASE_PATH || './database.db';
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Initialise MariaDB
     */
    async initMariaDB() {
        try {
            this.connection = await mariadb.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'nocturn_bot'
            });
        } catch (error) {
            throw new Error(`Impossible de se connecter à MariaDB: ${error.message}`);
        }
    }

    /**
     * Crée les tables nécessaires
     */
    async createTables() {
        const tables = [
            // Table des serveurs
            `CREATE TABLE IF NOT EXISTS guilds (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                prefix VARCHAR(10) DEFAULT '!',
                welcome_channel VARCHAR(20),
                welcome_message TEXT,
                goodbye_channel VARCHAR(20),
                goodbye_message TEXT,
                ticket_category VARCHAR(20),
                ticket_log_channel VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Table des tickets
            `CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) UNIQUE NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                category VARCHAR(50) DEFAULT 'support',
                status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                closed_by VARCHAR(20),
                FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE
            )`,

            // Table des giveaways
            `CREATE TABLE IF NOT EXISTS giveaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id VARCHAR(20) NOT NULL,
                channel_id VARCHAR(20) NOT NULL,
                message_id VARCHAR(20) UNIQUE NOT NULL,
                prize VARCHAR(255) NOT NULL,
                winner_count INTEGER DEFAULT 1,
                end_time TIMESTAMP NOT NULL,
                created_by VARCHAR(20) NOT NULL,
                requirements TEXT,
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Table des participants aux giveaways
            `CREATE TABLE IF NOT EXISTS giveaway_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id INTEGER NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE,
                UNIQUE(giveaway_id, user_id)
            )`,

            // Table des logs
            `CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id VARCHAR(20) NOT NULL,
                action VARCHAR(50) NOT NULL,
                user_id VARCHAR(20),
                target_id VARCHAR(20),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Table des embeds sauvegardés
            `CREATE TABLE IF NOT EXISTS saved_embeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                title VARCHAR(255),
                description TEXT,
                color VARCHAR(7),
                fields TEXT,
                footer TEXT,
                thumbnail VARCHAR(255),
                image VARCHAR(255),
                created_by VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, name)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    /**
     * Exécute une requête SQL
     */
    async run(sql, params = []) {
        if (this.type === 'sqlite') {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, changes: this.changes });
                    }
                });
            });
        } else {
            return await this.connection.query(sql, params);
        }
    }

    /**
     * Récupère une ligne
     */
    async get(sql, params = []) {
        if (this.type === 'sqlite') {
            return new Promise((resolve, reject) => {
                this.db.get(sql, params, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        } else {
            const rows = await this.connection.query(sql, params);
            return rows[0];
        }
    }

    /**
     * Récupère plusieurs lignes
     */
    async all(sql, params = []) {
        if (this.type === 'sqlite') {
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } else {
            return await this.connection.query(sql, params);
        }
    }

    /**
     * Ferme la connexion
     */
    async close() {
        if (this.type === 'sqlite') {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            await this.connection.end();
        }
    }

    // Méthodes spécifiques pour les guilds
    async getGuild(guildId) {
        return await this.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
    }

    async createGuild(guildId, guildName) {
        return await this.run(
            'INSERT OR REPLACE INTO guilds (id, name) VALUES (?, ?)',
            [guildId, guildName]
        );
    }

    async updateGuildPrefix(guildId, prefix) {
        return await this.run(
            'UPDATE guilds SET prefix = ? WHERE id = ?',
            [prefix, guildId]
        );
    }

    // Méthodes spécifiques pour les tickets
    async createTicket(guildId, channelId, userId, category = 'support') {
        return await this.run(
            'INSERT INTO tickets (guild_id, channel_id, user_id, category) VALUES (?, ?, ?, ?)',
            [guildId, channelId, userId, category]
        );
    }

    async getTicket(channelId) {
        return await this.get('SELECT * FROM tickets WHERE channel_id = ?', [channelId]);
    }

    async closeTicket(channelId, closedBy) {
        return await this.run(
            'UPDATE tickets SET status = ?, closed_at = ?, closed_by = ? WHERE channel_id = ?',
            ['closed', new Date(), closedBy, channelId]
        );
    }

    // Méthodes spécifiques pour les giveaways
    async createGiveaway(guildId, channelId, messageId, prize, winnerCount, endTime, createdBy, requirements = null) {
        return await this.run(
            'INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winner_count, end_time, created_by, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [guildId, channelId, messageId, prize, winnerCount, endTime, createdBy, requirements]
        );
    }

    async getActiveGiveaways() {
        return await this.all('SELECT * FROM giveaways WHERE active = 1 AND end_time > ?', [new Date()]);
    }

    async addGiveawayParticipant(giveawayId, userId) {
        return await this.run(
            'INSERT OR IGNORE INTO giveaway_participants (giveaway_id, user_id) VALUES (?, ?)',
            [giveawayId, userId]
        );
    }

    async getGiveawayParticipants(giveawayId) {
        return await this.all('SELECT user_id FROM giveaway_participants WHERE giveaway_id = ?', [giveawayId]);
    }

    async endGiveaway(giveawayId) {
        return await this.run('UPDATE giveaways SET active = 0 WHERE id = ?', [giveawayId]);
    }
}

module.exports = Database; 