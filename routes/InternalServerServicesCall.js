const FirestoreHandler = require('../Util/FirestoreHandler');
const RedisHandler = require('../RedisHandler');
const FirestoreManager = require('../Firestore/FirestoreManager');

class InternalServerServicesHandler {

    /**
     * constructor
     * @param {RedisHandler} redisHandler - websocket server
    */
    constructor(redisHandler) {
        this.redisHandler = redisHandler;
    }

    async handle(ws, queryParams) {
        try {
            const callType = queryParams['callType'];

            switch (callType) {

                ///////////////////////////////////////////////////////////////////
                /////////////////////////// caln //////////////////////////////////
                ///////////////////////////////////////////////////////////////////
                case "sendClanJoinedRequest":
                    await this.handleSendClanJoinedRequest(queryParams);
                    ws.send("send clan joined request successfully");
                    ws.close(4390, 'success');
                    break;

                case "actionJoinedRequest":
                    await this.handleActionJoinedRequest(queryParams);
                    ws.send(queryParams['actionCode'] === "1" ? "accepted successfully" :
                        queryParams['actionCode'] === "0" ? "rejected successfully" :
                            "removed inviteCard successfully");
                    ws.close(4390, 'success');
                    break;

                case "joinedClan":
                    await this.handleSendClanJoinMessage(queryParams);
                    ws.send("joined successfully");
                    ws.close(4390, 'success');
                    break;

                case "LeftClan":
                    await this.handleSendClanLeaveMessage(queryParams);
                    ws.send("left successfully");
                    ws.close(4390, 'success');
                    break;

                case "promoteMember":
                    await this.handlePromoteMember(queryParams);
                    ws.send("Member promoted successfully");
                    ws.close(4390, 'success');
                    break;

                case "demoteMember":
                    await this.handleDemoteMember(queryParams);
                    ws.send("Member demoted successfully");
                    ws.close(4390, 'success');
                    break;

                case "kickMember":
                    await this.handleKickMember(queryParams);
                    ws.send("Member kicked successfully");
                    ws.close(4390, 'success');
                    break;

                case "sendClanDetailsUpdate":
                    await this.handleSendClanDetailsUpdate(queryParams);
                    ws.send("clanUpdated message send successfully");
                    ws.close(4390, 'success');
                    break;

                case "joinedClanByInvite":
                    await this.handleJoinedClanByInvite(queryParams);
                    ws.send("joinedClanByInvite message send successfully");
                    ws.close(4390, 'success');
                    break;

                case "friendlyBattleResult":
                    await this.handleFriendlyBattleResult(queryParams);
                    ws.send("friendlyBattleResult send successfully");
                    ws.close(4390, 'success');
                    break;


                ///////////////////////////////////////////////////////////////////
                ////////////////////////// Clan War ///////////////////////////////
                ///////////////////////////////////////////////////////////////////
                case "clanWarSearch":
                    await this.handleClanWarSearch(queryParams);
                    ws.send("send clanWarSearch message  successfully");
                    ws.close(4390, 'success');
                    break;


                case "clanWarDone":
                    await this.handleClanWarDone(queryParams);
                    ws.send("send clan invalidate  successfully");
                    ws.close(4390, 'success');
                    break;


                case "clanWarMatchSuccessful":
                    await this.handleClanWarMatchSuccessful(queryParams);
                    ws.send("send clanWar invalidate  successfully");
                    ws.close(4390, 'success');
                    break;

                case "clanWarOver":
                    await this.handleClanWarOver(queryParams);
                    ws.send("send clanWar invalidate  successfully");
                    ws.close(4390, 'success');
                    break;


                ///////////////////////////////////////////////////////////////////
                ////////////////////// Notification ///////////////////////////////
                ///////////////////////////////////////////////////////////////////
                case "sendNotification":
                    await this.handleSendNotification(queryParams);
                    ws.send("send Notification message successfully");
                    ws.close(4390, 'success');
                    break;

                case "invalidateNotification":
                    await this.handleInvalidateNotification(queryParams);
                    ws.send("send Notification invalidate successfully");
                    ws.close(4390, 'success');
                    break;

                ///////////////////////////////////////////////////////////////////
                ////////////////////// seasonReset ////////////////////////////////
                ///////////////////////////////////////////////////////////////////
                case "seasonReset":
                    await this.handleSeasonReset(queryParams);
                    ws.send("send seasonReset Notification message  successfully");
                    ws.close(4390, 'success');
                    break;


                    
                ///////////////////////////////////////////////////////////////////
                ////////////////////// eventChange ////////////////////////////////
                ///////////////////////////////////////////////////////////////////
                case "eventChange":
                    await this.handleEventChange(queryParams);
                    ws.send("send eventChange Notification message  successfully");
                    ws.close(4390, 'success');
                    break;


                default:
                    ws.close(4490, 'failed1');
                    break;
            }
        } catch (e) {
            ws.close(4490, 'failed2' + e.message);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////  clan  ///////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async handleSendClanJoinedRequest(queryParams) {
        
        const senderId = queryParams['senderId'];
        const senderName = queryParams['senderName'];
        const senderLeagueLogo = queryParams['senderLeagueLogo'];
        const senderAvatar = queryParams['senderAvatar'];
        const senderFrame = parseInt(queryParams['senderFrame']);
        const senderTrophy = parseInt(queryParams['senderTrophy']);
        const isSenderPremium = queryParams['isSenderPremium'];
        const cid = queryParams['cid'];


        const uid = senderId;
        const clanInvitationCard = { cardType: "clanJoinInviteRequest", senderId, senderName, senderLeagueLogo, senderAvatar, senderFrame, senderTrophy, isSenderPremium, timeStamp: Date.now() };
        const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);
        if (senderPosition !== null) {
            throw new Error("Player already in the clan");
        }
        const ClanInviteObjectCard = {
            action: "ADD_CARD", messageData: JSON.stringify({
                messageId: clanInvitationCard.timeStamp + "_" + uid,
                messageCard: JSON.stringify(clanInvitationCard)
            })
        };
        FirestoreHandler.saveMessageToClanHistory(cid, uid, clanInvitationCard);
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanInviteObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }


    //////////////////////////////////////////////////  handleActionJoinedRequest /////////////////////////////////////////////////////////////////////////
    async handleActionJoinedRequest(queryParams) {
        const actionMemberUid = queryParams['actionMemberUid'];
        const onActionDoneUid = queryParams['onActionDoneUid'];
        const actionMemberName = queryParams['actionMemberName'];
        const playerName = queryParams['playerName'];
        const actionCode = parseInt(queryParams['actionCode']);
        const requestMessageId = queryParams['requestMessageId'];
        const cid = queryParams['cid'];

        if (!actionMemberUid || !actionMemberName || !playerName || actionCode == null || !requestMessageId || !cid) {
            throw new Error("Incomplete parameters for handleActionJoinedRequest");
        }

        switch (actionCode) {
            case 1:  // Accept to clan
                await this.handleAcceptClanJoinedRequest(actionMemberUid, onActionDoneUid, actionMemberName, playerName, cid, requestMessageId);
                break;

            case 0:  // Reject to clan
                await this.handleRejectClanJoinedRequest(actionMemberUid, onActionDoneUid, actionMemberName, playerName, cid, requestMessageId);
                break;

            case -1:  // Already Join Other Clan
                await this.handleRemoveClanJoinedRequest(actionMemberUid, cid, requestMessageId);
                break;

            default:
                throw new Error("Invalid action code provided: " + actionCode);
        }
    }

    async handleAcceptClanJoinedRequest(uid, onActionDoneUid, actionMemberName, playerName, cid, requestMessageId) {

        //send accepted card
        const acceptedCard = { 
        cardType: "logMessage",
        logMessage: `${playerName} is accepeted by ${actionMemberName}`,
        type: "InvitationAccepted", 
        profileId: onActionDoneUid,
        timeStamp: Date.now() };
        const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);

        const ClanAcceptedObjectCard = {
            action: "ADD_CARD", messageData: JSON.stringify({
                messageId: acceptedCard.timeStamp + "_" + uid,
                messageCard: JSON.stringify(acceptedCard)
            })
        };

        FirestoreHandler.saveMessageToClanHistory(cid, uid, acceptedCard);
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanAcceptedObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);

        //send action to delete invitaion card
        // 1) delete from clan message history
        FirestoreHandler.removeMessageFromClanHistory(cid, requestMessageId);
        // 2) action : remover card of invitationRequestCard in user local
        const actionMessage = { action: "REMOVE_CARD", messageData: requestMessageId };
        const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);

    }

    async handleRejectClanJoinedRequest(uid, onActionDoneUid, actionMemberName, playerName, cid, requestMessageId) {

        //send accepted card
        const rejectedCard = {
            cardType: "logMessage",
            logMessage: `${playerName} is rejected by ${actionMemberName}`,
            type: "InvitationRejected",
            profileId: onActionDoneUid,
            timeStamp: Date.now() };
        const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);

        const ClanRejectedObjectCard = {
            action: "ADD_CARD", messageData: JSON.stringify({
                messageId: rejectedCard.timeStamp + "_" + uid,
                messageCard: JSON.stringify(rejectedCard)
            })
        };

        FirestoreHandler.saveMessageToClanHistory(cid, uid, rejectedCard);
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanRejectedObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);

        //send action to delete invitaion card
        // 1) delete from clan message history
        FirestoreHandler.removeMessageFromClanHistory(cid, requestMessageId);
        // 2) action : remover card of invitationRequestCard in user local
        const actionMessage = { action: "REMOVE_CARD", messageData: requestMessageId };
        const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);

    }

    async handleRemoveClanJoinedRequest(uid, cid, requestMessageId) {
        // 1) delete from clan message history
        FirestoreHandler.removeMessageFromClanHistory(cid, requestMessageId);
        // 2) action : remover card of invitationRequestCard in user local
        const { clanMembers, senderPosition } = await FirestoreHandler.getClanMembers(cid, uid);
        const actionMessage = { action: "REMOVE_CARD", messageData: requestMessageId };
        const actionMessageStr = JSON.stringify({ uids: clanMembers, text: JSON.stringify(actionMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, actionMessageStr);

    }
    //////////////////////////////////////////////////  handleActionJoinedRequest /////////////////////////////////////////////////////////////////////////


    async handleSendClanJoinMessage(queryParams) {
        const joinedUID = queryParams['joinedUID'];
        const playerName = queryParams['playerName'];
        const cid = queryParams['cid'];

        // Construct the join card message
        const joinedCard = {
            cardType: "logMessage",
            logMessage: `${playerName} joined the Clan`,
            type: "JoinedClan",
            profileId: joinedUID,
            timeStamp: Date.now()
        };

        // Fetch clan members and sender position
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid, joinedUID);

        // Create the message object to be broadcasted
        const ClanJoinedObjectCard = {
            action: "ADD_CARD",
            messageData: JSON.stringify({
                messageId: joinedCard.timeStamp + "_" + joinedUID,
                messageCard: JSON.stringify(joinedCard)
            })
        };

        // Save the join message to clan history
        await FirestoreHandler.saveMessageToClanHistory(cid, joinedUID, joinedCard);

        // Broadcast the join message to all clan members
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanJoinedObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }


    async handleSendClanLeaveMessage(queryParams) {
        const leftUID = queryParams['leftUID'];
        const playerName = queryParams['playerName'];
        const cid = queryParams['cid'];

        // Construct the leave card message
        const leftCard = {
            cardType: "logMessage",
            logMessage: `${playerName} left the Clan`,
            type: "LeftClan",
            profileId: leftUID,
            timeStamp: Date.now()
        };

        // Fetch clan members
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);

        // Create the message object to be broadcasted
        const ClanLeftObjectCard = {
            action: "ADD_CARD",
            messageData: JSON.stringify({
                messageId: leftCard.timeStamp + "_" + leftUID,
                messageCard: JSON.stringify(leftCard)
            })
        };

        // Save the leave message to clan history
        await FirestoreHandler.saveMessageToClanHistory(cid, leftUID, leftCard);

        // Broadcast the leave message to all clan members
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(ClanLeftObjectCard) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    /////////////////////////////////// promote/demode/kick handled ////////////////////////////////////
    async handlePromoteMember(queryParams) {
        const { promoterUID, promotingUID, promoterName, promotingName, cid } = queryParams;
        const card = {
            cardType: "logMessage",
            logMessage: `${promotingName} was promoted by ${promoterName}`,
            type: "MemberPromoted",
            profileId: promotingUID,
            timeStamp: Date.now()
        };
        await this.sendClanActionCard(promoterUID, cid, card);
    }

    async handleDemoteMember(queryParams) {
        const { demoterUID, demotingUID, demoterName, demotingName, cid } = queryParams;
        const card = {
            cardType: "logMessage",
            logMessage: `${demotingName} was demoted by ${demoterName}`,
            type: "MemberDemoted",
            profileId: demotingUID,
            timeStamp: Date.now()
        };
        await this.sendClanActionCard(demoterUID, cid, card);
    }

    async handleKickMember(queryParams) {
        const { kickerUID, kickingUID, kickerName, kickingName, cid } = queryParams;
        const card = {
            cardType: "logMessage",
            logMessage: `${kickingName} was kicked out by ${kickerName}`,
            type: "MemberKicked",
            profileId: kickingUID,
            timeStamp: Date.now()
        };
        this.sendKickMessageToPlayer(kickingUID)
        await this.sendClanActionCard(kickerUID, cid, card);
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

    /////////////////////////////////// promote/demode/kick handled ////////////////////////////////////


    async sendClanInvalidationAction(cid, clanMembers) {
        const invalidateMessage = {
            action: "CLAN_INVALIDATION",
            messageData: cid
        };
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(invalidateMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async handleSendClanDetailsUpdate(queryParams) {
        const { invalidatorUid, invalidatorName, cid } = queryParams;
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);

        const card = {
            cardType: "logMessage",
            logMessage: `Clan setting has been changed by ${invalidatorName}`,
            type: "ClanUpdate",
            profileId: invalidatorUid,
            timeStamp: Date.now()
        };
        await this.sendClanInvalidationAction(cid, clanMembers);
        await this.sendClanCardFast(invalidatorUid, cid, clanMembers, card);
    }




    async handleJoinedClanByInvite(queryParams) {
        const { joinedUID, invitedPlayerName, joinedPlayerName, cid } = queryParams;
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);

        const card = {
            cardType: "logMessage",
            logMessage: `${joinedPlayerName} joined the Clan, invited by ${invitedPlayerName}`,
            type: "JoinedClanByInvite",
            profileId: joinedUID,
            timeStamp: Date.now()
        };
        await this.sendClanCardFast(joinedUID, cid, clanMembers, card);
    }


    async handleFriendlyBattleResult(queryParams) {
        const { UID1, UID2, winner } = queryParams;
        const userDataArray = await FirestoreManager.getInstance().bulkReadDocuments("Users", "/", [UID1, UID2], { "profileData.userName": 1, "profileData.clanId": 1 , "gameData.carromPass.isPremiumMember" : 1});
        const cid = userDataArray[0].profileData.clanId;
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);

        const card = {
            cardType: "resultFriendlyBattle",
            type: "resultFriendlyBattle",
            playerName1: userDataArray[0].profileData.userName,
            playerName2: userDataArray[1].profileData.userName,
            isPlayer1Premium: userDataArray[0].gameData.carromPass.isPremiumMember,
            isPlayer2Premium: userDataArray[1].gameData.carromPass.isPremiumMember,
            UID1: UID1,
            UID2: UID2,
            winner: winner,
            timeStamp: Date.now()
        };
        await this.sendClanCardFast(UID1, cid, clanMembers, card);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////  clan  ///////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////  Clan War  ///////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async handleClanWarSearch(queryParams) {
        const { searcherUID, searcherName, warId, cid } = queryParams;
        const { clanMembers } = await FirestoreHandler.getClanMembers(cid);

        const card = {
            cardType: "logMessage",
            logMessage: `Clan war search started by ${searcherName}`,
            type: "ClanWarSearch",
            profileId: searcherUID,
            timeStamp: Date.now()
        };
        await this.sendClanInvalidationAction(cid, clanMembers);
        await this.sendClanCardFast(searcherUID, cid, clanMembers, card);
    }


    async sendClanWarInvalidationAction(warId, clanMembers) {
        const invalidateMessage = {
            action: "CLAN_WAR_INVALIDATION",
            messageData: warId
        };
        const message = JSON.stringify({ uids: clanMembers, text: JSON.stringify(invalidateMessage) });
        await this.redisHandler.publish(this.redisHandler.CLAN_MESSAGE_BROADCAST_CHANNEL, message);
    }


    async handleClanWarDone(queryParams) {
        const { warId, cid1, cid2 } = queryParams;
        const clan1 = await FirestoreHandler.getClanMembers(cid1);
        const clan2 = await FirestoreHandler.getClanMembers(cid2);

        await this.sendClanWarInvalidationAction(warId, clan1.clanMembers);
        await this.sendClanWarInvalidationAction(warId, clan2.clanMembers);
    }

    async handleClanWarMatchSuccessful(queryParams) {
        const { warId, cid1, cid2 } = queryParams;
        const clan1 = await FirestoreHandler.getClanMembers(cid1);
        const clan2 = await FirestoreHandler.getClanMembers(cid2);

        await this.sendClanInvalidationAction(cid1, clan1.clanMembers);
        await this.sendClanInvalidationAction(cid2, clan2.clanMembers);
    }

    async handleClanWarOver(queryParams) {
        const { warId, cid1, cid2 } = queryParams;
        const clan1 = await FirestoreHandler.getClanMembers(cid1);
        const clan2 = await FirestoreHandler.getClanMembers(cid2);

        await this.sendClanInvalidationAction(cid1, clan1.clanMembers);
        await this.sendClanInvalidationAction(cid2, clan2.clanMembers);
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////  notification  ///////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async handleSendNotification(queryParams) {
        const { receiverUID, notificationCard, notificationId } = queryParams;
        const notificationMembers = [receiverUID];

        const NotificationActionCard = {
            action: "ADD_CARD_NOTIFICATION",
            messageData: JSON.stringify({
                messageId: notificationId,
                messageCard: notificationCard
            })
        };
        const message = JSON.stringify({ uids: notificationMembers, text: JSON.stringify(NotificationActionCard) });
        await this.redisHandler.publish(this.redisHandler.NOTIFICATION_MESSAGE_BROADCAST_CHANNEL, message);
    }

    async handleInvalidateNotification(queryParams) {
        const { receiverUID, type} = queryParams;
        const notificationMembers = [receiverUID];

        const NotificationActionCard = {
            action: "INVALIDATE_NOTIFICATION",
            messageData: type
        };
        const message = JSON.stringify({ uids: notificationMembers, text: JSON.stringify(NotificationActionCard) });
        await this.redisHandler.publish(this.redisHandler.NOTIFICATION_MESSAGE_BROADCAST_CHANNEL, message);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////  seasonReset  ////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async handleSeasonReset(queryParams) {

        const seasonResetMessage = {
            action: "SEASON_RESET",
            messageData: "reloadApp"
        };
        const message = JSON.stringify({type : "seasonReset", text: JSON.stringify(seasonResetMessage) });
        await this.redisHandler.publish(this.redisHandler.ALL_PLAYERS, message);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////  eventChange  ////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    async handleEventChange(queryParams) {

        const eventChangeMessage = {
            action: "EVENT_CHANGE",
            messageData: "refreshEvents"
        };
        const message = JSON.stringify({type : "eventChange", text: JSON.stringify(eventChangeMessage) });
        await this.redisHandler.publish(this.redisHandler.ALL_PLAYERS, message);
    }




}

module.exports = InternalServerServicesHandler;
