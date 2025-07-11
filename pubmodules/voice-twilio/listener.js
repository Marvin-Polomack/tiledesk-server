const voice_twilio = require('@tiledesk/tiledesk-voice-twilio-connector');
let winston = require('../../config/winston');
let configGlobal = require('../../config/global');
const mongoose = require('mongoose');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info("TwilioVoice apiUrl: " + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {

        winston.info("TwilioVoice Listener listen");
        if (config.databaseUri) {
            winston.debug("TwilioVoice config databaseUri: " +  config.databaseUri);
        }

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        // Railway private host resolves only to AAAA → try public URL or use alternative approach
        if (host === "redis.railway.internal") {
            winston.info("Railway internal Redis detected - trying alternative Redis configuration for voice-twilio connector");
            
            // Try using Railway's public Redis URL if available
            if (process.env.REDIS_URL) {
                winston.info("Using REDIS_URL for voice-twilio connector");
                // Parse Redis URL to extract components
                const redisUrl = new URL(process.env.REDIS_URL);
                host = redisUrl.hostname;
                port = redisUrl.port || 6379;
                var password = redisUrl.password || process.env.CACHE_REDIS_PASSWORD;
                winston.info(`Voice-twilio connector using parsed Redis URL: ${host}:${port}`);
            } else {
                winston.info("No REDIS_URL available - disabling voice-twilio connector to avoid IPv6 connection issues");
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

        let openai_endpoint = process.env.OPENAI_ENDPOINT;
        winston.debug("OpenAI Endpoint: ", openai_endpoint);

        let gpt_key = process.env.GPTKEY;

        let log = process.env.VOICE_TWILIO_LOG || false
        winston.debug("Voice log: "+ log);
        
        voice_twilio.startApp({
            MONGODB_URI: config.databaseUri,          
            dbconnection: dbConnection,
            BASE_URL: apiUrl + "/modules/voice-twilio",
            BASE_FILE_URL: apiUrl,                     
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            BRAND_NAME: brand_name,
            OPENAI_ENDPOINT: openai_endpoint,
            GPT_KEY: gpt_key,
            log: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk Twilio Voice Connector proxy server succesfully started.");
            } else {
                winston.info("unable to start Tiledesk Twilio Voice Connector. " + err);
            }    
        })
    }
}

let listener = new Listener();

module.exports = listener;