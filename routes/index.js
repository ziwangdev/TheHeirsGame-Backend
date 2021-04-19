var express = require('express');
var router = express.Router();
var server = require('../bin/www');
const io = require('socket.io')(server);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.json([{
        id: 1,
        username: "samsepi0l"
    }, {
        id: 2,
        username: "D0loresH4ze"
    }]);
});

io.on('connection', (socket) => {
    console.log('a user connected');
});

module.exports = router;
