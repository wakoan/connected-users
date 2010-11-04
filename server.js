var http = require('http');
var url = require('url');
var fs = require('fs');
var io = require('./socket.io');

// TODO this is nginx task
server = http.createServer(function(req, response){
    var path = url.parse(req.url).pathname;
    if(path == '/'){
      path = '/users.html';
    }
    if(path == '/users.html' || path == '/json.js'){
      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(response);

        response.writeHead(200, {
          'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'
        });

        response.write(data, 'utf8');
        response.end();
      }); 
    }else{
      send404(response);
    };
});

send404 = function(response){
	response.writeHead(404);
	response.write('404');
	response.end();
};

// Start Server
server.listen(8080);
var socket = io.listen(server);

var logins = {};

socket.on('connection', function(client){
  // Send all users to client
  var sessionId = client.sessionId;
  logins[sessionId] = sessionId;
  client.send({ action:'init', users: logins, currentUser: sessionId});

  // Send all users information about new user
  client.broadcast({user: sessionId, action: 'connected' });
 
  client.on('message', function(message) {
    if('login' == message.action){
      client.broadcast({
          action: 'rename', sessionId: sessionId, 
          oldName: logins[sessionId], newName:message.login
      });
      logins[sessionId] = message.login;
    }
  });

  client.on('disconnect', function() { 
    client.broadcast({user: sessionId, action: 'disconnected', login:logins[sessionId]});
    logins[sessionId] = null;
  });
});
