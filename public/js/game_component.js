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

//  info of flower token
function flowerToken(type, quality) {
	this.type = type; 		//range 0-2, possibly 3 for rainbow (expansion)
	this.quality = quality;	//range 1-4
}

// info of tool token
function toolToken(type, cost) {
	this.type = type;	// see getString function for description
	this.cost = cost;
	this.toSymbol = function() {
		var text = "";
		switch(type) {
			case 0: text = "C"; break;		// clock
			case 1: text = "CC"; break;	// two clocks
			case 2: text = "V"; break;		// vase
			case 3: text = "R"; break;		// ribbon
			case 4: text = "RR"; break;	// two ribbons
			case 5: text = "F"; break;		// buy flower
			case 6: text = "T";			// first buy order
		}
		return text + ":" + this.cost;
	};
	this.toString = function() {
		switch(type) {
			case 0: return "a Clock.";	
			case 1: return "two Clocks.";
			case 2: return "a Vase.";
			case 3: return "a Ribbon.";
			case 4: return "two Ribbons.";
			case 5: return "* buy a flower.";
			case 6: return "1st in tie break";
			default: return "what?";
		}
	};
}

// info of time token
function timeToken(id, value) {
	this.id = id;
	this.value = value;
}

