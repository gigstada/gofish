// JavaScript Document
var app = angular.module("gofish", ['ngSanitize','ui.bootstrap', 'firebase']);

app.controller("ctrl", function($scope, $firebase) {

    $scope.currentScreen = "start";
    $scope.gameState = {};
    $scope.currentPlayer = 0;

    //Variable for the accordion
    $scope.oneAtATime = false;
    $scope.pisopen = true;
    $scope.hisopen = true;
    $scope.gameToJoin = "";

    $scope.status = {
        isFirstOpen: true,
        isFirstDisabled: false
    };

    $scope.colorClass = function() {
        if ($scope.currentPlayer > 0 && $scope.gameState.activePlayer > 0 && !$scope.gameState.gameOver) {
            if ($scope.currentPlayer == $scope.gameState.activePlayer) {
                return "green";
            }
            else {
                return "red";
            }
        }
        else {
            return "";
        }

    }
    
    $scope.btnColor = function(card){
        var suit = getCardSuit(card);
        if(suit == "D" || suit == "H"){
            return 'card-red';
        }else{
            return "";
        }
    }

    $scope.fancy = function(card) {
        var suit = getCardSuit(card);
        var num = getCardNumber(card);
        var sym;

        if (suit == 'C') {
            sym = "&clubs;";
        }
        else if (suit == 'D') {
            sym = "&diams;";
        }
        else if (suit == "S") {
            sym = "&spades;"
        }
        else {
            sym = "&hearts;";
        }
        console.log(sym);
        return "" + num + sym;
    }

    $scope.startNewGame = function() {
        $scope.currentScreen = "new-game";
        $scope.gameId = randomIntFromInterval(100000000, 999999999);

        //$scope.gameId = "123456789";
        $scope.formattedGameId = hyphenatedNumString($scope.gameId);

        var ref = new Firebase("https://radiant-fire-3192.firebaseio.com/gofish/games/" + $scope.gameId);
        var sync = $firebase(ref);
        //var gs = sync.$asObject();
        $scope.gameState = sync.$asObject();

        $scope.gameState.$loaded(function() {
            console.log($scope.gameState);
            $scope.currentPlayer = 1;
            initializeGame($scope, $scope.gameState);
        }).then(function() {
            $scope.currentScreen = 'play-game';
        });

        console.log($scope.gameState);
    }


    $scope.joinGameScreen = function() {
        $scope.currentScreen = "join-game";
        $scope.gameToJoin = '';
        //$("#gameIdInput").val("hello");

    };

    $scope.enterGame = function() {
        var ref = new Firebase("https://radiant-fire-3192.firebaseio.com/gofish/games/" + numericOnly($scope.gameToJoin));
        var sync = $firebase(ref);
        //var gs = sync.$asObject();
        $scope.gameState = sync.$asObject();

        $scope.gameState.$loaded(function() {
            if (!$scope.gameState.deck) {
                $scope.gameToJoin = "";
            }
            else {
                $scope.currentPlayer = 2;
                $scope.currentScreen = 'play-game';
                $scope.gameState.activePlayer = 1;

            }
            console.log($scope.gameState);
            $scope.gameState.$save();
        });

    }

    $scope.requestCard = function(card) {
        console.log(card);

        if ($scope.currentPlayer == $scope.gameState.activePlayer) {
            processCardRequest($scope, $scope.gameState, otherPlayer($scope.currentPlayer), card);
        }

    }

    $scope.pairToArray = function(cardString) {
        return cardString.split(",");
    }

});

var randomIntFromInterval = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

var hyphenatedNumString = function(number) {
    var numString = number.toString();

    return [numString.substr(0, 3), numString.substr(3, 3), numString.substr(6, 3)].join('-');
};

var shuffle = function(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var drawCards = function(deck, n) {
    var drawnCards = [];
    var newCard;

    for (var i = 0; i < n; i++) {
        newCard = deck.pop();
        if (!newCard) {
            return false;
        }
        drawnCards.push(newCard);
    }

    return drawnCards;
};

var addToDeck = function(deck, card) {
    deck.push(card);
};

var newId = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

};
var movePairs = function($scope, gameState, player) {
    var hand = gameState.players[player].hand;
    console.log(player);
    var pairs = gameState.players[player].pairs;
    var thisPair;
    var pairCount = 0;

    hand.sort();

    console.log(hand);


    var i = hand.length - 1;

    while (i > 0) {
        if (getCardNumber(hand[i]) == getCardNumber(hand[i - 1])) {
            thisPair = hand.splice(i, 1) + "," + hand.splice(i - 1, 1);
            console.log("this pair " + thisPair);
            if (!pairs) {
                gameState.players[player].pairs = [thisPair];
            }
            else {
                gameState.players[player].pairs.push(thisPair);
            }
            pairCount += 1;
            i -= 2;
            console.log("pushing a pair");
        }
        else {
            i--;
        }
    }

    if (!hand.length) {
        gameState.gameOver = true;
        $scope.currentScreen = 'game-over';
        setEndMessages($scope);
    }
    return pairCount;
}

var getCardNumber = function(card) {
    return card.slice(0, -1);
}

var getCardSuit = function(card) {
    return card.slice(-1);
}

var initializeGame = function($scope, gameState) {
    console.log(gameState); // {foo: "bar"}
    gameState.activePlayer = 0;
    gameState.gameOver = false;
    gameState.deck = shuffle(['2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD']);
    gameState.players = {
        '1': {
            'message': "It's your turn.",
            'hand': [],
            'pairs': []
        },
        '2': {
            'message': "It's the other player's turn.",
            'hand': [],
            'pairs': []
        }
    };

    for (var i = 0; i < 7; i++) {
        addToDeck(gameState.players['1'].hand, drawCards(gameState.deck, 1)[0]);
        addToDeck(gameState.players['2'].hand, drawCards(gameState.deck, 1)[0]);
    }

    movePairs($scope, gameState, 1);
    movePairs($scope, gameState, 2);

    $scope.gameState.$save();
    console.log($scope.gameState);


}

var numericOnly = function(text) {
    return text.replace(/\D/g, '');
}

var changeActivePlayer = function(gameState) {
    gameState.activePlayer = otherPlayer(gameState.activePlayer);
    swapPlayerMessages(gameState);

}

var otherPlayer = function(x) {
    if (x == 1) {
        return 2;
    }
    else if (x == 2) {
        return 1;
    }
    else {
        return 0;
    }
}

var swapPlayerMessages = function(gameState) {
    var temp = gameState.players[1].message;
    gameState.players[1].message = gameState.players[2].message;
    gameState.players[2].message = temp;
}

var processCardRequest = function($scope, gameState, playerToAsk, card) {
    var cardNumber = getCardNumber(card);
    console.log(playerToAsk);
    console.log(gameState.players[playerToAsk]);
    var targetDeck = gameState.players[playerToAsk].hand;
    console.log(targetDeck);
    var iCardNumber;
    var cardSource;
    var newCard;
    var pairCount;

    for (var i = 0; i < targetDeck.length; i++) {
        iCardNumber = getCardNumber(targetDeck[i]);

        if (iCardNumber == cardNumber) {
            newCard = targetDeck.splice(i, 1)[0];
            cardSource = "player";
            if (!targetDeck.length) {
                gameState.gameOver = true;
                $scope.currentScreen = 'game-over';
                setEndMessages($scope);
            }
            break;
        }
    }

    if (!newCard) {
        if (gameState.deck) {
            newCard = gameState.deck.pop();
        }
        console.log('newCard and deck: ' + newCard + " " + gameState.deck);
        if (!newCard || !gameState.deck) {
            gameState.gameOver = true;
            $scope.currentScreen = 'game-over';
            setEndMessages($scope);
        }
        cardSource = "deck";
    }

    if (newCard) {
        addToDeck($scope.gameState.players[otherPlayer(playerToAsk)].hand, newCard);
        pairCount = movePairs($scope, gameState, otherPlayer(playerToAsk));
    }

    if (!pairCount) {
        changeActivePlayer(gameState);
    }
    console.log(gameState);

    $scope.gameState.$save();
}

var setEndMessages = function($scope) {
    var p1pairs = 0;
    var p2pairs = 0;

    if ($scope.gameState.players[1].pairs) {
        p1pairs = $scope.gameState.players[1].pairs.length;
    }

    if ($scope.gameState.players[2].pairs) {
        p2pairs = $scope.gameState.players[2].pairs.length;
    }

    if (p1pairs == p2pairs) {
        $scope.gameState.players[1].message = "The game was a tie.";
        $scope.gameState.players[2].message = "The game was a tie.";
    }
    else if (p1pairs > p2pairs) {
        $scope.gameState.players[1].message = "You won!";
        $scope.gameState.players[2].message = "You lost.";
    }
    else {
        $scope.gameState.players[1].message = "You lost.";
        $scope.gameState.players[2].message = "You won!";
    }
}

var cleanThing = function(obj) {
    return angular.fromJson(angular.toJson(obj));
}
