const express = require('express');
const router = express.Router();
const firebaseApp = require('../utils/firebaseInstance');

const databaseRef = firebaseApp.database().ref();
const roomsRef = firebaseApp.database().ref('rooms');

/* Helper functions */
function getRoomName(roomID){
    return 'room ' + roomID;
}

/* GET entire game data when user is joining the room. */
router.get('/get/load-game', function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log('Received a GET request to get game data!');
    console.log(req.body);
    let roomID = req.body.roomID ? req.body.roomID : null;
    let identity = req.body.identity? req.body.identity : null;
    let userName = req.body.userName? req.body.userName : null;
    // Return if any of the above three parameters are null
    // if(!roomID || !identity || !userName){
    //     let message = 'Missing important parameter(s) for this GET request to get game data!';
    //     console.log(message);
    //     res.status(400).send(message);
    //     return;
    // }
    // Get data
    roomsRef.child(getRoomName('0001')).once('value')
        .then((snapshot) => {
            let gameData = snapshot.val();
            console.log(gameData);
            res.json(gameData);
            return;
        })
});

module.exports = router;
