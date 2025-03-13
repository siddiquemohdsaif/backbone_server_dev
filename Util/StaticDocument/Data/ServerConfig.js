const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for ServerConfig
let serverConfigCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if ServerConfig is in cache and not older than 10 seconds
    if (serverConfigCache.data && (now - serverConfigCache.timestamp) < 10000) {
        return serverConfigCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const serverConfig = await firestoreManager.readDocument("Config", "ServerConfig", "/");
        serverConfigCache = {
            data: serverConfig,
            timestamp: now
        };
        return serverConfig;
    }
};

module.exports = {
    get
};
