var io = require('socket.io')(8000);
var http = require('http');
var multiparty = require('multiparty');
var server;
var clients = {};

server = http.createServer(function (request, response) {
    var socketId;

    var data = {},
        accessKey = '',
        event = '',
        room;

    var form = new multiparty.Form();

    form.on('field', function(name, value) {
        if('d' == name) data = JSON.parse(value);
        if('a' == name) accessKey = value;
        if('e' == name) event = value;
        if('r' == name) room = value;
    });

    form.parse(request, function(err) {

        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("success");

        if(!event) return;

        if(accessKey){
            for(socketId in io.sockets.sockets){
                if(io.sockets.sockets[socketId].accessKey != accessKey) continue;
                io.sockets.sockets[socketId].emit(event, data);
            }
        }else if(room){
            io.to(room).emit(event, data);
        }else{
            io.emit(event, data);
        }

    });

}).listen(8001);


io.sockets.on('connection', function (socket) {
    socket.accessKey = '';
    socket.on('register', function (data) {
        socket.accessKey = data.accessKey || '';
    });
    socket.on('join', function (data) {
        socket.join(data.room);
    });
    socket.on('leave', function (data) {
        socket.leave(data.room);
    });

});