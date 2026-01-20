const fs = require('fs');
const path = require('path');

// Config file path - will be in app's user data folder for production
const getConfigPath = () => {
    // In production (Electron), use app's user data directory
    // In development, use server folder
    const configDir = process.env.CONFIG_DIR || __dirname;
    return path.join(configDir, 'app-config.json');
};

// Default config
const defaultConfig = {
    database: {
        host: 'localhost',
        port: 5432,
        name: 'spraycenter',
        user: 'postgres',
        password: ''
    },
    isConfigured: false
};

// Read config from file
const readConfig = () => {
    const configPath = getConfigPath();
    
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(data);
            return { ...defaultConfig, ...config };
        }
    } catch (err) {
        console.error('Error reading config:', err.message);
    }
    
    return defaultConfig;
};

// Write config to file
const writeConfig = (config) => {
    const configPath = getConfigPath();
    
    try {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing config:', err.message);
        return false;
    }
};

// Check if app is configured
const isConfigured = () => {
    const config = readConfig();
    return config.isConfigured === true;
};

// Get database config
const getDatabaseConfig = () => {
    const config = readConfig();
    return config.database;
};

// Save database config
const saveDatabaseConfig = (dbConfig) => {
    const config = readConfig();
    config.database = { ...config.database, ...dbConfig };
    config.isConfigured = true;
    return writeConfig(config);
};

// Reset config
const resetConfig = () => {
    return writeConfig(defaultConfig);
};

module.exports = {
    readConfig,
    writeConfig,
    isConfigured,
    getDatabaseConfig,
    saveDatabaseConfig,
    resetConfig,
    getConfigPath
};
