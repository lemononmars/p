var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
   cors: {
       origin: "http://localhost:8100",
       methods: ["GET", "POST"],
       transports: ['websocket', 'polling'],
       credentials: true
   },
   allowEIO3: true
});
var port = process.env.PORT || 8000;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/main.html');
});

server.listen(port, function(){
  console.log('listening on *:' + port);
});

// variables for gamelist lobby
var onlineUsers = {};
var gameRooms = {};
var activeGames = {};
var gameRoomId = 0; // use hashtable instead of increment ?
var userId = 0;

io.on('connection', function(socket){
  var addedUser = false;
  /*
   *  game list lobby 
   */ 

  // check if the username has been claimed already
  socket.on('check username', function(data) {
    console.log("checking username");
    socket.emit('username checked', {
      dupe : (data in onlineUsers)
    });
  });

  // add a new user who just logged in
  socket.on('add user', function(data) {
    addedUser = true;
    var username = data.username;

    onlineUsers[username] = {};
    socket.username = username;
    socket.room = -1;
    socket.userId = userId++;
    io.emit('update user list', {
      list : onlineUsers
    });

    io.emit('chat message added', {
      user : username + ' has logged in',
      message : ''
    });
    for (r in gameRooms) {
      socket.emit('room created', {
        roomId : r,
        host: Object.keys(gameRooms[r])[0]
      })
    }
  });

  // disconnect a user
  socket.on('disconnect', function(){
    if (addedUser) {
      delete onlineUsers[socket.username];
      addedUser = false;
      io.emit('update user list', {
        list : onlineUsers
      });
      // remove the user from the room she/he was in
      if (socket.room > -1) {
        socket.leave(socket.room);
        delete gameRooms[socket.room][socket.username];
        if (Object.keys(gameRooms[socket.room]).length == 0)
          delete gameRooms[socket.room];
        io.emit('update room', {
          list : gameRooms[socket.room],
          username : socket.username,
          roomId : socket.room
        });
      }
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

  // join a game room
  socket.on('join room', function(data) {
    socket.room = data.roomId;
    socket.join(socket.room);
    gameRooms[socket.room][socket.username] = {};
    io.emit('update room', {
      list : gameRooms[socket.room],
      username : socket.username,
      roomId : socket.room
    });
  });

  // leave the room you joined
  socket.on('leave room', function(data) {
    if (socket.username in gameRooms[socket.room]) {
      socket.leave(socket.room);
      delete gameRooms[socket.room][socket.username];
      io.emit('update room', {
        list : gameRooms[socket.room],
        username : socket.username,
        roomId : socket.room
      });
      socket.room = -1;
    }
  });

  // add a chat message
  socket.on('add chat message', function(data){
    io.emit('chat message added', {
      message : data,
      user : socket.username
    });
  });

  // game sutaato !
  socket.on('start game', function(data) {
    var numBots = Number(data);
    var numPlayers = Object.keys(gameRooms[socket.room]).length;
    // check if the number of players is valid (2-6)
    if (numPlayers + numBots > 1 && numPlayers + numBots < 7) {

      var plist = []; // list of players
      for (const player in gameRooms[socket.room])
        plist.push(player);

      io.in(socket.room).emit('new game', {
        gameId : socket.room, 
        players : plist,
        numBots : numBots
      });

      io.emit('game started', {
        roomId : socket.room
      });
    }
    else{
      var errorText = (numPlayers + numBots <= 1) ? 'Not enough players' : 'Too many players';
      socket.emit('errorMessage', errorText);
    }
  });

  socket.on('leave game', function() {
    socket.room = -1;
  });

  /*
   * socket for in game stuff
   */

  socket.on('give starting stuff', function(data) {
    io.in(socket.room).emit('starting stuff recieved', data);
  });

  socket.on('generate market', function(data) {
    io.in(socket.room).emit('market generated', data);
  });

  socket.on('end phase', function(data) {
    io.in(socket.room).emit('to next phase', data);
  });

  socket.on('submit time tokens', function(data) {
    io.in(socket.room).emit('time tokens submitted', data);
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

  socket.on('game end', function(data) {
    io.in(socket.room).emit('game finished');
    delete gameRooms[socket.room];
    io.emit('room deleted', {
        roomId : socket.room
    });
    socket.emit('save game', {
      url : __dirname + '/save.txt',
      text: data.gameinfo
    });
   
   socket.on('toggle autoplay', function(data) {
     io.in(socket.room).emit('autoplay toggled', data);
   });

  });
});
