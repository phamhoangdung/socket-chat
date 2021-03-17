//client.js
var io = require('socket.io-client');
var socket = io.connect('http://15.206.161.234:1362', { reconnect: true });
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
    socket.emit('back room', { accountID: 1, commID: 1, messageID: 1 });
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