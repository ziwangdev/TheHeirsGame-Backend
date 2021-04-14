var firebase = require('firebase');
var firebaseConfig = require('./firebaseConfig');

/* Firebase instance */
let firebaseApp = firebase.initializeApp(firebaseConfig);

module.exports = firebaseApp;