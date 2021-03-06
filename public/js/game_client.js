var numPlayersDone = 0; // number of players done in the current phase (planning / arranging)

$(document).ready(function(){
	
    /**
     * Click checkers
     */

	$('.gamelog_button').click(function(){
		$('#gamelog').height( 500 - $('#gamelog').height() );
		$('.gamelog_button').toggle();
    });

    $(document).on('click', '.button--expand_achievement', function () {
        var newPos = $('#achievement_area--large').css('bottom') === '0px' ? '-350px': '0px';
        $('#achievement_area--large').css('bottom', newPos);
    });

    $(document).on('click', '.button--expand_tool', function() { 
        var newPos = $('#tool_lookup').css('right') === '0px' ? '-400px': '0px';
        $('#tool_lookup').css('right', newPos);
    });

    $(document).on('click', '.button--language_toggle', function() { 
        language = (language === 'EN') ? 'TH': 'EN';
        $('.button--language_toggle').toggle();
    });

    $(document).on('click', '.button--expand_opponent_board', function() {
        $('#game_info').slideToggle();
        $('.lower_opponent_board').slideToggle();
    });
    // testing purpose only !

    $(document).on('click', '.autoplay_button', function() {
        $('.autoplay_button').toggle();
        players[myID].isBot = !players[myID].isBot;
        autoplay = !autoplay;
        socket.emit('toggle autoplay', {
            id : myID,
            newStatus: players[myID].isBot
        });
    });

    $(document).on('click', '.random_button', function() {
        var temp = [0,1,2,3,4,5];
        shuffle(temp);
        for (i = 0; i < 4; i ++) {
            $('.time_token_drop').eq(temp[i]).append(
                $('#button_area').find('.time_token').first()
            );
        }
        this.remove();
    });
    // end testing section

    $(document).on('click', '.money', function() {
        if (currentPlayer == myID 
                && (activeShop == 0 || phase == 0 || phase == 3)) {
            var index = $('#goods1').children().index( this );
            playerAction(myID, 0, index);
        }
    });

    $(document).on('click', '.flower_token', function() {
        var type = $(this).data('type');
        // buy the token
        if (currentPlayer == myID
                &&(activeShop == type || buyFlowerToolToken || phase == 0 || phase == 3)
                && $(this).parent().hasClass('goods')) {
            var index = $('.goods').eq(type).children().index( $(this) );
            playerAction(myID, type, index);
        }
        else if ($(this).parent().hasClass('player_vase')) {
            // select the token during arranging phase
            if (phase == 4)
                $(this).toggleClass('chosen');
            // discard the token during other phases
            else if (phase == 0 || phase == 2 || phase == 3) {
                var index = $('#my_vase').children().index( $(this) );
                if (window.confirm('discard this flower token?'))
                    players[myID].discardFlowerToken(index);
            }
        }
    });

    $(document).on('click', '.flower_card', function() {
        // take the card from shop
        if (currentPlayer == myID 
                && (activeShop == 4 || phase == 0 || phase == 3)
                && $(this).parent().hasClass('goods')) {
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
        // discard the card during phase 0, 2, 3
        else if ($(this).parent().hasClass('player_hand')) {
            var index = $('#my_hand').children().index( $(this) );
            if (window.confirm('discard this card?'))
                players[myID].discardFlowerCard(index);
        }
    });

    $(document).on('click', '.tool', function() {
        if (currentPlayer == myID 
            && (activeShop == 5 || phase == 0 || phase == 3))
            playerAction(myID, 5, $(this).val());
    });

    $(document).on('click', '.achievement_card', function() {
        if (currentPlayer == myID && (phase == 0 || phase == 3))
            playerAction(myID, 6, $(this).data('index'))
    })
    $(document).on('click', '.button--submit', function() {
        // return to lobby
        if (gameState == 3) {
            $('#gamelist_lobby').show();
            $('#menu_bar').show();
            $('#game_board').hide();
            $('#gamelog_window').hide();
            socket.emit('leave game');
        } else if (phase == 1) {
            // check if all slots are occupied
            if ($('.time_token_drop div').length == 4) {
                for (i = 0; i < 6; i ++) {
                    players[myID].myPlayedTimeTokens[i] = ($('.time_token_drop').eq(i).find('.time_token').length == 0) ?
                        5 : $('.time_token_drop').eq(i).find('.time_token').eq(0).val();
                }
                isDone = true;
                socket.emit('submit time tokens', {
                    id : myID,
                    timeTokens : players[myID].myPlayedTimeTokens
                });
                
                $('.button--submit').remove();
                $('#button_area').append(
                    $('<div/>').addClass('loader')
                );
            }
            else
                addNoti('add time tokens to all shops!');
        }
        // check if card's requirements are all satisfied
        else if (phase == 4) {
            if ($('#my_hand').find('.chosen').length == 0)
                addNoti('Select a flower card');
            else {
                var cardIndex = $('#my_hand').find('.flower_card')
                    .index(
                        $('#my_hand').find('.chosen').eq(0) 
                    );
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
                    for (i = 0; i < r; i ++) {
                        $('#button_area .add_ribbons').find('option').last().remove();
                    }
                    addNoti('Arrangement successful !');
                }
            }
        }
    });

    $(document).on('click', '.button--pass', function() {
        if (phase <= 3 && currentPlayer == myID)
            playerAction(myID, 0, -1);
        else if (phase == 4) {
            isDone = true;
            $('#my_hand').children().removeClass('chosen');
            $('#my_vase').children().removeClass('chosen');
            addNoti('Wait for other players to finish');
            $('#button_area').empty();
            $('#button_area').append(
                $('<div/>').addClass('loader')
            );
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
        //$('#gamelog_window').append($autoplayOn).append($autoplayOff);

        $('.language_toggle').remove();
        var $langTH = $('<button/>').text('ไทย').addClass('button button--language_toggle').hide();
        var $langEN = $('<button/>').text('Eng').addClass('button button--language_toggle');
        $('#gamelog_window').append($langTH).append($langEN);
        language = 'EN';
        autoplay = false;
        
	    startGame(data);
    });

    // handing out stuff you start the game with
    socket.on('starting stuff recieved', function(data) {
        // assign player bonuses and colors
        playerBonuses = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];
        
        for (i = 0; i < numPlayers; i ++) {
            players[i].bonus = playerBonuses[data.bonuses[i]];
            players[i].color = data.playerColors[i];
        }
        playerColors = data.playerColors;
        tieBreak = data.tieBreak;

        achievements = [];
        for (i = 0; i < data.achieve.length; i ++)
    		achievements.push(new achievementCard(data.achieve[i]));

        // add labels on the board
        boardSetup();	
        
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
                        ).data({
                            info: a
                        });
                    }

                $card.append(
                    $('<br>'),
                    // quality
                    $('<img/>')
                        .attr('src','img/card_quality_icon.png')
                        .addClass('card_icon'),
                    $('<div/>')
                        .text(a[3])
                        .addClass('quality_symbol'),
                    // score
                    $('<img/>')
                        .attr('src','img/card_score_icon.png')
                        .addClass('card_icon'),
                    $('<div/>')
                        .text(a[4])
                        .addClass('score_symbol'),   
                    // level stars
                    $('<br>'),
                    $('<span/>').text(cardLevelStars[a[5]])
                        .css('color', 'white')
                );

                players[i].drawFlowerCard(
                    new flowerCard(a[0], a[1], a[2], a[3], a[4], a[5]),
                    $card
                );
            }
            else
                players[i].drawFlowerCard(
                    new flowerCard(a[0], a[1], a[2], a[3], a[4], a[5])
                );
        }

        $('#gamelog').empty();
        addLog("*");
        addLog("***** Turn " + turn + "******");
        addLog("*");
        $('.status_bar--turn').text('Turn ' + turn);
        $('.status_bar--phase').text('Phase 0: Planning Phase');
        currentPlayer = -1;
        nextPlayer();
        });

    // get the new market from the server
    socket.on('market generated', function(data) {
        newMarket(data);
    });

    // the server tells you to move on to the next phase
    socket.on('to next phase', function(data) {
        // clear the buttons and title animation
        $('#button_area').empty();
        clearInterval(blink);
		titleBlink = false;
		$('link[rel="icon"]').attr('href', 'img/title_icon.png');
		document.title = 'Pakklong Talat';

        switch(data.phase) {
            // from early-bird to planning phase
            case 0: 
                $('.shop').removeClass('active');
                // add droppable areas
                $('.time_token_area').each(function() {
                    $(this).append(
                        $('<div/>')
                            .addClass('time_token_drop')
                            .droppable({
                                accept: '.time_token',
                                classes: {
                                    'ui-droppable-hover': 'chosen'
                                },
                                drop: function(event, ui) {
                                    var value = $(ui.draggable).val();
                                    // swap tokens if the area has one already
                                    if($(this).children('.time_token').length) {
                                        var oldValue = $(this).children('.time_token').eq(0).val();
                                        $(this).children('.time_token').eq(0)
                                            .text(timeTokenList[value])
                                            .val(value);
                                        $(ui.draggable)
                                            .text(timeTokenList[oldValue])
                                            .val(oldValue);
                                    }
                                    // otherwise append it
                                    else {
                                        $(ui.draggable).parent().removeClass('time_token_drop--highlight');
                                        $(this).append(ui.draggable);
                                    }
                    
                                    $(this).addClass('time_token_drop--highlight');
                                }
                            })
                    )
                });

                $myTimeTokenButtons = [];
                var mtt = players[myID].getMyTimeTokens();
                $('#button_area').append(
                    $('<button/>').addClass('button button--submit')
                        .text('Submit')
                );
                // display time tokens to choose in planning phase
                for (i = 0; i < 4; i ++) {
                    $('#button_area').append(
                        $('<div/>').addClass('time_token')
                            .css('background-color', players[myID].color)
                            .text(timeTokenList[mtt[i]])
                            .val(mtt[i])
                            .draggable({
                                revert: 'invalid',
                                helper: 'clone',
                                snap: '.time_token_drop'
                            })
                    );
                }

                // random button is for testing only !!!!!
                /*$('#button_area').append(
                    $('<button/>').addClass('random_button')
                        .text('Random')
                );*/

                addLog("----- planning phase -----");
                if (language === 'EN')
                    addLog(">> Drag and drop time tokens to each shop");
                else
                    addLog(">> ลากเบี้ยเวลาไปวางในร้านแต่ละร้าน")
                // select time tokens for bots in advance !
                if (myID == 0)
                    for (var p in players)
                        if (players[p].isBot) 
                            botChooseTimeTokens(players[p].id);
                phase = 1;

                $('.status_bar--turn').text('Turn ' + turn);
                $('.status_bar--phase').text('Phase 1: Planning Phase');
                break;

            // from planning to buy phase
            case 1:
                isDone = false;
                $('.time_token_area').empty();
                collectTimeTokens();

                $('#button_area').empty();

                addLog("------ buy phase ------");
                if (tutorial)
                    addLog(">> On your turn, click on the goods to buy");
                phase = 2;
                activeShop = 0;
                activeTokenOrder = -1;
                $('.shop').eq(0).addClass('active');

                $('.status_bar--turn').text('Turn ' + turn);
                $('.status_bar--phase').text('Phase 2: Buy Phase');
                nextPlayer();
                if (currentPlayer >= 0 && myID == 0 && players[currentPlayer].isBot)
			        botAction(currentPlayer);
                break;

            // from buy to after market phase
            case 2:
                addLog("------ after market phase ------");
                if (language == 'EN')
                    addLog(">> You may spend 2 action cubes to buy anything");
                else
                    addLog(">> สามารถจ่าย Action cube 2 เม็ดเพื่อซื้ออะไรก็ได้")
                $('.time_token_area').empty();

                phase = 3;
                currentPlayer = -1;
                $('.status_bar--turn').text('Turn ' + turn);
                $('.status_bar--phase').text('Phase 3: After-market Phase');
                $('.status_bar--text').empty();
                nextPlayer();
                if (currentPlayer >= 0 && myID == 0 && players[currentPlayer].isBot)
			        botAction(currentPlayer);
                break;

            // from after market to flower arranging phase
            case 3:
                $('#button_area').append(
                    $('<button/>').addClass('button button--submit')
                        .text('Arrange')
                );

                $('#button_area').append(
                    $('<button/>').addClass('button button--pass')
                        .text('End Phase')
                );

                $('.shop').removeClass('active');

                var $addRibbons = $('<select/>').addClass('add_ribbons');

                for (i = 0; i <= players[myID].numRibbons; i ++) {
                    var suffix = (i >= 1) ? ' ribbons' : ' ribbon';
                    $addRibbons.append(
                        $('<option/>').val(i).text(i + suffix + ' (+' + Number(2*i) + ')')
                    );
                }  

                $('#button_area').append($addRibbons);

				addLog("------ arranging phase ------");
				if(language === 'EN') {
					addLog(">> Select a flower card & flower tokens to arrange");
					addLog(">> or click on 'skip phase'")
				}
                else {
                    addLog(">> เลือกการ์ดดอกไม้และเบี้ยดอกไม้เพื่อจัดดอกไม้");
                    addLog(">> หรือกด Skip Phase เพื่อข้ามเฟสนี้");
                }

				// arrange flowers for bot in advance !
				if (myID == 0)
					for (var p in players)
						if (players[p].isBot) {
							botArrangeFlower(players[p].id);
							socket.emit('finish arranging');
						}
                phase = 4;
                $('.status_bar--turn').text('Turn ' + turn);
                $('.status_bar--phase').text('Phase 4: Arranging Phase');
                $('.status_bar--text').empty();
                break;

            // from flower arranging phase to next turn (early bird phase)
            case 4:
                isDone = false;
                if (checkEndGame()) {
                    gameState = 3;
                    var winner = 0;
                    // display final scores
                    addLog("------------- ------------- -------------");
                    addLog("-------------  Final Scores -------------");
                    addLog("------------- ------------- -------------");
                    for (k = 0; k < numPlayers; k ++) {
                        addLog(players[k].username + ' : ' + players[k].score, k);
                        if ((players[k].score > players[winner].score) ||
                            (players[k].score == players[winner].score && tieBreak.indexOf(k) < tieBreak.indexOf(winner)))
                            winner = k;
                    }
                    // deterine the winner
                    addLog('||', winner);
                    if (language === 'EN') 
                        addLog('||  The winner is  ::: ' + players[winner].username + ' :::', winner);
                    else
                        addLog('||  ผู้ชนะคือ  ::: ' + players[winner].username + ' :::', winner);
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
                            .addClass('button button--submit')
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
                    addLog("*");
                    addLog("***** Turn " + turn + "******");
                    addLog("*");
                    addLog("----- early-bird phase -----");
                    if (myID == 0)
                        socket.emit('generate market', generateGoods(numPlayers));
                    
                    turn ++;
                    phase = 0;
                    currentPlayer = -1;
                    $('.status_bar--turn').text('Turn ' + turn);
                    $('.status_bar--phase').text('Phase 0: Early-bird Phase');
                    nextPlayer();

                    if (currentPlayer >= 0 && myID == 0 && players[currentPlayer].isBot)
			            botAction(currentPlayer);
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
        if (!buyFlowerToolToken)
            nextPlayer();
        if (currentPlayer >= 0 && myID == 0 && players[currentPlayer].isBot) {
            botAction(currentPlayer);
	}
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

    socket.on('autoplay toggled', function(data) {
        players[data.id].isBot = data.newStatus;
    })
});