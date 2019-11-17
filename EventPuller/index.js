const axios = require('axios');
const { Pool, Client } = require("pg");

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
    let result = '[' + jsonString.substr(0, jsonString.length - 2) + ']';
    return JSON.parse(result);
}

const hello = async (event) => {
    let notifications = await notificationPuller();
    // let notifications = 
    let validJsonEvents = validateJSON(notifications)

    const pgPool = new Pool({
        host: 'pg-7d61f7-lecungdinh-7cdc.aivencloud.com',
        port: 21510,
        database: 'junction19',
        user: 'avnadmin',
        password: 'vvodeuqhtjda0zmz',
        ssl: true
    });
    const poolClient = await pgPool.connect();
    // validJsonEvents.forEach(async (container) => {
    //     let notiList = container.notifications;
    //     notiList.forEach(async (item) => {
    //         let query =
    //             `
    //             INSERT INTO notifications("notifiedAt", x, y, "floorNum", latitude, longitude)
    //             VALUES($1, $2, $3, $4, $5, $6)
    //             `
    //         try {
    //             await poolClient.query(query, [
    //                 item.lastSeen, item.locationCoordinate.x, item.locationCoordinate.y, item.hierarchyDetails.floor.name, item.geoCoordinate.latitude, item.geoCoordinate.longitude
    //             ]);
    //         }
    //         catch (error) {
    //             console.log("Error insert to DB:", error);
    //             poolClient.release();
    //             pgPool.end()
    //         }
    //     })
    // })

    const promise = validJsonEvents.map(async (container) => {
        let notiList = container.notifications;
        let subpromise = notiList.map(async (item) => {
            let query =
                `
                INSERT INTO notifications("notifiedAt", x, y, "floorNum", latitude, longitude)
                VALUES($1, $2, $3, $4, $5, $6)
                `
            try {
                await poolClient.query(query, [
                    item.lastSeen, item.locationCoordinate.x, item.locationCoordinate.y, item.hierarchyDetails.floor.name, item.geoCoordinate.latitude, item.geoCoordinate.longitude
                ]);
            }
            catch (error) {
                console.log("Error insert to DB:", error);
                poolClient.release();
            }
        })

        await Promise.all(subpromise)
    })

    await Promise.all(promise);
    pgPool.end();

    return {
        statusCode: 200,
        body: 'Success'
    };
}

hello();