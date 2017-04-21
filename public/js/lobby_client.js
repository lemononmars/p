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


    $('form').submit(function(){
        if ($('#chat_input').val() != '') {
            socket.emit('add chat message', $('#chat_input').val());
            $('#chat_input').val('');
        }
    });

    /**
     * socket and stuff
     */

    // add a newly logged in user

    socket.on('username checked', function(data) {
        if (data.dupe)
            alert('This username has been used already.')
        else if (myusername.length > 8)
            alert('Your username is too long (max=8).')
        else {
            $('#login_page').hide();
            $('#menu_bar').show();
            $('#gamelist_lobby').show();
            $('#chat_box').show();
            $('#chat_messages').append($('<li/>').text('Welcome !'));

            $('#chat_box ul').empty();
            myroom = -1;
            $('#username').text(myusername);
            socket.emit('add user', {
                username: myusername
            });
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
        var $options = $('<div/>');
        var $participants = $('<ul/>')
            .addClass('participants')
            .append($('<li/>')
            .text(data.host));

        // create a bunch of options to customize if you're the host
        if (data.host == myusername) {
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

            $addBots.append( $('<option/>').val(0).text('No bots'));
            for (i = 1; i < 6; i ++)
                $addBots.append(
                    $('<option/>').val(i).text(i + ' bots')
                );

            $options.addClass('room_options')
                .append($deleteButton)
                .append($startButton)
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
            $options.append($joinLeaveRoom);
        }

        $newRoom.addClass('game_room')
        .val(data.roomId)
        .append($options)
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
            filter(function(){return this.value == data.roomId;})
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

        if (Object.keys(data.list).length == 0) {
            $('.game_room')
                .filter(function(){return this.value == data.roomId;})
                .remove();
            if (data.roomId == myroom) {
                myroom = -1;
                $('#create_room').prop('disabled', false);
            }
        }
    });

    socket.on('game started', function(data) {
        var $room = $('.game_room').filter(function(){return this.value == data.roomId;});
        $room.children('div').empty();  // clear option area
    });

    socket.on('errorMessage', function(data) {
        alert(data);
    });

    // chat stuff
    socket.on('chat message added', function(data) {
        var d = new Date();
        var h = ('0' + d.getHours()).slice(-2);
        var m = ('0' + d.getMinutes()).slice(-2);
        var t = '[' + h + ':' + m + ']   ' + data.user + ' : ' + data.message;
        $('#chat_messages').append($('<li/>').text(t));
        $('#chat_messages').scrollTop($('#chat_messages')[0].scrollHeight);
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
    socket.emit('disconnect');
}