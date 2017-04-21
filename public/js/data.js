// constant variables
/* 		<script src ="js/bot.js"></script>
		<script src = "js/data.js"></script>
		<script src = "js/game_client.js"></script>
		<script src = "js/game.js"></script>
		<script src = "js/lobby_client.js"></script>
		<script src = "js/player.js"></script>
		<script src = "js/player_action.js"></script>
		<script src = "js/setup.js"></script>
		<script src = "js/game_component.js"></script>
	*/
var botNames = ['Mel', 'Game', 'Job', 'Lui', 'Poupe', 'Due', 'Au', 'Som', 'Benz', 'Aon', 'Oak', 'Boat', 'Tana'];
var playerColors = ['aquamarine', 'bisque', 'coral', 'darkseagreen', 'peru', 'lightcyan'];
var shopList = ['Restaurant', 'Rose', 'Orchid', 'Mums', 'Bookstore', 'Tool'];
var shopColors = ['yellow', 'pink', 'skyblue', 'white', 'purple', 'lightgreen'];
var timeTokenList = [0, 1, 2, 3, 4, 'x', 'x'];
var bonusTypeString = ['Quality bonus', 'Money bonus', 'Score bonus'];
var cardLevelStars = ['*', '**', '***'];

var toolCost = [[3,5,4], 
				[3,2,4], 
				[1,2,1], 
				[2,1,0], 
				[1,0,0]];

var toolAmount = [	[1, 2, 2], 
					[1, 1, 2], 
					[1, 2, 2], 
					[1, 1, 1],
					[1, 1, 1]];

var toolString = [	['a clock', 'two clocks', 'two clocks'], 
					['a vase', 'a vase', 'two vases'], 
					['a ribbon', 'two ribbons', 'two ribbons'], 
					['a flower', 'a flower', 'a flower'],
					['First in Tie Break', 'First in Tie Break', 'First in Tie Break']];

var achievementSymbol = [0,1,2,3,4,5,6,7];

var achievementString = [	'6 pink', '6 blue', '6 white', 
							'4 pink & 4 blue' , '4 pink & 4 white', '4 blue & 4 white',
							'3 pink & blue & white',
							'5 finished cards'];

// [pink, blue, white, score, money]
var achievementRewards = [	[0,0,0,5,0], [0,0,0,5,0], [0,0,0,5,0],
							[0,0,0,3,3], [0,0,0,3,3], [0,0,0,3,3],
							[1,1,1,0,5],
							[0,0,0,5,0]];

function generateStartingFlowerCards () {
	var startingFlowerCards = [];
	startingFlowerCards.push([0, 1, 1, 3, 1, 0]);
	startingFlowerCards.push([0, 1, 1, 3, 1, 0]);
	startingFlowerCards.push([1, 0, 1, 3, 1, 0]);
	startingFlowerCards.push([1, 0, 1, 3, 1, 0]);
	startingFlowerCards.push([1, 1, 0, 3, 1, 0]);
	startingFlowerCards.push([1, 1, 0, 3, 1, 0]);
	shuffle(startingFlowerCards);
	return startingFlowerCards;
}

function getRandomFlowerToken() {
	var type = [0,0,0,0,	1,1,1,1,	2,2,2,2];
	var qual = [1,3,3,3,	2,2,3,3,	2,2,2,4];
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
	var c = randomWithWeight([2, 6, 6, 3, 0]);	// remove 5-flower cards because the icons don't fit....
	var a = allCards[c][ran(allCards[c].length)];
	var l = randomWithWeight([3, 2, 1]);

	var total = a[0] + a[1] + a[2];
	var qual = Math.ceil(total * 2.5) + l * 3; 
	var score = ( total - 1 ) * 2 + l * 2;
	return [a[0], a[1], a[2], qual, score, l]; // score = 2*(total-1) + 2*level
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