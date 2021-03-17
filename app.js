const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 1362;
var siofu = require("socketio-file-upload");
var fs = require("fs");
const fetch = require('node-fetch');
const Bearer = "Bearer 73c6s0ych2x51rrpftk3ifd9j76mikvt";
var serviceAccount = require('../keys/' + process.env.KEYNAME);
const admin = require("firebase-admin");

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(path.join(__dirname, 'public')));

app.use("/", (req, res) => {
    res.send("OK")
})

var roomUsers = {};
var customerRoom = "customerRoom";
var adminRoom = "adminRoom";
// app.use('/', function () {
//     console.log("listening");
// });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://vietsumedia-ac02f.firebaseio.com"
})
exports.sendNotification = function (token, title, content, data) {
    console.log(token);
    return new Promise(async function (resolve, reject) {
        try {
            const msg = {
                notification: { title: title, body: content },
                tokens: token,
                data: data,
                // data: {
                //     // 'click_action': 'FLUTTER_NOTIFICATION_CLICK',
                //     ...data
                //     // 'image_url': JSON.stringify(arr),
                //     // 'current': rdm.toString(),
                //     // 'scripture_id': _idScripture.toString()
                // },
                apns: {
                    headers: {
                        'apns-priority': '10',
                    },
                    payload: {
                        aps: {
                            sound: 'default',
                        }
                    },
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                    }
                },
            }
            admin.messaging().sendMulticast(msg)
                .then(response => {
                    console.log(response);
                    if (response.responses[0].success) {
                        resolve({ status: true, msg: "send notification success", result: response });
                    } else {
                        reject({ status: false, msg: "send notification fails" });
                    }
                })
        } catch (error) {
            console.log(error);
            reject({ status: false, msg: "send notification fails", error: error.message });
        }
    })
}

io.on('connection', function (socket) {
    console.log("connection");
    console.log(socket.id);
    var uploader = new siofu();

    // Do something when a file is saved:
    uploader.on("saved", function (event) {
        console.log(event.file);
        event.file.clientDetail.fileName = event.file.name;
    });

    // Error handler:
    uploader.on("error", function (event) {
        console.log("Error from uploader", event);
    });

    uploader.uploadValidator = function (event, callback) {
        fs.mkdir("pub/media/chatsystem/attachments", function (err, folder) {
            if (err) {
                if (err.code == "EEXIST") {
                    uploader.dir = err.path;
                    callback(true);
                } else {
                    callback(false); // abort
                }
            } else {
                uploader.dir = folder;
                callback(true); // ready
            }
        });
    };

    uploader.listen(socket);

    socket.on("newUserConneted", function (details) {
        if (details.sender === "admin") {
            var index = details.sender + "_" + details.adminId;
            roomUsers[index] = socket.id;
        } else if (details.sender === "customer") {
            var index = details.sender + "_" + details.customerId;
            roomUsers[index] = socket.id;
            Object.keys(roomUsers).forEach(function (key, value) {
                if (key === "admin_" + details.receiver) {
                    receiverSocketId = roomUsers[key];
                    socket.broadcast.to(receiverSocketId).emit("refresh admin chat list", details);
                }
            });
        }
    });

    socket.on("newCustomerMessageSumbit", function (data) {
        var isSupportActive = true;
        if (typeof (data) !== "undefined") {
            Object.keys(roomUsers).forEach(function (key, value) {
                if (key === "admin_" + data.receiver) {
                    isSupportActive = true;
                    receiverSocketId = roomUsers[key];
                    socket.broadcast.to(receiverSocketId).emit("customerMessage", data);
                }
            });
            if (!isSupportActive) {
                receiverSocketId = roomUsers["customer_" + data.sender];
                socket.broadcast.to(receiverSocketId).emit("supportNotActive", data);
            }
        }
    });

    socket.on("newAdminMessageSumbit", function (data) {
        if (typeof (data) !== "undefined") {
            Object.keys(roomUsers).forEach(function (key, value) {
                if (key === "customer_" + data.receiver) {
                    receiverSocketId = roomUsers[key];
                    socket.broadcast.to(receiverSocketId).emit("adminMessage", data);
                }
            });
        }
    });

    socket.on("updateStatus", function (data) {
        var isSupportActive = true;
        if (typeof (data) !== "undefined") {
            Object.keys(roomUsers).forEach(function (key, value) {
                if (key === "admin_" + data.receiver) {
                    receiverSocketId = roomUsers[key];
                    socket.broadcast.to(receiverSocketId).emit("customerStatusChange", data);
                }
            });
        }
    });

    socket.on("admin status changed", function (data) {
        if (typeof (data) !== "undefined") {
            Object.keys(roomUsers).forEach(function (key, value) {
                Object(data.receiverData).forEach(function (k) {
                    if (key === "customer_" + k.customerId) {
                        receiverSocketId = roomUsers[key];
                        socket.broadcast.to(receiverSocketId).emit("adminStatusUpdate", data.status);
                    }
                });
            });
        }
    });
    socket.on("join", (data) => {
        console.log("=============join===", data);
        if (data.commID.length > 0) {
            console.log(data);
            socket.join(data.commID);
            socket.emit("join room success");
        } else
            socket.emit("notification", { msg: "comId is null" });
    });
    socket.on("leave", (data) => {
        console.log("=============leave===", data);
        if (data.commID.length > 0) {
            socket.leave(data.commID);
            socket.emit("leave room success");
        } else
            socket.emit("notification", { msg: "comId is null" });
    });
    socket.on("send message", (data) => {
        console.log(data.headers);
        console.log(data);
        let { commID, accountID, message, createdAt, attachment } = data;
        console.log(commID);
        if (commID != null) {
            socket.broadcast.to(commID.toString()).emit("new message", data);
            var obj = {
                method: 'POST',
                headers: {
                    'Authorization': Bearer,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }
            fetch('https://staging.kaspythailand.com/rest/V1/additional-api/save-buyer-seller-message/', obj)
                .then(function (result) {
                    console.log(result);
                    if (result.status == 200 && result.statusText) {
                        socket.emit("send message success");
                    } else {
                        socket.emit("send message fail");
                    }
                })
        } else
            socket.emit("notification", { msg: "comId is null" });

    });
    socket.on("back room", (data) => {
        var obj = {
            method: 'POST',
            headers: {
                'Authorization': Bearer,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }
        fetch('https://staging.kaspythailand.com/rest/V1/additional-api/save-seen-message-id', obj)
            .then(function (result) {
                console.log(result);
                if (result.status == 200 && result.statusText) {
                    socket.emit("send message success");
                } else {
                    socket.emit("send message fail");
                }
            })
    })
    socket.on('disconnect', (reason) => {
        console.log(reason);
    });
});
