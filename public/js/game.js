var players; 		// list of players
var numPlayers;
var gameState;		//	0 = start screen, 1 = waiting for players, 2 = playing, 3 = game end
var turn;			// number of turns passed, starting at 0
var phase;
/* phase: each round consists of 4 phases
	0. early bird phase	- each player can spend 3 action cubes to buy anything in the market
	1. planning	phase	- each player assigns each shop a time token simultaneously
	2. buy phase		- players get to buy goods in time token order, tie broken by buy order
	3. aftermarket phase- each player can spend 2 action cubes to buy anything left in the market
	4. arranging phase	- players arrange any number of flowers from their hand
*/
var buyFlowerToolToken = false;	// boolean for tool token that allows you to buy leftover flower

var currentPlayer;	// who is playing
var myusername;
var myID;
var gameID;
var selectedFlowerCard;	// card currently selected (arranging phase)
var startingMoney = 5;
var handLimit = 4;
var tutorial = true;	// on: detailed description of each phase is displayed in log
var isDone = false;		// check if you finish and are waiting for other players
var numBots = 0;

var statusBar;
var shopLabels; 		// mainboard consists of shop names
var shops; 				// list of goods components displaying in each shop
var activeShop;			// which shop is opening now (buy phase):
var activeTokenOrder;	// which token in the shop is taking an action
var allPlayedTimeTokens;	// list of played time tokens on the board (buy phase)
var myTimeTokenButtons;	// time token components displayed on the board (planning phase)
var tieBreak;			// determine who buys first in case of tie
var tieBreakTrack;		// components for buy order track
var passButton;			// pass button used in many phases
var submitButton;		// submit and verify your flower arrangement
var addRibbonsButton;	// component for adding more ribbons (arranging phase) 

var playerBoards;		// player board displays points, flower tokens, etc.
var playLogWindow;		// component
var playLogs;			// messages

var playerColors = ["aquamarine", "bisque", "coral", "darkseagreen", "peru", "lightcyan"];
var shopList = ["Restaurant", "Rose", "Orchid", "Mums", "Bookstore", "Tool"];
var shopColors = ["yellow", "pink", "skyblue", "white", "purple", "lightgreen"];
var shopTColors = ["black", "black", "white", "black", "white", "black"];
var shopYCoor = [55, 85, 115, 145, 175, 235, 265];
var timeTokenList = [0, 1, 2, 3, 4, "x", "xx"];
var bonusSymbols = ["Q", "$", "S"];		// quality, money, score

//////////////////////////////////////////////////////////////////////////////////////
// add a player after username is submitted and display waiting room
//////////////////////////////////////////////////////////////////////////////////////

function startGame(data) {

	// initialize various values
	myID = data.players.indexOf(myusername);
	gameID = data.gameId;
	players = [];
	for (var p in data.players)
		players.push(new player(p, data.players[p], playerColors[p], false));
	// add highly competitive bots
	for (i = 0; i < data.numBots; i ++)
		players.push(new player(players.length, 'bot#' + i, playerColors[players.length], true));

	numPlayers = players.length;
	numBots = data.numBots;
	gameState = 2;
	turn = 1;
	phase = 0;

	// only let one player sends the server an inquiry
	if (myID === 0) {
		socket.emit('generate market', generateGoods(numPlayers));
		var bonus = [0,1,2,3,4,5];
      	shuffle(bonus);
		socket.emit('give starting stuff', {
			flowerCards : generateStartingFlowerCards(),
			bonuses : bonus
		})
	}

	myGameArea.start();	// add the main canvas
	boardSetup();	// add labels on the board
	currentPlayer = tieBreak[0];
}

///////////////////////////////////////////////////
//		generate and add main canvas to html	 //
///////////////////////////////////////////////////

var myGameArea = {
	canvas: document.createElement("canvas"),
	start: function() {
		this.canvas.width = 800;
		this.canvas.height = 800;
		this.canvas.border = "5px";
		this.context = this.canvas.getContext("2d");
		$("#game_board").append(this.canvas);
		this.interval = setInterval(checkForInput, 20);
		var rect = this.canvas.getBoundingClientRect();
		window.addEventListener("click", function(e) {
			myGameArea.x = e.pageX - rect.left;
			myGameArea.y = e.pageY - rect.top;
		});
	},
	clear: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
};

/////////////////////////////////////////////////////////////////////////
//
// 		update the canvas according to each game state
//		and check for user input (click)
//
/////////////////////////////////////////////////////////////////////////

function checkForInput() {

	/////////////////////////////////
	// Game State 1: loading screen
	// wait until all players finish loading the board
	/////////////////////////////////
	if (gameState == 1) {
		// perpetually rolling ball
	}
	/////////////////////////////////
	// Game State 2: main game screen
	/////////////////////////////////
	else if (gameState == 2) {
		/////////////////////////////////
		// Phase 0: early bird phase
		// each player, in tie break order, may spend 3 action cubes to buy anything in the market
		/////////////////////////////////
		if(phase == 0) {
			if(myID == currentPlayer) {
				if (players[myID].actionCubes >= 3) {
					if(myGameArea.x && myGameArea.y) {
						if (passButton.clicked()) {
							playerAction(myID, 0, -1);
						}
						for (i = 0; i < 6; i ++) {
							for (j = 0; j < shops[i].length; j ++) {
								if (shops[i][j].clicked())
									playerAction(myID, i, j);
							}
						}
						myGameArea.x = false;
					}
				}
				else {	// my turn but not enough action cubes >> pass
					playerAction(myID, 0, -1);
				}
			} 
			// not my turn
			// first check if we should move on
			else if(currentPlayer < 0) {
				myTimeTokenButtons = [];
				var mtt = players[myID].getMyTimeTokens();
				// display time tokens on the right to choose in planning phase
				for (i = 0; i < 6; i ++) {
					myTimeTokenButtons.push(new component(25, 25, players[myID].color, "black", 
					400, shopYCoor[i], timeTokenList[mtt[i]], "center", mtt[i]));
				}
				// submit button
				submitButton = new component(25, 25, "black", "white", 400, shopYCoor[6], "OK", "center");
				statusBar.text = "Turn:" + turn + ": planning phase";
				addLog("***** Turn " + turn + "******");
				addLog("----- planning phase -----");
				if (tutorial)
					addLog(">> Click on two time tokens on the board to swap");

				// select time tokens for bots in advance !
				if (myID == 0)
					for (const p in players)
						if (players[p].isBot) 
							botChooseTimeTokens(players[p].id);

				phase = 1;
			}
			else { // otherwise, let bot takes turn
				if (players[currentPlayer].isBot && myID == 0)
					botAction(currentPlayer);	
			}
		}
		/////////////////////////////////
		// Phase 1: planning phase
		/////////////////////////////////
		else if(phase == 1) {
			if(myGameArea.x && myGameArea.y) {
				// click on 1st time token and then 2nd one to swap them
				for (i = 0; i < 6; i ++) {
					if (myTimeTokenButtons[i].clicked()) {
						var index = -1;
						for (j = 0; j < 6; j ++)
							if(myTimeTokenButtons[j].border) 
								index = j;
						if (index > -1) {
							var x = myTimeTokenButtons[index].object;
							myTimeTokenButtons[index].object = myTimeTokenButtons[i].object;
							myTimeTokenButtons[i].object = x;
							myTimeTokenButtons[index].text = timeTokenList[myTimeTokenButtons[index].object];
							myTimeTokenButtons[i].text = timeTokenList[myTimeTokenButtons[i].object];
							myTimeTokenButtons[index].border = false;
						}
						else
							myTimeTokenButtons[i].toggleBorder("yellow");
						myGameArea.x = false;
					}
				}
				// submit your time tokens
				if (!isDone && submitButton.clicked()) {
					if (tutorial)
						addLog("Done! Wait for other players");
					for (i = 0; i < 6; i ++) {
						players[myID].myPlayedTimeTokens[i] = myTimeTokenButtons[i].object;
					}
					submitButton.text = "Wait";
					isDone = true;
					socket.emit('submit time tokens', {
						id : myID,
						timeTokens : players[myID].myPlayedTimeTokens
					});
				}
				myGameArea.x = false;
			}
		}
		/////////////////////////////////
		// Phase 2: buy phase
		/////////////////////////////////
		else if(phase == 2) {
			// all time tokens got resolved. move on to phase 3
			if(activeShop >= 6) {
				addLog("------ after market phase ------");
				if (tutorial)
					addLog(">> You may spend 2 action cubes to buy anything");
				statusBar.text = "Turn " + turn +": after market phase";
				currentPlayer = tieBreak[0];
				phase = 3;	
				if (myID == 0)
					socket.emit('after market phase');
			}	
			// x and xx don't give players an action
			else if(getActiveTimeToken().value >= 5) {
				currentPlayer = nextPlayer();
			}
			else if(currentPlayer == myID) {
				// forced to pass if nothing is left :(
				if(activeShop < 6 && shops[activeShop].length === 0 && !buyFlowerToolToken) {
					playerAction(myID, activeShop, -1);
				} else if(myGameArea.x && myGameArea.y) {
					for (i = 0; i < shops[activeShop].length; i ++) {
						if(shops[activeShop][i].clicked())
							playerAction(myID, activeShop, i);
					}
					// you can discard any flower tokens and cards during your turn
					// will add confirm button later. for the time being, please don't accidentally click on them
					for (i = 0; i < players[myID].vases.length; i ++) {
						if (players[myID].vases[i].clicked())
							players[myID].discardFlowerToken(i);
					}
					for (i = 0; i < players[myID].hand.length; i ++) {
						if (players[myID].hand[i].clicked())
							players[myID].discardFlowerCard(i);
					}
					// special phase when you choose the tool that lets you buy any leftover flower
					if (buyFlowerToolToken) {
						for (i = 1; i < 4; i ++)
							for (j = 0; j < shops[i].length; j ++)
								if (shops[i][j].clicked())
									playerAction(myID, i, j);
					}
					if(passButton.clicked()) {
						playerAction(myID, activeShop, -1);
					}
					myGameArea.x = false;
				}
			} else if (players[currentPlayer].isBot && myID == 0) {
				botAction(currentPlayer);
			}
		}
		/////////////////////////////////
		// Phase 3: aftermarket phase
		// each player may spend 2 action cubes to buy anything left in the market
		/////////////////////////////////
		else if(phase == 3) {
			if(myID == currentPlayer) {
				if (players[myID].actionCubes >= 2) {
					if(myGameArea.x && myGameArea.y) {
						if (passButton.clicked()) {
							playerAction(myID, 0, -1);
						}
						for (i = 0; i < 6; i ++) {
							for (j = 0; j < shops[i].length; j ++) {
								if (shops[i][j].clicked())
									playerAction(myID, i, j);
							}
						}
						myGameArea.x = false;
					}
				} else { // my turn but not enough action cubes >> pass
					playerAction(myID, 0, -1);
				}
			}
			// when everyone got a chance to buy, move on to flower arranging phase
			else if (currentPlayer < 0) {
				addRibbonsButton = new component(75, 25, "red", "white", 400, 265, "Add 0 8's", "center", 0);
				submitButton = new component(60, 25, "white", "black", 480, 265, "Submit", "center");
				passButton = new component(75, 25, "black", "white", 545, 265, "Skip phase", "center");

				phase = 4;
				selectedFlowerCard = -1;
				selectedNumRibbons = 0;
				addLog("------ arranging phase ------");
				if(tutorial)
					addLog(">> Select a flower card to arrange or skip phase");
				statusBar.text = "Turn " + turn +": flower arranging phase";

				// arrange flowers for bot in advance !
				if (myID == 0)
					for (const p in players)
						if (players[p].isBot) {
							botArrangeFlower(players[p].id);
							socket.emit('finish arranging');
						}
			}
			else {
				if (players[currentPlayer].isBot && myID == 0)
					botAction(currentPlayer);
			}
		}
		/////////////////////////////////
		// Phase 4: flower arranging phase
		// players arrange any number of flower cards in their hand
		/////////////////////////////////
		else if(phase == 4) {
			if(myGameArea.x && myGameArea.y) {
				// submit selected flower card and tokens to be checked
				if(submitButton.clicked()) {
					if (selectedFlowerCard < 0) {
						if (players[myID].hand.length == 0)
							addLog("Nothing to arrange. Press -Skip Phase-");
						else
							addLog("Select a flower card !");
					}
					else {
						myGameArea.x = false;
						var r, selectedflwTkn = [], indices = [];
						var card = players[myID].hand[selectedFlowerCard].object;
						// keep both the flower tokens and ther indices
						for (i = 0; i < players[myID].vases.length; i ++) {
							if (players[myID].vases[i].border) {
								indices.push(i);
								selectedflwTkn.push(players[myID].vases[i].object);
							}
						}
						r = addRibbonsButton.object;

						// verify if the requirements on the card are fulfilled
						// r = number of ribbons, 
						if (card.verify(selectedflwTkn, players[myID].stars, r, players[myID].getBonus(0))) {
							// hurray ! you know how to play the game !
							socket.emit('arrange flower', {
								id : myID,
								card : selectedFlowerCard,
								indices : indices,
								ribbons : r
							});
							if(tutorial)
								addLog("Select another flower card to arrange or skip phase");
							selectedFlowerCard = -1;
						}
					}
				}
				// finish and move on to the next round
				else if(!isDone && passButton.clicked()) {
					// clear borders
					for (i = 0; i < players[myID].vases.length; i ++) 
						players[myID].vases[i].border = false;
					for (i = 0; i < players[myID].hand.length; i ++)
						players[myID].hand[i].border = false;
					
					isDone = true;
					addLog('Wait for other players to finish');
					socket.emit('finish arranging');
				}
				// toggle flower tokens, flower card, and ribbons
				else {
					for (i = 0; i < players[myID].vases.length; i ++) {
						if (players[myID].vases[i].clicked())
							players[myID].vases[i].toggleBorder("yellow");
					}
					for (i = 0; i < players[myID].hand.length; i ++) {
						if (players[myID].hand[i].clicked()) {
							// deselect if choose the one previously chosen
							if (i == selectedFlowerCard) {
								players[myID].hand[selectedFlowerCard].border = false;
								selectedFlowerCard = -1;
							}
							else {
								if (selectedFlowerCard > -1)
									players[myID].hand[selectedFlowerCard].border = false;
								players[myID].hand[i].toggleBorder("yellow");
								selectedFlowerCard = i;
							}
						}
					}
					// * to do: use drop down menu instead
					if (addRibbonsButton.clicked()) {
						addRibbonsButton.object = (addRibbonsButton.object+1) % (players[myID].numRibbons+1);
						addRibbonsButton.text = "Add " + addRibbonsButton.object + " rbb";
					}
				}
				myGameArea.x = false;
			}
			if (checkEndGame()) {
				gameState = 3;
				var winner = 0;
				addLog("------------- Final Scoring ---------------");
				for (const p in players); {
					addLog(players[p].username + ' : ' + players[p].score, players[p].color);
					if ((players[p].score > player[winner].score) ||
						(players[p].score == players[winner].score && tieBreak.indexOf(p) > tieBreak.indexOf(winner)))
						winner = p;
				}
				statusBar.text = "Game End!";
				addLog('', player[winner].color);
				addLog('The winner is  ::: ' + players[winner].username + ' :::', player[winner].color);
				addLog('', player[winner.color]);
			}
		}

		// most important part !
		myGameArea.clear();
		updateBoard();
	}	// end of game state 2

	/////////////////////////////////
	// Game State 3 : end game screen
	// displaying final scores & possibly flying pigeons
	/////////////////////////////////
	else if (gameState == 3) {
		if(myGameArea.x && myGameArea.y) {
			if(statusBar.clicked()) {
				$('#gamelist_lobby').show();
				$('#menu_bar').show();
				$('#game_board').hide();
				$('#gamelog_window').hide();
				socket.emit('leave game');
			}
			myGameArea.x = false;
		}
		myGameArea.clear();
		updateBoard();
	}
}

///////////////////////////////////////////////////
// update the board (i.e. shops) and player boards/
///////////////////////////////////////////////////

function updateBoard() {
	statusBar.update();

	for (i = 0; i < 6; i ++) {
		shopLabels[i].update();
		// display goods
		if (phase >= 1) {
			for (j = 0; j < shops[i].length; j ++) {
				shops[i][j].update();
				if (i == 4) { // cards need extra text
					var cardComp = shops[4][j];	// component, no the actual card
					fillCard(cardComp.width, cardComp.height, cardComp.x, cardComp.y, cardComp.object);
				}
			}
		}
		// display my time token buttons only in planning phase
		if (phase == 1) 
			for (j = 0; j < 6; j ++)
				myTimeTokenButtons[j].update();
		// display all time tokens here
		if (phase == 2)
			for (const aptt of allPlayedTimeTokens[i])
				aptt.update();
	}
	
	for (const tbt of tieBreakTrack) 
		tbt.update();
	
	if (gameState == 2) {
	if (phase == 1 || (phase == 4 && !isDone))
		submitButton.update();
	if ((currentPlayer == myID && (phase == 0 || phase == 2 || phase == 3)) || (!isDone && phase == 4))
		passButton.update();
	if (phase == 4 && !isDone)
		addRibbonsButton.update();
	}
	players[myID].update();
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
	allPlayedTimeTokens = [[],[],[],[],[],[]];

	// sort them and create components for tokens
	for (k = 0; k < 6; k ++) {
		var temp = [];
		for (j = 0; j < numPlayers; j++)
			temp.push(new timeToken(j,players[j].myPlayedTimeTokens[k]));
		sortTimeToken(temp);

		// display each token
		for (l = 0; l < temp.length; l++) {
			var d = temp[l].id;
			allPlayedTimeTokens[k].push(new component(25, 25, players[d].color,"black", 400 + 30*l, shopYCoor[k], timeTokenList[temp[l].value], "center", temp[l]));
		}
	}
	allPlayedTimeTokens[0][0].toggleBorder("yellow");
}

// sort given time tokens
function sortTimeToken(a) {
	for(i = 0; i < a.length; i ++) {
		var low = i;
		for (j = i+1; j < a.length; j ++) {
			if(a[j].value < a[low].value || (a[j].value == a[low].value && tieBreak.indexOf(a[j].id) < tieBreak.indexOf(a[low].id))) 
				low = j;
		}
		x = a[i];
		a[i] = a[low];
		a[low] = x;
	}
}

// move player id to the first (leftmost) in tie break track
function goFirst(id) {
	var t = tieBreak.indexOf(id);
	tieBreak.splice(t, 1);
	tieBreak.unshift(id);
	for (k = 0; k < numPlayers; k ++) 
		tieBreakTrack[tieBreak[k]].moveTo(105 + 30*k, tieBreakTrack[0].y);
}

function nextPlayer () {
	// during phase 2, the next player is determined by time token
	if (phase == 2) {
		allPlayedTimeTokens[activeShop][activeTokenOrder].border = false;
		activeTokenOrder++;
		if (activeTokenOrder >= numPlayers) {
			activeShop++;
			activeTokenOrder = 0;
		}
		if (activeShop < 6) {
			allPlayedTimeTokens[activeShop][activeTokenOrder].toggleBorder("yellow");
			return getActiveTimeToken().id;
		}
	}
	// during phase 0 and 3, the next player is determined by tie break order
	else if (phase == 0 || phase == 3) {
		var index = tieBreak.indexOf(currentPlayer);
		if (index < tieBreak.length - 1)
			return tieBreak[index + 1];
		else
			return -1;
	}

}

function getActiveTimeToken() {
	return allPlayedTimeTokens[activeShop][activeTokenOrder].object;
}

// game end when one of the following conditions is met
// 1. 10 turns has passed
// 2. some player gets at least 8 stars in one color
// 3. some player gets at least 50 points
function checkEndGame() {
	var end = false;
	if (turn >= 10)
		return true;
	
	var maxScore = 0;
	for (const p in players) {
		var maxStars = 0;
		for (const s in p.stars) {
			if (s > maxStars)
				maxStars = s;
		}
		if (maxStars >= 8) {
			end = true;
			p.score += 2;	// extra points for reaching the threshold
		}
		if (p.score > maxScore)
			maxScore = p.score;
	}
	
	if (maxScore >= 30)
		end = true;
	return end;
}
///////////////////////////////////////////////////////////////////////////////////////////
//
//					components displayed on the board
//
///////////////////////////////////////////////////////////////////////////////////////////

// define all buttons and texts
function component(width, height, color, textColor, x, y, text, align, object) {
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
	// center is the default
	this.textx = x + width / 2;
	this.texty = y + height / 2 + 5;
	if (align == "left") {	// otherwise, left aligned
		this.textx = x + 5;
		this.texty = y + height / 2 + 5;
	}
	this.align = align;
	this.text = text;
	this.object = object;			// store the object it represents (tokens, cards, etc.)
	this.border = false;
	this.borderColor = "white";
	this.update = function() {
		ctx = myGameArea.context;
		ctx.fillStyle = color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.fillStyle = textColor;
		ctx.font = "15px Arial";
		ctx.textAlign = align;
		ctx.fillText(this.text, this.textx, this.texty);
		if (this.border) {
			ctx.beginPath();
			ctx.strokeStyle = this.borderColor;
			ctx.lineWidth = "3";
			ctx.rect(this.x-2, this.y-2, this.width+4, this.height+4);
			ctx.stroke();
		}
	};
	this.clicked = function() {
		var myleft = this.x;
		var myright = this.x + (this.width);
		var mytop = this.y;
		var mybottom = this.y + (this.height);
		var clicked = true;
		if ((mybottom < myGameArea.y) || (mytop > myGameArea.y) || (myright < myGameArea.x) || (myleft > myGameArea.x)) {
			clicked = false;
		}
		return clicked;
	};
	this.toggleBorder = function(color) {
		this.borderColor = color;
		this.border = !this.border;
	};
	this.moveTo = function(newx, newy) {
		this.x = newx;
		this.y = newy;
		if (this.align === "center") {
			this.textx = this.x + this.width / 2;
			this.texty = this.y + this.height / 2 + 5;
		}
		else{	//assumel left align
			this.textx = this.x + 5;
			this.texty = this.y + this.height / 2 + 5;
		}
	};
}
