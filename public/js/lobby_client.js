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
        socket.emit('delete room', {roomId: $(this).val()});
    });

    $(document).on('click', '.join_leave_room', function() {
        var id = $(this).val();
        if (myroom == -1) {
            $(this).text("Leave");
            socket.emit('join room', {roomId: id});
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
        socket.emit('start game', {numBots : numBots});
    });

    $(document).on('click', '#log_out', function() {
        logOut();
    });

    /**
     * socket and stuff
     */

    // add a newly logged in user
    socket.on('user added', function(data) {
        $('#online_users ul').append(
            $('<li/>').text(data.username)
        );
    });

    // remove a user who just disconnected
    socket.on('user disconnected', function(data) {
        $('#online_users ul li').filter(function(){return this.text() ===  data.username;}).remove();
    });

    // create a new room
    socket.on('room created', function(data) {
        var $newRoom = $('<div/>');
        var $buttonArea = $('<div/>');
        var $participants = $('<ul/>')
            .append($('<li/>')
            .text(data.host));

        if (data.host === myusername) {
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
        } else {
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
    socket.on('user joined', function(data) {
        var $newJoinedUser = $('<li/>').text(data.username);
        $('.game_room').filter(function(){return this.value === data.roomId;})
        .children("ul")
        .append($newJoinedUser);
        if (data.username === myusername)
            $('#create_room').prop('disabled', true);
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
    $('#login_page').hide();
    $('#menu_bar').show();
    $('#gamelist_lobby').show();
    $('#chat_box').show();

    myroom = -1;
    myusername = $('#input_username').val();
    $('#username').text(myusername);
    socket.emit('add user', {username: myusername});
}

// lobby > log in page
function logOut() {
    $('#login_page').show();
    $('#menu_bar').hide();
    $('#gamelist_lobby').hide();
    $('#chat_box').hide();
}