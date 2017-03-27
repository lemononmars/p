// set up the board by adding labels and player boards
function boardSetup() {
	statusBar = new component(400, 25, "lightgray", "black", 25, 25, "", "center", "text");
	passButton = new component(50, 25, "black", "white", 400, 265, "Pass", "center");

	shopLabels = [];

	// add the shops
	for (i = 0; i < 6; i ++) {
		shopLabels.push(new component(75, 25, shopColors[i], shopTColors[i], 25, shopYCoor[i], shopList[i], "center"));
	}

	// add buy order track and determine buy order randomly
	// buyOrder[0] contains player's id who wins all ties (leftmost on the trak)
	tieBreakTrack = [];
	tieBreak = [];
	for (i = 0; i < numPlayers; i ++) 
		tieBreak.push(i);

	// add tie break track
	for (i = 0; i < numPlayers; i ++) {
		var c = tieBreak[i];
		tieBreakTrack.push(new component(25, 25, playerColors[i], "white", 105 + 30*c, 265, "", "left"));
		// distribute starting resources depending on tie break order
		players[c].money += startingMoney + Math.floor(i/2);
		players[c].numRibbons += i%2;
	}
	tieBreakTrack.push(new component(75, 25, "black", "white", 
		25, 265, "Tie break", "center")); // add label last to make it easier to manipulate the track
}

/*
 *  generate goods according to player count (num)
 */ 

function generateGoods(num) {
  var goods = [[],[],[],[],[],[]];
	for (i = 0; i < num; i++) {
		var a = ran(6);
		if (a < 5) {
			goods[0].push(Math.floor(a/2) + 1); // 1,1,2,2,3
		}
	}

	var flowerTokens = [];
	for (i = 0; i < num*2; i++) 
		flowerTokens.push(getRandomFlowerToken());  // [type, qual]

	for (i = 0; i < flowerTokens.length; i ++) {
		var shopIndex = flowerTokens[i][0] + 1; // shop index = 1,2,3
		goods[shopIndex].push(flowerTokens[i]);
	}

	for (i = 0; i < num; i ++)
    goods[4].push(getRandomFlowerCard());

	goods[5] = getTools();
  	return goods;
  	
}

///////////////////////////////////////////////////////////////////
//
//		assign goods generated from the server to each shop
//
////////////////////////////////////////////////////////////////////

function newMarket(goods) {
	// add leftover cards to the deck and clear the board
	shops = [[],[],[],[],[],[]];

	// Shop #1 : restaurant. Players work part time and earn money.
	for (i = 0; i < goods[0].length; i++) {
		shops[0].push(new component(25, 25, "yellow", "black", 
			105 + 30 * i, 55, "$" + goods[0][i], "center", goods[0][i]));
		// $('#shop1').after($("<button></button>").text("$" + money).addClass("money"));
	}

	for (j = 1; j < 4; j ++)
		for (i = 0; i < goods[j].length; i++) {
			var token = new flowerToken(goods[j][i][0], goods[j][i][1]);
			shops[j].push(new component(25, 25, shopColors[j], shopTColors[j], 
				105 + 30 * i, 55 + 30 * j, goods[j][i][1], "center", token));
		}
		// var shop = "shop" + (type + 2), flowertype = "flower" + (type + 1);
		// $('#' + shop).after($("<button></button>").text(flowers[i].quality).addClass(flowertype));

	// Shop #5 : book store. Players learn how to arrange flowers (draw a card).
	// create blank cards to display and interact first, and add text later
	for (i = 0; i < goods[4].length; i ++) {
		var a = goods[4][i];
		var card = new flowerCard(a[0], a[1], a[2], a[3], a[4]);
		shops[4].push(new component(40, 55, shopColors[4], shopTColors[4], 
			105 + 45 * i, 175, "", "center", card));
	}

	// Shop #6 : Tool shop. Players upgrade and buy stuff for their shop.
	var tools = getTools();
	for (i = 0; i < tools.length; i ++) {
		var token = new toolToken(goods[5][i][0], goods[5][i][1]);
		shops[5].push(new component(40, 25, shopColors[5], shopTColors[5], 
			105 + 45 * i, 235, token.toSymbol(), "center", token));
		// $('#shop6').after($("<button></button>").text(tools[i].toSymbol()).addClass('tool'));
	}
}