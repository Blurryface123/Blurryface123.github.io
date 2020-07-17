var userID = Math.floor(Math.random() * 10);
var arrayCardsID = []; 
var deckIsFinished = false;
//window.response = false;
function connect() {
  //var socket = new SockJS('https://blurryface123.azurewebsites.net/virus-game'); //AQUI SE CONECTA CON EL BACK
  var socket = new SockJS('https://localhost:8080/virus-game');
  stompClient = Stomp.over(socket);


  //MIENTRAS ESTEMOS CONECTADOS
  stompClient.connect({}, function (frame) {
    drawCard();
    stompClient.subscribe('/topic/refill-deck', function (card) {


    });

    stompClient.subscribe('/topic/conexion', function (positionsValues) {
      var id = JSON.parse(positionsValues.body).id;
      var y = JSON.parse(positionsValues.body).y;
      var x = JSON.parse(positionsValues.body).x;
      console.log("TOP: " + y);
      console.log("LEFT: " + x);
      console.log("subscribe id: " + id);
      $("#" + id).css({
        top: y + "px",
        left: x + "px"
      });
    });

    stompClient.subscribe('/user/queue/dealCard', function (card) {
      var cardId = JSON.parse(card.body).id;
      var cardRef = "./img/" + JSON.parse(card.body).cardValue + ".jpg";
      var $cardDiv = createCardDiv(cardId, "new-card card own-hand hidden", cardRef);

      $($cardDiv).appendTo($("#player-self"));
      $(".hidden").draggable();
      console.log(cardId.indexOf("67"));
      if (cardId.indexOf("67") != -1) {
        deckIsFinished = true;
        console.log(deckIsFinished);
      }
    });

    stompClient.subscribe('/topic/sendPlayedCard', function (card) {
      var cardId = JSON.parse(card.body).id;
      var cardDiv = JSON.parse(card.body).cardValue;
      var y = JSON.parse(card.body).coords.y;
      var x = JSON.parse(card.body).coords.x;
      if ($("#" + cardId).length == 0) {
        $(cardDiv).css({
          top: y + "px",
          left: x + "px"
        }).appendTo("#store-cards");
      } else {
        console.log("ESTA CARTA YA EXISTE PARA TI")
      }
    });
  })
}

function createCardDiv(cardId, cardClass, cardRef) {
  var $cartaDiv = $('<div>', {
    class: cardClass, //"new-card card own-hand"
    id: cardId  //aqui el lenght es 0 porque no hay nada creado
  })
  var $cartaImg = $('<img>', {
    alt: "Card image",
    class: "card-img", //"new-card card own-hand"
    src: cardRef
  });
  //.data({ "played": "false" })
  var $cartaConImg = $($cartaDiv).append($cartaImg);

  return $cartaConImg;
}

function setCookie(cvalue) {
  var d = new Date();
  d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = "user" + " = " + cvalue + ";"
    + expires + ";" + "SameSite=Strict;"; //samesite para evitar cross site attacks
}

function getCookie(name) {
  //var name = "user =";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {

      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function drawCard() {
  var button = $("#button");
  //no sera por click, ser al droppear
  button.on("click", function (e) {
    //var id = "card-" + ($(".new-card").length + 1);
    if ( deckIsFinished == true){
      console.log("deck is finished");
      stompClient.send("/app/discard", {}, JSON.stringify(
        {
          "id": arrayCardsID.join()
        }))
        console.log("deck is finished a terminado");
    }
    if (countCardsOnHands() < 3) {
      console.log(countCardsOnHands());
      stompClient.send("/app/pideCarta", {}, JSON.stringify(
        {
          'id': "1" //a cambiar luego por el verdadero id
        }
      ));
    }
  });
}

function countCardsOnHands() {
  console.log($("#player-self").find(".hidden").length);

  return $("#player-self").find(".hidden").length;
}

function dragCard() {
  //ver https://api.jquery.com/on/ y even delegation luego para evitar tener que hacer dos clicks para mover carta
  $(document).on("mouseover", '.played', function (e) {
    console.log("id PARA VER: " + this.id);
    $('.played').draggable({
      drag: function (e, ui) {
        stompClient.send("/app/prueba", {}, JSON.stringify(
          {
            'id': this.id,
            'y': ui.position.top,
            'x': ui.position.left
          }
        ));
      }
    });
  });
}

function deleteCardByIdAndClass(id, cardClass) {
  if ($("#" + id).hasClass(cardClass)) {
    $("#" + id).remove();
  }
}

function coordsOfPlayedCard(ui, index) {
  var coords = null;
  var newCardLeft = ui.position.left + 602.617;
  var newCardTop = ui.position.top + 512.1167;
  if (index == 0) {
    coords = {
      x: newCardLeft,
      y: newCardTop
    }

  } else if (index == 1) {
    coords = {
      x: newCardLeft + 86.7666,
      y: newCardTop
    }
  } else {
    coords = {
      x: newCardLeft + 173.533,
      y: newCardTop
    }
  }
  return coords;
}

$(function () {
  connect();
  dragCard();

  $("#discards").droppable({
    tolerance: "fit",
    accept: ".new-card",
    drop: function (event, ui) {
      var id = ui.draggable.attr("id");
      arrayCardsID.push(id);
      console.log(arrayCardsID);
      deleteCardByIdAndClass(id, "new-card");
    }
  });

  $(".players-table").droppable({
    tolerance: "fit",
    accept: ".new-card",
    drop: function (event, ui) {
      var id = ui.draggable.attr("id");
      var imgSource = ui.draggable[0].innerHTML;
      var index = $("div .new-card").index($("#" + id));
      console.log(ui.draggable);
      console.log(id);
      console.log(event.target);

      var $playedCard = createCardDiv(id, "new-card card own-hand played", $(imgSource).attr("src")).css({
        position: "absolute"
      });
      console.log($("div .new-card").index($("#" + id)));
      var cardCords = coordsOfPlayedCard(ui, index);
      deleteCardByIdAndClass(id, "hidden");

      stompClient.send("/app/playCard", {}, JSON.stringify(
        {
          'id': id,
          'cardValue': $playedCard[0].outerHTML,
          "coords": {
            'x': cardCords.x,
            'y': cardCords.y
          }
        }
      ));
    }
  });
});