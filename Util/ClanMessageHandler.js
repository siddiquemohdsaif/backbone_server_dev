const FirestoreHandler = require('./FirestoreHandler');



const builtClanMessageCard = (senderId, senderName_cache, senderPosition_cache, senderLogo_cache, isSenderPremium_cache, text) => {

    const messageData = text;
    const timeStamp = Date.now();

    const messageClanCard = { cardType: "clanMessage", messageData, timeStamp, senderId, senderName_cache, senderPosition_cache, senderLogo_cache, isSenderPremium_cache};
    return messageClanCard;
}


const clanMessageSizeController = async (cid) => {
    // Generate a random integer between 1 (inclusive) and 100 (inclusive).
    const randomNumber = Math.floor(Math.random() * 100) + 1;

    // Check if the random number is less than or equal to 10 (i.e., 10% probability).
    if (randomNumber <= 10) {
        reduceClanSize(cid);
    }
}

const reduceClanSize = async (cid) => {
    const limit = 200;
    const messagesHistory = await FirestoreHandler.getClanChatHistory(cid);
    delete messagesHistory._id;
    //console.log("Before:", messagesHistory);

    // Extract the keys from the message history object that correspond to the messages.
    const messageKeys = Object.keys(messagesHistory).filter(key => key.includes('_'));

    // Sort these keys based on their timestamp.
    messageKeys.sort((a, b) => {
        const timeStampA = Number(a.split('_')[0]);
        const timeStampB = Number(b.split('_')[0]);
        return timeStampB - timeStampA;  // Most recent first
    });

    // Remove the oldest messages until only the 10 most recent messages remain.
    for (let i = limit; i < messageKeys.length; i++) {
        delete messagesHistory[messageKeys[i]];
    }

    // Update the Firestore document with the reduced message history (assuming there's a method to do that).
    await FirestoreHandler.updateClanChatHistory(cid, messagesHistory);

    // console.log("After:", messagesHistory);
};





module.exports = {

    builtClanMessageCard,
    clanMessageSizeController
}