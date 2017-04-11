var numPlayersDone = 0; // number of players done in the current phase (planning / arranging)

$(document).ready(function(){
	
    /**
     * Click checkers
     */

	$('.gamelog_button').click(function(){
		$('#gamelog').toggle();
		$('.gamelog_button').toggle();
    });

    // testing purpose only !

    $(document).on('click', '.autoplay_button', function() {
        $('.autoplay_button').toggle();
        players[myID].isBot = !players[myID].isBot;
        autoplay = !autoplay;
    });

    $(document).on('click', '.random_button', function() {
        var temp = [0,1,2,3,4,5];
        shuffle(temp);
        for (i = 0; i < 6; i ++) {
            $('.time_token_drop').eq(temp[i]).append(
                $('#button_area').find('.time_token').first()
            );
        }
        this.remove();
    });
    // end testing section

    $(document).on('click', '.money', function() {
        if (currentPlayer == myID && (activeShop == 0 || phase == 0 || phase == 3)) {
            var index = $('#goods1').children().index( this );
            playerAction(myID, 0, index);
        }
    });

    $(document).on('click', '.flower_token', function() {
        var type = $(this).data('type');
        if (currentPlayer == myID && 
            (activeShop == type || buyFlowerToolToken || phase == 0 || phase == 3)) {
            var index = $('.goods').eq(type).children().index( $(this) );
            playerAction(myID, type, index);
        }
        else if (phase == 4) 
            $(this).toggleClass('chosen');
        else if ($(this).parent().hasClass('.player_vase')) {
            var index = $('#my_vase').children().index( $(this) );
            if (window.confirm('discard this flower token?'))
                players[myID].discardFlowerToken(index);
        }
    });

    $(document).on('click', '.flower_card', function() {
        // take the card
        if (currentPlayer == myID && (activeShop == 4 || phase == 0 || phase == 3)) {
            var index = $('#goods5').children().index( $(this) );
            playerAction(myID, 4, index);
        }
            // select the card to be arranged
        else if (phase == 4 && $(this).parent().is('#my_hand')) {
            if ($(this).hasClass('chosen')) {
                $(this).removeClass('chosen');
            }
            else {
                $('#my_hand').find('.flower_card').removeClass('chosen');
                $(this).addClass('chosen');
            }
        }
        else if ($(this).parent().hasClass('.player_hand')) {
            var index = $('#my_hand').children().index( $(this) );
            if (window.confirm('discard this flower token?'))
                players[myID].discardFlowerCard(index);
        }
    });

     $(document).on('click', '.tool', function() {
        if (currentPlayer == myID && activeShop == 5)
            playerAction(myID, 5, $(this).val());
    });

    $(document).on('click', '.submit_button', function() {
        // return to lobby
        if (gameState == 3) {
            $('#gamelist_lobby').show();
            $('#menu_bar').show();
            $('#game_board').hide();
            $('#gamelog_window').hide();
            socket.emit('leave game');
        } else if (phase == 1) {
            // check if all slots are occupied
            if ($('.time_token_drop div').length == 6) {
                for (i = 0; i < 6; i ++) {
                    players[myID].myPlayedTimeTokens[i] = $('.time_token').eq(i).val();
                }
                isDone = true;
                socket.emit('submit time tokens', {
                    id : myID,
                    timeTokens : players[myID].myPlayedTimeTokens
                });
                
                $('.submit_button').remove();   // *todo - let players undo ?
            }
            else
                alert('add time tokens to all shops!');
        }
        // check if card's requirements are all satisfied
        else if (phase == 4) {
            if ($('#my_hand').find('.chosen').length == 0)
                alert('select a flower card');
            else {
                var cardIndex = $('#my_hand').find('.flower_card')
                    .index(
                        $('#my_hand').find('.chosen').eq(0) 
                    );
                console.log(cardIndex + ' #cards=' + players[myID].hand.length);
                var l = $('#my_vase').find('.chosen').length;
                var ftokens = [];
                var findices = [];
                for (i = 0; i < l; i ++) {
                    // get the index of i-th chosen token, relative to all vases
                    var findex = $('#my_vase').find('.flower_token').index(
                                    $('#my_vase').find('.chosen').eq(i)
                                );
                    ftokens.push(players[myID].vases[findex]);
                    findices.push(findex);
                }

                var r = Number( $('.add_ribbons :selected').val() );

                if (players[myID].hand[cardIndex]
                        .verify(ftokens, r, players[myID].getBonus(0))) {
                    socket.emit('arrange flower', {
                        id : myID,
                        card : cardIndex,
                        indices : findices,
                        ribbons : r
                    });
                }
            }
        }
    });

    $(document).on('click', '.pass_button', function() {
        if (phase <= 3 && currentPlayer == myID)
            playerAction(myID, 0, -1);
        else if (phase == 4) {
            isDone = true;
            $('#my_hand').children().removeClass('chosen');
            $('#my_vase').children().removeClass('chosen');
            addLog('Wait for other players to finish');
            socket.emit('finish arranging');
        }
    });

    /*
    *   socket stuff
    */

    socket.on('new game', function(data) {
        $('#gamelist_lobby').hide();
        $('#menu_bar').hide();
        $('#game_board').show();
        $('#gamelog_window').show();

        $('.autoplay_button').remove();
        var $autoplayOn = $('<button/>').text('Autoplay: On').addClass('autoplay_button').hide();
        var $autoplayOff = $('<button/>').text('Autoplay: Off').addClass('autoplay_button');
        $('#gamelog_window').append($autoplayOn).append($autoplayOff);
        autoplay = false;
        
	    startGame(data);
    });

    // handing out stuff you start the game with
    socket.on('starting stuff recieved', function(data) {
        // assign player bonuses (index randomly generated by server)
        playerBonuses = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];
        
        for (i = 0; i < numPlayers; i ++)
            players[i].bonus = playerBonuses[data.bonuses[i]];

        tieBreak = data.tieBreak;
        boardSetup();	
        
        // add labels on the board
        for (i = 0; i < numPlayers; i ++) {
            var a = data.flowerCards[i];

            // add card component for yourself
            if (myID == i) {
                var $card = $('<div/>').addClass('flower_card');

                // add flower icons
                for(j = 1; j < 4; j ++)
                    for (k = 0; k < a[j-1]; k ++) {
                        $card.append(
                            $("<img/>")
                                .attr('src', 'img/ficon' + j + '.png')
                                .addClass('flower_icon')
                        );
                        // dummy component to store values
                        $card.append(
                            $('<span/>').val(a[j-1])
                        );
                    }

                $card.append($('<br>'));
                // add required quality
                $card.append(
                    $('<div/>')
                        .text(a[3])
                        .addClass('quality_symbol')
                );
                // add score
                $card.append(
                    $('<div/>')
                        .text(a[4])
                        .addClass('score_symbol')
                );
                
                players[i].drawFlowerCard(
                    new flowerCard(a[0], a[1], a[2], a[3], a[4]),
                    $card
                );
            }
            else
                players[i].drawFlowerCard(
                    new flowerCard(a[0], a[1], a[2], a[3], a[4])
                );
        }

        $('#gamelog').empty();
        addLog("*");
        addLog("***** Turn " + turn + "******");
        addLog("*");
        currentPlayer = -1;
        nextPlayer();
    });

    // get the new market from the server
    socket.on('market generated', function(data) {
        newMarket(data);
    });

    // the server tells you to move on to the next phase
    socket.on('to next phase', function(data) {
        $('#button_area').empty();

        switch(data.phase) {
            // from early-bird to planning phase
            case 0: 
                $myTimeTokenButtons = [];
                var mtt = players[myID].getMyTimeTokens();
                // display time tokens to choose in planning phase
                for (i = 0; i < 6; i ++) {
                    $('#button_area').append(
                        $('<div/>').addClass('time_token')
                            .css('background-color', players[myID].color)
                            .attr('draggable', true)
                            .attr('ondragstart', 'drag(event)')
                            .text(timeTokenList[mtt[i]])
                            .val(mtt[i])
                    );
                }
                $('#button_area').append(
                    $('<button/>').addClass('submit_button')
                        .text('Submit')
                ).append(
                    $('<button/>').addClass('random_button')
                        .text('Random')
                );

                addLog("----- planning phase -----");
                if (tutorial)
                    addLog(">> Click on two time tokens on the board to swap");

                // select time tokens for bots in advance !
                if (myID == 0)
                    for (const p in players)
                        if (players[p].isBot) 
                            botChooseTimeTokens(players[p].id);
                phase = 1;

                $('.time_token_area').append(
                    $('<div/>').addClass('time_token_drop')
                        .attr('ondrop', 'drop(event)')
                        .attr('ondragover', 'allowDrop(event)')
                );
                break;

            // from planning to buy phase
            case 1:
                isDone = false;
                $('.time_token_area').empty();
                collectTimeTokens();

                $('#button_area').append(
                    $('<button/>').addClass('pass_button')
                        .text('Pass')
                );

                addLog("------ buy phase ------");
                if (tutorial)
                    addLog(">> On your turn, click on the goods to buy");
                phase = 2;
                activeShop = 0;
                activeTokenOrder = -1;
                $('.shop').eq(0).addClass('active');
                nextPlayer();
                break;

            // from buy to after market phase
            case 2:
                addLog("------ after market phase ------");
                if (tutorial)
                    addLog(">> You may spend 2 action cubes to buy anything");
                $('.time_token_area').empty();
                $('#button_area').append(
                    $('<button/>').addClass('pass_button')
                        .text('Pass')
                );
                phase = 3;
                currentPlayer = -1;
                nextPlayer();
                break;

            // from after market to flower arranging phase
            case 3:
                $('#button_area').append(
                    $('<button/>').addClass('submit_button')
                        .text('Arrange')
                );

                $('#button_area').append(
                    $('<button/>').addClass('pass_button')
                        .text('End phase')
                );

                var $addRibbons = $('<select/>').addClass('add_ribbons');
                $addRibbons.append(
                    $('<option/>').val(0).text('0 ribbon')
                );
                for (i = 1; i < players[myID].numRibbons; i ++)
                    $addRibbons.append(
                        $('<option/>').val(i).text(i + ' ribbons')
                );

                $('#button_area').append($addRibbons);

				addLog("------ arranging phase ------");
				if(tutorial) {
					addLog(">> Select a flower card & flower tokens to arrange");
					addLog(">> or skip phase")
				}

				// arrange flowers for bot in advance !
				if (myID == 0)
					for (const p of players)
						if (p.isBot) {
							botArrangeFlower(p.id);
							socket.emit('finish arranging');
						}
                phase = 4;
                break;

            // from flower arranging phase to next turn (early bird phase)
            case 4:
                isDone = false;
                // see if anyone is eligible for any achievement
                 for (const ac of achievements) {
                        for (i = 0; i < numPlayers; i ++)
                            if (ac.check(tieBreak[i]))
                                players[tieBreak[i]].getAchievementRewards(ac.getRewards());
                    }
                if (checkEndGame()) {
                    gameState = 3;
                    var winner = 0;
                    addLog("------------- ------------- ------------- ");
                    addLog("------------- Final Scoring ---------");
                    addLog("------------- ------------- ------------- ");
                    for (k = 0; k < numPlayers; k ++) {
                        addLog(players[k].username + ' : ' + players[k].score, k);
                        if ((players[k].score > players[winner].score) ||
                            (players[k].score == players[winner].score && tieBreak.indexOf(k) < tieBreak.indexOf(winner)))
                            winner = k;
                    }
                    addLog('||', winner);
                    addLog('||  The winner is  ::: ' + players[winner].username + ' :::', winner);
                    addLog('||', winner);

                    // add miscellaneous info to game log
                    var timeEnd = new Date();
                    var playtime = timeEnd.getTime() - timeStart;
                    addLog("Play Time: " + ('0' + Math.floor(playtime/60000)).slice(-2) + ":" + 
                        ('0' + Math.floor((playtime%60000)/1000)).slice(-2) + " minutes");
                    addLog("Number of turns: " + turn);
                    addLog("--------------------------------------------");
                    addLog("รบกวนตอบแบบสอบถาม เพื่อนำพัฒนาเกมนี้ให้สนุกยิ่งขึ้นครับ");
                    var $feedback = $('<a/>').text("[ลิงค์แบบสอบถาม]")
                        .attr("href", " https://goo.gl/forms/JFXs6f1p2ksIavcH3")
                        .attr("target", "_blank");
                    $('#gamelog').append($feedback);
	                $('#gamelog').scrollTop($('#gamelog')[0].scrollHeight);
                   
                    $('#button_area').append(
                        $('<button/>')
                            .addClass('submit_button')
                            .text('Return to lobby')
                    );

                    // save game info
                    var gameinfo = '';
                    for (k = 0; k < numPlayers; k ++) {
                        gameinfo += 'p' + k + ' s' + players[k].score;
                    }
                    gameinfo += ' turn' + turn;
                    
                    if (myID == 0)
                        socket.emit('game end', {
                            text: gameinfo
                        });
                } 
                else {
                    turn ++;
                    phase = 0;
                    currentPlayer = -1;
                    nextPlayer();

                    addLog("*");
                    addLog("***** Turn " + turn + "******");
                    addLog("*");
                    addLog("----- early-bird phase -----");
                    if (myID == 0)
                        socket.emit('generate market', generateGoods(numPlayers));
                    $('#button_area').append(
                        $('<button/>').addClass('pass_button')
                            .text('Pass')
                    );
                }
                break;
        } // end switch
    });

    socket.on('time tokens submitted', function(data) {
        if (!players[data.id].isBot)
            addLog(players[data.id].username + ' has submitted time tokens', data.id);
        players[data.id].myPlayedTimeTokens = data.timeTokens;
        numPlayersDone ++;
        if (myID == 0 && numPlayersDone >= numPlayers) {
            socket.emit('end phase', {
                phase : 1
            });
            numPlayersDone = 0;
        }
    });

    socket.on('action taken', function(data) {
        takeAction(data.id, data.location, data.index);
    });

    socket.on('flower arranged', function(data) {
        players[data.id].arrangeFlower(data.card, data.indices, data.ribbons);
    });

    socket.on('player finished arranging', function() {
        numPlayersDone ++;
        if (myID == 0 && numPlayersDone >= numPlayers) {
            socket.emit('end phase', {
                phase : 4
            });
            numPlayersDone = 0;
        }
    });

    socket.on('game finished', function() {
        myroom = -1;
        $('#create_room').prop('disabled', false);
    });

    socket.on('save game', function(data) {
        $.ajax({
            type: 'POST',
            url: data.url,
            data: data.text,
            dataType: 'text'
        });
    })
});

/*
*   drag / drop for time tokens
*/

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData('from', $(ev.target).val());
}

function drop(ev) {
    ev.preventDefault();
    var fromVal = ev.dataTransfer.getData('from');
    var tempFrom =  $('.time_token').filter(function() {  return $(this).val() == fromVal;});
    var tempTo;
    // tempTo = time_token_drop of the target
    // so when you drop onto a token, we go up one step instead
    if ($(ev.target).is('.time_token'))
        tempTo = $(ev.target).parent();
    else   
        tempTo = $(ev.target);
    
    // if the target has a time token, move it to the location we picked our token from
    if (! $(ev.target).is(':empty')) {
        $(tempFrom).parent().append($(tempTo).children());
    }

    // then drop the dragged token
    $(tempTo).append(
        $('.time_token').filter(function() {  return $(this).val() == fromVal;})
    );
}