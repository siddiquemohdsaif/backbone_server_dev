const ClanServiceHandler = require('./ClanServiceHandler');
const NotificationServiceHandler = require('./NotificationServiceHandler');

class InternalServerServicesHandler {

    constructor(redisHandler) {
        this.clanServiceHandler = new ClanServiceHandler(redisHandler);
        this.notificationServiceHandler = new NotificationServiceHandler(redisHandler);
    }

    async handle(ws, queryParams) {
        const callType = queryParams['callType'];
        try {
            // Clan related calls
            if ([
                "sendClanJoinedRequest", "actionJoinedRequest", "joinedClan", "LeftClan", 
                "promoteMember", "demoteMember", "kickMember", "sendClanDetailsUpdate", 
                "joinedClanByInvite", "friendlyBattleResult"
            ].includes(callType)) {
                await this.clanServiceHandler.handle(ws, queryParams);
            }
            
            // Notification related calls
            else if (["sendNotification"].includes(callType)) {
                await this.notificationServiceHandler.handle(ws, queryParams);
            }

            // Any other cases or defaults
            else {
                ws.close(4490, 'failed1'); // Unhandled callType
            }
        } catch (e) {
            ws.close(4490, 'failed2' + e.message);
        }
    }
    
    // If there were any other methods that were not specific to clans or notifications in the original class,
    // you can place them here. For now, it seems all methods were related to either clans or notifications,
    // so I've left this section empty.

}

module.exports = InternalServerServicesHandler;
