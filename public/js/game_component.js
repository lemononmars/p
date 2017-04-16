///////////////////////////////////////////////////////////////////////////////////
// 	info of Flower Card
//	r0. r1. r2	: rose, orchid and mums respectively
//	quality 	: sum of quality of flowers must be at least this amount
//	score		: score gained once finished
///////////////////////////////////////////////////////////////////////////////////

function flowerCard(f0, f1, f2, quality, score, level) {
	this.flowers = new Array(f0, f1, f2); 	// required flowers
	this.quality = quality;
	this.score = score;					// base score
	this.level = level;					// difficulty

	// check if the player can arrange this flower card
	this.verify = function(flowerTokens, numRibbons, qualBonus) {
		var type = new Array(0,0,0);
		var sum = qualBonus + 2 * numRibbons;
		for (i = 0; i < flowerTokens.length; i++) {
			type[flowerTokens[i].type] += 1;
			sum += flowerTokens[i].quality;
		}
		if (sum < quality) {
			addNoti("Quality not satisfied");
			return false;
		}
		// need exact number for each type
		if(type[0] < this.flowers[0] || type[1] < this.flowers[1] || type[2] < this.flowers[2]) {
			addNoti("Not enough flowers of some type");
			return false;
		}
		if(type[0] > this.flowers[0] || type[1] > this.flowers[1] || type[2] > this.flowers[2]) {
			addNoti("Too many flowers of some type");
			return false;
		}
		// if it's possible to arrange with one fewer ribbon, why not? how kind I am !
		if (numRibbons > 0 && sum - 2 >= quality) {
			addNoti("Too many ribbons?");
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
	};

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

	this.toString = function() {
		return toolString[this.type][this.level] + ' for ฿' + toolCost[this.type][this.level];
	};	
}

// info of time token
function timeToken(id, value) {
	this.id = id;
	this.value = value;
}

// info of achievement cards
function achievementCard (type) {
	this.type = type;
	this.claimed = false;
	this.claimer = 0;

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
				this.claimed = (players[id].numPlayedCards >= 5);
				break;
			default:
				break;
		}
		if (this.claimed) {
			this.claimer = id;
			addLog(players[id].username + ' claimed an achievement #' + this.type + ' !', id);
			var t = this.type;
			$('.achievement_card').filter( 
				function() { return $(this).val() == t}
			).css('border-color',players[id].color);

			$('.achievement_card--large').filter( 
				function() { return $(this).val() == t}
			).addClass('achievement_card--claimed');
		}
		return this.claimed;
	};

	this.toString = function () {
		return achievementString[this.type];
	};

	this.getRewards = function() {
		return achievementRewards[this.type];
	};
}