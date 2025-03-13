class NotificationServiceHandlers {

    constructor(redisHandler) {
        this.redisHandler = redisHandler;
    }

    async handleNotificationActions(callType, queryParams, ws) {
        switch (callType) {
            case "sendNotification":
                await this.handleSendNotification(queryParams);
                ws.send("send Notification message successfully");
                ws.close(4390, 'success');
                break;
            // ... add other notification related cases here if needed
        }
    }

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

    // ... add other notification related functions here if needed
}

module.exports = NotificationServiceHandlers;
