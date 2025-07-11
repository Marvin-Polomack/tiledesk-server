const Redis = require('ioredis');

class TdCache {

    constructor(config) {
        this.redis_host = config.host;
        this.redis_port = config.port;
        this.redis_password = config.password;
        this.client = null;
    }

    async connect(callback) {
        return new Promise( async (resolve, reject) => {
            // ioredis configuration object
            const redisConfig = {
                host: this.redis_host,
                port: this.redis_port,
                password: this.redis_password,
                family: 6,
                retryDelayOnFailover: 100,
                enableReadyCheck: false,
                maxRetriesPerRequest: null,
            };

            this.client = new Redis(redisConfig);
            
            this.client.on('error', err => {
                reject(err);
                if (callback) {
                    callback(err);
                }
            });
            
            this.client.on('ready', function() {
                resolve();
                if (callback) {
                    callback();
                }
                //console.log("Redis is ready.");
            });
        });
    }

    async set(key, value, options) {
      //console.log("setting key value", key, value)
      if (!options) {
        options = {EX: 86400}
      }
      try {
        if (options && options.EX) {
          //console.log("expires:", options.EX)
          await this.client.set(key, value, 'EX', options.EX);
        }
        else {
          //console.log("setting here...key", key, value)
          await this.client.set(key, value);
        }
        if (options && options.callback) {
            options.callback();
        }
        //console.log("resolving...", key);
        return;
      } catch(error) {
        console.error("Error", error);
        throw error;
      }
    }

    async incr(key) {
      // console.log("incr key:", key)
      try {
        // console.log("incr here...key", key)
        await this.client.incr(key);
        return;
      } catch(error) {
        console.error("Error on incr:", error);
        throw error;
      }
    }

    async incrby(key, increment) {
      try {
        await this.client.incrby(key, increment);
        return;
      } catch(error) {
        console.error("Error on incrby:", error);
        throw error;
      }
    }

    async incrbyfloat(key, increment) {
      try {
        await this.client.incrbyfloat(key, increment);
        return;
      } catch(error) {
        console.error("Error on incrby: ", error);
        throw error;
      }
    }

    async hset(dict_key, key, value, options) {
      //console.log("hsetting dict_key key value", dict_key, key, value)
      try {
        if (options && options.EX) {
          //console.log("expires:", options.EX)
          await this.client.hset(dict_key, key, value, 'EX', options.EX);
        }
        else {
          //console.log("setting here...key", key, value)
          await this.client.hset(dict_key, key, value);
        }
        if (options && options.callback) {
            options.callback();
        }
        return;
      } catch(error) {
        console.error("Error", error);
        throw error;
      }
    }

    async hdel(dict_key, key, options) {
      //console.log("hsetting dict_key key value", dict_key, key, value)
      try {
        if (options && options.EX) {
          //console.log("expires:", options.EX)
          await this.client.hdel(dict_key, key, 'EX', options.EX);
        }
        else {
          //console.log("setting here...key", key, value)
          await this.client.hdel(dict_key, key);
        }
        if (options && options.callback) {
            options.callback();
        }
        return;
      } catch(error) {
        console.error("Error", error);
        throw error;
      }
    }
    
    async setJSON(key, value, options) {
      const _string = JSON.stringify(value);
      return await this.set(key, _string, options);
    }
    
    async get(key, callback) {
      try {
        const value = await this.client.get(key);
        if (callback) {
          callback(value);
        }
        return value;
      } catch(err) {
        if (callback) {
          callback(null);
        }
        throw err;
      }
    }

    async hgetall(dict_key, callback) {
      //console.log("hgetting dics", dict_key);
      try {
        const value = await this.client.hgetall(dict_key);
        if (callback) {
          callback(null, value);
        }
        return value;
      } catch(err) {
        if (callback) {
          callback(err, null);
        }
        throw err;
      }
    }

    async hget(dict_key, key, callback) {
      //console.log("hgetting dics", dict_key);
      try {
        const value = await this.client.hget(dict_key, key);
        if (callback) {
          callback(null, value);
        }
        return value;
      } catch(err) {
        if (callback) {
          callback(err, null);
        }
        throw err;
      }
    }
    
    async getJSON(key, callback) {
      const value = await this.get(key);
      return JSON.parse(value);
    }
    
    async del(key, callback) {
      try {
        let result = await this.client.del(key);
        if (callback) {
            callback(result);
        }
        return result;
      } catch(error) {
        throw error;
      }
    }
}

module.exports = { TdCache };