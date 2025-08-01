const mariadb = require('mariadb');
require('dotenv').config();

// Configuration de la pool de connexions
const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nocturn_bot',
    connectionLimit: 5,
    acquireTimeout: 30000,
    timeout: 30000,
    reconnect: true
});

// Fonction pour initialiser la base de données
async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();
        
        // Création de la base de données si elle n'existe pas
        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'nocturn_bot'}`);
        await conn.query(`USE ${process.env.DB_NAME || 'nocturn_bot'}`);
        
        // Création des tables nécessaires
        await conn.query(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id VARCHAR(20) PRIMARY KEY,
                prefix VARCHAR(5) DEFAULT '!',
                welcome_channel VARCHAR(20),
                log_channel VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id VARCHAR(20) PRIMARY KEY,
                guild_id VARCHAR(20),
                messages_sent INT DEFAULT 0,
                commands_used INT DEFAULT 0,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES guild_settings(guild_id) ON DELETE CASCADE
            )
        `);
        
        console.log('✅ Base de données initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

// Fonction pour obtenir une connexion
async function getConnection() {
    return await pool.getConnection();
}

// Fonction pour exécuter une requête
async function query(sql, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(sql, params);
        return result;
    } catch (error) {
        console.error('❌ Erreur de requête:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    pool,
    initializeDatabase,
    getConnection,
    query
}; 