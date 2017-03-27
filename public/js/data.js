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
	// randomly hand crafted
	// better be predetermined
	var num = ran(2) + 2; // 2,3,4 flowers required
	var a1 = ran(2);
	var a2 = ran(num-a1);
	var a3 = num-a1-a2;
	var e = ran(6), level;	// the higher level, the higher quality is required
	switch(e) {
		case 0:
			level = 2; break;
		case 1: case 2:
			level = 1; break;
		default:
			level = 0; break; 
	}
	var qual = Math.ceil((a1 + a2 + a3) * 2.5) + level * 3;  
	return [a1, a2, a3, qual, 2 + level * 2];
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

