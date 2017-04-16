function playerAction(id, location, index) {
	var success = takeAction(id, location, index);
	// see if the action works and broadcast it only when it succeeds
	if (success) {
		socket.emit('take action', {
			id : id,
			location : location,
			index : index
		});
		if (!buyFlowerToolToken)
        	nextPlayer();
		if (currentPlayer >= 0 && myID == 0 && players[currentPlayer].isBot) {
			botAction(currentPlayer);
		}
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

		if (buyFlowerToolToken)
			buyFlowerToolToken = false;
		players[id].update();
		return true;
	}

	switch(location) {
		case 0:
			players[id].money += shops[0][index];
			addLog(players[id].username + " gains ฿" + shops[0][index], id);
			// remove the component from the board
			$('#goods1').children()
				.eq(index)
				.remove();
			shops[0].splice(index, 1);
			break;
		case 1: case 2: case 3:
			if (players[id].money < 1 && !buyFlowerToolToken) {
				if (language === 'EN')
					addNoti("Not enough money");
				else
					addNoti("เงินไม่พอ");
				return false;
			}
			if (players[id].vases.length >= players[id].numVases) {
				if (id == myID)
					if (language === 'EN')
						addNoti("Your vases are full. Discard a flower token or pass.");
					else
						addNoti("ดอกไม้เต็มแล้ว คลิกที่เบี้ยดอกไม้เพื่อทิ้ง หรือ Pass เพื่อผ่าน")
				return false;
			}
			else {
				addLog(players[id].username + " buys a " + shopList[location], id);
				players[id].getFlowerToken(
					shops[location][index], 
					$('.goods').eq(location).children().eq(index)
				);
				shops[location].splice(index, 1);

				if (buyFlowerToolToken)
					buyFlowerToolToken = false;
                else
                    players[id].money -= 1;
			}
			break;
		case 4:
			if (players[id].hand.length >= handLimit) {
				if (id == myID)
					if (language === 'EN')
						addNoti("Your hand is full. Discard a card or pass.");
					else
						addNoti("การ์ดเต็มมือ คลิกที่การ์ดในมือเพื่อทิ้ง หรือ Pass เพื่อผ่าน");
				return false;
			}
			else {
				addLog(players[id].username + " draws a card.", id);
				players[id].drawFlowerCard(
					shops[4][index],
					$('.goods').eq(4).children().eq(index)
				);
				shops[4].splice(index, 1);
			}
			break;
		case 5:
			if (players[id].money < shops[5][index].getCost()) {
				if (language === 'EN')
					addNoti("Not enough money");
				else
					addNoti("เงินไม่พอ");
				return false;
			}
			addLog(players[id].username + " buys " + shops[5][index].toString(), id);
			players[id].getToolToken(shops[5][index]);
			players[id].money -= shops[5][index].getCost();
			shops[5][index].levelDown(1);
			// change the image and title
			$('#goods6 img')
				.filter(function() {return $(this).val() == index;})
				.attr('src', 'img/tool' + index + 'lv' + shops[5][index].level + '.jpg' )
				.attr('title', shops[5][index].toString());

			break;
	}
	// it costs extra action cubes if you take action during these phases
	if (phase == 0 && location < 6)
		players[id].actionCubes -= 3;
	if (phase == 3 && location < 6)
		players[id].actionCubes -= 2;

	// update displayed information
	players[id].update();
	return true;
}