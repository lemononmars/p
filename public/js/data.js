function generateStartingFlowerCards () {
	var startingFlowerCards = [];
	startingFlowerCards.push([0, 1, 1, 3, 1]);
	startingFlowerCards.push([0, 1, 1, 3, 1]);
	startingFlowerCards.push([1, 0, 1, 3, 1]);
	startingFlowerCards.push([1, 0, 1, 3, 1]);
	startingFlowerCards.push([1, 1, 0, 3, 1]);
	startingFlowerCards.push([1, 1, 0, 3, 1]);
	shuffle(startingFlowerCards);
	return startingFlowerCards;
}

function getRandomFlowerToken() {
	var type = [0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2];
	var qual = [1,2,3,3,3,3,1,2,2,3,3,4,2,2,2,2,3,4];
	var a = ran(type.length);
	return [type[a], qual[a]];
}

function getRandomFlowerCard() {
	var allCards = 	[	[[1,0,0], [0,1,0], [0,0,1]],
						[[2,0,0], [0,2,0], [0,0,2], [1,1,0], [1,0,1], [0,1,1]], 
						[[2,1,0], [2,0,1], [1,2,0], [1,0,2], [0,2,1], [0,1,2], [1,1,1]],
						[[2,2,0], [2,0,2], [0,2,2], [2,1,1], [1,2,1], [1,1,2]],	
						[[2,2,1], [2,1,2], [1,2,2]]	
					];	// [ [1], [2], [3], [4], [5]
	var c = randomWithWeight([1, 4, 6, 3, 1]);
	var a = allCards[c][ran(allCards[c].length)];
	var l = randomWithWeight([1, 2, 3]);

	var qual = Math.ceil((a[0] + a[1] + a[2]) * 2.5) + l * 3;  
	return [a[0], a[1], a[2], qual, (a[0] + a[1] + a[2] -1 ) * 2 + l * 2]; // score = 2*(total-1) + 2*level
}

function getTools() {
	// each pair of type/cost represents different dice.
	// 0: 1 clock
    // 1: 2 clocks
    // 2: 1 vase
    // 3: 1 ribbon
    // 4: 2 ribbons
    // 5: buy flower
    // 6: first in tie break track
	var type1 = [0,0,0,2,2,2];
	var cost1 = [4,4,4,2,2,2];
	var type2 = [0,0,2,2,4,4];
	var cost2 = [5,5,3,3,1,1];
	var type3 = [3,5,5,6,6,6];
	var cost3 = [1,0,0,0,0,0];
	var tools = [];

	var a = ran(6);
	tools.push([type1[a], cost1[a]]);		// one type 1 die
	for (i = 0; i < 2; i ++) {
		a = ran(6);
		tools.push([type2[a], cost2[a]]);	// two type 2 dice
	}
	for (i = 0; i < 3; i ++) {
		a = ran(6);
		tools.push([type3[a], cost3[a]]);	// three type 3 dice
	}
	return tools;
}

function generateAchievements () {

}

// get a random number in range (0... a.length-1)
// where P(i) = a[i]/(sum a[k])
function randomWithWeight(a) {
	var total = 0, index = 0;
	for (k = 0; k < a.length; k ++)
		total += a[k];
	var r = ran(total) + 1;
	while(r > a[index] && index < a.length - 1) {
		r = r - a[index];
		index ++;
	}
	return index;
}