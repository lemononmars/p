/*
*		generate and add main canvas to html	 
*/

var myGameArea = {
	canvas: document.createElement("canvas"),
	start: function() {
		this.canvas.width = 800;
		this.canvas.height = 600;
		this.canvas.border = "5px";
		this.context = this.canvas.getContext("2d");
		$("#game_board").append(this.canvas);
		this.interval = setInterval(checkForInput, 20);	// *todo only update when necessary 
		var rect = this.canvas.getBoundingClientRect();
		window.addEventListener("click", function(e) {
			if (currentPlayer == myID || phase == 1 || phase == 4) {
				myGameArea.x = e.pageX - rect.left;
				myGameArea.y = e.pageY - rect.top;
			}
		});
	},
	clear: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
};

/*
* set up the board by adding labels and player boards
*/

function boardSetup() {
	$statusBar = new component(400, 25, "lightgray", "black", 25, 25, "", "center", "text");
	$passButton = new component(50, 25, "black", "white", 400, 265, "Pass", "center");

	$shopLabels = [];
	shops = [[],[],[],[],[],[]];

	// add the shops
	for (i = 0; i < 6; i ++) {
		$shopLabels.push(new component(75, 25, shopColors[i], shopTColors[i], 25, shopYCoor[i], shopList[i], "center"));
	}

	// add buy order track and determine buy order randomly
	// buyOrder[0] contains player's id who wins all ties (leftmost on the trak)
	$tieBreakTrack = [];

	// add 5 different tools
	// also an indicator of its level underneath
	$toolLevels = [];
	for (i = 0; i < 5; i ++) {
		var token = new toolToken(i);
		shops[5].push(new component(50, 30, shopColors[5], shopTColors[5], 
			105 + 55 * i, shopYCoor[5], token.toSymbol(), "center", token));
		// $('#shop6').after($("<button></button>").text(tools[i].toSymbol()).addClass('tool'));
		$toolLevels.push(new component(50, 10, shopColors[5], shopTColors[5], 
			105 + 55 * i, shopYCoor[5] + 35, '-', "center", token));
	}

	// add tie break track
	for (i = 0; i < numPlayers; i ++) {
		var c = tieBreak[i];
		$tieBreakTrack.push(new component(25, 25, playerColors[i], "white", 105 + 30*c, shopYCoor[6], "", "left"));
		// distribute starting resources depending on tie break order
		players[c].money += (startingMoney + Math.floor(i/2));
		players[c].numRibbons += i%2;
	}
	$tieBreakTrack.push(new component(75, 25, "black", "white", 
		25, shopYCoor[6], "Tie break", "center")); // add label last to make it easier to manipulate the track

	// add achievements (= # of players)
	$achievements = [];
	var temp = [0,1,2,3,4,5,6,7];
	shuffle(temp);
	var achieve = temp.splice(0, numPlayers);

	for (i = 0; i < achieve.length; i ++) {
		$achievements.push(new achievementCard(achieve[i], 635, 55 * i + 55));
	}
	$shopLabels.push(new component(120, 25, "black", "white", 635, 25, "Achievements", "center" ));
}

/*
 *  generate goods according to player count (num)
 */ 

function generateGoods(num) {
	var goods = [[],[],[],[],[],[]];
	for (i = 0; i < num; i++) {
		var a = ran(6);
		if (a < 5) {
			goods[0].push(Math.floor((a+1)/2) + 1); // 1,2,2,3,3
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
	// Shop #1 : restaurant. Players work part time and earn money.
	shops[0] = [];
	for (i = 0; i < goods[0].length; i++) {
		shops[0].push(new component(25, 25, "yellow", "black", 
			105 + 30 * i, shopYCoor[0], "$" + goods[0][i], "center", goods[0][i]));
		// $('#shop1').after($("<button></button>").text("$" + money).addClass("money"));
	}

	// Shop #2-4 : flower shops. Players buy flowers here.
	for (j = 1; j < 4; j ++) {
		shops[j] = [];
		for (i = 0; i < goods[j].length; i++) {
			var token = new flowerToken(goods[j][i][0], goods[j][i][1]);
			shops[j].push(new component(25, 25, shopColors[j], shopTColors[j], 
				105 + 30 * i, shopYCoor[j], goods[j][i][1], "center", token));
		}
	}
		// var shop = "shop" + (type + 2), flowertype = "flower" + (type + 1);
		// $('#' + shop).after($("<button></button>").text(flowers[i].quality).addClass(flowertype));

	// Shop #5 : book store. Players learn how to arrange flowers (draw a card).
	// create blank cards to display and interact first, and add text later
	shops[4] = [];
	for (i = 0; i < goods[4].length; i ++) {
		var a = goods[4][i];
		var card = new flowerCard(a[0], a[1], a[2], a[3], a[4]);
		shops[4].push(new component(40, 55, shopColors[4], shopTColors[4], 
			105 + 45 * i, shopYCoor[4], "", "center", card));
	}

	// Shop #6 : Tool shop. Players upgrade and buy stuff for their shop.
	for (i = 0; i < shops[5].length; i ++) {
		shops[5][i].object.levelUp(goods[5][i]);
		shops[5][i].newText(shops[5][i].object.toSymbol());
		$toolLevels[i].newText(shops[5][i].object.getLevelBar());
	}
}