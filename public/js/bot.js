function botAction(id) {
	// early bird/after market phase
	// *todo - do something when the bot has enough action cubes
	if(phase == 0 || phase == 3) {
		playerAction(id, 0, -1)
	}
	else if(phase == 2) {
		if (shops[activeShop].length === 0) {
			playerAction(id, activeShop, -1);
		}
		else {
			var indexBest = 0;
			for (i = 0; i < shops[activeShop].length; i ++) {
				switch(activeShop) {
					case 0: if (shops[activeShop][indexBest].object < shops[activeShop][i].object) 
								indexBest = i;
							break;
					case 1: case 2: case 3:
							if (shops[activeShop][indexBest].object.quality < shops[activeShop][i].object.quality)
								indexBest = i;
							break;
							// *todo - add a clever way to select a card
							// *idea - early : get money & quality >> late game : get points
					case 4: if (ran(shops[activeShop].length) == 0)
								indexBest = i;
							break;
					default:
							break;
				}
			}
			// *todo - use different strategy for each type of bots 
			// e.g. switching if statement ordering
			if (activeShop == 5) {
				var toolType = [];
				for (i = 0; i < shops[5].length; i ++)
					toolType.push(shops[5][i].object.type);
				// get ahead on tie break track first
				if (toolType.includes(6) && tieBreak.indexOf(id) >= numPlayers - 2)
					indexBest = toolType.indexOf(6);
				// then try to get a clock upgrade
				else if (toolType.includes(0) && players[id].time <= 2 && players[id].money >= 6)
					indexBest = toolType.indexOf(0);
				// then try to expand your vases
				else if (toolType.includes(2) && players[id].numVases <= 4 && players[id].money >= 3)
					indexBest = toolType.indexOf(2);
				// then see if you want some ribbons
				else if (toolType.includes(3) && players[id].numRibbons <= 2 && players[id].money >= 1)
					indexBest = toolType.indexOf(3);
				else if (toolType.includes(4) && players[id].numRibbons <= 2 && players[id].money >= 1)
					indexBest = toolType.indexOf(4);
				// *todo - determine if bot wants extra flower
				// if all fails, just pass.....
				else
					indexBest = -1;
			}
			if(!playerAction(id, activeShop, indexBest))
				playerAction(id, activeShop, -1);
		}
	}
}

function botArrangeFlower(id) {
	if (players[id].hand.length < 1)
		return false;

	for (i = 0; i < players[id].hand.length; i ++) {
		var requiredFlowers = players[id].hand[i].object.getFlowers();
		var requiredTotal = players[id].hand[i].object.quality;
		var flowers = [[],[],[]];
		for (j = 0; j < players[id].vases.length; j ++)
			flowers[players[id].vases[j].object.type].push([j, players[id].vases[j].object.quality]); // push (index of the token in the vase, quality of that token)
		
 		if (flowers[0].length >= requiredFlowers[0] && flowers[1].length >= requiredFlowers[1] && flowers[2].length >= requiredFlowers[2]) {
			for (k = 0; k < flowers.length; k ++)
				flowers[k].sort(function(a,b){return a[1]-b[1];});

		 	var total = players[id].getBonus(0);
			var indexFTokens = [];
			for (k = 0; k < 3; k ++)
				for (l = 0; l < requiredFlowers[k]; l ++) {
					total += flowers[k][l][1];
					indexFTokens.push(flowers[k][l][0]);
				}
			if (total + 2*players[id].numRibbons >= requiredTotal) {
				var numRibbonsUsed = Math.floor((requiredTotal - total)/2);
				socket.emit('arrange flower', {
					id : id,
					card : i,
					indices : indexFTokens,
					ribbons : numRibbonsUsed
				});
			}
		}

	}
	return true;
}

function botChooseTimeTokens(id) {
	var wanted = [], unwanted = [];
	
	// the earlier if clause is located, the less priority it is
	if (turn <= 3)
		wanted.unshift(5);
	if (players[id].hand.length >= 2 || shops[4].length == 0)
		unwanted.push(4);
	else if (players[id].hand.length == 0)
		wanted.unshift(4);
	
	// check what type of flowers it needs more
	if (players[id].hand.length > 0) {
		var requiredFlowers = players[id].hand[0].object.getFlowers();
		var flowers = [[],[],[]];
		for (const token of players[id].vases)
			flowers[token.object.type].push(token.object.quality); 

		if (shops[1].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(1);
		else if (flowers[0].length < requiredFlowers[0])
			wanted.unshift(1);

		if (shops[2].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(2);
		else if (flowers[1].length < requiredFlowers[1])
			wanted.unshift(2);

		if (shops[3].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(3);
		else if (flowers[2].length < requiredFlowers[2])
			wanted.unshift(3);
	}
		
	if (players[id].money <= 3)
		wanted.unshift(0);
		
	// random the rest
	var middle = [];
	for (i = 0; i < 6; i ++)
		if(!wanted.includes(i) && !unwanted.includes(i))
			middle.push(i);
	shuffle(middle);
	
	wanted = wanted.concat(middle, unwanted);
	var botTT = players[id].getMyTimeTokens();
	players[id].myPlayedTimeTokens = [];
	for (i = 0; i < 6; i ++)
		players[id].myPlayedTimeTokens.push(botTT[wanted.indexOf(i)]);

	// send this to the server
	socket.emit('submit time tokens', {
		id : id,
		timeTokens : players[id].myPlayedTimeTokens
	});
}