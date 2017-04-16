
///////////////////////////////////////////////////////////////////
//
//  set up the board by adding labels and player boards
//
////////////////////////////////////////////////////////////////////


function boardSetup() {
	shops = [[],[],[],[],[],[]];

	// add 5 different tools
	for (i = 0; i < 5; i ++)
		shops[5].push(
			new toolToken(i)
		);

	// add tie break track
    $('#tie_break_track').empty();
	$('#tie_break_track').append(
		$('<span/>').text('Tie Break:')
	);
	for (i = 0; i < numPlayers; i ++) {
		var c = tieBreak[i];
		$('#tie_break_track').append(
			$('<div/>')
				.addClass('tie_break_token')
				.css('background-color', playerColors[c])
				.text(Number(i+1))
		);
		// distribute starting resources depending on tie break order
		players[c].money += (startingMoney + Math.floor(i/2));
		players[c].numRibbons += i%2;
	}

	// add status bar
	var $statusBar = $('<div/>').addClass('status_bar')
		.append(
			$('<span/>').addClass('status_bar--turn'),
			$('<span/>').addClass('status_bar--phase'),
			$('<span/>').addClass('status_bar--text')
		);
	$('#status_bar').empty();
	$('#status_bar').append($statusBar);

	// add opponents' boards on the top
	$('#opponent_board_area').empty();
	for (i = 0; i < numPlayers; i ++)
		if (myID != i) {
			var $board = $('<div/>')
					.addClass('player_board')
					.css('background-color', playerColors[i])
					.val(i);
			var $name = $('<span/>').addClass('player_name').text(players[i].username);
			var $money = $('<span/>').addClass('player_money').text(players[i].money);
			var $score = $('<span/>').addClass('player_score').text(players[i].score);
			var $vase = $('<div/>').addClass('player_vase').addClass('player_vase--opponent');

			for (j = 0; j < 3; j ++)
				$($vase).append(
					$('<img/>').attr('src', 'img/empty_vase.png')
						.addClass('icon--small')
						.addClass('empty_vase')
				);

			$($board).append($name)
				.append(
					$('<img/>').attr('src','img/money_icon.png')
						.addClass('icon--small')
				)
				.append($money)
				.append(
					$('<img/>').attr('src','img/score_icon.png')
						.addClass('icon--small')
				)
				.append($score)
				.append($vase);

			$('#opponent_board_area').append($board);
			players[i].addBoard($board);
		}

	// add info to your board at the bottom of the screen
	$('#my_board').css('background-color', playerColors[myID])
		.val(myID);

	// clean up stuff from previous game

	$('#my_name .player_name').empty();
	$('#my_name .player_name').text(myusername);

	// starting resources
	$('#my_money .player_money').text(players[myID].money);
	$('#my_score .player_score').text(0);
	$('#my_ribbon .player_ribbon').text(players[myID].numRibbons);	
	$('#my_action_cube .player_action_cube').text(0);

	// time_track
	$('#my_time_track').empty();
	$('#my_time_track').append(
		$('<img/>').attr('src','img/time_track0.png')
			.addClass('time_track_image')
	)

	$('#my_hand').empty();
	$('#my_vase').empty();
	for (i = 1; i < 4; i ++) {
		var starColor = players[myID].bonus[i-1] + 1;
		$('#bonus_icon' + i).empty();
		$('#bonus_icon' + i).append(
			$('<img/>').attr('src', 'img/bonus_icon' + i + '.png')
				.addClass('icon')
				.css('background-color', shopColors[starColor])
		);
		$('#my_bonus' + i).empty();
		$('#my_bonus' + i).append(
			$('<span/>').text(0)
				.addClass('bonus_star')
				.css('background-color', shopColors[starColor])
		).append(
			$('<img/>').attr('src', 'img/star_icon' + starColor + '.png')
				.addClass('icon--small')
		);

		$('#my_vase').append(
			$('<img/>').attr('src', 'img/empty_vase.png')
				.addClass('empty_vase')
		);
	}

	// add popup area that shows all tools with all levels
	$('#tool_lookup').empty();
	$('#tool_lookup').append(
		$('<button/>').text('Close')
			.addClass('button--expand_tool')
	);

	for (i = 0; i < 3; i ++ ) {
		$('#tool_lookup').append($('<br>'));
		$('#tool_lookup').append(
			$('<span/>').text('level ' + i).css('color', 'white')
		);
		$('#tool_lookup').append($('<br>'));
		for (j = 0; j < 5; j ++) {
			$('#tool_lookup').append(
				$("<img/>")
					.attr('src', 'img/tool' + j + 'lv' + i + '.jpg' )
					.addClass('tool--large')
					.val(i)
			);
		}
	}

	// initialize board component
	players[myID].addBoard(
		$('#my_board')
	);
}

///////////////////////////////////////////////////////////////////
//
//  generate goods according to player count (num)
//
////////////////////////////////////////////////////////////////////

function generateGoods(num) {
	var goods = [[],[],[],[],[],[]];
	for (i = 0; i < num; i++) {
		var a = ran(6);
		if (a < 5) {
			goods[0].push(Math.floor((a+1)/2) + 1); // 1,2,2,3,3,X
		}
	}

	var flowerTokens = [];
	for (i = 0; i < num*2; i++) 
		flowerTokens.push(getRandomFlowerToken());  // [type, qual]

	for (i = 0; i < flowerTokens.length; i ++) {
		var shopIndex = flowerTokens[i][0] + 1; // shop index = 1,2,3
		goods[shopIndex].push(flowerTokens[i]);
	}

	for (i = 0; i < num; i ++) {
		goods[4].push(getRandomFlowerCard());
	}

	goods[5] = getTools(numPlayers);
  	return goods;
}

///////////////////////////////////////////////////////////////////
//
//		assign goods generated from the server to each shop
//
////////////////////////////////////////////////////////////////////

function newMarket(goods) {

	$('.goods').empty();

	// Shop #1 : restaurant. Players work part time and earn money.
	shops[0] = [];
	for (i = 0; i < goods[0].length; i++) {
		shops[0].push(goods[0][i]);
		$('#goods1').append(
			$("<button></button>")
			.text("฿" + goods[0][i])
			.addClass("money")
			.val(i)
			.fadeIn("slow")
		);	//*todo - change button to image
	}

	// Shop #2-4 : flower shops. Players buy flowers here.
	for (j = 1; j < 4; j ++) {
		shops[j] = [];
		for (i = 0; i < goods[j].length; i++) {
			shops[j].push(
				new flowerToken(goods[j][i][0], goods[j][i][1])
			);
			var shop = "goods" + (j + 1);
			var ftoken = $("<img/>")
					.attr('src', 'img/f' + j + 'q' + goods[j][i][1] + '.jpg')
					.addClass('flower' + j)
					.addClass('flower_token')
					.val(i)
					.fadeIn("slow");
			// dummy components to store data
			$(ftoken).data({
				type: j,
				quality: goods[j][i][1]
			});
			$('#' + shop).append(ftoken);
		}
	}
		

	// Shop #5 : book store. Players learn how to arrange flowers (draw a card).
	// create blank cards to display and interact first, and add text later
	shops[4] = [];
	for (i = 0; i < goods[4].length; i ++) {
		var a = goods[4][i];
		// also keep track of the card
		shops[4].push(
			new flowerCard(a[0], a[1], a[2], a[3], a[4])
		);

		var $card = $('<div/>')
						.addClass('flower_card')
						.val(i);

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
			$('<img/>')
				.attr('src','img/card_quality_icon.png')
				.addClass('card_icon'),
			$('<div/>')
				.text(a[3])
				.val(a[3])
				.addClass('quality_symbol')
		);
		// add score
		$card.append(
			$('<img/>')
				.attr('src','img/card_score_icon.png')
				.addClass('card_icon'),
			$('<div/>')
				.text(a[4])
				.val(a[4])
				.addClass('score_symbol')
		);

		$('#goods5').append($card);
	}

	// Shop #6 : Tool shop. Players upgrade and buy stuff for their shop.
	for (i = 0; i < shops[5].length; i ++) {
		shops[5][i].levelUp(goods[5][i]);
		$('#goods6').append(
			$("<img/>")
				.attr('src', 'img/tool' + i + 'lv' + shops[5][i].level + '.jpg' )
				.attr('title', shops[5][i].toString())
				.addClass('tool')
				.val(i)
		);
	}
	$('#goods6').append(
		$('<button/>').text('See All')
			.addClass('button--expand_tool')
	);
}