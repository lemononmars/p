var players; 		// list of players
var numPlayers;
var numBots = 0;
var gameState;		//	1 = loading screen, 2 = playing, 3 = game end
var turn;			// number of turns passed, starting at 1
var phase;
var timeStart;		// time the game starts
/* phase: each round consists of 4 phases
	0. early bird phase	- each player can spend 3 action cubes to buy anything in the market
	1. planning	phase	- each player assigns each shop a time token simultaneously
	2. buy phase		- players get to buy goods in time token order, tie broken by buy order
	3. aftermarket phase- each player can spend 2 action cubes to buy anything left in the market
	4. arranging phase	- players arrange any number of flowers from their hand
*/
var buyFlowerToolToken = false;	// boolean for tool token that allows you to buy leftover flower
var autoplay = false;	// true = let bot play for you

var currentPlayer;		// who is playing
var myusername;			
var myID;
var gameID;
var selectedFlowerCard;	// card currently selected (arranging phase)
var startingMoney = 5;
var handLimit = 4;
var tutorial = true;	// on: detailed description of each phase is displayed in log
var isDone = false;		// check if you finish and are waiting for other players

var ctx;				// pointed to the canvas
var shops; 				// list of goods components displaying in each shop
var activeShop;			// which shop is opening now (buy phase):
var activeTokenOrder;	// which token in the shop is taking an action
var tieBreak;			// determine who buys first in case of tie

var $achievements;		// component for achievements

//////////////////////////////////////////////////////////////////////////////////////
// add a player after username is submitted and display waiting room
//////////////////////////////////////////////////////////////////////////////////////

function startGame(data) {

	$('#game_board').show();
	// initialize various values
	myID = data.players.indexOf(myusername);
	gameID = data.gameId;
	players = [];
	for (var p in data.players)
		players.push(new player(p, data.players[p], playerColors[p], false));
	// add highly competitive bots
	for (i = 0; i < data.numBots; i ++) {
		var bname = botNames[ran(botNames.length)];
		players.push(new player(players.length, bname + '#' + i, playerColors[players.length], true));
	}

	numPlayers = players.length;
	numBots = data.numBots;
	gameState = 2;
	turn = 1;
	phase = 0;
	var d = new Date();
	timeStart = d.getTime();
	
	tieBreak = [];
	// only let one player sends the server an inquiry
	if (myID == 0) {
		var bonus = [0,1,2,3,4,5];
      	shuffle(bonus);
		for (i = 0; i < numPlayers; i ++) 
			tieBreak.push(i);
		shuffle(tieBreak);

		socket.emit('give starting stuff', {
			flowerCards : generateStartingFlowerCards(),
			bonuses : bonus,
			tieBreak: tieBreak
		})

		socket.emit('generate market', generateGoods(numPlayers));
	}
}

///////////////////////////////////////////////////////////////////////////////////////////	
///////////////////////////////////////////////////////////////////////////////////////////
//				         Helper functions   											//
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function addLog(msg, id) {
	var color;
	if (addLog.arguments.length == 1)
		color = "white";
	else
		color = players[id].color;

	var $log = $('<div/>').text(msg)
		.css({"background-color" : color});
	$('#gamelog').append($log);
	$('#gamelog').scrollTop($('#gamelog')[0].scrollHeight);
}

// return a random integer from 0 to a-1 inclusive
function ran(a) {
	return Math.floor(Math.random() * a);
}

// shuffle, just because
function shuffle(a) {
	var j, x, i;
	for (i = a.length; i; i--) {
		j = ran(i);
		x = a[i - 1];
		a[i - 1] = a[j];
		a[j] = x;
	}
}

// collect, sort, and create components for all player's time tokens
function collectTimeTokens() {
	$allPlayedTimeTokens = [[],[],[],[],[],[]];

	// sort them and then create components for tokens
	for (k = 0; k < 6; k ++) {
		var temp = [];
		var area = k+1;
		for (j = 0; j < numPlayers; j++)
			temp.push(new timeToken(j,players[j].myPlayedTimeTokens[k]));
		sortTimeToken(temp);

		// display each token
		for (l = 0; l < temp.length; l++) {
			var d = temp[l].id;
			var $tt = $('<div/>')
						.css('background-color', players[d].color)
						.addClass('time_token')
						.text(timeTokenList[temp[l].value])
						.val(d);
			// X and XX tokens are to be ignored
			if (temp[l].value > 4) {
				$tt.css('opacity', 0.2);
				$tt.val(-1);
			}
			$('#timetokenarea' + area).append($tt);
		}
	}
}

// sort given time tokens
function sortTimeToken(a) {
	for(i = 0; i < a.length; i ++) {
		var low = i;
		for (j = i+1; j < a.length; j ++) {
			if(a[j].value < a[low].value || 
				(a[j].value == a[low].value && tieBreak.indexOf(a[j].id) < tieBreak.indexOf(a[low].id))) 
				low = j;
		}
		x = a[i];
		a[i] = a[low];
		a[low] = x;
	}
}

// move player id to the first (leftmost) in tie break track
function goFirst(id) {
	var t = tieBreak.indexOf(Number(id));
	tieBreak.splice(t, 1);
	tieBreak.unshift(Number(id));
	if (t > 0)
		$('.tie_break_token').eq(0).before( $('.tie_break_token').eq(t) );
}

// find the next player
function nextPlayer () {

	var nextP = -1;
	// during phase 2, the next player is determined by time token
	if (phase == 2) {
		activeTokenOrder++;
		// move to the next shop if no one else can buy
		if (activeTokenOrder >= numPlayers || getActiveTimeToken() == -1) {
			activeTokenOrder = 0;
			activeShop++;
			// go through all x tokens
			while(activeShop < 6 && getActiveTimeToken() == -1)
				activeShop++;

			// remove .active class (blinking)
			$('.shop').removeClass('active');
			$('.shop').eq(activeShop).addClass('active');
		}

		$('.time_token').removeClass('active');
		$('.time_token_area').eq(activeShop).children('.time_token')
			.eq(activeTokenOrder).addClass('active');

		if (activeShop < 6) {
			nextP = getActiveTimeToken();
		}
		else {
			$('.shop').removeClass('active');
			$('.time_token').removeClass('active');
			if (myID == 0)
				socket.emit('end phase', {
					phase : phase
				});
			nextP = -1;
		}
	}
	// during phase 0 and 3, the next player is determined by tie break order
	else if (phase == 0 || phase == 3) {
		// find the next player who has enough action cubes to spend
		var cubesNeeded = (phase == 0)? 3 : 2; 
		// currentPlayer is set to be -1 at the beginning of phase 0 & 3
		var index = (currentPlayer == -1) ? 0: tieBreak.indexOf(currentPlayer) + 1;
		while (index < numPlayers && players[tieBreak[index]].actionCubes < cubesNeeded) {
			index++;
		}
		if (index < numPlayers)
			nextP = tieBreak[index];
		else if(myID == 0) {
			socket.emit('end phase', {
				phase : phase	
			});
			nextP = -1;
		}
	}

	currentPlayer = nextP;
	// if the next player is a bot, let it take some action
	if (nextP >= 0 && myID == 0 && players[nextP].isBot) {
		botAction(nextP);
	}
}

function getActiveTimeToken() {
	return $('.time_token_area')
			.eq(activeShop).children('.time_token')
			.eq(activeTokenOrder).val();
}

// game end when one of the following conditions is met
// 1. 10 turns has passed
// 2. some player gets at least 7 stars in one color
// 3. some player gets at least 50 points

function checkEndGame() {
	var turnThreshold = 10,
	scoreThreshold = 40,
	starThreshold = 7,
	end = false;

	if (turn >= turnThreshold)
		return true;
	
	var maxScore = 0;
	for (const p in players) {
		var maxStars = 0;
		for (const s in players[p].stars) {
			if (players[p].stars[s] > maxStars)
				maxStars = players[p].stars[s];
		}
		if (maxStars >= starThreshold) {
			end = true;
			players[p].score += 2;	// extra points for reaching the threshold
		}
		if (players[p].score > maxScore)
			maxScore = players[p].score;
	}
	
	if (maxScore >= scoreThreshold)
		end = true;
	return end;
}