const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('crypto').randomUUID ? {} : require('uuid');

const app = express();

// Configuration
const PORT = process.env.PORT || 8082;
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const APP_COLOR = process.env.APP_COLOR || 'blue';

// Generate or retrieve instance UUID
const INSTANCE_UUID = process.env.INSTANCE_UUID || (crypto.randomUUID ? crypto.randomUUID() : uuidv4());

// Database configuration and connection
let dbClient;
let dbType = 'postgres'; // Default to PostgreSQL

// Database configuration from VCAP_SERVICES or environment
function getDatabaseConfig() {
    // Check for Cloud Foundry VCAP_SERVICES
    if (process.env.VCAP_SERVICES) {
        try {
            const vcapServices = JSON.parse(process.env.VCAP_SERVICES);

            // Check for MySQL service (both "mysql" and "p.mysql" service types)
            const mysqlServices = vcapServices.mysql || vcapServices['p.mysql'];
            if (mysqlServices && mysqlServices.length > 0) {
                const mysqlService = mysqlServices[0];
                const credentials = mysqlService.credentials;

                // Check if credentials contain a URI (common with CredHub)
                if (credentials.uri) {
                    console.log('✓ Detected MySQL service from VCAP_SERVICES (URI)');
                    dbType = 'mysql';
                    return parseMySqlUri(credentials.uri);
                }

                console.log('✓ Detected MySQL service from VCAP_SERVICES');
                dbType = 'mysql';
                return {
                    type: 'mysql',
                    host: credentials.host || credentials.hostname,
                    port: credentials.port || 3306,
                    database: credentials.name || credentials.database,
                    user: credentials.username || credentials.user,
                    password: credentials.password,
                    ssl: credentials.ssl ? { rejectUnauthorized: false } : undefined
                };
            }

            // Check for PostgreSQL service (both "postgres", "p.postgresql", and "postgresql" service types)
            const postgresServices = vcapServices.postgres || vcapServices['p.postgresql'] || vcapServices.postgresql;
            if (postgresServices && postgresServices.length > 0) {
                const postgresService = postgresServices[0];
                const credentials = postgresService.credentials;

                // Check if credentials contain a URI (common with CredHub)
                if (credentials.uri) {
                    console.log('✓ Detected PostgreSQL service from VCAP_SERVICES (URI)');
                    dbType = 'postgres';
                    return parsePostgreSqlUri(credentials.uri);
                }

                console.log('✓ Detected PostgreSQL service from VCAP_SERVICES');
                dbType = 'postgres';
                return {
                    type: 'postgres',
                    host: credentials.host || credentials.hostname,
                    port: credentials.port || 5432,
                    database: credentials.name || credentials.database,
                    user: credentials.username || credentials.user,
                    password: credentials.password,
                    ssl: credentials.ssl ? { rejectUnauthorized: false } : false
                };
            }
        } catch (error) {
            console.error('Error parsing VCAP_SERVICES:', error);
        }
    }

    // Check for DATABASE_URL (connection string)
    if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        console.log('✓ Using DATABASE_URL');

        // Detect database type from URL
        if (dbUrl.includes('mysql://')) {
            dbType = 'mysql';
            return {
                type: 'mysql',
                connectionString: dbUrl.replace('mysql://', '')
            };
        } else {
            dbType = 'postgres';
            return {
                type: 'postgres',
                connectionString: dbUrl,
                ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
            };
        }
    }

    // Fall back to individual environment variables or defaults (PostgreSQL for local dev)
    console.log('✓ Using default PostgreSQL configuration for local development');
    dbType = 'postgres';
    return {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'demodb',
        user: process.env.DB_USER || 'demouser',
        password: process.env.DB_PASSWORD || 'demopass'
    };
}

// Parse MySQL URI format: mysql2://username:password@host:port/database?params
function parseMySqlUri(uri) {
    try {
        // Handle both mysql:// and mysql2:// protocols
        const cleanUri = uri.replace('mysql2://', 'mysql://');
        const url = new URL(cleanUri);

        return {
            type: 'mysql',
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            database: url.pathname.substring(1).split('?')[0], // Remove leading '/' and query params
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            ssl: url.searchParams.get('ssl') ? { rejectUnauthorized: false } : undefined
        };
    } catch (error) {
        console.error('Error parsing MySQL URI:', error);
        throw error;
    }
}

// Parse PostgreSQL URI format: postgres://username:password@host:port/database?params
function parsePostgreSqlUri(uri) {
    try {
        const url = new URL(uri);

        return {
            type: 'postgres',
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            database: url.pathname.substring(1).split('?')[0], // Remove leading '/' and query params
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            ssl: url.searchParams.get('sslmode') !== 'disable' ? { rejectUnauthorized: false } : false
        };
    } catch (error) {
        console.error('Error parsing PostgreSQL URI:', error);
        throw error;
    }
}

// Initialize database connection based on detected type
function initializeDatabaseConnection() {
    const config = getDatabaseConfig();

    if (config.type === 'mysql') {
        const mysql = require('mysql2/promise');
        dbClient = mysql.createPool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('✓ MySQL connection pool created');
    } else {
        const { Pool } = require('pg');
        dbClient = new Pool(config);

        dbClient.on('connect', () => {
            console.log('✓ Connected to PostgreSQL database');
        });

        dbClient.on('error', (err) => {
            console.error('✗ Unexpected error on idle client', err);
        });
    }
}

// Initialize database schema and sample data
async function initializeDatabase() {
    try {
        console.log(`Initializing ${dbType.toUpperCase()} database...`);

        if (dbType === 'mysql') {
            // MySQL initialization
            const connection = await dbClient.getConnection();
            try {
                // Create pets table if it doesn't exist (MySQL syntax)
                await connection.query(`
                    CREATE TABLE IF NOT EXISTS pets (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        race VARCHAR(50) NOT NULL,
                        gender VARCHAR(10) NOT NULL,
                        name VARCHAR(50) NOT NULL,
                        age INT NOT NULL,
                        description TEXT
                    )
                `);
                console.log('✓ Pets table ready');

                // Check if data already exists
                const [rows] = await connection.query('SELECT COUNT(*) as count FROM pets');
                const count = rows[0].count;

                if (count === 0) {
                    console.log('Seeding sample pet data...');
                    const samplePets = [
                        { race: 'Golden Retriever', gender: 'Male', name: 'Max', age: 5, description: 'Friendly and energetic dog' },
                        { race: 'Persian Cat', gender: 'Female', name: 'Luna', age: 3, description: 'Calm and fluffy cat' },
                        { race: 'Labrador', gender: 'Male', name: 'Charlie', age: 7, description: 'Loyal companion' },
                        { race: 'Siamese Cat', gender: 'Female', name: 'Bella', age: 2, description: 'Playful and vocal' },
                        { race: 'German Shepherd', gender: 'Male', name: 'Rex', age: 4, description: 'Smart and protective' },
                        { race: 'Maine Coon', gender: 'Male', name: 'Oliver', age: 6, description: 'Large and gentle cat' },
                        { race: 'Parakeet', gender: 'Female', name: 'Kiwi', age: 1, description: 'Colorful and chirpy bird' },
                        { race: 'Cockatiel', gender: 'Male', name: 'Sunny', age: 2, description: 'Friendly whistling bird' }
                    ];

                    for (const pet of samplePets) {
                        await connection.query(
                            'INSERT INTO pets (race, gender, name, age, description) VALUES (?, ?, ?, ?, ?)',
                            [pet.race, pet.gender, pet.name, pet.age, pet.description]
                        );
                    }

                    console.log(`✓ Inserted ${samplePets.length} sample pets`);
                } else {
                    console.log(`✓ Database already contains ${count} pets`);
                }
            } finally {
                connection.release();
            }
        } else {
            // PostgreSQL initialization
            const client = await dbClient.connect();
            try {
                // Create pets table if it doesn't exist (PostgreSQL syntax)
                await client.query(`
                    CREATE TABLE IF NOT EXISTS pets (
                        id SERIAL PRIMARY KEY,
                        race VARCHAR(50) NOT NULL,
                        gender VARCHAR(10) NOT NULL,
                        name VARCHAR(50) NOT NULL,
                        age INTEGER NOT NULL,
                        description TEXT
                    )
                `);
                console.log('✓ Pets table ready');

                // Check if data already exists
                const result = await client.query('SELECT COUNT(*) FROM pets');
                const count = parseInt(result.rows[0].count);

                if (count === 0) {
                    console.log('Seeding sample pet data...');
                    const samplePets = [
                        { race: 'Golden Retriever', gender: 'Male', name: 'Max', age: 5, description: 'Friendly and energetic dog' },
                        { race: 'Persian Cat', gender: 'Female', name: 'Luna', age: 3, description: 'Calm and fluffy cat' },
                        { race: 'Labrador', gender: 'Male', name: 'Charlie', age: 7, description: 'Loyal companion' },
                        { race: 'Siamese Cat', gender: 'Female', name: 'Bella', age: 2, description: 'Playful and vocal' },
                        { race: 'German Shepherd', gender: 'Male', name: 'Rex', age: 4, description: 'Smart and protective' },
                        { race: 'Maine Coon', gender: 'Male', name: 'Oliver', age: 6, description: 'Large and gentle cat' },
                        { race: 'Parakeet', gender: 'Female', name: 'Kiwi', age: 1, description: 'Colorful and chirpy bird' },
                        { race: 'Cockatiel', gender: 'Male', name: 'Sunny', age: 2, description: 'Friendly whistling bird' }
                    ];

                    for (const pet of samplePets) {
                        await client.query(
                            'INSERT INTO pets (race, gender, name, age, description) VALUES ($1, $2, $3, $4, $5)',
                            [pet.race, pet.gender, pet.name, pet.age, pet.description]
                        );
                    }

                    console.log(`✓ Inserted ${samplePets.length} sample pets`);
                } else {
                    console.log(`✓ Database already contains ${count} pets`);
                }
            } finally {
                client.release();
            }
        }

        console.log('✓ Database initialization complete');
    } catch (error) {
        console.error('✗ Database initialization failed:', error);
        throw error;
    }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// REST API: Get technology stack info
app.get('/api/infos', (req, res) => {
    const nodeVersion = process.version;
    const npmVersion = process.env.npm_package_version || 'N/A';

    // Get database type display name
    const databaseName = dbType === 'mysql' ? 'MySQL' : 'PostgreSQL';

    res.json({
        uuid: INSTANCE_UUID,
        version: APP_VERSION,
        deploymentColor: APP_COLOR,
        techStack: {
            framework: 'Node.js + Express',
            version: nodeVersion,
            language: 'JavaScript',
            languageVersion: 'ES2024',
            runtime: `Node.js ${nodeVersion}`,
            database: databaseName
        }
    });
});

// REST API: Get all pets
app.get('/api/pets', async (req, res) => {
    try {
        if (dbType === 'mysql') {
            const [rows] = await dbClient.query('SELECT * FROM pets ORDER BY id');
            res.json(rows);
        } else {
            const result = await dbClient.query('SELECT * FROM pets ORDER BY id');
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch pets' });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        if (dbType === 'mysql') {
            await dbClient.query('SELECT 1');
        } else {
            await dbClient.query('SELECT 1');
        }
        res.status(200).send('Healthy');
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).send('Unhealthy');
    }
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server after database initialization
async function startServer() {
    try {
        // Initialize database connection
        initializeDatabaseConnection();

        // Initialize database schema and data
        await initializeDatabase();

        // Start HTTP server
        app.listen(PORT, () => {
            console.log('======================================');
            console.log(`Server running on port ${PORT}`);
            console.log(`Version: ${APP_VERSION} (${APP_COLOR})`);
            console.log(`Instance UUID: ${INSTANCE_UUID}`);
            console.log(`Database: ${dbType.toUpperCase()}`);
            console.log('======================================');
            console.log(`Access the app at: http://localhost:${PORT}`);
            console.log('======================================');
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server and database connections');
    if (dbType === 'mysql') {
        await dbClient.end();
    } else {
        await dbClient.end();
    }
    process.exit(0);
});

// Start the application
startServer();
