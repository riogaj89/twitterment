export default {
	lambda:  {
		getWords: {
			url: 'http://localhost/ase17/words.php',
			params: {
				userId: 'user'
			},
			response: {
				items: function(data, userId, processor, thisArg) { data.forEach(processor, thisArg); },
				text: function(item, userId) { return item.text; }
			}
		},
		addWord: {
			url: 'http://localhost/ase17/add.php',
			params: {
				userId: 'user',
				word: 'word',
				createdAt: 'createdAt'
			},
			response: {}
		},
		getTweets: {
			url: 'http://localhost/ase17/tweets.php',
			params: {
				userId: 'user',
				word: 'word',
				fromTimestamp: 'fromTimestamp',
				toTimestamp: 'toTimestamp'
			},
			response: {
				items: function(data, userId, word, fromTimestamp, toTimestamp, processor, thisArg) { data.forEach(processor, thisArg); },
				text: function(item, userId, word, fromTimestamp, toTimestamp) { return item.text; },
				score: function(item, userId, word, fromTimestamp, toTimestamp) { return item.score; },
				createdAt: function(item, userId, word, fromTimestamp, toTimestamp) { return item.createdAt; },
			}
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