const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3001;
var siofu = require("socketio-file-upload");
var fs = require("fs");

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(path.join(__dirname, 'public')));


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
});