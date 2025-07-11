const sms = require("@tiledesk/tiledesk-sms-connector");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');
const mongoose = require("mongoose");

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('SMS apiUrl: ' + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {
        winston.info("SMS Listener listen");
        if (config.databaseUri) {
            winston.debug("SMS config databaseUri: " + config.databaseUri);
        }

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        // Railway private host resolves only to AAAA → try public URL or use alternative approach
        if (host === "redis.railway.internal") {
            winston.info("Railway internal Redis detected - trying alternative Redis configuration for SMS connector");
            
            // Try using Railway's public Redis URL if available
            if (process.env.REDIS_URL) {
                winston.info("Using REDIS_URL for SMS connector");
                // Parse Redis URL to extract components
                const redisUrl = new URL(process.env.REDIS_URL);
                host = redisUrl.hostname;
                port = redisUrl.port || 6379;
                var password = redisUrl.password || process.env.CACHE_REDIS_PASSWORD;
                winston.info(`SMS connector using parsed Redis URL: ${host}:${port}`);
            } else {
                winston.info("No REDIS_URL available - disabling SMS connector to avoid IPv6 connection issues");
                return;
            }
        } else {
            var password = process.env.CACHE_REDIS_PASSWORD;
        }
        winston.debug("Redis password: "+ password);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME
        }

        let log = process.env.SMS_LOG || false
        winston.debug("SMS log: " + log);


        sms.startApp({
            MONGODB_URI: config.databaseUri,          
            dbconnection: dbConnection,
            BASE_URL: apiUrl + "/modules/sms",
            BRAND_NAME: brand_name,
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            log: log
        })
        
    }
}

var listener = new Listener();

module.exports = listener;

