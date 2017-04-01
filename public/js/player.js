function player(id, username, color, bot) {
	this.id = id;
	this.username = username;
	this.color = color;
	this.isBot = bot;				// true = bot
	this.y = 325;					// y coordinate

	this.score = 0;
	this.money = 0;
	this.numVases = 3;				// max number of flowers
	this.vases = [];				// components of fresh flowers
	this.time = 0;
	this.myPlayedTimeTokens = [];	// played time tokens (planning phase)
	this.stars = new Array(0,0,0); 	// number of flowers you've arranged (called experience)
	this.bonus = new Array(0,0,0);	// stars of type bonus[i] give bonus i   
									// bonus: 0 = qual, 1 = money, 2 = score
	this.hand = []; 				// component of flower cards in hand not yet arranged
	this.numPlayedCards = 0;		// number of flower cards played
	this.numRibbons = 0;
	this.actionCubes = 0;			// cubes you gain when you pass

    // draw a flower card and add it to your hand
	this.drawFlowerCard = function(card) {
		var x = 425 + this.hand.length*45;
		this.hand.push(new component(40, 50, shopColors[4], shopTColors[4], x, this.y, "", "center", card));
	};

	// discard a card and reindex components
	this.discardFlowerCard = function(index) {
		if (index >=0 && index < this.hand.length) {
			if (phase != 4)
				addLog(this.username + " discards a card", this.id);
			this.hand.splice(index, 1);
			for (i = index; i < this.hand.length; i ++) {
				this.hand[i].moveTo(425 + 45*i, this.y) ;
				if (myID == this.id)
					this.hand[i].update();
			}
			return true;
		}
		return false;
	};

    // get a flower token and add it to your vase
	this.getFlowerToken = function(t) {
		var x = 100 + 25*this.vases.length;
		this.vases.push(new component(20, 20, shopColors[t.type + 1], shopTColors[t.type + 1], 
			x, this.y + 35, t.quality, "center", t));
	};

	// discard a flower token and reindex components
	this.discardFlowerToken = function(index) {
		if (index >=0 && index < this.vases.length) {
			if (phase != 4)
				addLog(this.username + " discards a " + shopList[this.vases[index].object.type + 1], this.id);
			this.vases.splice(index, 1);
			for (i = index; i < this.vases.length; i ++) {
				this.vases[i].moveTo(100 + 25*i, this.y + 35);
				if (myID == this.id)
					this.vases[i].update();
			}
			return true;
		}
		return false;
	};

	// get a tool token and upgrade accordingly
	this.getToolToken = function(toolToken) {
		switch(toolToken.type) { // refer to toolToken
			case 0:	
				this.time += toolToken.getAmount();
				if(this.time > 6) 
					this.time = 6;
				this.score += toolToken.getAmount();
				break;
			case 1:
				this.numVases += toolToken.getAmount();
				if(this.numVases > 6) 
					this.numVases = 6;
				this.score += toolToken.getAmount();
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
	};

    // get the list of usable time tokens for this player
	this.getMyTimeTokens = function() {
		var a = [0,1,2,3,4,5,6];
		a.splice(this.time, 1);
		return a;
	};

    // get the string representing usable time tokens 
	this.getTimeTokensString = function () {
		var str = "";
		for (i = 0; i < 7; i ++)
			if (i != this.time)
				str = str + "( " + timeTokenList[i] + " )";
			else
				str = str + "( * )";
		return str;
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
		var s = this.hand[cardIndex].object.getFlowersAt(this.bonus.indexOf(2)) + this.hand[cardIndex].object.score;
		this.score += s;
		for (i = 0; i < 3; i ++)
			this.stars[i] += this.hand[cardIndex].object.getFlowersAt(i);
		this.numPlayedCards += 1;
		this.money += this.getBonus(1);

		// add log
		addLog(this.username + " arranges a bouquet ~", this.id);
		addLog("...." + this.username + " gains $" + this.stars[this.bonus[1]], this.id);
		addLog("...." + this.username + " gets " + s + " points", this.id);

		// spend resources
		this.numRibbons -= ribbonsUsed;
		this.discardFlowerCard(cardIndex);
		tokenIndices.sort(function(a,b){return b-a;}); 
		//sort from highest to lowest
		for(j = 0; j < tokenIndices.length; j ++) {
			this.discardFlowerToken(tokenIndices[j]); //remove from highest
		}
	};

	this.getAchievementRewards = function(rw) {
		addLog(this.username + ' claimed an achievement !', this.id);
		this.stars[0] += rw[0];
		this.stars[1] += rw[1];
		this.stars[2] += rw[2];
		this.score += rw[3];
		this.money += rw[4];
 	};

	// display player's board on the screen
	this.update = function () {
		ctx.fillStyle = this.color;
		ctx.fillRect(25, this.y - 5, 600, 60);

		ctx.fillStyle = "black";
		ctx.font = "15px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Score:" + this.score, 			80, this.y + 10);
		ctx.fillText("$" + this.money, 					150, this.y + 10);
		ctx.fillText("œ " + this.numRibbons,			190, this.y + 10);
		// add stars and corresponding bonus symbols
		ctx.fillText('★', 								270, this.y + 10)
		for (j = 0; j < 3; j ++) {
			ctx.fillStyle = shopColors[j+1];
			ctx.fillRect(295+40*j, this.y - 5, 40, 20);
			ctx.fillStyle = shopTColors[j+1];
			ctx.fillText(bonusSymbols[this.bonus.indexOf(j)],	300 + 40*j, this.y + 10);
			ctx.fillText(this.stars[j], 						320 + 40*j, this.y + 10);
		}
		// add cards
		ctx.fillText("Ø: " + this.getTimeTokensString(),			80, this.y + 28);
		ctx.fillText(this.username,									30, this.y + 30);
		ctx.fillText("#Bouquets: " + this.numPlayedCards,			300, this.y + 30);
		ctx.fillText("Ÿ",											80, this.y + 50);
		ctx.fillText("Action cubes: " + this.actionCubes,			300, this.y + 50);
		for (j = 0; j < this.vases.length; j ++)
			this.vases[j].update();

		// add text on the cards
		for (j = 0; j < this.hand.length; j ++) {
			this.hand[j].update();
			fillCard(40, 50, 425 + 45*j, this.y, this.hand[j].object);
		}

		// add vase's borders
		for (j = 0; j < this.numVases; j ++) {
			ctx.beginPath();
			ctx.lineWidth = "1";
			ctx.strokeStyle = "black";
			ctx.rect(100 + 25*j, this.y + 35, 20, 20);
			ctx.stroke();
		}
	};

	// update partial information on other player's screen
	this.miniUpdate = function(index) {
		var top = Math.floor(index/2) * 65 + 390;
		var left = (index % 2) * 305 + 25;

		ctx.fillStyle = this.color;
		ctx.fillRect(left, top - 5, 295, 60);
		// left = 25
		ctx.fillStyle = "black";
		ctx.font = "15px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Score:" + this.score, 			left + 55, top + 10);
		ctx.fillText("$" + this.money, 					left + 125, top + 10);
		ctx.fillText("#Bouq:" + this.numPlayedCards, 	left + 235, top + 50);
		// add stars and corresponding bonus symbols
		for (j = 0; j < 3; j ++) {
			ctx.fillStyle = shopColors[j+1];
			ctx.fillRect(left + 170 + 40*j, top - 5, 40, 20);
			ctx.fillStyle = shopTColors[j+1];
			ctx.fillText(bonusSymbols[this.bonus.indexOf(j)],	left + 175 + 40*j, top + 10);
			ctx.fillText(this.stars[j], 						left + 195 + 40*j, top + 10);
		}
		// add cards
		ctx.fillText("Ø: " + this.getTimeTokensString(),			left + 55, top + 28);
		ctx.fillText(this.username,									left + 5, top + 30);
		ctx.fillText("Ÿ",											left + 55, top + 50);
		for (j = 0; j < this.vases.length; j ++) {
			var ft = this.vases[j].object
			ctx.fillStyle = shopColors[ft.type + 1];
			ctx.fillRect(left + 75 + 25 *j, top + 35, 20, 20);
			ctx.fillStyle = shopTColors[ft.type + 1];
			ctx.fillText(ft.quality,		left + 82 + 25 * j, top + 50);
		}

		// add vase's borders
		for (j = 0; j < this.numVases; j ++) {
			ctx.beginPath();
			ctx.lineWidth = "1";
			ctx.strokeStyle = "black";
			ctx.rect(left + 75 + 25*j, top + 35, 20, 20);
			ctx.stroke();
		}
	};
}