/*
* set up the board by adding labels and player boards
*/

function boardSetup() {
	shops = [[],[],[],[],[],[]];

	// add 5 different tools
	for (i = 0; i < 5; i ++)
		shops[5].push(
			new toolToken(i)
		);

	// add tie break track
    $('#tie_break_track').empty();
	for (i = 0; i < numPlayers; i ++) {
		var c = tieBreak[i];
		$('#tie_break_track').append(
			$('<div/>')
				.addClass('tie_break_token')
				.css('background-color', playerColors[c])
		);
		// distribute starting resources depending on tie break order
		players[c].money += (startingMoney + Math.floor(i/2));
		players[c].numRibbons += i%2;
	}

	// add achievements (= # of players)
	achievements = [];
	var temp = [0,1,2,3,4,5,6,7];
	shuffle(temp);
	var achieve = temp.splice(0, numPlayers);

	for (i = 0; i < achieve.length; i ++) {
		achievements.push(new achievementCard(achieve[i]));
	}

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
			var $vase = $('<div/>').addClass('player_vase');

			for (j = 0; j < 3; j ++)
				$($vase).append(
					$('<img/>').attr('src', 'img/empty_vase.png')
						.addClass('small_icon')
						.addClass('empty_vase')
				);

			$($board).append($name)
				.append(
					$('<img/>').attr('src','img/money_icon.png')
						.addClass('small_icon')
				)
				.append($money)
				.append(
					$('<img/>').attr('src','img/score_icon.png')
						.addClass('small_icon')
				)
				.append($score)
				.append($vase);

			$('#opponent_board_area').append($board);
			players[i].addBoard($board);
		}
	// add your board at the bottom
	$('#my_board').css('background-color', playerColors[myID])
		.val(myID);

	// clean up stuff from previous game
	$('#my_board td').empty();

	$('#my_name').append( 
		$('<span/>').text(myusername)
	);

	// money
	$('#my_money').append(
		$('<img/>').attr('src','img/money_icon.png')
			.attr('title', 'money')
			.addClass('icon')
	).append( 
		$('<span/>').text(players[myID].money)
			.addClass('player_money')
	);

	// score
	$('#my_score').append(
		$('<img/>').attr('src','img/score_icon.png')
			.attr('title', 'score')
			.addClass('icon')
	).append(
		$('<span/>').text(0)
			.addClass('player_score')
	);

	// ribbon
	$('#my_ribbon').append(
		$('<img/>').attr('src','img/ribbon_icon.png')
			.addClass('icon')
	).append( 
		$('<span/>').text(players[myID].numRibbons)
			.addClass('player_ribbon')	
	);	

	// action cube
	$('#my_action_cube').append(
		$('<img/>').attr('src','img/action_cube_icon.png')
			.attr('title', 'action cubes')
			.addClass('icon')
	).append( 
		$('<span/>').text(0)
			.addClass('player_action_cube')
	);

	// time_track
	$('#my_time_track').append(
		$('<img/>').attr('src','img/time_track0.png')
			.addClass('time_track_image')
	)

	for (i = 1; i < 4; i ++) {
		$('#bonus_icon' + i).append(
			$('<img/>').attr('src', 'img/bonus_icon' + i + '.png')
				.addClass('icon')
				.css('background-color', shopColors[players[myID].bonus[i-1] + 1])
		);
		$('#my_bonus' + i).append(
			$('<span/>').text(0)
				.addClass('bonus_star')
				.css('background-color', shopColors[players[myID].bonus[i-1] + 1])
		);

		$('#my_vase').append(
			$('<img/>').attr('src', 'img/empty_vase.png')
				.addClass('empty_vase')
		);
	}

	// initialize board component
	players[myID].addBoard(
		$('#my_board')
	);
}

/*
 *  generate goods according to player count (num)
 */ 

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
			.text("$" + goods[0][i])
			.addClass("money")
			.val(i)
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
					.val(i);
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
			$('<div/>')
				.text(a[3])
				.val(a[3])
				.addClass('quality_symbol')
		);
		// add score
		$card.append(
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
				.addClass('tool')
				.val(i)
		);
	}
}