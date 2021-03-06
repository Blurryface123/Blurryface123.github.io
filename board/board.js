var userID = Math.floor(Math.random() * 10000);
var arrayCardsID = [];
var deckIsFinished = false;
//window.response = false;
function connect() {
  var socket = new SockJS('https://blurryface123.azurewebsites.net/virus-game'); //AQUI SE CONECTA CON EL BACK
  //var socket = new SockJS('http://localhost:8080/virus-game');
  stompClient = Stomp.over(socket);


  //MIENTRAS ESTEMOS CONECTADOS
  stompClient.connect({}, function (frame) {
    startGame()
    drawCard();

    stompClient.subscribe('/topic/drag', function (positionsValues) {
      var id = JSON.parse(positionsValues.body).id;
      var y = JSON.parse(positionsValues.body).y;
      var x = JSON.parse(positionsValues.body).x;
      $("#" + id).css({
        top: y+ "%",
        left: x+ "%"
      });
    });

    stompClient.subscribe('/user/queue/dealCard', function (card) {
      var cardId = JSON.parse(card.body).id;
      var cardRef = "./img/" + JSON.parse(card.body).cardValue + ".jpg";
      var $cardDiv = createCardDiv(cardId, "new-card card own-hand hidden", cardRef);

      $($cardDiv).appendTo($("#player-self"));
      $(".hidden").draggable();
      deckIsFinished = checkSubstring(cardId, "67");
    });

    stompClient.subscribe('/topic/sendPlayedCard', function (card) {
      var cardId = JSON.parse(card.body).id;
      var cardDiv = JSON.parse(card.body).cardValue;
      var playerContainer = JSON.parse(card.body).parentId;
      var coord = JSON.parse(card.body).coords;

      moveCard(cardId, cardDiv, playerContainer, coord)
    });
  })
}

function moveCard(cardId, cardDiv, playerContainer, coord) {
  if ($($("#" + playerContainer).find("#" + cardId)).length == 0) { //could be faster using children instead of find
    deleteCardByIdAndClass(cardId, "new-card");
    
    $(cardDiv).appendTo("#" + playerContainer).css({
      top: (parseFloat(coord.y/ parseFloat($(window).height())) * 100+ "%"),
      left: (parseFloat(coord.x/ parseFloat($(window).width())) * 100+ "%")
    });
  } else {
    console.log("ESTA CARTA YA EXISTE")
  }
}

function checkSubstring(cardId, substring) {
  if (cardId.indexOf(substring) != -1) {
    return true
  } else { return false }
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

function setCookie(key, value) {
  var d = new Date();
  d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = key + " = " + value + ";"
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
    if (deckIsFinished == true) {
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
        stompClient.send("/app/dragCoord", {}, JSON.stringify(
          {
            'id': this.id,
            'y': ( 100 * parseFloat(ui.position.top/ parseFloat($(this).parent().height())) ),
            'x': ( 100 * parseFloat(ui.position.left / parseFloat($(this).parent().width())) )
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

function sendCardValue(id, $playedCard, event, cardCords) {
  stompClient.send("/app/playCard", {}, JSON.stringify(
    {
      'id': id,
      'cardValue': $playedCard[0].outerHTML,
      'parentId': event.target.id,
      "coords": {
        'x': cardCords.left,
        'y': cardCords.top
      }
    }
  ));
}

function startGame(){
  $("#start").click(function() {
    stompClient.send("/app/startGame", {}, JSON.stringify(
      {}
    ));
    alert("game has started");
  });
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
      var $cardCords = $("#" + id).position();
      console.log($("#" + id).position());
      console.log(id);
      console.log(event.target.id);

      var $playedCard = createCardDiv(id, "new-card card own-hand played", $(imgSource).attr("src")).css({
        position: "absolute"
      });
  
      sendCardValue(id, $playedCard, event, $cardCords);

    }
  });
});