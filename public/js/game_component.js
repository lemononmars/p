///////////////////////////////////////////////////////////////////////////////////
// 	info of Flower Card
//	r0. r1. r2	: rose, orchid and mums respectively
//	quality 	: sum of quality of flowers must be at least this amount
//	score		: score gained once finished
///////////////////////////////////////////////////////////////////////////////////

function flowerCard(f0, f1, f2, quality, score) {
	this.flowers = new Array(f0, f1, f2); 	// required flowers
	this.quality = quality;
	this.score = score;					// base score

	// check if the player can arrange this flower card
	this.verify = function(flowerTokens, numRibbons, qualBonus) {
		var type = new Array(0,0,0);
		var sum = qualBonus + 2 * numRibbons;
		for (i = 0; i < flowerTokens.length; i++) {
			type[flowerTokens[i].type] += 1;
			sum += flowerTokens[i].quality;
		}
		if (sum < quality) {
			addLog("Quality not satisfied");
			return false;
		}
		// need exact number for each type
		if(type[0] < this.flowers[0] || type[1] < this.flowers[1] || type[2] < this.flowers[2]) {
			addLog("Not enough flowers of some type");
			return false;
		}
		if(type[0] > this.flowers[0] || type[1] > this.flowers[1] || type[2] > this.flowers[2]) {
			addLog("Too many flowers of some type");
			return false;
		}
		// if it's possible to arrange with one fewer ribbon, why not? how kind I am !
		if (numRibbons > 0 && sum - 2 >= quality) {
			addLog("Too many ribbons?");
			return false;
		}
		return true;
	};

	this.getFlowers = function() {
		return this.flowers;
	};

	this.getFlowersAt = function(index) {
		if(index == 0 || index == 1 || index == 2)
			return this.flowers[index];
	};
	
	this.getRewards = function () {
		return this.rewards;
	};
}

///////////////////////////////////////////////////////////////////////////////////////////
// 							add extra text on components								//
///////////////////////////////////////////////////////////////////////////////////////////

// add text on a card
function fillCard(width, height, x, y, card) {
	ctx = myGameArea.context;
	ctx.font = "15px Arial";
	ctx.textAlign = "center";
	ctx.fillStyle = shopColors[1];
	var f = card.getFlowers();
	for (k = 0; k < 3; k ++) {
		ctx.fillStyle = shopColors[k+1];
		ctx.fillText(f[k],					x + (2*k+1)*width/6, y+15);
		ctx.fillText("*", 					x + (2*k+1)*width/6, y+15+ height/4);
	}
	ctx.fillStyle = "white";
	ctx.font = "10px Cordia";
	ctx.fillText("Qual:" + card.quality, x + 3*width/6, y+10 + 2*height/4);
	ctx.fillText("Score:" + card.score, x + 3*width/6, y+10 + 3*height/4);
}

//  info of flower token
function flowerToken(type, quality) {
	this.type = type; 		//range 0-2, possibly 3 for rainbow (expansion)
	this.quality = quality;	//range 1-4
}

// info of tool token
function toolToken(type) {
	this.type = type;	// see getString function for description
	this.level = 0;	// each tool has either level 0,1 or 2

	this.getCost = function() {
		return toolCost[this.type][this.level];
	}

	// return the number of tools you get (1 or 2)
	this.getAmount = function() {
		return toolAmount[this.type][this.level];
	};
	
	this.getLevelBar = function() {
		if (this.level == 0)
			return '-';
		else if (this.level == 1)
			return '- -';
		else
			return '- - -';
	};

	this.levelDown = function (l) {
		this.level = Math.max(0, this.level - l);
	};
	
	this.levelUp = function(l) {
		this.level = Math.min(2, this.level + l);
	}

	this.toSymbol = function() {
		return toolSymbol[this.type][this.level] + '\n $' + toolCost[this.type][this.level];
	};

	this.toString = function() {
		return toolSymbol[this.type][this.level] + ' for ' + toolCost[this.type][this.level];
	};

	
}

// info of time token
function timeToken(id, value) {
	this.id = id;
	this.value = value;
}

function achievementCard (type, x, y) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.claimed = false;

	this.check = function(id) {
		var stars = players[id].getStars();
		// remove this if several players can claim the same achievement
		if (this.claimed)
			return false;

		switch(this.type) {
			case 0:
				this.claimed = (stars[0] >= 6);
				break;
			case 1:
				this.claimed = (stars[1] >= 6);
				break;
			case 2:
				this.claimed = (stars[2] >= 6);
				break;
			case 3:
				this.claimed = (stars[0] >= 4 && stars[1] >= 4);
				break;
			case 4:
				this.claimed = (stars[0] >= 4 && stars[2] >= 4);
				break;
			case 5:
				this.claimed = (stars[1] >= 4 && stars[2] >= 4);
				break;
			case 6:
				this.claimed = (stars[0] >= 3 && stars[1] >= 3 && stars[2] >= 3);
				break;
			case 7:
				this.claimed = (players[id].numPlayedCards >= 6);
				break;
			default:
				break;
		}
		return this.claimed;
	};

	this.toString = function () {
		return achievementString[this.type];
	};

	this.getRewards = function() {
		return achievementRewards[this.type];
	};

	this.update = function() {
		ctx = myGameArea.context;
		ctx.fillStyle = "brown";
		ctx.fillRect(this.x, this.y, 120, 50);
		ctx.font = "15px";
		ctx.textAlign = "center";
		// fill achievement's requirement
		if (!this.claimed) {
			switch(this.type) {
				case 0: case 1: case 2:
					ctx.fillStyle = shopColors[this.type + 1];
					ctx.fillText('★★★★★★', this.x + 60, this.y + 20);
					break;
				case 3:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★★★★', this.x + 30, this.y + 20);
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★★★★', this.x + 90, this.y + 20);
					break;
				case 4:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★★★★', this.x + 30, this.y + 20);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★★★★', this.x + 90, this.y + 20);
					break;
				case 5:
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★★★★', this.x + 30, this.y + 20);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★★★★', this.x + 90, this.y + 20);
					break;
				case 6:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★★★', this.x + 20, this.y + 20);
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★★★', this.x + 60, this.y + 20);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★★★', this.x + 100, this.y + 20);
					break;
				case 7:
					ctx.fillStyle = "white";
					ctx.fillText('6 bouquets', this.x + 60, this.y + 20);
					break;
			}
			// fill achievement rewards
			ctx.fillStyle = "white";
			ctx.fillText('Get:', this.x + 12, this.y + 40)
			switch(this.type) {
				case 0:
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★', this.x + 40, this.y + 40);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★', this.x + 50, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('2VP', this.x + 70, this.y + 40);
					break;
				case 1:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★', this.x + 40, this.y + 40);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★', this.x + 50, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('2VP', this.x + 70, this.y + 40);
					break;
				case 2:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★', this.x + 40, this.y + 40);
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★', this.x + 50, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('2VP', this.x + 70, this.y + 40);
					break;
				case 3:
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★★', this.x + 40, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('1VP $2', this.x + 80, this.y + 40);
					break;
				case 4:
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★★', this.x + 40, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('1VP $2', this.x + 80, this.y + 40);
					break;
				case 5:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★★', this.x + 40, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('1VP $2', this.x + 80, this.y + 40);
					break;
				case 6:
					ctx.fillStyle = shopColors[1];
					ctx.fillText('★', this.x + 40, this.y + 40);
					ctx.fillStyle = shopColors[2];
					ctx.fillText('★', this.x + 50, this.y + 40);
					ctx.fillStyle = shopColors[3];
					ctx.fillText('★', this.x + 60, this.y + 40);
					ctx.fillStyle = "white";
					ctx.fillText('$2', this.x + 80, this.y + 40);
					break;
				case 7:
					ctx.fillStyle = "white";
					ctx.fillText('3 VP', this.x + 60, this.y + 40);
					break;
			}
		}
	}
}