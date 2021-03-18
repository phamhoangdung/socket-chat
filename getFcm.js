var request = require('request');
const notificationModel = require('../models/notification');
var firebase = require('./firebase_admin');
exports.getFcmToken = (value) => {
    return new Promise(async function (resolve, reject) {
        // return new Promise(async function (resolve, reject) {
        try {
            let { id, title, content, data, type, action, post_id, sender_id } = value;
            var options = {
                'method': 'GET',
                'url': process.env.URL_API,
                'headers': {
                    'Authorization': 'Bearer ryff45ubbr01l91o5v6u9jjbfn6drqkm',
                }
            };
            request(options, function (error, response) {
                if (error) {
                    console.log(error);
                    // return;
                    reject({ status: false, msg: "get fcm_token false", error: error.message });
                    return;
                }
                console.log(response.body);
                let body = JSON.parse(response.body)
                if (body.items.length > 0 && body.items[0].custom_attributes != undefined) {
                    let custom_attributes = body.items[0].custom_attributes;
                    let fcm_token = custom_attributes.find((element) => {
                        console.log(element.attribute_code);
                        return element.attribute_code == "fcm_token";
                    })
                    console.log(fcm_token);
                    if (fcm_token) {
                        firebase.sendNotification([fcm_token.value], title, content, data).then(async (result) => {
                            let newNoti = new notificationModel({
                                customer_id: id,
                                title: title,
                                content: content,
                                type: type,
                                action: action,
                                post_id: post_id,
                                sender_id: sender_id != null ? sender_id : "",
                            })
                            console.log("new message notification", newNoti);
                            await newNoti.save();
                            resolve({ status: true, msg: "success", data: result });
                        }).catch((error) => {
                            console.log(error);
                            reject({ status: false, msg: error.message });
                        });
                    } else { console.log("fcm_token not found"); reject({ status: false, msg: "fcm_token not found" }); }
                } else { console.log("items empty"); reject({ status: false, msg: "items empty" }); }
                // reject({ status: false, msg: "fcm_token not found" })
            });
        } catch (error) {
            console.log(error);
            reject({ status: false, msg: "get fcm_token false", error: error.message });
        }
    })
}