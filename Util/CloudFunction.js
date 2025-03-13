const axios = require('axios');
const RedisHandler = require('../RedisHandler');
const FirestoreManager = require('../Firestore/FirestoreManager');
const firestoreManager = FirestoreManager.getInstance();

/**
 * Handles the event when a player connects to the game.
 * It sends a player's unique identifier (UID) and their clan ID (cid) to a CF server endpoint
 * and updates this clan member LS as 0(means currently active) also send event clan update to all member.
 * 
 * @param {string} UID - The unique identifier of the player.
 * @param {string} cid - The clan ID to which the player belongs.
 * @param {RedisHandler} redisHandler - An instance of RedisHandler for publishing messages.
 */
const playerConnected = async (UID, cid, redisHandler) => {
    const data = { UID, cid };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/playerConnected', data);
        // console.log(response.data)
        if(cid != "null"){
            const clan = response.data.clan;
            //console.log(clan);
            await callbackAllMemberForClanUpdate(redisHandler, clan);
        }
        const userDoc = response.data.updatedDocUser;
        await callbackAllMemberForFriendsUpdate(redisHandler,userDoc);
    } catch (error) {
        //console.error('Error calling playerConnected API:', error);
    }
};

/**
 * Handles the event when a player disconnects from the game.
 * It sends a player's unique identifier (UID) and their clan ID (cid) to a CF server endpoint
 * and updates this clan member LS as Date.now() also send event clan update to all member.
 * 
 * @param {string} UID - The unique identifier of the player.
 * @param {string} cid - The clan ID to which the player belongs.
 * @param {RedisHandler} redisHandler - An instance of RedisHandler for publishing messages.
 */
const playerDisconnected = async (UID, cid, redisHandler) => {
    const data = { UID, cid };

    try {
        const response = await axios.post('https://function.cloudsw3.com/cc-app-api/backBoneServer/playerDisconnect', data);
        // console.log(response.data)
        if(cid != "null"){
            const clan = response.data.clan;
            //console.log(clan);
            await callbackAllMemberForClanUpdate(redisHandler, clan);
        }
        const userDoc = response.data.updatedDocUser;
        await callbackAllMemberForFriendsUpdate(redisHandler,userDoc);
    } catch (error) {
        //console.error('Error calling playerDisconnect API:', error);
    }
};

/**
 * Publishes a message to all members of a clan indicating that there has been an update.
 * The message contains the updated clan information.
 * 
 * @param {RedisHandler} redisHandler - An instance of RedisHandler for publishing messages.
 * @param {Object} clan - The clan object containing updated information about the clan.
 */
const callbackAllMemberForClanUpdate = async (redisHandler, clan) => {
    const actionMessage = { action: "Clan_Update", messageData: clan };
    const clanMembers = clan.members.map(member => member.UID);
    const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
    await redisHandler.publish(redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);
};

/**
 * Publishes a message to all members of a clan indicating that there has been an update.
 * The message contains the updated clan information.
 * 
 * @param {RedisHandler} redisHandler - An instance of RedisHandler for publishing messages.
 * @param {Object} userDoc - The userDoc object containing updated information about the user.
 */

const callbackAllMemberForFriendsUpdate = async (redisHandler, userDoc) => {
    // Create the action message
    const actionMessage = {action: "Friends_Update",messageData: {uid: userDoc.uid,ls: userDoc.lastSeen}};

    // Read the user's notification document to get the friend list
    const notification = await firestoreManager.readDocument('Notifications', userDoc.uid, '/');
    const friendList = notification.friendList || []; // Ensure friendList is an array

    // Extract the UIDs of friends from the friendList
    const friendUIDs = friendList.map(friend => friend.uid);

    // Create the message string to be published
    const actionMessageStr = JSON.stringify({uids: friendUIDs,text: JSON.stringify(actionMessage)});

    // console.log(1);
    // Publish the message to the Redis channel
    await redisHandler.publish(redisHandler.FRIENDS_BROADCAST_CHANNEL, actionMessageStr);

};


module.exports = {
    playerConnected,
    playerDisconnected
};
