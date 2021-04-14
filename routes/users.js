var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json([{
      id: 1,
      username: "users1"
  }, {
      id: 2,
      username: "user2"
  }]);
});

module.exports = router;
