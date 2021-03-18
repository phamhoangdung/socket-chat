//client.js
var io = require('socket.io-client');
// var socket = io.connect('http://13.233.235.33:1362');
// var socket = io.connect('http://staging.kaspythailand.com/socket',{path:"/socket"});
var socket = io.connect('http://15.206.161.234:1362', { reconnect: false });
console.log(socket);
// var socket = io.connect('http://127.0.0.1:1362', { reconnect: true });
var stdin = process.openStdin();
var moment = require('moment');
stdin.addListener("data", function (d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
    if (d.toString().trim() == "join") {
        socket.emit('join', { commID: '3' });
    }
    var now = new Date();
    var dateStringWithTime = moment(now).format('YYYY-MM-DD HH:mm:ss');
    if (d.toString().trim() == "send") {
        socket.emit('send message', {
            "_id": "123",
            "commID": '3',
            "accountID": 1,
            "message": "testtesttesttesttesttesttest",
            "createdAt": dateStringWithTime,
            "attachment": "test attachments"
        });
    }
});
socket.on('connect_failed', function () {
    if (typeof console !== "undefined" && console !== null) {
        console.log("Connect failed (port " + socket_port + ")");
    }
    return try_other_port();
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
socket.on("join room success", function () {
    console.log('join room success');
});