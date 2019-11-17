'use strict';

const axios = require("axios");
const { Client } = require("pg");

exports.hello = async (event) => {
    let notifications = await notificationPuller();
    let validJsonEvents = validateJSON(notifications)

    const pgClient = new Client();
    await pgClient.connect();
    const promise = validJsonEvents.map(async (container) => {
        let notiList = container.notifications;
        let subpromise = notiList.map(async (item) => {
            let query =
                `
                INSERT INTO notificationsdev("notifiedAt", x, y, "floorNum", latitude, longitude, "deviceId")
                VALUES($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT ON CONSTRAINT notificationsdev_devicedId_unique
                DO UPDATE SET
                    "notifiedAt" = $1,
                    x = $2,
                    y = $3,
                    "floorNum" = $4,
                    latitude = $5,
                    longitude = $6
                WHERE notificationsdev."deviceId" = $7
                `
            try {
                await pgClient.query(query, [
                    item.lastSeen,
                    item.locationCoordinate.x,
                    item.locationCoordinate.y,
                    item.hierarchyDetails.floor.name,
                    item.geoCoordinate.latitude,
                    item.geoCoordinate.longitude,
                    item.deviceId
                ]);
            }
            catch (error) {
                console.log("Error insert to DB:", error);
                pgClient.end();
            }
        })

        await Promise.all(subpromise)
    })

    await Promise.all(promise);
    pgClient.end();

    return {
        statusCode: 200,
        body: 'Success'
    };
}


async function notificationPuller() {
    const aaltoURL = 'http://13.48.149.61:8000/notifycache.json'
    try {
        const response = await axios.get(aaltoURL);
        return response.data
    } catch (error) {
        return error
    }
}

function validateJSON(jsonString) {
    let result = '[' + jsonString.substring(0, jsonString.length - 2) + ']';
    return JSON.parse(result);
}