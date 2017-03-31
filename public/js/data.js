// constant variables

var botNames = ['Mel', 'Game', 'Job', 'Lui', 'Poupe', 'Due', 'Au', 'Som', 'Benz', 'Aon', 'Oak', 'Boat', 'Tana'];
var playerColors = ['aquamarine', 'bisque', 'coral', 'darkseagreen', 'peru', 'lightcyan'];
var shopList = ['Restaurant', 'Rose', 'Orchid', 'Mums', 'Bookstore', 'Tool'];
var shopColors = ['yellow', 'pink', 'skyblue', 'white', 'purple', 'lightgreen'];
var shopTColors = ['black', 'black', 'white', 'black', 'white', 'black'];
var shopYCoor = [55, 85, 115, 145, 175, 235, 280];
var timeTokenList = [0, 1, 2, 3, 4, 'x', 'xx'];
var bonusSymbols = ['+Q', '$', 'VP'];		// quality, money, score

var toolCost = [[3,5,4], 
				[3,2,4], 
				[1,2,1], 
				[2,1,0], 
				[1, 0, 0]];

var toolAmount = [	[1, 2, 2], 
					[1, 1, 2], 
					[1, 2, 2], 
					[1, 1, 1],
					[1, 1, 1]];

var toolSymbol = [	['Ø', 'ØØ', 'ØØ'], 
					['Ÿ', 'Ÿ', 'ŸŸ'], 
					['œ', 'œœ', 'œœ'], 
					['✿', '✿', '✿'],
					['«', '«', '«']];

var achievementSymbol = [0,1,2,3,4,5,6,7];

var achievementString = [	'6 pink', '6 blue', '6 white', 
							'4 pink & 4 blue' , '4 pink & 4 white', '4 blue & 4 white',
							'3 pink & blue & white',
							'6 finished cards'];

// [pink, blue, white, score, money]
var achievementRewards = [	[0,1,1,2,0], [1,0,1,2,0], [1,1,0,2,0],
							[0,0,2,1,2], [0,2,0,1,2], [2,0,0,1,2],
							[1,1,1,0,2],
							[1,1,1,2,0]];

var achievementRewardString = [ 	'blue + white + 2 VP', 'pink + white + 2 VP', 'blue + pink + 2 VP',
						'2 white + 1 VP + $2', '2 blue + 1 VP + $2', '2 pink + 1 VP + $2',
						' 1 white & blue & pink + $2',
						'1 white & blue & pink + 2 VP'];

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
					];	// number of flowers [ [1], [2], [3], [4], [5] ]
	var c = randomWithWeight([1, 4, 6, 3, 1]);
	var a = allCards[c][ran(allCards[c].length)];
	var l = randomWithWeight([3, 2, 1]);

	var qual = Math.ceil((a[0] + a[1] + a[2]) * 2.5) + l * 3;  
	return [a[0], a[1], a[2], qual, (a[0] + a[1] + a[2] -1 ) * 2 + l * 2]; // score = 1 + 2*(total-1) + 2*level
}

// return array of length 5 where a[i] = # tools drawn for tool of type i
	// 0: clock
    // 1: vase
    // 2: ribbon
    // 3: buy flower
    // 4: tie break
	// 5: nothing (blank)
function getTools(num) {
	var tools = [0,0,0,0,0,0];
	for (j = 0; j < num; j ++)
		tools[ran(6)] ++;
	return tools;
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