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
var $statusBar;			// grey bar at the top, showing current turn & phase
var $shopLabels; 		// mainboard consisting of shop names
var $toolLevels;		// display the level of each tool
var shops; 				// list of goods components displaying in each shop
var activeShop;			// which shop is opening now (buy phase):

var activeTokenOrder;	// which token in the shop is taking an action
var $allPlayedTimeTokens;	// list of played time tokens on the board (buy phase)
var $myTimeTokenButtons;	// time token components displayed on the board (planning phase)
var tieBreak;			// determine who buys first in case of tie
var $tieBreakTrack;		// components for buy order track

var $passButton;			// pass button used in many phases
var $submitButton;		// submit and verify your flower arrangement
var $addRibbonsButton;	// component for adding more ribbons (arranging phase) 
var $achievements;		// component for achievements

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

	// only let one player sends the server an inquiry
	if (myID === 0) {
		socket.emit('generate market', generateGoods(numPlayers));
		var bonus = [0,1,2,3,4,5];
      	shuffle(bonus);
		tieBreak = [];
		for (i = 0; i < numPlayers; i ++) 
			tieBreak.push(i);
		shuffle(tieBreak);

		socket.emit('give starting stuff', {
			flowerCards : generateStartingFlowerCards(),
			bonuses : bonus,
			tieBreak: tieBreak
		})
	}

	$('#gamelog').empty();
	addLog("*");
    addLog("***** Turn " + turn + "******");
    addLog("*");
	myGameArea.start();	// add the main canvas
	ctx = myGameArea.context;
	boardSetup();	// add labels on the board
	currentPlayer = tieBreak[0];
}

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
						if ($passButton.clicked()) {
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
					if ($myTimeTokenButtons[i].clicked()) {
						var index = -1;
						for (j = 0; j < 6; j ++)
							if($myTimeTokenButtons[j].border) 
								index = j;
						if (index > -1) {
							var x = $myTimeTokenButtons[index].object;
							$myTimeTokenButtons[index].object = $myTimeTokenButtons[i].object;
							$myTimeTokenButtons[i].object = x;
							$myTimeTokenButtons[index].text = timeTokenList[$myTimeTokenButtons[index].object];
							$myTimeTokenButtons[i].text = timeTokenList[$myTimeTokenButtons[i].object];
							$myTimeTokenButtons[index].border = false;
						}
						else
							$myTimeTokenButtons[i].toggleBorder("yellow");
						myGameArea.x = false;
					}
				}
				// submit your time tokens
				if (!isDone && $submitButton.clicked()) {
					if (tutorial)
						addLog("Done! Wait for other players");
					for (i = 0; i < 6; i ++) {
						players[myID].myPlayedTimeTokens[i] = $myTimeTokenButtons[i].object;
					}
					$submitButton.text = "Wait";
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
			// x and xx don't give players an action
			if(getActiveTimeToken().value >= 5) {
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
						if (players[myID].vases[i].clicked()) {
							if (window.confirm("Discard the flower token ?"))
								players[myID].discardFlowerToken(i);
						}
					}
					for (i = 0; i < players[myID].hand.length; i ++) {
						if (players[myID].hand[i].clicked())
							if (window.confirm("Discard the card ?"))
								players[myID].discardFlowerCard(i);
					}
					// special phase when you choose the tool that lets you buy any leftover flower
					if (buyFlowerToolToken) {
						for (i = 1; i < 4; i ++)
							for (j = 0; j < shops[i].length; j ++)
								if (shops[i][j].clicked())
									playerAction(myID, i, j);
					}
					if($passButton.clicked()) {
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
						if ($passButton.clicked()) {
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
			else if (players[currentPlayer].isBot && myID == 0) {
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
				if($submitButton.clicked()) {
					if (selectedFlowerCard < 0) {
						if (players[myID].hand.length == 0)
							alert('Nothing to arrange. Press -Skip Phase-');
						else
							alert('Select a flower card !');
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
						r = $addRibbonsButton.object;

						// verify if the requirements on the card are fulfilled
						// r = number of ribbons, 
						if (card.verify(selectedflwTkn, r, players[myID].getBonus(0))) {
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
				// finish this phase and wait for other players
				else if(!isDone && $passButton.clicked()) {
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
					if ($addRibbonsButton.clicked()) {
						$addRibbonsButton.object = ($addRibbonsButton.object+1) % (players[myID].numRibbons+1);
						$addRibbonsButton.text = "Add " + $addRibbonsButton.object + " œ";
					}
				}
				myGameArea.x = false;
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
			// back to the lobby once you 
			if($statusBar.clicked()) {
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
	$statusBar.update();

	for (i = 0; i < 6; i ++) {
		$shopLabels[i].update();
		// display goods
		if (phase >= 0) {
			for (j = 0; j < shops[i].length; j ++) {
				shops[i][j].update();
				if (i == 4) { // cards need extra text
					var $cardComp = shops[4][j];	// component, no the actual card
					fillCard($cardComp.width, $cardComp.height, $cardComp.x, $cardComp.y, $cardComp.object);
				}
			}
		}
		// display my time token buttons only in planning phase
		if (phase == 1) 
			for (j = 0; j < 6; j ++)
				$myTimeTokenButtons[j].update();
		// display all time tokens here
		if (phase == 2)
			for (const aptt of $allPlayedTimeTokens[i])
				aptt.update();
	}
	for (const tl of $toolLevels)
		tl.update();
	for (const tbt of $tieBreakTrack) 
		tbt.update();
	
	if (gameState == 2) {
		if (phase == 1 || (phase == 4 && !isDone))
			$submitButton.update();
		if ((currentPlayer == myID && (phase == 0 || phase == 2 || phase == 3)) || (!isDone && phase == 4))
			$passButton.update();
		if (phase == 4 && !isDone)
			$addRibbonsButton.update();
	}
	players[myID].update();
	var index = 0;
	for (pp = 0; pp < numPlayers; pp ++) {
		if (pp != myID) {
			players[pp].miniUpdate(index);
			index ++;
		}
	}

	$shopLabels[6].update();	// 'achievements' label
	for (const a of $achievements)
		a.update();
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
		for (j = 0; j < numPlayers; j++)
			temp.push(new timeToken(j,players[j].myPlayedTimeTokens[k]));
		sortTimeToken(temp);

		// display each token
		for (l = 0; l < temp.length; l++) {
			var d = temp[l].id;
			$allPlayedTimeTokens[k].push(
				new component(25, 25, players[d].color,"black", 
				400 + 30*l, shopYCoor[k], timeTokenList[temp[l].value], "center", temp[l])
			);
		}
	}
	$allPlayedTimeTokens[0][0].toggleBorder("yellow");
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
	for (k = 0; k < numPlayers; k ++) 
		$tieBreakTrack[tieBreak[k]].moveTo(105 + 30*k, $tieBreakTrack[0].y);
}

function nextPlayer () {
	// during phase 2, the next player is determined by time token
	if (phase == 2) {
		$allPlayedTimeTokens[activeShop][activeTokenOrder].border = false;
		activeTokenOrder++;
		if (activeTokenOrder >= numPlayers) {
			activeShop++;
			activeTokenOrder = 0;
		}

		if (activeShop < 6) {
			$allPlayedTimeTokens[activeShop][activeTokenOrder].toggleBorder("yellow");
			return getActiveTimeToken().id;
		}
		else if (myID == 0) {
			socket.emit('end phase', {
				phase : phase
			});
			return -1;
		}
	}
	// during phase 0 and 3, the next player is determined by tie break order
	else if (phase == 0 || phase == 3) {
		var index = tieBreak.indexOf(currentPlayer);
		if (index < tieBreak.length - 1)
			return tieBreak[index + 1];
		else if(myID == 0) {
			socket.emit('end phase', {
				phase : phase	
			});
		}
	}
}

function getActiveTimeToken() {
	return $allPlayedTimeTokens[activeShop][activeTokenOrder].object;
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
	this.newText = function(t) {
		this.text = t;
	};
}
