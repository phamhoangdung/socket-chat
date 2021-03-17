//client.js
var io = require('socket.io-client');
var socket = io.connect('http://150.95.113.87:3001/chatroom');
var stdin = process.openStdin();

stdin.addListener("data", function (d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 

    // if (d.toString().trim() == "join") {
    //     socket.emit('join', { commID: 2 });
    // }
    // if (d.toString().trim() == "send") {
    //     socket.emit('send message', {
    //         "commID": 2,
    //         "accountID": 1,
    //         "message": "test",
    //         "createdAt": "2021-01-22",
    //         "attachment": "test attachments"
    //     });
    // }
    socket.emit('join-room', { roomId: "60217fcebb40d90b3f619655", userId: "294" });
    // socket.emit('start match', { match_id: d.toString().trim() });
    // socket.emit('ready', { match_id: "6007dca0d6869156057f4871", player_id: "5ffc7505d475ed04440f580c", status: false, changeStatus: true });
    // socket.emit('start match', d.toString().trim());
});
// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});

socket.on('new message', function (result) {
    console.log('new message');
    console.log(result);
});
socket.on('send message success', function () {
    console.log('send message success');
});
// Add a connect listener
socket.on("have been kicked", function () {
    console.log('have been kicked');
});
socket.on("notification", function (data) {
    console.log(data);
});
socket.on("refresh", function (data) {
    console.log(data);
});
socket.on("addMessage", function (data) {
    console.log(data);
});