const EventEmitter = require("events");
const mysql = require("mysql2/promise");
const fs = require("fs");

let pool;

const createEventListeners = (pool) => {
    if (pool instanceof EventEmitter) {
        pool.addListener("error", (error) => {
            console.error(error);
        });

        pool.addListener("warn", (warning) => {
            console.warn(warning);
        });
    }
};

// Set the cert value depending on environment variable (production/development)
const cert =
    process.env.NODE_ENV === "production"
        ? fs.readFileSync("./ca_cert.cert")
        : process.env.MYSQL_CA_CERT;

const getDatabasePoolConnection = () => {
    const {
        MYSQL_HOST,
        MYSQL_USERNAME,
        MYSQL_PASSWORD,
        MYSQL_DATABASE,
        MYSQL_PORT,
    } = process.env;
    if (typeof pool === "undefined") {
        pool = mysql.createPool({
            host: MYSQL_HOST,
            user: MYSQL_USERNAME,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE,
            port: MYSQL_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10,
            idleTimeout: 60000,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            supportBigNumbers: true,
            timezone: "Z",
            ssl: {
                ca: cert,
            },
        });

        createEventListeners(pool);
    }

    return pool;
};

module.exports = getDatabasePoolConnection();
