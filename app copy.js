const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')({ path: '/socket' }).listen(server);
const port = process.env.PORT || 1362;
var siofu = require("socketio-file-upload");
var fs = require("fs");
const fetch = require('node-fetch');
const Bearer = "Bearer cd q7ni48mbhl4wmt1ci97rukcjqu0fxyx2";

const BASE_URL = 'https://hidden.kaspy.com/rest/V1/additional-api/'

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
            console.log("=========send message data=======", JSON.stringify(data));
            fetch(BASE_URL + 'save-buyer-seller-message/', obj)
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
        console.log("=========back room data=======", JSON.stringify(data));
        fetch(BASE_URL + 'save-seen-message-id', obj)
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
