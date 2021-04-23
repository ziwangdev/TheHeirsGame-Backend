const express = require('express');
const firebaseApp = require('../utils/firebaseInstance').instance;
const firebase = require('../utils/firebaseInstance');
const router = express.Router();
const www = require('../bin/www');
const initialMapData = require('../utils/mapData');

/* GET user authentication on welcome page*/
router.get('/', function(req, res){

});

/* ref to 'games' in realtime database */
const roomsRef = firebaseApp.database().ref('rooms');
const databaseRef = firebaseApp.database().ref();


// Write new room data to realtime database
const createRoom = (roomID, hostName) => {
    return new Promise((resolve, reject) => {
        roomsRef.once('value')
            .then((snapshot) => {
                let roomExists = snapshot.hasChild(getRoomName(roomID));
                // If room doesn't exist, it will be created user the given host name
                let date = Date();
                if(!roomExists){
                    let roomName = getRoomName(roomID)
                    let refPath = 'rooms/' + roomName
                    let roomData = {
                        'roomID': roomID,
                        'host': hostName,
                        'numPlayers': 0,
                        'numGuests': 0,
                        'whoseTurn': 'player1',
                        'day': 1,
                        'players':{
                            'player1':{
                                'name':'',
                                'cash':0,
                                'property':0
                            },
                            'player2':{
                                'name':'',
                                'cash':0,
                                'property':0
                            },
                            'player3':{
                                'name':'',
                                'cash':0,
                                'property':0
                            },
                            'player4':{
                                'name':'',
                                'cash':0,
                                'property':0
                            }
                        },
                        'broadcasts':{
                            '0': '房间已创建。'
                        },
                        mapData: initialMapData
                    };
                    firebaseApp.database().ref(refPath).set(roomData);
                    let message = '房间创建成功！房间号为' + roomID + '。请邀请玩家加入游戏。'
                    resolve(message);
                    return;
                }
                else{
                    // If room exists, host with the same name will choose if entering the created room again, or create a new room
                    let rooms = snapshot.val();
                    let roomsKeys = Object.keys(rooms);
                    for(var i = 0; i < roomsKeys.length; i++){
                        if(rooms[roomsKeys[i]].roomID == roomID && rooms[roomsKeys[i]].host == hostName){
                            resolve('该房间已存在，是否作为主持重连此房间？');
                        }
                    }
                    // If credentials don't match, reject the host
                    reject('房间创建失败！该房间号已被使用。');
                }

            })

    });
}

// Add a player to an existing room(that is not full)
const roomAddPlayer = (roomID, playerName, characterName) => {
    return new Promise((resolve, reject) => {
        // Check if room is full
        var numPlayers = null;
        let data = roomsRef.child(getRoomName(roomID)).get()
            .then((snapshot) => {
                numPlayers = snapshot.val().numPlayers;
                if(numPlayers >= 4){
                    // If room is full but player name matches existing player, player can join and take on role
                    roomsRef.child(getRoomName(roomID)).child('players').get()
                        .then((snapshot) => {
                            let players = snapshot.val();
                            let playersKeys = Object.keys(players);
                            for (let i = 0; i < playersKeys.length; i = i + 1){
                                if (players[playersKeys[i]].name === playerName){
                                    let message = '欢迎' + playerName + '回到游戏!'
                                    resolve(message);
                                    console.log(message);
                                    firebase.pushBroadcast(message, roomID);
                                    return;
                                }
                            }
                            reject('房间人数已满！请作为观众加入游戏，或加入其他的房间。');
                            return;
                        })
                }
                // Add check for if characters have duplicate
                else{
                    // Check if character selected has already been chosen
                    if(numPlayers > 0){
                        let playersKeys = Object.keys(snapshot.val().players);
                        for (let i = 0; i < playersKeys.length; i = i + 1){
                            let thisCharacter = snapshot.val().players[playersKeys[i]].character
                            if (thisCharacter === characterName){
                                if(snapshot.val().players[playersKeys[i]].name === playerName){
                                    let message = '欢迎' + playerName + '回到游戏!'
                                    resolve(message);
                                    console.log(message);
                                    firebase.pushBroadcast(message, roomID);
                                    return;
                                }
                                console.log(playerName + ' selected a character that has already been chosen!');
                                reject('角色已被他人选中！');
                                return;
                            }
                        }
                    }
                    // Add new player and increment numPlayers in the database
                    numPlayers += 1;
                    let playerKey = 'player' + numPlayers.toString();
                    let result = roomsRef.child(getRoomName(roomID)).child('players').child(playerKey).set({
                        'name' : playerName,
                        'character' : characterName,
                        'cash' : 200000, // all players start with $200,000 cash
                        'property': 0,
                        'properties' : {
                        },
                        'cards' : {
                            'card1' : 'card-dice',
                            'card2' : 'card-stop'
                        },
                        'numCards' : 2, // all players start with 2 cards
                        'xPos' : 0,
                        'yPos' : 0,
                        'pauseRounds': 0 // e.g. pauseRounds = 3 when player enters hospital
                    });
                    // Update number of players
                    roomsRef.child(getRoomName(roomID)).child('numPlayers').set(numPlayers)
                    let message = '欢迎' + playerName + '作为' + characterName + '进入游戏！';
                    resolve(message);
                    firebase.pushBroadcast(message, roomID);
                    return;
                }
            })
            .catch((error) =>{
                console.log(error);
            })
    })
}

// Add a guest to an existing room
const roomAddGuest = (roomID, guestName) => {
    return new Promise((resolve, reject) => {
        // Add guest to room
        roomsRef.child(getRoomName(roomID)).child('numGuests').once('value')
            .then((snapshot) => {
                let numGuests = snapshot.val();
                numGuests += 1;
                let guestKey = 'guest' + numGuests.toString()
                // Set guest
                roomsRef.child(getRoomName(roomID)).child('guests').child(guestKey).set({
                    'name' : guestName
                })
                    .then(() => {
                        // Increment guest numbers
                        roomsRef.child(getRoomName(roomID)).child('numGuests').set(numGuests)
                            .then(() =>{
                                resolve('Added guest to ' + getRoomName(roomID));
                            })
                    })
                    .catch((error) =>{
                        console.log(error);
                    })
            })
    })
}

// Check if room with id exists
const roomExists = (roomID) => {
    return new Promise((resolve, reject) => {
        roomsRef.once('value')
            .then((snapshot) => {
                let roomName = getRoomName(roomID);
                let roomExists = snapshot.child(getRoomName(roomID)).exists();
                roomExists? resolve():reject();
            })
            .catch((error) => {
                console.log(error);
            })
    })
}

function getRoomName(roomID){
    return 'room ' + roomID;
}

/* Called when a player/guest wants to join an existing room */
router.post('/post/join-room',function (req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log("Received a post request!")
    console.log(req.body);
    let roomID = req.body.roomID ? req.body.roomID : null;
    let identity = req.body.identity? req.body.identity : null;
    let userName = req.body.userName? req.body.userName : null;
    let characterName = req.body.character? req.body.character : null;
    // Check if roomID provided was empty
    if (roomID){
        var validRoomID = false;
        roomExists(roomID)
            .then(() => {
                console.log('Found ' + getRoomName(roomID));
                if(userName && identity === '玩家'){
                    Promise.all([roomAddPlayer(roomID, userName, characterName)])
                        .then((result) => {
                            console.log('Added player ' + userName + ' to ' + getRoomName(roomID));
                            res.send(result);
                        })
                        .catch((error) =>{
                            console.log(error);
                            res.status(400).send(error);
                        })
                }
                else if(userName && identity === '观众'){
                    roomAddGuest(roomID, userName)
                        .then((result) => {
                            console.log('Added guest ' + userName + ' to ' + getRoomName(roomID));
                            console.log(result);
                            res.send(result);
                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(400).send('找不到房间！请检查游戏房间号是否正确。');
                        })
                }
            })
            .catch((error) => {
                console.log(error);
                res.send(error);
                return;
            })
    }
    // If roomID is empty, reject
    else{
        res.status(400).send('room ID was empty.');
        return;
    }
});

/* Called when a host wants to create a new room */
router.post('/post/create-room',function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log("Received a post request!")
    console.log(req.body);
    let roomID = req.body.roomID ? req.body.roomID : null;
    let hostName = req.body.hostName? req.body.hostName : null;
    // If roomID is not empty, write room data to realtime database
    if (roomID) {
        let roomName = 'room ' + roomID;
        Promise.all([createRoom(roomID, hostName)])
            .then((message) => {
                console.log('Created room! ')
                res.send(message);
            })
            .catch((error) =>{
                console.log('Failed to create room. ' + error)
                res.status(400).send(error);
            })
    }
    // If room ID empty, reject
    else{
        res.status(400).send('room ID was empty.');
        return;
    }
});

module.exports = router;
