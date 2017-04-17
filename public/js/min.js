function flowerCard(a,b,c,d,e,f){this.flowers=new Array(a,b,c),this.quality=d,this.score=e,this.level=f,this.verify=function(a,b,c){var e=new Array(0,0,0),f=c+2*b;for(i=0;i<a.length;i++)e[a[i].type]+=1,f+=a[i].quality;return f<d?(addNoti("Quality not satisfied"),!1):e[0]<this.flowers[0]||e[1]<this.flowers[1]||e[2]<this.flowers[2]?(addNoti("Not enough flowers of some type"),!1):e[0]>this.flowers[0]||e[1]>this.flowers[1]||e[2]>this.flowers[2]?(addNoti("Too many flowers of some type"),!1):!(b>0&&f-2>=d)||(addNoti("Too many ribbons?"),!1)},this.getFlowers=function(){return this.flowers},this.getFlowersAt=function(a){if(0==a||1==a||2==a)return this.flowers[a]}}function flowerToken(a,b){this.type=a,this.quality=b}function toolToken(a){this.type=a,this.level=0,this.getCost=function(){return toolCost[this.type][this.level]},this.getAmount=function(){return toolAmount[this.type][this.level]},this.getLevelBar=function(){return 0==this.level?"-":1==this.level?"- -":"- - -"},this.levelDown=function(a){this.level=Math.max(0,this.level-a)},this.levelUp=function(a){this.level=Math.min(2,this.level+a)},this.toString=function(){return toolString[this.type][this.level]+" for ฿"+toolCost[this.type][this.level]}}function timeToken(a,b){this.id=a,this.value=b}function achievementCard(a){this.type=a,this.claimed=!1,this.claimer=0,this.check=function(a){var b=players[a].getStars();if(this.claimed)return!1;switch(this.type){case 0:this.claimed=b[0]>=6;break;case 1:this.claimed=b[1]>=6;break;case 2:this.claimed=b[2]>=6;break;case 3:this.claimed=b[0]>=4&&b[1]>=4;break;case 4:this.claimed=b[0]>=4&&b[2]>=4;break;case 5:this.claimed=b[1]>=4&&b[2]>=4;break;case 6:this.claimed=b[0]>=3&&b[1]>=3&&b[2]>=3;break;case 7:this.claimed=players[a].numPlayedCards>=5}if(this.claimed){this.claimer=a,addLog(players[a].username+" claimed an achievement #"+this.type+" !",a);var c=this.type;$(".achievement_card").filter(function(){return $(this).val()==c}).css("border-color",players[a].color),$(".achievement_card--large").filter(function(){return $(this).val()==c}).addClass("achievement_card--claimed")}return this.claimed},this.toString=function(){return achievementString[this.type]},this.getRewards=function(){return achievementRewards[this.type]}}function enterLobby(){myusername=$("#input_username").val(),socket.emit("check username",myusername)}function logOut(){$("#login_page").show(),$("#menu_bar").hide(),$("#gamelist_lobby").hide(),$("#chat_box").hide(),socket.emit("disconnect")}function player(a,b,c,d){this.id=a,this.username=b,this.color=c,this.isBot=d,this.myBoard={},this.score=0,this.money=0,this.numVases=3,this.vases=[],this.time=0,this.myPlayedTimeTokens=[],this.stars=new Array(0,0,0),this.bonus=new Array(0,0,0),this.hand=[],this.numPlayedCards=0,this.numRibbons=0,this.actionCubes=0,this.addBoard=function(a){this.myBoard=a},this.drawFlowerCard=function(a,b){this.hand.push(a),this.id==myID?$(this.myBoard).find(".player_hand").append(b):$(b).remove()},this.discardFlowerCard=function(a){a>=0&&a<this.hand.length&&(4!=phase&&addLog(this.username+" discards a card",this.id),this.hand.splice(a,1),$(this.myBoard).find(".player_hand").find(".flower_card").eq(a).remove())},this.getFlowerToken=function(a,b){this.vases.push(a),$(b).fadeIn("slow"),this.id!=myID&&$(b).addClass("icon--small"),$(this.myBoard).find(".player_vase").append(b),$(this.myBoard).find(".empty_vase").first().remove()},this.discardFlowerToken=function(a){if(a>=0&&a<this.vases.length){4!=phase&&addLog(this.username+" discards a "+shopList[this.vases[a].type+1],this.id),this.vases.splice(a,1),$(this.myBoard).find(".player_vase").find(".flower_token").eq(a).remove();var b=$("<img/>").attr("src","img/empty_vase.png").addClass("empty_vase");this.id!=myID&&$(b).addClass("icon--small"),$(this.myBoard).find(".player_vase").prepend(b)}},this.getToolToken=function(a){switch(a.type){case 0:this.time+=a.getAmount(),this.score+=a.getAmount(),this.time>6&&(this.time=6),$(this.myBoard).find("#my_time_track").empty(),$(this.myBoard).find("#my_time_track").append($("<img/>").attr("src","img/time_track"+this.time+".png").addClass("time_track_image"));break;case 1:var b=a.getAmount();if(this.numVases<6){var c=$("<img/>").attr("src","img/empty_vase.png").addClass("empty_vase").fadeIn("slow");this.id!=myID&&$(c).addClass("icon--small"),this.numVases++,$(this.myBoard).find(".player_vase").prepend(c)}if(2==b&&this.numVases<6){this.numVases++;var c=$("<img/>").attr("src","img/empty_vase.png").addClass("empty_vase");this.id!=myID&&$(c).addClass("icon--small"),$(this.myBoard).find(".player_vase").prepend(c)}this.score+=b;break;case 2:this.numRibbons+=a.getAmount();break;case 3:buyFlowerToolToken=!0,addLog("EN"==language?">> You may buy any leftover flower":">> สามารถซื้อดอกไม้ในร้านใดก็ได้"),$("#shop2").addClass("active"),$("#shop3").addClass("active"),$("#shop4").addClass("active"),$("#shop6").removeClass("active");break;case 4:goFirst(this.id)}this.update()},this.getMyTimeTokens=function(){var a=[0,1,2,3,4,5,6];return a.splice(this.time,1),a},this.getBonus=function(a){return this.stars[this.bonus[a]]},this.getStars=function(){return this.stars},this.arrangeFlower=function(a,b,c){var d=this.getBonus(2)+this.hand[a].score;for(this.score+=d,i=0;i<3;i++)this.stars[i]+=this.hand[a].getFlowersAt(i);for(this.numPlayedCards+=1,this.money+=this.getBonus(1),addLog(this.username+" arranges a bouquet ~",this.id),addLog("...."+this.username+" gains ฿"+this.stars[this.bonus[1]],this.id),addLog("...."+this.username+" gets "+d+" points",this.id),this.numRibbons-=c,this.discardFlowerCard(a),b.sort(function(a,b){return b-a}),j=0;j<b.length;j++)this.discardFlowerToken(b[j]);this.update()},this.getAchievementRewards=function(a){this.stars[0]+=a[0],this.stars[1]+=a[1],this.stars[2]+=a[2],this.score+=a[3],this.money+=a[4],this.update()},this.update=function(){if($(this.myBoard).find(".player_money").text(this.money),$(this.myBoard).find(".player_score").text(this.score),this.id==myID)for($(this.myBoard).find(".player_ribbon").text(this.numRibbons),$(this.myBoard).find(".player_action_cube").text(this.actionCubes),i=0;i<3;i++)$(this.myBoard).find(".bonus_star").eq(i).text(this.stars[this.bonus[i]])}}function playerAction(a,b,c){var d=takeAction(a,b,c);return d&&(socket.emit("take action",{id:a,location:b,index:c}),buyFlowerToolToken||nextPlayer(),currentPlayer>=0&&0==myID&&players[currentPlayer].isBot&&botAction(currentPlayer)),d}function takeAction(a,b,c){if(b>0&&b<6&&0==shops[b].length&&(c=-1),-1==c)return(turn>1||1==turn&&phase>0)&&addLog(players[a].username+" passes",a),2==phase&&players[a].actionCubes++,buyFlowerToolToken&&(buyFlowerToolToken=!1),players[a].update(),!0;switch(b){case 0:players[a].money+=shops[0][c],addLog(players[a].username+" gains ฿"+shops[0][c],a),$("#goods1").children().eq(c).remove(),shops[0].splice(c,1);break;case 1:case 2:case 3:if(players[a].money<1&&!buyFlowerToolToken)return addNoti("EN"===language?"Not enough money":"เงินไม่พอ"),!1;if(players[a].vases.length>=players[a].numVases)return a==myID&&addNoti("EN"===language?"Your vases are full. Discard a flower token or pass.":"ดอกไม้เต็มแล้ว คลิกที่เบี้ยดอกไม้เพื่อทิ้ง หรือ Pass เพื่อผ่าน"),!1;addLog(players[a].username+" buys a "+shopList[b],a),players[a].getFlowerToken(shops[b][c],$(".goods").eq(b).children().eq(c)),shops[b].splice(c,1),buyFlowerToolToken?buyFlowerToolToken=!1:players[a].money-=1;break;case 4:if(players[a].hand.length>=handLimit)return a==myID&&addNoti("EN"===language?"Your hand is full. Discard a card or pass.":"การ์ดเต็มมือ คลิกที่การ์ดในมือเพื่อทิ้ง หรือ Pass เพื่อผ่าน"),!1;addLog(players[a].username+" draws a card.",a),players[a].drawFlowerCard(shops[4][c],$(".goods").eq(4).children().eq(c)),shops[4].splice(c,1);break;case 5:if(players[a].money<shops[5][c].getCost())return addNoti("EN"===language?"Not enough money":"เงินไม่พอ"),!1;addLog(players[a].username+" buys "+shops[5][c].toString(),a),players[a].getToolToken(shops[5][c]),players[a].money-=shops[5][c].getCost(),shops[5][c].levelDown(1),$("#goods6 img").filter(function(){return $(this).val()==c}).attr("src","img/tool"+c+"lv"+shops[5][c].level+".jpg").attr("title",shops[5][c].toString())}return 0==phase&&b<6&&(players[a].actionCubes-=3),3==phase&&b<6&&(players[a].actionCubes-=2),players[a].update(),!0}function boardSetup(){for(shops=[[],[],[],[],[],[]],i=0;i<5;i++)shops[5].push(new toolToken(i));for($("#tie_break_track").empty(),$("#tie_break_track").append($("<span/>").text("Tie Break:")),i=0;i<numPlayers;i++){var a=tieBreak[i];$("#tie_break_track").append($("<div/>").addClass("tie_break_token").css("background-color",playerColors[a]).text(Number(i+1))),players[a].money+=startingMoney+Math.floor(i/2),players[a].numRibbons+=i%2}var b=$("<div/>").addClass("status_bar").append($("<span/>").addClass("status_bar--turn"),$("<span/>").addClass("status_bar--phase"),$("<span/>").addClass("status_bar--text"));for($("#status_bar").empty(),$("#status_bar").append(b),$("#opponent_board_area").empty(),i=0;i<numPlayers;i++)if(myID!=i){var c=$("<div/>").addClass("player_board").css("background-color",playerColors[i]).val(i),d=$("<span/>").addClass("player_name").text(players[i].username),e=$("<span/>").addClass("player_money").text(players[i].money),f=$("<span/>").addClass("player_score").text(players[i].score),g=$("<div/>").addClass("player_vase").addClass("player_vase--opponent");for(j=0;j<3;j++)$(g).append($("<img/>").attr("src","img/empty_vase.png").addClass("icon--small").addClass("empty_vase"));$(c).append(d).append($("<img/>").attr("src","img/money_icon.png").addClass("icon--small")).append(e).append($("<img/>").attr("src","img/score_icon.png").addClass("icon--small")).append(f).append(g),$("#opponent_board_area").append(c),players[i].addBoard(c)}for($("#my_board").css("background-color",playerColors[myID]).val(myID),$("#my_name .player_name").empty(),$("#my_name .player_name").text(myusername),$("#my_money .player_money").text(players[myID].money),$("#my_score .player_score").text(0),$("#my_ribbon .player_ribbon").text(players[myID].numRibbons),$("#my_action_cube .player_action_cube").text(0),$("#my_time_track").empty(),$("#my_time_track").append($("<img/>").attr("src","img/time_track0.png").addClass("time_track_image")),$("#my_hand").empty(),$("#my_vase").empty(),i=1;i<4;i++){var h=players[myID].bonus[i-1]+1;$("#bonus_icon"+i).empty(),$("#bonus_icon"+i).append($("<img/>").attr("src","img/bonus_icon"+i+".png").addClass("icon").css("background-color",shopColors[h])),$("#my_bonus"+i).empty(),$("#my_bonus"+i).append($("<span/>").text(0).addClass("bonus_star").css("background-color",shopColors[h])).append($("<img/>").attr("src","img/star_icon"+h+".png").addClass("icon--small")),$("#my_vase").append($("<img/>").attr("src","img/empty_vase.png").addClass("empty_vase"))}for($("#tool_lookup").empty(),$("#tool_lookup").append($("<button/>").text("Close").addClass("button--expand_tool")),i=0;i<3;i++)for($("#tool_lookup").append($("<br>")),$("#tool_lookup").append($("<span/>").text("level "+i).css("color","white")),$("#tool_lookup").append($("<br>")),j=0;j<5;j++)$("#tool_lookup").append($("<img/>").attr("src","img/tool"+j+"lv"+i+".jpg").addClass("tool--large").val(i));players[myID].addBoard($("#my_board"))}function generateGoods(a){var b=[[],[],[],[],[],[]];for(i=0;i<a;i++){var c=ran(6);c<5&&b[0].push(Math.floor((c+1)/2)+1)}var d=[];for(i=0;i<2*a;i++)d.push(getRandomFlowerToken());for(i=0;i<d.length;i++){b[d[i][0]+1].push(d[i])}for(i=0;i<a;i++)b[4].push(getRandomFlowerCard());return b[5]=getTools(numPlayers),b}function newMarket(a){for($(".goods").empty(),shops[0]=[],i=0;i<a[0].length;i++)shops[0].push(a[0][i]),$("#goods1").append($("<button></button>").text("฿"+a[0][i]).addClass("money").val(i).fadeIn("slow"));for(j=1;j<4;j++)for(shops[j]=[],i=0;i<a[j].length;i++){shops[j].push(new flowerToken(a[j][i][0],a[j][i][1]));var b="goods"+(j+1),c=$("<img/>").attr("src","img/f"+j+"q"+a[j][i][1]+".jpg").addClass("flower"+j).addClass("flower_token").val(i).fadeIn("slow");$(c).data({type:j,quality:a[j][i][1]}),$("#"+b).append(c)}for(shops[4]=[],i=0;i<a[4].length;i++){var d=a[4][i];shops[4].push(new flowerCard(d[0],d[1],d[2],d[3],d[4]));var e=$("<div/>").addClass("flower_card").val(i);for(j=1;j<4;j++)for(k=0;k<d[j-1];k++)e.append($("<img/>").attr("src","img/ficon"+j+".png").addClass("flower_icon")),e.append($("<span/>").val(d[j-1]));e.append($("<br>")),e.append($("<img/>").attr("src","img/card_quality_icon.png").addClass("card_icon"),$("<div/>").text(d[3]).val(d[3]).addClass("quality_symbol")),e.append($("<img/>").attr("src","img/card_score_icon.png").addClass("card_icon"),$("<div/>").text(d[4]).val(d[4]).addClass("score_symbol")),$("#goods5").append(e)}for(i=0;i<shops[5].length;i++)shops[5][i].levelUp(a[5][i]),$("#goods6").append($("<img/>").attr("src","img/tool"+i+"lv"+shops[5][i].level+".jpg").attr("title",shops[5][i].toString()).addClass("tool").val(i));$("#goods6").append($("<button/>").text("See All").addClass("button--expand_tool"))}function botAction(a){0==phase&&players[a].actionCubes>=3||3==phase&&players[a].actionCubes>=2?playerAction(a,0,findBestIndex(a,0)):2==phase&&(0==$(".goods").eq(activeShop).children().length?playerAction(a,activeShop,-1):playerAction(a,activeShop,findBestIndex(a,activeShop))||playerAction(a,activeShop,-1))}function botArrangeFlower(a){if(players[a].hand.length<1)return!1;for(i=0;i<players[a].hand.length;i++){var b=players[a].hand[i].getFlowers(),c=players[a].hand[i].quality,d=[[],[],[]];for(j=0;j<players[a].vases.length;j++)d[players[a].vases[j].type].push([j,players[a].vases[j].quality]);if(d[0].length>=b[0]&&d[1].length>=b[1]&&d[2].length>=b[2]){for(k=0;k<d.length;k++)d[k].sort(function(a,b){return a[1]-b[1]});var e=players[a].getBonus(0),f=[];for(k=0;k<3;k++)for(l=0;l<b[k];l++)e+=d[k][l][1],f.push(d[k][l][0]);if(e+2*players[a].numRibbons>=c){var g=Math.floor((c-e)/2);return socket.emit("arrange flower",{id:a,card:i,indices:f,ribbons:g}),!0}}}return!0}function botChooseTimeTokens(a){var b=[],c=[];turn<=3&&b.unshift(5),players[a].hand.length>=3||0==shops[4].length?c.push(4):players[a].hand.length<=1&&b.unshift(4),players[a].hand.length>0&&(0==shops[1].length||players[a].vases.length==players[a].numVases?c.push(1):needFlowerTokens(a,0)&&b.unshift(1),0==shops[2].length||players[a].vases.length==players[a].numVases?c.push(2):needFlowerTokens(a,1)&&b.unshift(2),0==shops[3].length||players[a].vases.length==players[a].numVases?c.push(3):needFlowerTokens(a,2)&&b.unshift(3)),players[a].money<=3&&b.unshift(0);var d=[];for(i=0;i<6;i++)b.includes(i)||c.includes(i)||d.push(i);shuffle(d),shuffle(c),b=b.concat(d,c);var e=players[a].getMyTimeTokens();for(players[a].myPlayedTimeTokens=[],i=0;i<6;i++)players[a].myPlayedTimeTokens.push(e[b.indexOf(i)]);socket.emit("submit time tokens",{id:a,timeTokens:players[a].myPlayedTimeTokens})}function needFlowerTokens(a,b){if(players[a].hand.length>0){var c=players[a].hand[0].getFlowers()[b],d=0;for(var e in players[a].vases)players[a].vases[e].type==b&&d++;return c>d}return!0}function findBestIndex(a,b){var c=0,d=shops[b].length;if(0==d)return-1;switch(b){case 0:for(i=0;i<d;i++)shops[0][i]>shops[0][c]&&(c=i);break;case 1:case 2:case 3:if(needFlowerTokens(a,b-1))for(i=0;i<d;i++){var e=shops[b][c].quality,f=shops[b][i].quality;f>e&&(c=i)}else c=-1;break;case 4:for(i=0;i<d;i++){var e=shops[4][c].quality,f=shops[4][i].quality;f<e&&(c=i)}break;case 5:c=tieBreak.indexOf(Number(a))>=numPlayers-2?4:players[a].time<=2&&players[a].money>=5?0:(players[a].numVases<=4||players[a].numVases==players[a].vases.length)&&players[a].money>=4?1:(players[a].numRibbons<=2&&(players[a].money,shops[5][2].cost),2)}return c}function generateStartingFlowerCards(){var a=[];return a.push([0,1,1,3,1]),a.push([0,1,1,3,1]),a.push([1,0,1,3,1]),a.push([1,0,1,3,1]),a.push([1,1,0,3,1]),a.push([1,1,0,3,1]),shuffle(a),a}function getRandomFlowerToken(){var a=[0,0,0,0,1,1,1,1,2,2,2,2],b=[1,3,3,3,2,2,3,3,2,2,2,4],c=ran(a.length);return[a[c],b[c]]}function getRandomFlowerCard(){var a=[[[1,0,0],[0,1,0],[0,0,1]],[[2,0,0],[0,2,0],[0,0,2],[1,1,0],[1,0,1],[0,1,1]],[[2,1,0],[2,0,1],[1,2,0],[1,0,2],[0,2,1],[0,1,2],[1,1,1]],[[2,2,0],[2,0,2],[0,2,2],[2,1,1],[1,2,1],[1,1,2]],[[2,2,1],[2,1,2],[1,2,2]]],b=randomWithWeight([2,6,6,3,0]),c=a[b][ran(a[b].length)],d=randomWithWeight([3,2,1]),e=c[0]+c[1]+c[2],f=Math.ceil(2.5*e)+3*d,g=2*(e-1)+2*d;return[c[0],c[1],c[2],f,g]}function getTools(a){var b=[0,0,0,0,0,0];for(j=0;j<a;j++)b[ran(6)]++;return b}function randomWithWeight(a){var b=0,c=0;for(k=0;k<a.length;k++)b+=a[k];for(var d=ran(b)+1;d>a[c]&&c<a.length-1;)d-=a[c],c++;return c}function startGame(a){$("#game_board").show(),myID=a.players.indexOf(myusername),gameID=a.gameId,players=[];for(var b in a.players)players.push(new player(b,a.players[b],playerColors[b],!1));for(i=0;i<a.numBots;i++){var c=botNames[ran(botNames.length)];players.push(new player(players.length,c+"#"+i,playerColors[players.length],!0))}numPlayers=players.length,numBots=a.numBots,gameState=2,turn=1,phase=0;var d=new Date;if(timeStart=d.getTime(),tieBreak=[],0==myID){var e=[0,1,2,3,4,5];for(shuffle(e),i=0;i<numPlayers;i++)tieBreak.push(i);shuffle(tieBreak);var f=[0,1,2,3,4,5,6,7];shuffle(f);var g=f.splice(0,numPlayers);socket.emit("give starting stuff",{flowerCards:generateStartingFlowerCards(),bonuses:e,tieBreak:tieBreak,achieve:g}),socket.emit("generate market",generateGoods(numPlayers))}}function addLog(a,b){var c;c=1==addLog.arguments.length?"white":players[b].color;var d=$("<div/>").text(a).css({"background-color":c});$("#gamelog").append(d),$("#gamelog").scrollTop($("#gamelog")[0].scrollHeight)}function addNoti(a){$("#notification").addClass("show"),$("#notification").text(a),setTimeout(function(){$("#notification").removeClass("show")},3e3)}function ran(a){return Math.floor(Math.random()*a)}function shuffle(a){var b,c,d;for(d=a.length;d;d--)b=ran(d),c=a[d-1],a[d-1]=a[b],a[b]=c}function collectTimeTokens(){for(k=0;k<6;k++){var a=[];for(j=0;j<numPlayers;j++)a.push(new timeToken(j,players[j].myPlayedTimeTokens[k]));for(sortTimeToken(a),l=0;l<a.length;l++){var b=a[l].id,c=$("<div/>").css("background-color",players[b].color).addClass("time_token").text(timeTokenList[a[l].value]).val(b);a[l].value>4&&(c.css("opacity",.2),c.val(-1));var d=k+1;$("#timetokenarea"+d).append(c)}}}function sortTimeToken(a){for(i=0;i<a.length;i++){var b=i;for(j=i+1;j<a.length;j++)(a[j].value<a[b].value||a[j].value==a[b].value&&tieBreak.indexOf(a[j].id)<tieBreak.indexOf(a[b].id))&&(b=j);x=a[i],a[i]=a[b],a[b]=x}}function goFirst(a){var b=tieBreak.indexOf(Number(a));for(tieBreak.splice(b,1),tieBreak.unshift(Number(a)),$(".tie_break_token").eq(b).fadeOut(),b>0&&$(".tie_break_token").eq(0).before($(".tie_break_token").eq(b)),$(".tie_break_token").eq(0).fadeIn(),i=0;i<numPlayers;i++)$(".tie_break_token").eq(i).text(Number(i+1))}function nextPlayer(){var a=-1;if(2==phase){if(++activeTokenOrder>=numPlayers||-1==getActiveTimeToken()){for(activeTokenOrder=0,activeShop++;activeShop<6&&-1==getActiveTimeToken();)activeShop++;$(".shop").removeClass("active"),$(".shop").eq(activeShop).addClass("active")}$(".time_token").removeClass("active"),$(".time_token_area").eq(activeShop).children(".time_token").eq(activeTokenOrder).addClass("active"),activeShop<6?a=getActiveTimeToken():($(".shop").removeClass("active"),$(".time_token").removeClass("active"),0==myID&&socket.emit("end phase",{phase:phase}),a=-1)}else if(0==phase||3==phase){for(var b=0==phase?3:2,c=-1==currentPlayer?0:tieBreak.indexOf(Number(currentPlayer))+1;c<numPlayers&&players[tieBreak[c]].actionCubes<b;)c++;c<numPlayers?a=tieBreak[c]:0==myID&&(socket.emit("end phase",{phase:phase}),a=-1)}currentPlayer=a,a>=0&&$(".status_bar--text").text(players[a].username+"'s turn").css("background-color",players[a].color),a==myID?($("#status_bar").addClass("active"),blink=setInterval(function(){document.title=titleBlink?"!! Your Turn !!":"Pakklong Talat";var a=titleBlink?"img/title_icon_blink.png":"img/title_icon.png";$('link[rel="icon"]').attr("href",a),titleBlink=!titleBlink},700),0!=phase&&3!=phase||$("#button_area").append($("<button/>").addClass("pass_button").text("Pass"))):($("#status_bar").removeClass("active"),clearInterval(blink),titleBlink=!1,$('link[rel="icon"]').attr("href","img/title_icon.png"),document.title="Pakklong Talat",0!=phase&&3!=phase||$(".pass_button").remove())}function getActiveTimeToken(){return $(".time_token_area").eq(activeShop).children(".time_token").eq(activeTokenOrder).val()}function checkEndGame(){var b=40,c=7,d=!1;if(turn>=10)return!0;var e=0;for(var f in players){var g=0;for(var h in players[f].stars)players[f].stars[h]>g&&(g=players[f].stars[h]);g>=c&&(d=!0,players[f].score+=2),players[f].score>e&&(e=players[f].score)}return e>=b&&(d=!0),d}var numPlayersDone=0;$(document).ready(function(){$(".gamelog_button").click(function(){$("#gamelog").height(500-$("#gamelog").height()),$(".gamelog_button").toggle()}),$(document).on("click",".button--expand_achievement",function(){var a="0px"===$("#achievement_area--large").css("bottom")?"-350px":"0px";$("#achievement_area--large").css("bottom",a)}),$(document).on("click",".button--expand_tool",function(){var a="0px"===$("#tool_lookup").css("right")?"-400px":"0px";$("#tool_lookup").css("right",a)}),$(document).on("click",".language_toggle",function(){language="EN"===language?"TH":"EN",$(".language_toggle").toggle()}),$(document).on("click",".autoplay_button",function(){$(".autoplay_button").toggle(),players[myID].isBot=!players[myID].isBot,autoplay=!autoplay,socket.emit("toggle autoplay",{id:myID,newStatus:players[myID].isBot})}),$(document).on("click",".random_button",function(){var a=[0,1,2,3,4,5];for(shuffle(a),i=0;i<6;i++)$(".time_token_drop").eq(a[i]).append($("#button_area").find(".time_token").first());this.remove()}),$(document).on("click",".money",function(){if(currentPlayer==myID&&(0==activeShop||0==phase||3==phase)){var a=$("#goods1").children().index(this);playerAction(myID,0,a)}}),$(document).on("click",".flower_token",function(){var a=$(this).data("type");if(currentPlayer==myID&&(activeShop==a||buyFlowerToolToken||0==phase||3==phase)&&$(this).parent().hasClass("goods")){var b=$(".goods").eq(a).children().index($(this));playerAction(myID,a,b)}else if($(this).parent().hasClass("player_vase"))if(4==phase)$(this).toggleClass("chosen");else if(0==phase||2==phase||3==phase){var b=$("#my_vase").children().index($(this));window.confirm("discard this flower token?")&&players[myID].discardFlowerToken(b)}}),$(document).on("click",".flower_card",function(){if(currentPlayer!=myID||4!=activeShop&&0!=phase&&3!=phase||!$(this).parent().hasClass("goods")){if(4==phase&&$(this).parent().is("#my_hand"))$(this).hasClass("chosen")?$(this).removeClass("chosen"):($("#my_hand").find(".flower_card").removeClass("chosen"),$(this).addClass("chosen"));else if($(this).parent().hasClass("player_hand")){var a=$("#my_hand").children().index($(this));window.confirm("discard this card?")&&players[myID].discardFlowerCard(a)}}else{var a=$("#goods5").children().index($(this));playerAction(myID,4,a)}}),$(document).on("click",".tool",function(){currentPlayer!=myID||5!=activeShop&&0!=phase&&3!=phase||playerAction(myID,5,$(this).val())}),$(document).on("click",".submit_button",function(){if(3==gameState)$("#gamelist_lobby").show(),$("#menu_bar").show(),$("#game_board").hide(),$("#gamelog_window").hide(),socket.emit("leave game");else if(1==phase)if(6==$(".time_token_drop div").length){for(i=0;i<6;i++)players[myID].myPlayedTimeTokens[i]=$(".time_token").eq(i).val();isDone=!0,socket.emit("submit time tokens",{id:myID,timeTokens:players[myID].myPlayedTimeTokens}),$(".submit_button").remove()}else alert("add time tokens to all shops!");else if(4==phase)if(0==$("#my_hand").find(".chosen").length)addNoti("Select a flower card");else{var a=$("#my_hand").find(".flower_card").index($("#my_hand").find(".chosen").eq(0)),b=$("#my_vase").find(".chosen").length,c=[],d=[];for(i=0;i<b;i++){var e=$("#my_vase").find(".flower_token").index($("#my_vase").find(".chosen").eq(i));c.push(players[myID].vases[e]),d.push(e)}var f=Number($(".add_ribbons :selected").val());if(players[myID].hand[a].verify(c,f,players[myID].getBonus(0))){for(socket.emit("arrange flower",{id:myID,card:a,indices:d,ribbons:f}),i=0;i<f;i++)$("#button_area .add_ribbons").find("option").last().remove();addNoti("Arrangement successful !")}}}),$(document).on("click",".pass_button",function(){phase<=3&&currentPlayer==myID?playerAction(myID,0,-1):4==phase&&(isDone=!0,$("#my_hand").children().removeClass("chosen"),$("#my_vase").children().removeClass("chosen"),addNoti("Done! Wait for other players to finish"),$("#button_area").empty(),socket.emit("finish arranging"))}),socket.on("new game",function(a){$("#gamelist_lobby").hide(),$("#menu_bar").hide(),$("#game_board").show(),$("#gamelog_window").show(),$(".autoplay_button").remove();$("<button/>").text("Autoplay: On").addClass("autoplay_button").hide(),$("<button/>").text("Autoplay: Off").addClass("autoplay_button");$(".language_toggle").remove();var d=$("<button/>").text("ไทย").addClass("language_toggle").hide(),e=$("<button/>").text("Eng").addClass("language_toggle");$("#gamelog_window").append(d).append(e),language="EN",autoplay=!1,startGame(a)}),socket.on("starting stuff recieved",function(a){for(playerBonuses=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]],i=0;i<numPlayers;i++)players[i].bonus=playerBonuses[a.bonuses[i]];for(tieBreak=a.tieBreak,boardSetup(),i=0;i<numPlayers;i++){var b=a.flowerCards[i];if(myID==i){var c=$("<div/>").addClass("flower_card");for(j=1;j<4;j++)for(k=0;k<b[j-1];k++)c.append($("<img/>").attr("src","img/ficon"+j+".png").addClass("flower_icon")),c.append($("<span/>").val(b[j-1]));c.append($("<br>")),c.append($("<img/>").attr("src","img/card_quality_icon.png").addClass("card_icon"),$("<div/>").text(b[3]).addClass("quality_symbol")),c.append($("<img/>").attr("src","img/card_score_icon.png").addClass("card_icon"),$("<div/>").text(b[4]).addClass("score_symbol")),players[i].drawFlowerCard(new flowerCard(b[0],b[1],b[2],b[3],b[4]),c)}else players[i].drawFlowerCard(new flowerCard(b[0],b[1],b[2],b[3],b[4]))}for(achievements=[],$("#achievement_area").empty(),$("#achievement_area").append($("<span/>").text("Achievements")).append($("<br>")),$("#achievement_area").append($("<button/>").text("Expand").addClass("button--expand_achievement").css({position:"absolute",top:"0"})),i=0;i<a.achieve.length;i++){var d=a.achieve[i],e=$("<img/>").attr("src","img/achievement"+d+".png").addClass("achievement_card").val(d);$("#achievement_area").append(e),achievements.push(new achievementCard(d)),$("#achievement_area--large").append($("<img/>").attr("src","img/achievement"+d+".png").addClass("achievement_card--large").val(d))}$("#achievement_area--large").append($("<button/>").text("Close").addClass("button--expand_achievement")),$("#gamelog").empty(),addLog("*"),addLog("***** Turn "+turn+"******"),addLog("*"),$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 0: Planning Phase"),currentPlayer=-1,nextPlayer()}),socket.on("market generated",function(a){newMarket(a)}),socket.on("to next phase",function(a){switch($("#button_area").empty(),clearInterval(blink),titleBlink=!1,$('link[rel="icon"]').attr("href","img/title_icon.png"),document.title="Pakklong Talat",a.phase){case 0:$(".time_token_area").each(function(){$(this).append($("<div/>").addClass("time_token_drop").droppable({accept:".time_token",drop:function(a,b){var c=$(b.draggable).val();if($(this).children(".time_token").length>0){var d=$(this).children(".time_token").eq(0).val();$(this).children(".time_token").eq(0).text(timeTokenList[c]).val(c),$(b.draggable).text(timeTokenList[d]).val(d)}else $(this).append(b.draggable);$(this).addClass("time_token_drop--highlight")}}))}),$myTimeTokenButtons=[];var b=players[myID].getMyTimeTokens();for(i=0;i<6;i++)$("#button_area").append($("<div/>").addClass("time_token").css("background-color",players[myID].color).text(timeTokenList[b[i]]).val(b[i]).draggable({revert:"invalid",helper:"clone",snap:".time_token_drop"}));if($("#button_area").append($("<button/>").addClass("submit_button").text("Submit")),addLog("----- planning phase -----"),addLog("EN"===language?">> Drag and drop time tokens to each shop":">> ลากเบี้ยเวลาไปวางในร้านแต่ละร้าน"),0==myID)for(var c in players)players[c].isBot&&botChooseTimeTokens(players[c].id);phase=1,$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 1: Planning Phase");break;case 1:isDone=!1,$(".time_token_area").empty(),collectTimeTokens(),$("#button_area").empty(),$("#button_area").append($("<button/>").addClass("pass_button").text("Pass")),addLog("------ buy phase ------"),tutorial&&addLog(">> On your turn, click on the goods to buy"),phase=2,activeShop=0,activeTokenOrder=-1,$(".shop").eq(0).addClass("active"),$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 2: Buy Phase"),nextPlayer(),currentPlayer>=0&&0==myID&&players[currentPlayer].isBot&&botAction(currentPlayer);break;case 2:addLog("------ after market phase ------"),addLog("EN"==language?">> You may spend 2 action cubes to buy anything":">> สามารถจ่าย Action cube 2 เม็ดเพื่อซื้ออะไรก็ได้"),$(".time_token_area").empty(),$("#button_area").append($("<button/>").addClass("pass_button").text("Pass")),phase=3,currentPlayer=-1,$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 3: After-market Phase"),$(".status_bar--text").empty(),nextPlayer(),currentPlayer>=0&&0==myID&&players[currentPlayer].isBot&&botAction(currentPlayer);break;case 3:$("#button_area").append($("<button/>").addClass("submit_button mdl-button mdl-js-button mdl-button--fab").text("Arrange")),$("#button_area").append($("<button/>").addClass("pass_button").text("End phase"));var d=$("<select/>").addClass("add_ribbons");for(i=0;i<=players[myID].numRibbons;i++){var e=i>=1?" ribbons":" ribbon";d.append($("<option/>").val(i).text(i+e))}if($("#button_area").append(d),addLog("------ arranging phase ------"),"EN"===language?(addLog(">> Select a flower card & flower tokens to arrange"),addLog(">> or click on 'skip phase'")):(addLog(">> เลือกการ์ดดอกไม้และเบี้ยดอกไม้เพื่อจัดดอกไม้"),addLog(">> หรือกด Skip Phase เพื่อข้ามเฟสนี้")),0==myID)for(var c in players)players[c].isBot&&(botArrangeFlower(players[c].id),socket.emit("finish arranging"));phase=4,$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 4: Arranging Phase"),$(".status_bar--text").empty();break;case 4:isDone=!1;for(var f in achievements)for(i=0;i<numPlayers;i++)achievements[f].check(tieBreak[i])&&players[tieBreak[i]].getAchievementRewards(achievements[f].getRewards());if(checkEndGame()){gameState=3;var g=0;for(addLog("------------- ------------- -------------"),addLog("-------------  Final Scores -------------"),addLog("------------- ------------- -------------"),k=0;k<numPlayers;k++)addLog(players[k].username+" : "+players[k].score,k),(players[k].score>players[g].score||players[k].score==players[g].score&&tieBreak.indexOf(k)<tieBreak.indexOf(g))&&(g=k);addLog("||",g),"EN"===language?addLog("||  The winner is  ::: "+players[g].username+" :::",g):addLog("||  ผู้ชนะคือ  ::: "+players[g].username+" :::",g),addLog("||",g);var h=new Date,j=h.getTime()-timeStart;addLog("Play Time: "+("0"+Math.floor(j/6e4)).slice(-2)+":"+("0"+Math.floor(j%6e4/1e3)).slice(-2)+" minutes"),addLog("Number of turns: "+turn),addLog("--------------------------------------------"),addLog("รบกวนตอบแบบสอบถาม เพื่อนำพัฒนาเกมนี้ให้สนุกยิ่งขึ้นครับ");var l=$("<a/>").text("[ลิงค์แบบสอบถาม]").attr("href"," https://goo.gl/forms/JFXs6f1p2ksIavcH3").attr("target","_blank");$("#gamelog").append(l),$("#gamelog").scrollTop($("#gamelog")[0].scrollHeight),$("#button_area").append($("<button/>").addClass("submit_button").text("Return to lobby"));var m="";for(k=0;k<numPlayers;k++)m+="p"+k+" s"+players[k].score;m+=" turn"+turn,0==myID&&socket.emit("game end",{text:m})}else addLog("*"),addLog("***** Turn "+turn+"******"),addLog("*"),addLog("----- early-bird phase -----"),0==myID&&socket.emit("generate market",generateGoods(numPlayers)),turn++,phase=0,currentPlayer=-1,$(".status_bar--turn").text("Turn "+turn),$(".status_bar--phase").text("Phase 0: Early-bird Phase"),nextPlayer(),currentPlayer>=0&&0==myID&&players[currentPlayer].isBot&&botAction(currentPlayer)}}),socket.on("time tokens submitted",function(a){players[a.id].isBot||addLog(players[a.id].username+" has submitted time tokens",a.id),players[a.id].myPlayedTimeTokens=a.timeTokens,numPlayersDone++,0==myID&&numPlayersDone>=numPlayers&&(socket.emit("end phase",{phase:1}),numPlayersDone=0)}),socket.on("action taken",function(a){takeAction(a.id,a.location,a.index),buyFlowerToolToken||nextPlayer(),currentPlayer>=0&&0==myID&&players[currentPlayer].isBot&&botAction(currentPlayer)}),socket.on("flower arranged",function(a){players[a.id].arrangeFlower(a.card,a.indices,a.ribbons)}),socket.on("player finished arranging",function(){numPlayersDone++,0==myID&&numPlayersDone>=numPlayers&&(socket.emit("end phase",{phase:4}),numPlayersDone=0)}),socket.on("game finished",function(){myroom=-1,$("#create_room").prop("disabled",!1)}),socket.on("save game",function(a){$.ajax({type:"POST",url:a.url,data:a.text,dataType:"text"})}),socket.on("autoplay toggled",function(a){players[a.id].isBot=a.newStatus})}),function(a){function b(a,b){if(!(a.originalEvent.touches.length>1)){a.preventDefault();var c=a.originalEvent.changedTouches[0],d=document.createEvent("MouseEvents");d.initMouseEvent(b,!0,!0,window,1,c.screenX,c.screenY,c.clientX,c.clientY,!1,!1,!1,!1,0,null),a.target.dispatchEvent(d)}}if(a.support.touch="ontouchend"in document,a.support.touch){var c,d=a.ui.mouse.prototype,e=d._mouseInit,f=d._mouseDestroy;d._touchStart=function(a){var d=this;!c&&d._mouseCapture(a.originalEvent.changedTouches[0])&&(c=!0,d._touchMoved=!1,b(a,"mouseover"),b(a,"mousemove"),b(a,"mousedown"))},d._touchMove=function(a){c&&(this._touchMoved=!0,b(a,"mousemove"))},d._touchEnd=function(a){c&&(b(a,"mouseup"),b(a,"mouseout"),this._touchMoved||b(a,"click"),c=!1)},d._mouseInit=function(){var b=this;b.element.bind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),e.call(b)},d._mouseDestroy=function(){var b=this;b.element.unbind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),f.call(b)}}}(jQuery);var socket=io(),myroom;$(document).ready(function(){$(".chat_toggle_button").click(function(){$("#chat_messages").toggle(),$(".chat_toggle_button").toggle()}),$("#create_room").click(function(){-1==myroom?socket.emit("create room"):console.log("you are already in a room!")}),$(document).on("click",".delete_room",function(){socket.emit("delete room",{roomId:$(this).val()})}),$(document).on("click",".join_leave_room",function(){var a=$(this).val();-1==myroom?($(this).text("Leave"),socket.emit("join room",{roomId:a})):myroom==a?($(this).text("Join"),socket.emit("leave room")):console.log("you are already in a room !")}),$(document).on("click",".start_game",function(){var a=$("#add_bots :selected").val();socket.emit("start game",a)}),$(document).on("click","#log_out",function(){socket.emit("disconnect"),logOut()}),$("form").submit(function(){""!=$("#chat_input").val()&&(socket.emit("add chat message",$("#chat_input").val()),$("#chat_input").val(""))}),socket.on("username checked",function(a){a.dupe?alert("This username has been used already."):($("#login_page").hide(),$("#menu_bar").show(),$("#gamelist_lobby").show(),$("#chat_box").show(),$("#chat_messages").append($("<li/>").text("Welcome !")),myroom=-1,$("#username").text(myusername),socket.emit("add user",{username:myusername}))}),socket.on("update user list",function(a){$("#online_users ul").empty();for(name in a.list)$("#online_users ul").append($("<li/>").text(name))}),socket.on("room created",function(a){var b=$("<div/>"),c=$("<div/>"),d=$("<ul/>").addClass("participants").append($("<li/>").text(a.host));if(a.host==myusername){myroom=a.roomId;var e=$("<button/>").text("Delete").addClass("delete_room").val(a.roomId),f=$("<button/>").text("Start").addClass("start_game").val(a.roomId),g=$("<select/>").attr("id","add_bots");for(g.append($("<option/>").val(0).text("No bots")),i=1;i<6;i++)g.append($("<option/>").val(i).text(i+" bots"));c.addClass("room_options").append(e).append(f).append(g),$("#create_room").prop("disabled",!0),myroom=a.roomId}else{var h=$("<button/>").text("Join").addClass("join_leave_room").val(a.roomId);c.append(h)}b.addClass("game_room").val(a.roomId).append(c).append(d),$("#open_rooms").append(b)}),socket.on("room deleted",function(a){$(".game_room").filter(function(){return this.value==a.roomId}).remove(),a.roomId==myroom&&(myroom=-1,$("#create_room").prop("disabled",!1))}),socket.on("update room",function(a){var b=$(".game_room").filter(function(){return this.value==a.roomId}).children("ul");b.empty();for(name in a.list)b.append($("<li/>").text(name));a.username==myusername&&(myroom==a.roomId?($("#create_room").prop("disabled",!1),myroom=-1):($("#create_room").prop("disabled",!0),myroom=a.roomId))}),socket.on("game started",function(a){$(".game_room").filter(function(){return this.value==a.roomId}).children("div").empty()}),socket.on("errorMessage",function(a){alert(a)}),socket.on("chat message added",function(a){var b=new Date,c=("0"+b.getHours()).slice(-2),d=("0"+b.getMinutes()).slice(-2),e="["+c+":"+d+"]   "+a.user+" : "+a.message;$("#chat_messages").append($("<li/>").text(e)),$("#chat_messages").scrollTop($("#chat_messages")[0].scrollHeight)})});var botNames=["Mel","Game","Job","Lui","Poupe","Due","Au","Som","Benz","Aon","Oak","Boat","Tana"],playerColors=["aquamarine","bisque","coral","darkseagreen","peru","lightcyan"],shopList=["Restaurant","Rose","Orchid","Mums","Bookstore","Tool"],shopColors=["yellow","pink","skyblue","white","purple","lightgreen"],shopTColors=["black","black","white","black","white","black"],shopYCoor=[55,85,115,145,175,235,280],timeTokenList=[0,1,2,3,4,"x","xx"],bonusSymbols=["+Q","$","VP"],toolCost=[[3,5,4],[3,2,4],[1,2,1],[2,1,0],[1,0,0]],toolAmount=[[1,2,2],[1,1,2],[1,2,2],[1,1,1],[1,1,1]],toolString=[["a clock","two clocks","two clocks"],["a vase","a vase","two vases"],["a ribbon","two ribbons","two ribbons"],["a flower","a flower","a flower"],["First in Tie Break","First in Tie Break","First in Tie Break"]],achievementSymbol=[0,1,2,3,4,5,6,7],achievementString=["6 pink","6 blue","6 white","4 pink & 4 blue","4 pink & 4 white","4 blue & 4 white","3 pink & blue & white","5 finished cards"],achievementRewards=[[0,0,0,3,0],[0,0,0,3,0],[0,0,0,3,0],[0,0,0,2,2],[0,0,0,2,2],[0,0,0,2,2],[1,1,1,0,2],[0,0,0,3,0]],achievementRewardString=["blue + white + 2 VP","pink + white + 2 VP","blue + pink + 2 VP","2 white + 1 VP + $2","2 blue + 1 VP + $2","2 pink + 1 VP + $2"," 1 white & blue & pink + $2","1 white & blue & pink + 2 VP"],players,numPlayers,numBots=0,gameState,turn,phase,timeStart,buyFlowerToolToken=!1,autoplay=!1,currentPlayer,myusername,myID,gameID,achievements,selectedFlowerCard,startingMoney=5,handLimit=4,tutorial=!0,isDone=!1,shops,activeShop,activeTokenOrder,tieBreak,blink,titleBlink=!1,language;