const FirestoreManager = require('../Firestore/FirestoreManager');
const FirestoreHandler = require('./FirestoreHandler');
const GameInitiator = require('./GameInitiator');
const StrikerInfoCache = require("./StaticDocument/GameInfo/StrikerInfo");
const PowerInfoCache = require("./StaticDocument/GameInfo/PowerInfo");
const PuckInfoCache = require("./StaticDocument/GameInfo/PuckInfo");
const TrailInfoCache = require("./StaticDocument/GameInfo/TrailInfo");

class FriendlyBattleHandler {

    static async acceptFriendlyBattleAndgetFriendlyGameInfo(messageId, clanId, uid , redisHandler) {
        if (messageId) {
            const friendlyBattleDoc = await FirestoreManager.getInstance().readDocumentWithProjection("ClanMsg", clanId, "/", { [messageId]: 1 });
            const result = await this.removeFriendlyBattleChallengeCardFromClanMessage(clanId, messageId , redisHandler);
            if (!result.acknowledged || result.modifiedCount !== 1 || result.matchedCount !== 1) {
                //failed to challenge accepted, someone else already accepted it.
                return;
            }

            const friendlyBattle = JSON.parse(friendlyBattleDoc[messageId]);
            //console.log(friendlyBattle);
            //console.log(friendlyBattle.senderId);

            const UID1 = friendlyBattle.senderId;
            const UID2 = uid;
            const timeStamp = Date.now();
            const gameID = UID1 + UID2 + timeStamp;
            const gameState = await this.getGameState(UID1, UID2, -1, null, "FRIENDLY", "FRIENDLY");



            const friendlyBattleGameInfo = {
                IP: await GameInitiator.getGameServerIP(),
                gameID,
                gameState,
                UID1,
                UID2,
                timeStamp
            };

            return friendlyBattleGameInfo
        }
    }

    static async initChallengeGame(uid1, uid2, mapId){

        const UID1 = uid1;
        const UID2 = uid2;
        const timeStamp = Date.now();
        const gameID = UID1 + UID2 + timeStamp;

        const trophyData = {
            p1 : {win:0 , lose:0},
            p2 : {win:0 , lose:0}
        }

        const gameState = await this.getGameState(UID1, UID2, mapId, trophyData, "CHALLENGE", "CHALLENGE");


        const friendlyBattleGameInfo = {
            IP: await GameInitiator.getGameServerIP(),
            gameID,
            gameState,
            UID1,
            UID2,
            timeStamp
        };

        return friendlyBattleGameInfo
    }

    static async removeFriendlyBattleChallengeCardFromClanMessage(clanId, messageId , redisHandler) {
        //console.log("clanId:" + clanId + " messageId:" + messageId);
        const actionMessage = { action: "REMOVE_CARD", messageData: messageId };
        const { clanMembers } = await FirestoreHandler.getClanMembers(clanId);
        const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
        redisHandler.publish(redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);
        return await FirestoreManager.getInstance().deleteField("ClanMsg", "/", clanId, messageId);
    }


    static async getGameState(UID1, UID2, mapId, trophyData, gameType1, gameType2) {
        const CacheDocumentPromises = [
            StrikerInfoCache.get(),
            PowerInfoCache.get(),
            PuckInfoCache.get(),
            TrailInfoCache.get()
        ]
        // Use Promise.all to fetch all documents in parallel
        const [StrikerInfo, PowerInfo, PuckInfo, TrailInfo] = await Promise.all(CacheDocumentPromises);
        this.GameInfo = { StrikerInfo: StrikerInfo, PowerInfo: PowerInfo, PuckInfo: PuckInfo, TrailInfo: TrailInfo };

        const usercollectionArray = await FirestoreManager.getInstance().bulkReadDocuments("Users", "/", [UID1, UID2], { "gameData.collection": 1 });
        //console.log(usercollectionArray);
        const collection1 = usercollectionArray[0].gameData.collection;
        const collection2 = usercollectionArray[1].gameData.collection;

        const playerExtraInfo1 = this.getPlayerExtraInfo(collection1, this.GameInfo);
        const playerExtraInfo2 = this.getPlayerExtraInfo(collection2, this.GameInfo);

        if(trophyData){
            playerExtraInfo1.trophyData = trophyData.p1;
            playerExtraInfo2.trophyData = trophyData.p2;
        }

        // type : CHALLENGE FRIENDLY NORMAL BOT REMATCH
        playerExtraInfo1.gameType = gameType1;
        playerExtraInfo2.gameType = gameType2;

        const strikerId_1 = collection1.striker.id;
        const strikerId_2 = collection2.striker.id;

        const map = mapId;
        const CarromId_1 = collection1.puck.id;
        const CarromId_2 = collection2.puck.id;

        const gameState = GameInitiator.getInitialGamePosition(strikerId_1, strikerId_2, map, CarromId_1, CarromId_2, JSON.stringify(playerExtraInfo1), JSON.stringify(playerExtraInfo2));

        return gameState;
    }

    static getPlayerExtraInfo(collection, GameInfo) {
        let extraInfo = { isPlayerInWar : false };

        let striker = collection.striker;
        let power = collection.power;
        let puck = collection.puck;
        let trail = collection.trail;

        // console.log(collection);
        let StrikerInfo = GameInfo.StrikerInfo;
        let PowerInfo = GameInfo.PowerInfo;

        let selectedStrikerLevel = this.getCurrentLevel(StrikerInfo, striker.id, striker.level);
        let selectedPowerLevel = this.getCurrentLevel(PowerInfo, power.id, power.level);

        let aimS = selectedStrikerLevel[0];
        let aimP = selectedPowerLevel[0];
        let aim = (aimS + aimP) / 2;
        extraInfo.a = aim;

        let forceS = selectedStrikerLevel[1];
        let forceP = selectedPowerLevel[1];
        let force = (forceS + forceP) / 2;
        extraInfo.f = force;

        let timeS = selectedStrikerLevel[2];
        let timeP = selectedPowerLevel[2];
        let time = (timeS + timeP) / 2;
        extraInfo.t = time;

        // console.log(extraInfo);
        extraInfo.striker = striker.id;
        extraInfo.power = power.id;
        extraInfo.puck = puck.id;
        extraInfo.trail = trail.id;

        return extraInfo;
    }

    static getCurrentLevel(objectInfo, id, level) {
        for (let category of ["Normal", "Rare", "Epic", "Legendary"]) {
            let categoryObjects = objectInfo[category];
            for (let i = 0; i < categoryObjects.length; i++) {
                let categoryObject = categoryObjects[i];
                if (categoryObject.id === id) {
                    return categoryObject["level" + level].fat;
                }
            }
        }
        return null;
    }
}

module.exports = FriendlyBattleHandler;
