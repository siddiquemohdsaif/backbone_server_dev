const FirestoreManager = require("../../../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();

// Global cache for CarromPass
let carromPassCache = {
    data: null,
    timestamp: null
};

const get = async () => {
    const now = new Date().getTime();
    // Check if CarromPass is in cache and not older than 10 seconds
    if (carromPassCache.data && (now - carromPassCache.timestamp) < 10000) {
        return carromPassCache.data;
    } else {
        // Fetch new data from Firestore and update cache
        const carromPass = await firestoreManager.readDocument("Data", "CarromPass", "/");
        carromPassCache = {
            data: carromPass,
            timestamp: now
        };
        return carromPass;
    }
};

module.exports = {
    get
};
