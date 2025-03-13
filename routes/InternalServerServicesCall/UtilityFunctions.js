const FirestoreHandler = require('../../Util/FirestoreHandler');
const RedisHandler = require('../../RedisHandler');
const FirestoreManager = require('../../Firestore/FirestoreManager');

class UtilityFunctions {

    constructor(redisHandler) {
        this.redisHandler = redisHandler;
    }

    async sendClanActionCard(uid, cid, card) {
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);
        const ClanActionCard = {
            action: "ADD_CARD",
            messageData: JSON.stringify({
                messageId: card.timeStamp + "_" + uid,
                messageCard: JSON.stringify(card)
            })
        };
        FirestoreHandler.saveMessageToClanHistory(cid, uid, card);
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanActionCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async sendClanCardFast(uid, cid, clanMembers, card) {
        const ClanActionCard = {
            action: "ADD_CARD",
            messageData: JSON.stringify({
                messageId: card.timeStamp + "_" + uid,
                messageCard: JSON.stringify(card)
            })
        };
        FirestoreHandler.saveMessageToClanHistory(cid, uid, card);
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanActionCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async sendKickMessageToPlayer(kickingUID) {
        const kickMessage = {
            action: "KICK",
            messageData: kickingUID
        };
        const message = JSON.stringify({ uids: [kickingUID], text: JSON.stringify(kickMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async sendClanInvalidationAction(cid, clanMembers) {
        const invalidateMessage = {
            action: "CLAN_INVALIDATION",
            messageData: cid
        };
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(invalidateMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    // Add more utility functions if needed
}

module.exports = UtilityFunctions;
