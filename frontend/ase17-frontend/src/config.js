export default {
	lambda:  {
		addUser: {
			url: 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/user',
			//   ^--------- PLEASE CHANGE
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
			url: function(userIdName, userIdValue) {
				return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/keyword'
					//   ^----- PLEASE CHANGE
					+ '?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue);
				},
			params: {
				userId: 'userId'
			},
			response: {
				items: function(data, userId, processor, thisArg) { data.keywords.forEach(processor, thisArg); },
				text: function(item, userId) { return item.keyword; }
			}
		},
		addWord: {
			url: 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/keyword',
			//   ^--------- PLEASE CHANGE
			params: {
				userId: 'userId',
				word: 'keyword',
				createdAt: 'createdAt'
			},
			response: {}
		},
		getAggregatedData: {
			url: function(wordName, wordValue, fromTimestampName, fromTimestampValue, toTimestampName, toTimestampValue) {
				return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/tweets'
					//   ^----- PLEASE CHANGE
					+ '?' + encodeURIComponent(wordName) + '=' + encodeURIComponent(wordValue)
					+ '&' + encodeURIComponent(fromTimestampName) + '=' + encodeURIComponent(fromTimestampValue)
					+ '&' + encodeURIComponent(toTimestampName) + '=' + encodeURIComponent(toTimestampValue);
			},
			params: {
				word: 'keyword',
				fromTimestamp: 'fromTimestamp',
				toTimestamp: 'toTimestamp'
			},
			response: {
				date: function(data, word, fromTimestamp, toTimestamp) { return data.timestamp; },
				max: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.maxValue; },
				min: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.minValue; },
				positiveCount: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.countPositives; },
				averagePositive: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.averagePositives; },
				totalPositive: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.sumPositives; },
				neutralCount: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.countNeutral; },
				averageNeutral: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.averageNeutral; },
				totalNeutral: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.sumNeutral; },
				negativeCount: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.countNegatives; },
				averageNegative: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.averageNegatives; },
				totalNegative: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.sumNegatives; },
				totalCount: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.totalCount; },
				averageTotal: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.totalAverage; },
				totalSentiment: function(data, word, fromTimestamp, toTimestamp) { return data.statistics.totalSum; },
				displayedTweets: function(data, word, fromTimestamp, toTimestamp) { return data.tweets; },
				displayedTweetText: function(displayedTweet, word, fromTimestamp, toTimestamp) { return displayedTweet.text; },
				displayedTweetScore: function(displayedTweet, word, fromTimestamp, toTimestamp) { return displayedTweet.sentiment_score; },
				isError: function(data, word, fromTimestamp, toTimestamp) { return (typeof data === 'undefined') || data === null || (typeof data['statistics'] === 'undefined') || (typeof data['errorMessage'] !== 'undefined'); }
			}
		},
		produceRandomTweets: {
			url: function(numberName, numberValue) { 
				return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/random'
					//   ^----- PLEASE CHANGE
					+ '?' + encodeURIComponent(numberName) + '=' + encodeURIComponent(numberValue);
			},
			params: {
				number: 'number'
			},
			response: {}
		},
//		getTweets: {
//			url: function(userIdName, userIdValue, wordName, wordValue, fromTimestampName, fromTimestampValue, toTimestampName, toTimestampValue) {
//				return 'https://pzosuqcu5j.execute-api.us-east-1.amazonaws.com/prod/tweets'
//					+ '?' + encodeURIComponent(userIdName) + '=' + encodeURIComponent(userIdValue)
//					+ '&' + encodeURIComponent(wordName) + '=' + encodeURIComponent(wordValue)
//					+ '&' + encodeURIComponent(fromTimestampName) + '=' + encodeURIComponent(fromTimestampValue)
//					+ '&' + encodeURIComponent(toTimestampName) + '=' + encodeURIComponent(toTimestampValue);
//			},
//			
//			params: {
//				userId: 'username',
//				word: 'keyword',
//				fromTimestamp: 'fromTimestamp',
//				toTimestamp: 'toTimestamp'
//			},
//			response: {
//				items: function(data, userId, word, fromTimestamp, toTimestamp, processor, thisArg) { data.tweets.forEach(processor, thisArg); },
//				text: function(item, userId, word, fromTimestamp, toTimestamp) { return item.text; },
//				score: function(item, userId, word, fromTimestamp, toTimestamp) { return item.sentiment_score; },
//				createdAt: function(item, userId, word, fromTimestamp, toTimestamp) { return item.createdAt; },
//			}
//		},
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
	historyIntervalCount: 30,
	tweetFetchLag: 0,
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
	},
	simpleCount: -1
};