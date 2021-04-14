const express = require('express');
const firebaseApp = require('../utils/firebaseInstance');
const router = express.Router();
//const router = require('express-promise-router')();

/* GET user authentication on welcome page*/
router.get('/', function(req, res){

});

/* ref to 'games' in realtime database */
const gamesRef = firebaseApp.database().ref('games');

// Promise of reading games data from realtime database
const getGamesData = (ref) => {
    return new Promise((resolve, reject) => {
        const onData = snapshot => resolve(snapshot);  // success handler
        const onError = error => reject(error); // failure handler

        ref.on('value', onData, onError); // read data
    });
}

router.post('/post/start-game',function (req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log("Received a post request!")
    console.log(req.body);
    let roomID = req.body.roomID ? req.body.roomID : null;
    // If roomID is not empty, read data from realtime database
    if (roomID){
        var validRoomID = false;
        getGamesData(gamesRef)
            .then((snapshot) => {
                // resolve() was called in getGamesData()
                let games = snapshot.val();
                let keys = Object.keys(games);
                for(var i = 0; i < keys.length; i++){
                    var k = keys[i];
                    var game = games[k];
                    var id = game.roomID;
                    if(id == roomID){
                        res.send('Authentication successful!');
                        return;
                    }
                }
                res.status(400).send('Room does not exist!');
                return;
            })
            .catch((error) => {
                // reject() was called in getGamesData()
                res.status(400).send('Error when reading games data from realtime database.');
                return;
            })

    }
    // If roomID is empty, reject
    else{
        res.status(400).send('Please provide a room ID!');
        return;
    }
});

module.exports = router;