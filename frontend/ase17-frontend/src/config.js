export default {
	lambda:  {
		addUser: {
			// url: 'http://localhost/ase17/user.php',
			url: 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/user',
			params: {
				userId: 'userId',
				createdAt: 'createdAt',
				consumerKey: 'consumer_key',
				consumerSecret: 'consumer_secret',
				accessToken: 'access_token_key',
				accessTokenSecret: 'access_token_secret'
			},
			response: {}
		},
		getWords: {
			// url: function(userIdName, userIdValue) { return 'http://localhost/ase17/words.php?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue); },
			url: function(userIdName, userIdValue) { return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/keyword?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue); },
			params: {
				userId: 'userId'
			},
			response: {
				// items: function(data, userId, processor, thisArg) { data.forEach(processor, thisArg); },
				// text: function(item, userId) { return item; }
				items: function(data, userId, processor, thisArg) { data.keywords.forEach(processor, thisArg); },
				text: function(item, userId) { return item.keyword; }
			}
		},
		addWord: {
			url: 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/keyword',
			params: {
				userId: 'userId',
				word: 'keyword',
				createdAt: 'createdAt'
			},
			response: {}
		},
		getTweets: {
			/*url: function(userIdName, userIdValue, wordName, wordValue, fromTimestampName, fromTimestampValue, toTimestampName, toTimestampValue) {
				return 'http://localhost/ase17/tweets.php'
					+ '?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue)
					+ '&' + encodeURIComponent(wordName) + '=' + encodeURIComponent(wordValue)
					+ '&' + encodeURIComponent(fromTimestampName) + '=' + encodeURIComponent(fromTimestampValue)
					+ '&' + encodeURIComponent(toTimestampName) + '=' + encodeURIComponent(toTimestampValue);
			},*/
			//
			url: function(userIdName, userIdValue, wordName, wordValue, fromTimestampName, fromTimestampValue, toTimestampName, toTimestampValue) {
				return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/tweets'
					+ '?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue)
					+ '&' + encodeURIComponent(wordName) + '=' + encodeURIComponent(wordValue)
					+ '&' + encodeURIComponent(fromTimestampName) + '=' + encodeURIComponent(fromTimestampValue)
					+ '&' + encodeURIComponent(toTimestampName) + '=' + encodeURIComponent(toTimestampValue);
			},
			params: {
				userId: 'username',
				word: 'keyword',
				fromTimestamp: 'fromTimestamp',
				toTimestamp: 'toTimestamp'
			},
			response: {
				items: function(data, userId, word, fromTimestamp, toTimestamp, processor, thisArg) { data.tweets.forEach(processor, thisArg); },
				text: function(item, userId, word, fromTimestamp, toTimestamp) { return item.text; },
				score: function(item, userId, word, fromTimestamp, toTimestamp) { return item.sentiment_score; },
				createdAt: function(item, userId, word, fromTimestamp, toTimestamp) { return item.createdAt; },
			}
		},
		produceRandomTweets: {
			url: function(numberName, numberValue) { return 'http://localhost/ase17/random_tweets.php?' + encodeURIComponent(numberName) + '=' + encodeURIComponent(numberValue); },
			// url: function(numberName, numberValue) { return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/keyword?' + encodeURIComponent(numberName) + '=' + encodeURIComponent(numberValue); },
			params: {
				number: 'number'
			},
			response: {}
		}
	},
	sentiment: {
		neutralMin: -1,
		neutralMax: 1
	},
	aggregation: [
		{ fromSeconds:                  0, millis:                    1000 }, // less than  1 hour => ...
		{ fromSeconds:            60 * 60, millis:               60 * 1000 }, // less than  1 day  => 1 minute 
		{ fromSeconds:       24 * 60 * 60, millis:          60 * 60 * 1000 }, // less than 60 days => 1 hour
		{ fromSeconds:  60 * 24 * 60 * 60, millis:     24 * 60 * 60 * 1000 }, // less than  1 year => 1 day
		{ fromSeconds: 365 * 24 * 60 * 60, millis: 7 * 24 * 60 * 60 * 1000 }  // from       1 year => 1 week
	],
	tweetFetchLag: 7500,
	lineChart1: {
		width: 600,
		height: 270,
		margin: {
			top: 30,
			right: 20,
			bottom: 30,
			left: 50
		},
		initY: {
			min: -10,
			max: 10
		}
	}
};