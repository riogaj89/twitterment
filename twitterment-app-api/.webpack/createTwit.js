(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.main = main;

	var _uuid = __webpack_require__(3);

	var _uuid2 = _interopRequireDefault(_uuid);

	var _twitter = __webpack_require__(8);

	var _twitter2 = _interopRequireDefault(_twitter);

	var _dynamodbLib = __webpack_require__(4);

	var dynamoDbLib = _interopRequireWildcard(_dynamodbLib);

	var _responseLib = __webpack_require__(6);

	var _sentiment = __webpack_require__(9);

	var _sentiment2 = _interopRequireDefault(_sentiment);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var client = new _twitter2.default({
	  consumer_key: '2vExKpL7bwRqIUo8CPpnDZZqh',
	  consumer_secret: 'YJ3Ya9ZV21jrEcx3BuKTkJvZzU09ojTeZNJoBZ2B8wbeMdFjba',
	  access_token_key: '846732875902976002-HPvAujFsByDF281MxLRqdKaRCqgtQOq',
	  access_token_secret: 'pt9YIghOzZ9OqC1SPcSt2oLlUjBFMw9miPP18ptWW2KRo'
	});

	function main(event, context, callback) {
	  var data = JSON.parse(event.body);
	  var keyword = data.content;
	  console.log("The keyword is: " + keyword);
	  console.log('Start Service');
	  client.stream('statuses/filter', { track: keyword }, function (stream) {
	    stream.on('data', function (tweet) {
	      console.log('New Tweet : ', tweet.text);
	      var senti = (0, _sentiment2.default)(tweet.text);

	      var params = {
	        TableName: "twitter_words",
	        Item: {
	          userId: event.requestContext.authorizer.claims.sub,
	          wordId: _uuid2.default.v1(),
	          content: data.content,
	          createdAt: new Date().getTime(),
	          idstr: tweet.id_str,
	          name: tweet.user.screen_name,
	          text: tweet.text,
	          follower: tweet.user.followers_count,
	          url: "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str,
	          language: tweet.user.lang,
	          timezone: tweet.user.time_zone,
	          location: tweet.user.location,
	          score: senti.score
	        }
	      };

	      try {
	        var result = dynamoDbLib.call('put', params);
	        callback(null, (0, _responseLib.success)(params.Item));
	      } catch (e) {
	        callback(null, (0, _responseLib.failure)({ status: false }));
	      }
	    });
	  });
	}

/***/ }),
/* 1 */,
/* 2 */,
/* 3 */
/***/ (function(module, exports) {

	module.exports = require("uuid");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.call = call;

	var _awsSdk = __webpack_require__(5);

	var _awsSdk2 = _interopRequireDefault(_awsSdk);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	_awsSdk2.default.config.update({ region: 'us-east-1' });

	function call(action, params) {
	  var dynamoDb = new _awsSdk2.default.DynamoDB.DocumentClient();

	  return dynamoDb[action](params).promise();
	}

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	module.exports = require("aws-sdk");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _stringify = __webpack_require__(7);

	var _stringify2 = _interopRequireDefault(_stringify);

	exports.success = success;
	exports.failure = failure;

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function success(body) {
	  return buildResponse(200, body);
	}

	function failure(body) {
	  return buildResponse(500, body);
	}

	function buildResponse(statusCode, body) {
	  return {
	    statusCode: statusCode,
	    headers: {
	      'Access-Control-Allow-Origin': '*',
	      'Access-Control-Allow-Credentials': true
	    },
	    body: (0, _stringify2.default)(body)
	  };
	}

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/core-js/json/stringify");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	module.exports = require("twitter");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = require("sentiment");

/***/ })
/******/ ])));