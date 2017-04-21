function botAction(id) {
	// early bird/after market phase
	// *todo - do something when the bot has enough action cubes
	if((phase == 0 && players[id].actionCubes >= 3) || (phase == 3 && players[id].actionCubes >= 2)) {
		playerAction(id, 0, findBestIndex(id, 0));
	}
	else if(phase == 2) {
		if ( $('.goods').eq(activeShop).children().length == 0 ) {
			playerAction(id, activeShop, -1);
		}
		else {
			if(!playerAction(id, activeShop, findBestIndex(id, activeShop)))
				playerAction(id, activeShop, -1);
		}
	}
}

function botArrangeFlower(id) {
	if (players[id].hand.length < 1)
		return false;

	for (i = 0; i < players[id].hand.length; i ++) {
		var requiredFlowers = players[id].hand[i].getFlowers();
		var requiredTotal = players[id].hand[i].quality;
		var flowers = [[],[],[]];
		for (j = 0; j < players[id].vases.length; j ++)
			flowers[players[id].vases[j].type].push(
				[j, players[id].vases[j].quality]
			); // push (index of the token in the vase, quality of that token)
		
 		if (flowers[0].length >= requiredFlowers[0] && 
			flowers[1].length >= requiredFlowers[1] && 
			flowers[2].length >= requiredFlowers[2]) {
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
				return true;
			}
		}

	}
	return true;
}

function botChooseTimeTokens(id) {
	var wanted = [], unwanted = [];
	
	if (turn <= 3)
		wanted.unshift(5);
	if (players[id].hand.length >= 3 || shops[4].length == 0)
		unwanted.push(4);
	else if (players[id].hand.length <= 1)
		wanted.unshift(4);
	
	// check what type of flowers it needs more
	if (players[id].hand.length > 0) {

		if (shops[1].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(1);
		else if (needFlowerTokens(id, 0))
			wanted.unshift(1);

		if (shops[2].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(2);
		else if (needFlowerTokens(id, 1))
			wanted.unshift(2);

		if (shops[3].length == 0 || players[id].vases.length == players[id].numVases)
			unwanted.push(3);
		else if (needFlowerTokens(id, 2))
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
	shuffle(unwanted);
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

// 	return true if you need a token flower of type id
// 	simply compare how many the first card requires and how many you have
function needFlowerTokens (id, i) {
	if (players[id].hand.length > 0) {
		var want = players[id].hand[0].getFlowers()[i];
		var have = 0;
		for (var token in players[id].vases) {
			if (players[id].vases[token].type == i)
				have ++;
		}
		return want > have;	// true if you want more than you have
	}
	else
		return true; // want anyting if you have no card
}

function findBestIndex(id, shop) {
	var indexBest = 0;
	var l = shops[shop].length;
	if (l == 0)
		return -1;

	switch(shop) {
		case 0: // restaurant
			for (i = 0; i < l; i ++)
				if (shops[0][i] > shops[0][indexBest]) 
					indexBest = i;
			break;
		case 1: case 2: case 3:	// flower shop
			// don't buy the token if you already have enough
			if (!needFlowerTokens(id, shop-1))
				indexBest = -1;
			else {
				for (i = 0; i < l; i ++) {
					var best = shops[shop][indexBest].quality;
					var current = shops[shop][i].quality;
					if (current > best)
						indexBest = i;
				}
			}
			break;
		case 4: // library
			for (i = 0; i < l; i ++) {
				var best = shops[4][indexBest].quality;
				var current = shops[4][i].quality;
				// here, we want to draw the (subjectively) easiest card to arrange 
				// *todo : add a clever way to draw a card (weigh)
				if (current < best)
					indexBest = i;
			}
			break;
		case 5: // tool
			// get ahead on tie break track if you're last two
			if (tieBreak.indexOf(Number(id)) >= numPlayers - 2)
				indexBest = 4;
			// then try to get a clock upgrade
			else if (players[id].time <= 2 && players[id].money >= 5)
				indexBest = 0;
			// then try to get more vases
			else if ((players[id].numVases <= 4 || players[id].numVases == players[id].vases.length)
					&& players[id].money >= 4)
				indexBest = 1;
			// then see if you want some ribbons
			else if (players[id].numRibbons <= 2 && players[id].money >= shops[5][2].cost + 1)
				indexBest = 2;
			// *todo - determine if bot wants extra flower
			// if all fails, get some ribbons
			else
				indexBest = -1;
			break;
	}
	return indexBest;
}