function playerAction(id, location, index) {
	var success = takeAction(id, location, index);
	// see if the action works and broadcast it only when it succeeds
	if (success) {
		socket.emit('take action', {
			id : id,
			location : location,
			index : index
		});
	}
	return success;
}

///////////////////////////////////////////////////
//	takeAction(id, location, index)		 
//	A player with ID 'id' attempts to perform the 'action' at the specified 'index'
//	id			- player ID
//	location	- which shop the action takes place
//	index		- which object in the location is being chosen
///////////////////////////////////////////////////

function takeAction(id, location, index) {

	// forced to pass if nothing is left in the shop
	if (location > 0 && location < 6 && shops[location].length == 0)
		index = -1;
	// pass
	if (index == -1) {
		if (turn > 1 || ((turn == 1) && (phase > 0)))
			addLog(players[id].username + " passes", id);
        // get an action cube if you pass during buy phase
        if (phase == 2)
    		players[id].actionCubes ++;
        currentPlayer = nextPlayer();	// *todo - ping next player
		return true;
	}

	switch(location) {
		case 0:
			players[id].money += shops[0][index].object;
			addLog(players[id].username + " gains $" + shops[0][index].object, id);
			shops[0].splice(index, 1);
			break;
		case 1: case 2: case 3:
			if (players[id].money < 1) {
				addLog(">> Not enough money");
				return false;
			}
			if (players[id].vases.length >= players[id].numVases) {
				if (id == myID)
					addLog(">> Your vases are full. Discard a flower token or pass.");
				return false;
			}
			else {
				addLog(players[id].username + " buys a " + shopList[location], id);
				players[id].getFlowerToken(shops[location][index].object);
				if (!buyFlowerToolToken)
					players[id].money -= 1;
				shops[location].splice(index, 1);
                if(buyFlowerToolToken)
                    buyFlowerToolToken = false;
			}
			break;
		case 4:
			if (players[id].hand.length >= handLimit) {
				if (id == myID)
					addLog(">> Your hand is full. Discard a card or pass.");
				return false;
			}
			else {
				addLog(players[id].username + " draws a card.", id);
				players[id].drawFlowerCard(shops[4][index].object);
				shops[4].splice(index, 1);
			}
			break;
		case 5:
			if (players[id].money < shops[5][index].object.getCost()) {
				addLog("Not enough money");
				return false;
			}
			addLog(players[id].username + " buys " + shops[5][index].object.toString(), id);
			players[id].getToolToken(shops[5][index].object);
			players[id].money -= shops[5][index].object.getCost();
			shops[5][index].object.levelDown(1);
			shops[5][index].newText(shops[5][index].object.toSymbol());
			$toolLevels[index].newText(shops[5][index].object.getLevelBar());
			break;
		default:	// invalid location
			addLog("What are you doing?", id);
			return false;
	}
	// it costs extra action cubes if you take action during these phases
	if (phase == 0 && location < 6)
		players[id].actionCubes -= 3;
	if (phase == 3 && location < 6)
		players[id].actionCubes -= 2;

    if (!buyFlowerToolToken)
        currentPlayer = nextPlayer();

	return true;
}