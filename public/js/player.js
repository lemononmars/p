function player(id, username, color, bot) {
	this.id = id;
	this.username = username;
	this.color = color;
	this.isBot = bot;				// true = bot
	this.myBoard = {};

	this.score = 0;
	this.money = 0;
	this.numVases = 3;				// max number of flowers
	this.vases = [];				// components of fresh flowers
	this.time = 0;
	this.myPlayedTimeTokens = [];	// played time tokens (planning phase)
	this.stars = new Array(0,0,0); 	// number of flowers you've arranged of each type
	this.bonus = new Array(0,0,0);	// stars of type bonus[i] give bonus i   
									// bonus: 0 = qual, 1 = money, 2 = score
	this.hand = []; 				// component of flower cards in hand not yet arranged
	this.numPlayedCards = 0;		// number of flower cards played
	this.numRibbons = 0;
	this.actionCubes = 0;			// cubes you gain when you pass

	// reference to your board
	this.addBoard = function (board) {
		this.myBoard = board;
	}

    // draw a flower card and add it to your hand
	this.drawFlowerCard = function(card, $card) {
		this.hand.push(card);
		if (this.id == myID)
			$(this.myBoard)
				.find('.player_hand')
				.append($card);
		else
			$($card).remove();
	};

	// discard a card
	this.discardFlowerCard = function(index) {
		if (index >=0 && index < this.hand.length) {
			if (phase != 4)
				addLog(this.username + " discards a card", this.id);
			// remove both data and html component
			this.hand.splice(index, 1);
			$(this.myBoard)
				.find('.player_hand')
				.find('.flower_card')
				.eq(index)
				.remove();
		}
	};

    // get a flower token and add it to your vase
	this.getFlowerToken = function(ftoken, $ftoken) {
		this.vases.push(ftoken);
		$($ftoken).fadeIn("slow");
		if (this.id != myID)
			$($ftoken).addClass('small_icon');
		$(this.myBoard)
			.find('.player_vase')
			.append($ftoken);
		$(this.myBoard)
			.find('.empty_vase')
			.first()
			.remove();
	};

	// discard a flower token and reindex components
	this.discardFlowerToken = function(index) {
		if (index >=0 && index < this.vases.length) {
			if (phase != 4)
				addLog(this.username + " discards a " + shopList[this.vases[index].type + 1], this.id);
			// remove both data and html component
			this.vases.splice(index, 1);
			$(this.myBoard)
				.find('.player_vase')
				.find('.flower_token')
				.eq(index)
				.remove();
			var $v = $('<img/>').attr('src', 'img/empty_vase.png')
						.addClass('empty_vase');
			if (this.id != myID)
				$($v).addClass('small_icon');
			$(this.myBoard)
				.find('.player_vase')
				.prepend($v);
		}
	};

	// get a tool token and upgrade accordingly
	this.getToolToken = function(toolToken) {
		switch(toolToken.type) { // refer to toolToken
			case 0:	
				this.time += toolToken.getAmount();
				this.score += toolToken.getAmount();
				if(this.time > 6) 
					this.time = 6;

				$(this.myBoard).find('#my_time_track').empty();
				$(this.myBoard).find('#my_time_track').append(
					$('<img/>').attr('src','img/time_track' + this.time + '.png')
						.addClass('time_track_image')
				);
				break;
			case 1:
				var newVases = toolToken.getAmount();
				// cap at 6 vases
				if (this.numVases < 6) {
					var $v = $('<img/>').attr('src', 'img/empty_vase.png')
								.addClass('empty_vase')
								.fadeIn("slow");
					if (this.id != myID)
						$($v).addClass('small_icon');
					this.numVases ++;
					$(this.myBoard)
						.find('.player_vase')
						.prepend($v);
				}
				if (newVases == 2 && this.numVases < 6) {
					this.numVases ++;
					var $v = $('<img/>').attr('src', 'img/empty_vase.png')
								.addClass('empty_vase');
					if (this.id != myID)
						$($v).addClass('small_icon');
					$(this.myBoard)
						.find('.player_vase')
						.prepend($v);
				}	
				this.score += newVases;
				break;
			case 2: 
				this.numRibbons += toolToken.getAmount();
				break;
			case 3: 
				buyFlowerToolToken = true; 
				addLog(">> You may buy any leftover flower");
				break;	
			case 4: 
				goFirst(this.id); 
				break;
		 }
		 this.update();
	};

    // get the list of usable time tokens for this player
	this.getMyTimeTokens = function() {
		var a = [0,1,2,3,4,5,6];
		a.splice(this.time, 1);
		return a;
	};

	// get the number of stars representing bonus of type i
	// i: 0 = quality, 1 = money, 2 = score
	this.getBonus = function (i) {
		return this.stars[this.bonus[i]];
	};
	
	this.getStars = function() {
		return this.stars;
	}
	// arrange the flower at cardIndex using tokens at tokensIndices and #ribbonsUsed
	// because we assume eligibility was already checked, we don't check it again here
	this.arrangeFlower = function(cardIndex, tokenIndices, ribbonsUsed) {
		// update rewards
		var s = this.getBonus(2) + this.hand[cardIndex].score; // score = card score + score bonus
		this.score += s;
		for (i = 0; i < 3; i ++)
			this.stars[i] += this.hand[cardIndex].getFlowersAt(i);
		this.numPlayedCards += 1;
		this.money += this.getBonus(1);

		// add log
		addLog(this.username + " arranges a bouquet ~", this.id);
		addLog("...." + this.username + " gains ฿" + this.stars[this.bonus[1]], this.id);
		addLog("...." + this.username + " gets " + s + " points", this.id);

		// spend resources
		this.numRibbons -= ribbonsUsed;
		this.discardFlowerCard(cardIndex);
		tokenIndices.sort(function(a,b){return b-a;}); 
		//sort from highest to lowest
		for(j = 0; j < tokenIndices.length; j ++) {
			this.discardFlowerToken(tokenIndices[j]); //remove from highest
		}
		this.update();
	};

	this.getAchievementRewards = function(rw) {
		addLog(this.username + ' claimed an achievement !', this.id);
		this.stars[0] += rw[0];
		this.stars[1] += rw[1];
		this.stars[2] += rw[2];
		this.score += rw[3];
		this.money += rw[4];
		this.update();
 	};

	// update player's information
	this.update = function () {
		$(this.myBoard).find('.player_money').text(this.money);
		$(this.myBoard).find('.player_score').text(this.score);
		if (this.id == myID) {
			$(this.myBoard).find('.player_ribbon').text(this.numRibbons);
			$(this.myBoard).find('.player_action_cube').text(this.actionCubes);
			for (i = 0; i < 3; i ++)
				$(this.myBoard).find('.bonus_star').eq(i).text(this.stars[this.bonus[i]]);
		}
	};
}