var firebase = require('firebase');
var firebaseConfig = require('./firebaseConfig');

/* Firebase instance */
let firebaseApp = firebase.initializeApp(firebaseConfig);
module.exports.instance = firebaseApp;

module.exports.pushBroadcast = function(message, roomID){
    let roomName = 'room ' + roomID;
    let refPath = 'rooms/' + roomName + '/broadcasts';
    let broadcastsRef = firebaseApp.database().ref(refPath);
    broadcastsRef.push(message);
    console.log('Pushed a broadcast: ' + message);
}