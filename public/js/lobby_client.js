var socket = io();
var myroom;

$(document).ready(function(){
	
    /**
     * click checkers
     * not to be confused with cookie clickers
     */
    
    $('.chat_toggle_button').click(function() {
        $('#chat_messages').toggle();
        $('.chat_toggle_button').toggle();
    })

    $('#create_room').click(function() {
        if (myroom == -1) 
            socket.emit('create room');
        else
            console.log("you are already in a room!");
    });

    $(document).on('click', '.delete_room', function() {
        socket.emit('delete room', {
            roomId: $(this).val()
        });
    });

    $(document).on('click', '.join_leave_room', function() {
        var id = $(this).val();
        console.log(id, myroom);
        if (myroom == -1) {
            $(this).text("Leave");
            socket.emit('join room', {
                roomId: id
            });
        }
        else if (myroom == id) {
            
            $(this).text("Join");
            socket.emit('leave room');
        }
        else
            console.log("you are already in a room !");
    });

    $(document).on('click', '.start_game', function() {
        var numBots = $('#add_bots :selected').val();
        socket.emit('start game', numBots);
    });

    $(document).on('click', '#log_out', function() {
        socket.emit('disconnect');
        logOut();
    });

    /**
     * socket and stuff
     */

    // add a newly logged in user

    socket.on('username checked', function(data) {
        if (!data.dupe) {
            $('#login_page').hide();
            $('#menu_bar').show();
            $('#gamelist_lobby').show();
            $('#chat_box').show();

            myroom = -1;
            $('#username').text(myusername);
            socket.emit('add user', {
                username: myusername
            });
        }
        else {
            alert('This username has been used already.');
        }
    });

    socket.on('update user list', function(data) {
        $('#online_users ul').empty()
        for (name in data.list)
            $('#online_users ul').append(
                $('<li/>').text(name)
            );
    });

    // create a new room
    socket.on('room created', function(data) {
        var $newRoom = $('<div/>');
        var $buttonArea = $('<div/>');
        var $participants = $('<ul/>')
            .append($('<li/>')
            .text(data.host));

        // create a bunch of options to customize if you're the host
        if (data.host === myusername) {
            myroom = data.roomId;
            var $deleteButton = $('<button/>')
                .text('Delete')
                .addClass('delete_room')
                .val(data.roomId);
            var $startButton = $('<button/>')
                .text('Start')
                .addClass('start_game')
                .val(data.roomId);
            var $addBots = $('<select/>').attr('id', 'add_bots');

            for (i = 0; i < 6; i ++)
                $addBots.append(
                    $('<option/>').val(i).text(i)
                );

            $buttonArea.append($deleteButton)
                .append($startButton)
                .append($('<p/>').text('#bots'))
                .append($addBots);
            
            $('#create_room').prop('disabled', true);
            myroom = data.roomId;
        }
        // otherwise, create only "join/leave" button 
        else {
            var $joinLeaveRoom = $('<button/>')
                .text('Join')
                .addClass('join_leave_room')
                .val(data.roomId)
            $buttonArea.append($joinLeaveRoom);
        }

        $newRoom.addClass('game_room')
        .val(data.roomId)
        .append($buttonArea)
        .append($participants);

        $('#open_rooms').append($newRoom);
    });

    // delete a room
    socket.on('room deleted', function(data) {
        $('.game_room')
            .filter(function(){return this.value == data.roomId;})
            .remove();
        if (data.roomId == myroom) {
            myroom = -1;
            $('#create_room').prop('disabled', false);
        }
    });

    // add a user to a room
    socket.on('update room', function(data) {
        var list = $('.game_room').
        filter(function(){return this.value === data.roomId;})
        .children("ul");
        
        list.empty();
        for (name in data.list)
            list.append($('<li/>').text(name));

        if (data.username == myusername) {
            // this means you just left the room
            if (myroom == data.roomId) {
                $('#create_room').prop('disabled', false);
                myroom = -1;
            }
            // here, you just entered the room
            else{
                $('#create_room').prop('disabled', true);
                myroom = data.roomId;
            }
        }
    });

    // remove a user from a room
    socket.on('user left', function(data) {
        var $room = $('.game_room').filter(function(){return this.value == data.roomId;});
        $room.children('ul li')
            .filter(function(){return this.text ===  data.username;})
            .remove();
    });

    socket.on('errorMessage', function(data) {
        alert(data.errorText);
    });
});

// log in page > lobby
function enterLobby() {
    myusername = $('#input_username').val();
    socket.emit('check username', myusername);
}

// lobby > log in page
function logOut() {
    $('#login_page').show();
    $('#menu_bar').hide();
    $('#gamelist_lobby').hide();
    $('#chat_box').hide();
}