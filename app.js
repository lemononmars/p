var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/main.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

// variables for gamelist lobby
var onlineUsers = {};
var gameRooms = {};
var activeGames = {};
var gameRoomId = 0; // use hashtable instead of increment ?
var playerId = 0;

// variables for game
var playerColors = ["aquamarine", "bisque", "coral", "darkseagreen", "peru", "lightcyan"];


io.on('connection', function(socket){
  var addedUser = false;

  /*
   *  game list lobby 
   */ 

  // add a new user who just logged in
  socket.on('add user', function(data) {
    addedUser = true;
    var username = data.username;

    onlineUsers[username] = {};
    socket.username = username;
    socket.room = -1;
    socket.broadcast.emit('user added', {
      username: username,
    });

    for (p in onlineUsers)
      socket.emit('user added', {
        username: p
      });
    for (r in gameRooms) {
      socket.emit('room created', {
        roomId : r,
        host: Object.keys(gameRooms[r])[0]
      })
    }
  });

  // disconnect a user
  socket.on('disconnect', function(data){
    if (addedUser) {
      delete onlineUsers[socket.username];
      io.emit('user disconnected', {
        username: socket.username,
      });
    }
  });

  // create a new game room
  socket.on('create room', function() {
    var room = gameRoomId;
    socket.room = room;
    socket.join(room);

    if (!(room in gameRooms))
      gameRooms[room] = {};
    
    gameRooms[room][socket.username] = {};
    io.emit('room created', {
      roomId : room, 
      host : socket.username
    });
    gameRoomId++;
  });

  // delete the room you host
  socket.on('delete room', function(data) {
    if (socket.room in gameRooms) {
      delete gameRooms[socket.room];
      io.emit('room deleted', {
        roomId : socket.room
      });
    }
  });

  // join other's game room
  socket.on('join room', function(data) {
    socket.room = data.roomId;
    socket.join(data.roomId);
    gameRooms[data.roomId][socket.username] = {};
    io.emit('user joined', {
      username: socket.username, 
      roomId : data.roomId
    });
  });

  // leave the room you joined
  socket.on('leave room', function(data) {
    if (socket.username in gameRooms[socket.room]) {
      socket.leave(socket.room);
      delete gameRooms[socket.room][data.username];
      io.emit('user left', {
        username: data.username, 
        roomId : socket.room
      });
      socket.room = -1;
    }
  });

  // add a chat message
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  // game sutaato !
  socket.on('start game', function(data) {
   
    var numBots = Number(data.numBots);
    var numPlayers = Object.keys(gameRooms[socket.room]).length;
    console.log(numBots + numPlayers);
    // the game hosts 2-6 players
    if (numPlayers + numBots > 1 && numPlayers + numBots < 7) {
      console.log('game #' + socket.room + ' starts !!!');

      var plist = []; // list of players
      for (const player in gameRooms[socket.room])
        plist.push(player);
      
      activeGames[socket.room] = gameRooms[socket.room];
      delete gameRooms[socket.room];

      io.in(socket.room).emit('new game', {
        gameId : socket.room, 
        players : plist,
        numBots : numBots
      });

      io.emit('room deleted', {
        roomId : socket.room
      });
    }
    else{
      socket.emit('errorMessage', {
        errorText : numPlayers + numBots > 1 ? "Not enough players" : "Too many playesr"
      });
    }
  });

  socket.on('leave game', function() {
    socket.room = -1;
  });
  // socket for in game stuff

  socket.on('give starting stuff', function(data) {
    io.in(socket.room).emit('starting stuff recieved', data);
  });

  socket.on('generate market', function(data) {
    io.in(socket.room).emit('market generated', data);
  });

  socket.on('submit time tokens', function(data) {
    io.in(socket.room).emit('time tokens submitted', {
      id : data.id,
      timeTokens : data.timeTokens
    })
  });

  socket.on('tokens ready', function() {
    io.in(socket.room).emit('to buy phase');
  });

  socket.on('take action', function(data) {
    // send to all except sender
    socket.broadcast.to(socket.room).emit('action taken', data);  
  });

  socket.on('arrange flower', function(data) {
    io.in(socket.room).emit('flower arranged', data);
  })

  socket.on('finish arranging', function() {
    io.in(socket.room).emit('player finished arranging');
  })

  socket.on('to next turn', function() {
    io.in(socket.room).emit('next turn');
  });
});
