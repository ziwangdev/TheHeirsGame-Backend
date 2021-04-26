const express = require('express');
const router = express.Router();
const firebaseApp = require('../utils/firebaseInstance').instance;
const firebase = require('../utils/firebaseInstance');

const databaseRef = firebaseApp.database().ref();
const roomsRef = firebaseApp.database().ref('rooms');

/* Helper functions */
function getRoomName(roomID){
    return 'room ' + roomID;
}

/* GET entire game data when user is joining the room. */
router.post('/post/load-game', function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log('Received a POST request to retrieve game data!');
    // console.log(req.body);
    let roomID = req.body.roomID ? req.body.roomID : null;
    let identity = req.body.identity? req.body.identity : null;
    let userName = req.body.userName? req.body.userName : null;
    // Return if any of the above three parameters are null
    if(!roomID || !identity || !userName){
        let message = 'Missing important parameter(s) for this POST request to retrieve game data!';
        console.log(message);
        res.status(400).send(message);
        return;
    }
    // Get data
    roomsRef.child(getRoomName(roomID)).once('value')
        .then((snapshot) => {
            let gameData = snapshot.val();
            console.log(gameData);
            res.json(gameData);
            return;
        })
});

/* POST request to start game */
router.post('/post/start-game', function (req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log('Received a POST request to start the game!');

    let roomID = req.body.roomID ? req.body.roomID : null;
    if(!roomID){
        let message = 'No room ID was found in this request';
        console.log(message);
        return;
    }

    // Change whoseTurn in game data to player 1
    roomsRef.child(getRoomName(roomID)).once('value')
        .then((snapshot) => {
            let gameData = snapshot.val();
            // Check that there are at least 2 players present
            if(gameData.numPlayers < 2){
                let message = '至少有两名玩家在场才能开始游戏。';
                console.log(message);
                res.status(400).send(message);
                return;
            }
            // Set whoseTurn if validated numPlayers
            roomsRef.child(getRoomName(roomID)).update({whoseTurn: 'player1'});
            let message = '游戏开始了！';
            firebase.pushBroadcast(message, roomID);
            console.log(message);
            res.send(message);
        })

});

/* POST request to move player */
router.post('/post/player-moves', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log('Received a POST request to start the game!');

    let roomID = req.body.roomID ? req.body.roomID : null;
    let player = req.body.player? req.body.player : null;
    let currPos = req.body.currPos? req.body.currPos : null;
    let targetPos = req.body.targetPos? req.body.targetPos : null;

    if(!roomID || ! player || !currPos || !targetPos){
        let message = 'Missing parameter(s) to complete move player request';
        console.log(message);
        res.status(400).send(message);
        return;
    }

    // Update positions for the player who moved
    roomsRef.child(getRoomName(roomID)).child('mapData').child('mapData').child('players').child(player)
        .update({position: targetPos, prevPosition: currPos});

    res.send('移动了');

});

module.exports = router;
