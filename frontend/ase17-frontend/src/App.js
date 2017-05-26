import React, { Component } from 'react';
import {
	Button,
	FormGroup,
	FormControl,
	ControlLabel,
	Modal,
	ModalHeader,
	ModalTitle,
	ModalBody,
	Glyphicon
} from 'react-bootstrap';
import d3 from 'd3';
import config from './config.js';
import './App.css';


class App extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			readyForInteraction: false,
			
			userId: null,
			provisionalUserId: '',
			userIdValidationState: null,
			
			registrationFormShown: false,
			registrationInProgress: false,
			
			consumerKey: null,
			provisionalConsumerKey: '',
			consumerKeyValidationState: null,
			
			consumerSecret: null,
			provisionalConsumerSecret: '',
			consumerSecretValidationState: null,
			
			accessToken: null,
			provisionalAccessToken: '',
			accessTokenValidationState: null,
			
			accessTokenSecret: null,
			provisionalAccessTokenSecret: '',
			accessTokenSecretValidationState: null,
			
			word: null,
			provisionalWord: '',
			wordValidationState: null,
			
			submittingWord: false,
			
			suggestedWordsVisible: false,
			suggestedWords: null,
			suggestedWordsLoading: false,
			
			historyWord: '',
			
			provisionalHistoryFromDate: '',
			historyFromDate: '',
			
			provisionalHistoryToDate: '',
			historyToDate: '',
			
			scrollToOutputArea: false,
			outputAreaVisible: false,
			
			tweets: [],
			tweetPoints: [],
			loadStartTimestamp: -1,
			loadEndTimestamp: -1,
			loadTimesKnown: false,
			aggregationMillis: 1000,
			
			scoreMax: 0,
			scoreMin: 0,
			scoreMinMaxKnown: false,
			negativeCount: 0,
			negativeAverage: 0,
			neutralCount: 0,
			neutralAverage: 0,
			positiveCount: 0,
			positiveAverage: 0,
			totalCount: 0,
			totalAverage: 0,
			
			displayedTweets: [],
			displayedTweetsAge: 3,
			displayedTweetsMaxAge: 3,
			displayedTweetsMaxCount: 5,
			
			autoupdateInterval: 1000,
			autoupdatePaused: true,
			autoupdateDone: true,
			autoupdateLoopStarted: false,
			remainingAutoupdates: -1,
			
			demoCount: 0,
			demoLoopStarted: false,
			demoTaskDone: true,
			demoLoopInterval: 1000
		};
		
		// ... vvv ... LINE CHART 1 PROPERTIES ...................................
		
		var makeValueLine = function(index, x, y) {
			return d3.svg.line()
				.x(function(d) { return x(d.date); })
				.y(function(d) { return y(d.counts[index] === 0 ? 0 : (d.values[index] / d.counts[index])); });
		}
		
		this.lineChart1 = {
			x: d3.time.scale().range([0, config.lineChart1.width]),
			y: d3.scale.linear().range([config.lineChart1.height, 0])
		}
		this.lineChart1.xAxis = d3.svg.axis().scale(this.lineChart1.x).orient('bottom').ticks(5);
		this.lineChart1.yAxis = d3.svg.axis().scale(this.lineChart1.y).orient('left').ticks(5);
		this.lineChart1.valueLines = [
			makeValueLine(0, this.lineChart1.x, this.lineChart1.y),
			makeValueLine(1, this.lineChart1.x, this.lineChart1.y),
			makeValueLine(2, this.lineChart1.x, this.lineChart1.y),
			makeValueLine(3, this.lineChart1.x, this.lineChart1.y)
		];
		
		// ... ^^^ ... LINE CHART 1 PROPERTIES ...................................
	}
	
	// --- vvv --- GENERAL UTILITY ---------------------------------------------
	
	renderArray(arr, rendererFunction, thisArg) {
		var result = [];
		arr.forEach(function(item, index) {
			result.push(rendererFunction.apply(thisArg, [item, index]));
		});
		return result;
	}
	
	scrollToOutputArea() {
		this.refs.outputArea.scrollIntoView();
	}
	
	formatPercentage(part, total, defaultReturnValue) {
		if (total === 0) return defaultReturnValue;
		return (100 * part / total).toFixed(3) + '%';
	}
	
	insertThousendSeparators(posInt) {
		var str = '' + posInt;
		var m = new RegExp('(\\d{1,3})((\\d{3})*)$').exec(str);
		return m[1] + (typeof m[2] !== 'undefined' ? (m[2].replace(new RegExp('\\d{3}', 'g'), function(t) { return '\'' + t; })) : '');
	}
	
	// --- ^^^ --- GENERAL UTILITY ---------------------------------------------
	
	// --- vvv --- LAMBDA REQUESTS ---------------------------------------------
	
	addUser(userId, createdAt, consumerKey, consumerSecret, accessToken, accessTokenSecret, listenerFunction, thisArg) {
		var body = {};
		body[config.lambda.addUser.params.userId] = userId;
		body[config.lambda.addUser.params.userId] = userId;
		body[config.lambda.addUser.params.createdAt] = createdAt;
		body[config.lambda.addUser.params.consumerKey] = consumerKey;
		body[config.lambda.addUser.params.consumerSecret] = consumerSecret;
		body[config.lambda.addUser.params.accessToken] = accessToken;
		body[config.lambda.addUser.params.accessTokenSecret] = accessTokenSecret;
		
		fetch(config.lambda.addUser.url, {
			method: 'post',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		.then(function (response) {
			return response.text();
		})
		.then(function (data) {
			listenerFunction.apply(thisArg, [true]);
		}).catch(function(e) {
			console.log('Loading words failed. Error:');
			console.log(e);
			listenerFunction.apply(thisArg, [false]);
		});
	}
	
	getWords(userId, listenerFunction, thisArg) {
		var url = config.lambda.getWords.url(config.lambda.getWords.params.userId, userId);
		
		fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'application/json, text/plain, */*'
			}
		})
		.then(function (response) {
			return response.json();
		})
		.then(function (loadedData) {
			var words = [];
			config.lambda.getWords.response.items(loadedData, userId, function(item) {
				words.push({
					text: config.lambda.getWords.response.text(item)
				});
			}, thisArg);
			words.sort(function(a, b) { return a.text.localeCompare(b.text); });
			listenerFunction.apply(thisArg, [words]);
		}).catch(function(e) {
			console.log('Adding user failed. Error:');
			console.log(e);
			listenerFunction.apply(thisArg, [null]);
		});
	}
	
	addWord(userId, word, createdAt, listenerFunction, thisArg) {
		var body = {};
		body[config.lambda.addWord.params.userId] = userId;
		body[config.lambda.addWord.params.word] = word;
		body[config.lambda.addWord.params.createdAt] = createdAt;
		
		fetch(config.lambda.addWord.url, {
			method: 'post',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		.then(function (response) {
			return response.text();
		})
		.then(function (data) {
			// listenerFunction.apply(thisArg, [true]);
		}).catch(function(e) {
			console.log('Submitting word failed. Error:');
			console.log(e);
			// listenerFunction.apply(thisArg, [false]);
		});
		listenerFunction.apply(thisArg, [true]);
	}
	
	getTweets(userId, word, fromTimestamp, toTimestamp, listenerFunction, thisArg) {
		var url = config.lambda.getTweets.url(
			config.lambda.getTweets.params.userId, userId,
			config.lambda.getTweets.params.word, word,
			config.lambda.getTweets.params.fromTimestamp, fromTimestamp,
			config.lambda.getTweets.params.toTimestamp, toTimestamp
		);
		
		fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'application/json, text/plain, */*'
			}
		})
		.then(function (response) {
			return response.json();
		})
		.then(function (loadedData) {
			var tweets = [];
			config.lambda.getTweets.response.items(loadedData, userId, word, fromTimestamp, toTimestamp, function(item) {
				tweets.push({
					text: config.lambda.getTweets.response.text(item),
					score: config.lambda.getTweets.response.score(item),
					createdAt: config.lambda.getTweets.response.createdAt(item)
				});
			}, thisArg);
			tweets.sort(function(a, b) { return a.createdAt - b.createdAt }); // xxa xxb
			
			listenerFunction.apply(thisArg, [tweets]);
		}).catch(function(e) {
			console.log('Loading tweets failed. Error:');
			console.log(e);
			listenerFunction.apply(thisArg, [null]);
		});
	}
	
	getAggregatedData(word, fromTimestamp, toTimestamp, listenerFunction, thisArg) {
		var url = config.lambda.getAggregatedData.url(
			config.lambda.getAggregatedData.params.word, word,
			config.lambda.getAggregatedData.params.fromTimestamp, fromTimestamp,
			config.lambda.getAggregatedData.params.toTimestamp, toTimestamp
		);
		
		fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'application/json, text/plain, */*'
			}
		})
		.then(function (response) {
			return response.json();
		})
		.then(function (loadedData) {
			var data = {};
			
			if (!config.lambda.getAggregatedData.response.isError(loadedData)) {
				data.date = config.lambda.getAggregatedData.response.date(loadedData, word, fromTimestamp, toTimestamp);
				data.max = config.lambda.getAggregatedData.response.max(loadedData, word, fromTimestamp, toTimestamp);
				data.min = config.lambda.getAggregatedData.response.min(loadedData, word, fromTimestamp, toTimestamp);
				data.positiveCount = config.lambda.getAggregatedData.response.positiveCount(loadedData, word, fromTimestamp, toTimestamp);
				data.averagePositive = config.lambda.getAggregatedData.response.averagePositive(loadedData, word, fromTimestamp, toTimestamp);
				data.totalPositive = config.lambda.getAggregatedData.response.totalPositive(loadedData, word, fromTimestamp, toTimestamp);
				data.neutralCount = config.lambda.getAggregatedData.response.neutralCount(loadedData, word, fromTimestamp, toTimestamp);
				data.averageNeutral = config.lambda.getAggregatedData.response.averageNeutral(loadedData, word, fromTimestamp, toTimestamp);
				data.totalNeutral = config.lambda.getAggregatedData.response.totalNeutral(loadedData, word, fromTimestamp, toTimestamp);
				data.negativeCount = config.lambda.getAggregatedData.response.negativeCount(loadedData, word, fromTimestamp, toTimestamp);
				data.averageNegative = config.lambda.getAggregatedData.response.averageNegative(loadedData, word, fromTimestamp, toTimestamp);
				data.totalNegative = config.lambda.getAggregatedData.response.totalNegative(loadedData, word, fromTimestamp, toTimestamp);
				data.totalCount = config.lambda.getAggregatedData.response.totalCount(loadedData, word, fromTimestamp, toTimestamp);
				data.averageTotal = config.lambda.getAggregatedData.response.averageTotal(loadedData, word, fromTimestamp, toTimestamp);
				data.totalSentiment = config.lambda.getAggregatedData.response.totalSentiment(loadedData, word, fromTimestamp, toTimestamp);
				
				var displayedTweets = config.lambda.getAggregatedData.response.displayedTweets(loadedData, word, fromTimestamp, toTimestamp);
				
				data.displayedTweets = [];
				displayedTweets.forEach(function(displayedTweet) {
					if (displayedTweet !== null) {
						data.displayedTweets.push({
							text: config.lambda.getAggregatedData.response.displayedTweetText(displayedTweet, word, fromTimestamp, toTimestamp),
							score: config.lambda.getAggregatedData.response.displayedTweetScore(displayedTweet, word, fromTimestamp, toTimestamp)
						});
					}
				});
				
				listenerFunction.apply(thisArg, [data]);
			} else {
				listenerFunction.apply(thisArg, [null]);
			}
		}).catch(function(e) {
			console.log('Loading aggregated data failed. Error:');
			console.log(e);
			listenerFunction.apply(thisArg, [null]);
		});
	}
	
	produceRandomTweets(number, listenerFunction, thisArg, waitForResponse) {
		var url = config.lambda.produceRandomTweets.url(
			config.lambda.produceRandomTweets.params.number, number
		);
		
		fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'application/json, text/plain, */*'
			}
		})
		.then(function (response) {
			return response.text();
		})
		.then(function (loadedData) {
			if (waitForResponse) {
				listenerFunction.apply(thisArg, [true]);
			}
		}).catch(function(e) {
			console.log('Loading tweets failed. Error:');
			console.log(e);
			if (waitForResponse) {
				listenerFunction.apply(thisArg, [false]);
			}
		});
		if (!waitForResponse) {
			listenerFunction.apply(thisArg, [true]);
		}
	}
	
	// --- ^^^ --- LAMBDA REQUESTS ---------------------------------------------
	
	// --- vvv --- DEMO --------------------------------------------------------
	
	getNextDemoCount(demoCount) {
		if (demoCount === 0) return 1;
		if (demoCount >= 1000) return demoCount;
		return 2 * demoCount;
	}
	
	demoCountIncreaseRequested(event) {
		event.preventDefault();
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		
		this.setState({
			demoCount: this.getNextDemoCount(this.state.demoCount)
		})
	}
	
	startDemoLoop() {
		if (!this.state.demoLoopStarted) {
			this.demoLoop();
		}
	}
	
	demoLoop() {
		var demoCount = this.state.demoCount;
		if (this.state.demoCount > 0 && this.state.demoTaskDone) {
			this.runDemoTask(demoCount);
		}
		setTimeout(() => this.demoLoop(), this.state.demoLoopInterval);
	}
	
	runDemoTask(demoCount) {
		this.setState({ demoTaskDone: false });
		
		//for (var i = 0; i < 10; ++i) {
			this.produceRandomTweets(demoCount, function(success) {
				this.setState({ demoTaskDone: true });
			}, this, false);
		//}
	}
	
	// --- ^^^ --- DEMO --------------------------------------------------------
	
	// --- vvv --- TWEET PROCESSING --------------------------------------------
	
	integrateTweets(loadedTweets, fromTimestamp, toTimestamp) {
		var aggregationMillis = this.getAggregationMillis(this.state.loadTimesKnown ? this.state.loadStartTimestamp : fromTimestamp, toTimestamp);
		
		var tweetPoints = null;
		if (aggregationMillis !== this.state.aggregationMillis && this.state.loadTimesKnown) {
			tweetPoints = this.tweetsToPoints(this.state.tweets, aggregationMillis, this.state.loadStartTimestamp, this.state.loadEndTimestamp);
		} else {
			tweetPoints = this.state.tweetPoints.slice();
		}
		
		var loadedTweetPoints = this.tweetsToPoints(loadedTweets, aggregationMillis, fromTimestamp, toTimestamp);
		
		var loadedStartIndex = 1;
		if (tweetPoints.length > 0) {
			loadedStartIndex = Math.floor((loadedTweetPoints[0].date.getTime() - tweetPoints[0].date.getTime()) / aggregationMillis);
		}
		
		var overlappingCount = Math.min(loadedTweetPoints.length,  Math.max(0, tweetPoints.length - loadedStartIndex));
		
		for (var i = 0; i < overlappingCount; ++i) {
			this.combineTweetPoints(tweetPoints[loadedStartIndex + i], loadedTweetPoints[i]);
		}
		
		for (i = overlappingCount; i < loadedTweetPoints.length; ++i) {
			tweetPoints.push(loadedTweetPoints[i]);
		}
		
		// xxa
		var allTweets = this.state.tweets.slice();
		loadedTweets.forEach(function(tweet) {
			allTweets.push(tweet);
		}, this);
		// xxb
		
		var updatedStats = this.getUpdatedTweetStats(loadedTweets);
		this.setState(updatedStats);
		
		this.setState({
			loadStartTimestamp: this.state.loadTimesKnown ? this.state.loadStartTimestamp : fromTimestamp,
			loadEndTimestamp: toTimestamp,
			loadTimesKnown: true,
			tweets: allTweets, // xxa xxb
			tweetPoints: tweetPoints,
			aggregationMillis: aggregationMillis
		});
	}
	
	updatePointForTweet(point, tweet) {
		var sentimentClass = this.getSentimentClass(tweet);
		point.values[sentimentClass] += tweet.score;
		++point.counts[sentimentClass];
		point.values[3] += tweet.score;
		++point.counts[3];
	}
	
	combineTweetPoints(basePoint, addedPoint) {
		if (!basePoint) return;
		for (var i = 0; i < basePoint.values.length; ++i) {
			basePoint.values[i] += addedPoint.values[i];
		}
		for (i = 0; i < basePoint.counts.length; ++i) {
			basePoint.counts[i] += addedPoint.counts[i];
		}
	}
	
	tweetsToPoints(tweets, aggregationMillis, fromTimestamp, toTimestamp) {
		var firstTimestamp = fromTimestamp - (fromTimestamp % aggregationMillis);
		var lastTimestamp = toTimestamp - (toTimestamp % aggregationMillis);
		var pointCount = (lastTimestamp - firstTimestamp) / aggregationMillis + 1;
		
		var points = [];
		for (var i = 0; i < pointCount; ++i) {
			points.push({
				date: new Date(firstTimestamp + i * aggregationMillis),
				values: [0, 0, 0, 0],
				counts: [0, 0, 0, 0]
			});
		}
		
		tweets.forEach(function(tweet) {
			var pointIndex = Math.floor((tweet.createdAt - firstTimestamp) / aggregationMillis);
			this.updatePointForTweet(points[pointIndex], tweet);
		}, this);
		
		return points;
	}
	
	getAggregationMillis(loadFromTimestamp, loadToTimestamp) {
		var diffMillis = loadToTimestamp - loadFromTimestamp;
		var aggregationMillis = 1;
		for (var i = 0; i < config.aggregation.length; ++i) {
			var item = config.aggregation[i];
			if (item.fromSeconds * 1000 <= diffMillis) {
				aggregationMillis = item.millis;
			} else {
				break;
			}
		}
		return aggregationMillis;
	}
	
	getSentimentClass(tweet) {
		return tweet.score < config.sentiment.neutralMin ? 0 : (tweet.score > config.sentiment.neutralMax ? 2 : 1);
	}
	
	combineAverages(avg1, number1, avg2, number2) {
		if (number1 === 0) return avg2;
		if (number2 === 0) return avg1;
		return avg1 * (number1 / (number1 + number2)) + avg2 * (number2 / (number1 + number2));
	}
	
	getUpdatedTweetStats(tweets) {
		var stats = {
			scoreMinMaxKnown: this.state.scoreMinMaxKnown || tweets.length > 0,
			scoreMin: this.state.scoreMin,
			scoreMax: this.state.scoreMax,
			negativeCount: this.state.negativeCount,
			negativeAverage: this.state.negativeAverage,
			neutralCount: this.state.neutralCount,
			neutralAverage: this.state.neutralAverage,
			positiveCount: this.state.positiveCount,
			positiveAverage: this.state.positiveAverage,
			totalCount: this.state.totalCount,
			totalAverage: this.state.totalAverage
		};
		tweets.forEach(function(tweet) {
			stats.scoreMin = Math.min(stats.scoreMin, tweet.score);
			stats.scoreMax = Math.max(stats.scoreMax, tweet.score);
			stats.totalAverage = this.combineAverages(stats.totalAverage, stats.totalCount, tweet.score, 1);
			++stats.totalCount;
			switch(this.getSentimentClass(tweet)) {
				case 0:
					stats.negativeAverage = this.combineAverages(stats.negativeAverage, stats.negativeCount, tweet.score, 1);
					++stats.negativeCount;
					break;
				case 1:
					stats.neutralAverage = this.combineAverages(stats.neutralAverage, stats.neutralCount, tweet.score, 1);
					++stats.neutralCount;
					break;
				default: // case 2:
					stats.positiveAverage = this.combineAverages(stats.positiveAverage, stats.positiveCount, tweet.score, 1);
					++stats.positiveCount;
					break;
			}
		}, this);
		
		return stats;
	}
	
	updateDisplayedTweets(tweets) {
		var displayedTweets = [];
		for (var i = 0; i < Math.min(this.state.displayedTweetsMaxCount, tweets.length); ++i) {
			displayedTweets.push(tweets[i]);
		}
		this.setState({ displayedTweets: displayedTweets });
	}
	
	// --- ^^^ --- TWEET PROCESSING ---------------------------------------------
	
	// --- vvv --- USER ID FORM / REGISTRATION ---------------------------------
	
	provisionalUserIdChanged(event) {
		event.preventDefault();
		this.setState({
			provisionalUserId: event.target.value
		});
	}
	
	userIdUnset(event) {
		event.preventDefault();
		
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		
		this.setState({
			userId: null,
			provisionalUserId: '',
			userIdValidationState: null,
			
			consumerKey: null,
			provisionalConsumerKey: '',
			consumerKeyValidationState: null,
			
			consumerSecret: null,
			provisionalConsumerSecret: '',
			consumerSecretValidationState: null,
			
			accessToken: null,
			provisionalAccessToken: '',
			accessTokenValidationState: null,
			
			accessTokenSecret: null,
			provisionalAccessTokenSecret: '',
			accessTokenSecretValidationState: null,
			
			word: null,
			provisionalWord: '',
			wordValidationState: null,
			
			suggestedWordsVisible: false,
			suggestedWords: null,
			suggestedWordsLoading: false,
			
			scrollToOutputArea: false,
			outputAreaVisible: false,
			
			tweets: [],
			tweetPoints: [],
			loadStartTimestamp: -1,
			loadEndTimestamp: -1,
			loadTimesKnown: false,
			aggregationMillis: 1000,
			
			scoreMax: 0,
			scoreMin: 0,
			scoreMinMaxKnown: false,
			negativeCount: 0,
			negativeAverage: 0,
			neutralCount: 0,
			neutralAverage: 0,
			positiveCount: 0,
			positiveAverage: 0,
			totalCount: 0,
			totalAverage: 0,
			
			displayedTweets: [],
			displayedTweetsAge: this.state.displayedTweetsMaxAge,
			
			autoupdatePaused: true,
			
			demoCount: 0
		});
		
		this.resetLineChart1();
	}
	
	userIdSubmitted(event) {
		event.preventDefault();
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		if (this.state.provisionalUserId.length > 0) {
			this.setState({
				userId: this.state.provisionalUserId,
				provisionalUserId: this.state.provisionalUserId,
				userIdValidationState: null,
				word: null,
				provisionalWord: '',
				wordValidationState: null,
				suggestedWords: null,
				suggestedWordsVisible: false,
			});
		} else {
			this.setState({ userIdValidationState: 'error' });
		}
	}
	
	renderUserIdForm() {
		return <form onSubmit={(event) => this.userIdSubmitted(event)}>
			<FormGroup controlId="userId" bsSize="large" validationState={this.state.userIdValidationState}>
				<ControlLabel>What is your username, registered user?</ControlLabel>
				<FormControl
					autoFocus
					type="text"
					value={this.state.provisionalUserId}
					onChange={(event) => this.provisionalUserIdChanged(event)}
				/>
			</FormGroup>
			<Button block disabled={!this.state.readyForInteraction} type="submit" bsSize="large">Go!</Button>
			<div className="medium-top-margin">
				{ (this.state.readyForInteraction && !this.state.registrationFormShown)
					? <a href="#" onClick={(event) => this.registrationFormRequested(event)}>I would like to register</a>
					: <span>I would like to register</span>
				}
			</div>
			{ this.state.registrationFormShown ? this.renderRegistrationFormModal() : '' }
		</form>;
	}
	
	renderUserStateForm() {
		return <p className="text-right">
			LambdaLytics <Glyphicon glyph="heart" /> &quot;{this.state.userId}&quot;
			<Button disabled={!this.state.readyForInteraction} onClick={(event) => this.userIdUnset(event)} type="button" bsSize="small">Change Identity</Button>
		</p>
	}
	
	registrationFormRequested(event) {
		event.preventDefault();
		this.setState({
			registrationFormShown: true
		});
	}
	
	registrationFormModalHiding() {
		if (this.state.registrationInProgress) {
			alert('Registration in progress, please wait.');
			return;
		}
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		this.setState({
			registrationFormShown: false
		});
	}
	
	provisionalConsumerKeyChanged(event) {
		event.preventDefault();
		this.setState({ provisionalConsumerKey: event.target.value });
	}
	
	provisionalConsumerSecretChanged(event) {
		event.preventDefault();
		this.setState({ provisionalConsumerSecret: event.target.value });
	}
	
	provisionalAccessTokenChanged(event) {
		event.preventDefault();
		this.setState({ provisionalAccessToken: event.target.value });
	}
	
	provisionalAccessTokenSecretChanged(event) {
		event.preventDefault();
		this.setState({ provisionalAccessTokenSecret: event.target.value });
	}
	
	registrationFormSubmitted(event) {
		event.preventDefault();
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		
		var userId = this.state.provisionalUserId;
		var consumerKey = this.state.provisionalConsumerKey;
		var consumerSecret = this.state.provisionalConsumerSecret;
		var accessToken = this.state.provisionalAccessToken;
		var accessTokenSecret = this.state.provisionalAccessTokenSecret;
		
		var userIdValid = userId.length > 0;
		var consumerKeyValid = consumerKey.length > 0;
		var consumerSecretValid = consumerSecret.length > 0;
		var accessTokenValid = accessToken.length > 0;
		var accessTokenSecretValid = accessToken.length > 0;
		
		this.setState({
			userIdValidationState: userIdValid ? null : 'error',
			consumerKeyValidationState: consumerKeyValid ? null : 'error',
			consumerSecretValidationState: consumerSecretValid > 0 ? null : 'error',
			accessTokenValidationState: accessTokenValid > 0 ? null : 'error',
			accessTokenSecretValidationState: accessTokenSecretValid > 0 ? null : 'error'
		});
		
		if (userIdValid && consumerKeyValid && consumerSecretValid && accessTokenValid && accessTokenSecretValid) {
			this.setState({
				readyForInteraction: false,
				registrationInProgress: true
			});
			this.addUser(userId, (new Date()).getTime(), consumerKey, consumerSecret, accessToken, accessTokenSecret, function(success) {
				this.setState({
					userId: userId,
					consumerKey: consumerKey,
					consumerSecret: consumerSecret,
					accessToken: accessToken,
					accessTokenSecret: accessTokenSecret,
					readyForInteraction: true,
					registrationInProgress: false,
					registrationFormShown: false
				});
			}, this);
		}
	}
	
	renderRegistrationFormModal() {
		return <Modal show={true} animation={false} onHide={() => this.registrationFormModalHiding()}>
			<ModalHeader closeButton={true}>
				<ModalTitle>
					Registration
				</ModalTitle>
			</ModalHeader>
			<ModalBody>
				{ this.state.registrationInProgress
					? <div className="loader-block"><span className="sr-only">Loading...</span></div>
					:	(<form onSubmit={(event) => this.registrationFormSubmitted(event)}>
							<FormGroup controlId="userId" bsSize="large" validationState={this.state.userIdValidationState}>
								<ControlLabel>Username</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									value={this.state.provisionalUserId}
									onChange={(event) => this.provisionalUserIdChanged(event)}
								/>
							</FormGroup>
							<FormGroup controlId="consumerKey" bsSize="large" validationState={this.state.consumerKeyValidationState}>
								<ControlLabel>Consumer Key</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									value={this.state.provisionalConsumerKey}
									onChange={(event) => this.provisionalConsumerKeyChanged(event)}
								/>
							</FormGroup>
							<FormGroup controlId="consumerSecret" bsSize="large" validationState={this.state.consumerSecretValidationState}>
								<ControlLabel>Consumer Secret</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									value={this.state.provisionalConsumerSecret}
									onChange={(event) => this.provisionalConsumerSecretChanged(event)}
								/>
							</FormGroup>
							<FormGroup controlId="accessToken" bsSize="large" validationState={this.state.accessTokenValidationState}>
								<ControlLabel>Access Token</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									value={this.state.provisionalAccessToken}
									onChange={(event) => this.provisionalAccessTokenChanged(event)}
								/>
							</FormGroup>
							<FormGroup controlId="accessTokenSecret" bsSize="large" validationState={this.state.accessTokenSecretValidationState}>
								<ControlLabel>Access Token Secret</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									value={this.state.provisionalAccessTokenSecret}
									onChange={(event) => this.provisionalAccessTokenSecretChanged(event)}
								/>
							</FormGroup>
							<Button block disabled={!this.state.readyForInteraction} type="submit" bsSize="large">Register</Button>
						</form>)
				}
			</ModalBody>
		</Modal>;
	}
	
	// --- ^^^ --- USER ID FORM / REGISTRATION ---------------------------------
	
	// --- vvv --- WORD FORM ---------------------------------------------------
	
	wordSubmitted(event) {
		event.preventDefault();
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		if (this.state.provisionalWord.length > 0) {
			var word = this.state.provisionalWord;
			
			this.setState({
				readyForInteraction: false,
				
				word: word,
				provisionalWord: word,
				wordValidationState: null,
				
				submittingWord: true,
				
				outputAreaVisible: true,
				scrollToOutputArea: true,
				
				tweets: [],
				tweetPoints: [],
				loadStartTimestamp: -1,
				loadEndTimestamp: -1,
				loadTimesKnown: false,
				aggregationMillis: 1000,
				
				scoreMax: 0,
				scoreMin: 0,
				scoreMinMaxKnown: false,
				negativeCount: 0,
				negativeAverage: 0,
				neutralCount: 0,
				neutralAverage: 0,
				positiveCount: 0,
				positiveAverage: 0,
				totalCount: 0,
				totalAverage: 0,
				
				displayedTweets: [],
				displayedTweetsAge: this.state.displayedTweetsMaxAge,
				
				autoupdatePaused: true,
				
				demoCount: 0
			});
			
			if (this.state.suggestedWords !== null) {
				this.finishWordSubmission(
					word, 
					!this.suggestedWordsContainText(this.state.suggestedWords, word)
				);
			} else {
				this.setState({
					suggestedWordsLoading: true
				});
				this.getWords(this.state.userId, function(words) {
					this.setState({
						suggestedWords: words,
						suggestedWordsLoading: false
					});
					this.finishWordSubmission(
						word,
						!this.suggestedWordsContainText(words, word)
					);
				}, this);
			}
		} else {
			this.setState({ wordValidationState: 'error' });
		}
	}
	
	finishWordSubmission(word, addWord) {
		var addWordForDemo = false;
		
		if (!addWord) {
			addWordForDemo = confirm('You are already tracking this word. You can use the "Select Word from List" button to look at data for existing streams. Do you want to start a new stream for testing/demo?');
		}
		
		this.resetLineChart1();
		if (addWord || addWordForDemo) {
			this.addWord(this.state.userId, word, (new Date()).getTime(), function(success) {
				var newSuggestedWords = this.state.suggestedWords.slice();
				
				if (!addWordForDemo) {
					newSuggestedWords.push({ text: word });
					newSuggestedWords.sort(function(a, b) { return a.text.localeCompare(b.text); });
				}
				
				this.setState({
					submittingWord: false,
					readyForInteraction: true,
					autoupdatePaused: false,
					suggestedWords: newSuggestedWords
				});
			}, this);
		} else {
			this.setState({
				submittingWord: false,
				readyForInteraction: true,
				autoupdatePaused: false
			});
		}
	}
	
	provisionalWordChanged(event) {
		event.preventDefault();
		this.setState({
			provisionalWord: event.target.value
		});
	}
	
	renderWordForm() {
		return <form onSubmit={(event) => this.wordSubmitted(event)}>
			<FormGroup controlId="word" bsSize="large" validationState={this.state.wordValidationState}>
				<ControlLabel>What word would you like to track?</ControlLabel>
				<FormControl
					autoFocus
					type="text"
					value={this.state.provisionalWord}
					onChange={(event) => this.provisionalWordChanged(event)}
				/>
			</FormGroup>
			<Button block disabled={!this.state.readyForInteraction} type="submit" bsSize="large">Track!</Button>
		</form>;
	}
	
	// --- ^^^ --- WORD FORM ---------------------------------------------------
	
	// --- vvv --- WORD SUGGESTIONS --------------------------------------------
	
	wordSuggestionsRequested(event) {
		event.preventDefault();
		if (!this.state.readyForInteraction) {
			alert('I am busy, please wait');
			return;
		}
		if (this.state.suggestedWords == null) {
			this.setState({
				readyForInteraction: false,
				suggestedWordsLoading: true
			});
			this.getWords(this.state.userId, function(words) {
				this.setState({
					readyForInteraction: true,
					suggestedWordsLoading: false,
					suggestedWords: words
				});
			}, this);
		}
		this.setState({ suggestedWordsVisible: true });
	}
	
	wordSuggestionsModalHiding() {
		if (this.state.suggestedWordsLoading) {
			alert('Currently I am busy loading. Please wait.');
		} else {
			this.setState({ suggestedWordsVisible: false });
		}
	}
	
	suggestedWordsContainText(words, text) {
		if (words === null) return false;
		for (var i = 0; i < words.length; ++i) {
			if (words[i].text === text) return true;
		}
		return false;
	}
	
	selectedSuggestedWord(event, wordText) {
		event.preventDefault();
		
		this.resetLineChart1();
		
		this.setState({
			word: wordText,
			provisionalWord: wordText,
			wordValidationState: null,
			
			suggestedWordsVisible: false,
			
			scrollToOutputArea: true,
			outputAreaVisible: true,
			
			tweets: [],
			tweetPoints: [],
			loadStartTimestamp: -1,
			loadEndTimestamp: -1,
			loadTimesKnown: false,
			aggregationMillis: 1000,
			
			scoreMax: 0,
			scoreMin: 0,
			scoreMinMaxKnown: false,
			negativeCount: 0,
			negativeAverage: 0,
			neutralCount: 0,
			neutralAverage: 0,
			positiveCount: 0,
			positiveAverage: 0,
			totalCount: 0,
			totalAverage: 0,
			
			displayedTweets: [],
			displayedTweetsAge: this.state.displayedTweetsMaxAge,
			
			autoupdatePaused: false,
			
			demoCount: 0
		});
	}
	
	historyWordSelected(event) {
		event.preventDefault();
		this.setState({
			historyWord: event.target.value
		});
	}
	
	historyFromDateChanged(event) {
		event.preventDefault();
		this.setState({
			provisionalHistoryFromDate: event.target.value
		});
	}
	
	
	
	historyToDateChanged(event) {
		event.preventDefault();
		this.setState({
			provisionalHistoryToDate: event.target.value
		});
	}
	
	historyFormSubmitted(event) {
		event.preventDefault();
		var word = this.state.historyWord;
		var fromDate = this.state.provisionalHistoryFromDate;
		var toDate = this.state.provisionalHistoryToDate;
		
		if (word.length === 0 || word === '---') {
			alert('Please select a word');
			return;
		}
		
		var fromMatches = (new RegExp('^(\\d{4})-(\\d{2})-(\\d{2})$', 'g')).exec(fromDate);
		if (fromMatches === null) {
			alert('Invalid date format: ' +fromDate);
			return;
		}
		
		var toMatches = (new RegExp('^(\\d{4})-(\\d{2})-(\\d{2})$', 'g')).exec(toDate);
		if (toMatches === null) {
			alert('Invalid date format: ' +toDate);
			return;
		}
		
		var fromDateObj = new Date(fromMatches[1], fromMatches[2] - 1, fromMatches[3], 0, 0, 1);
		var toDateObj = new Date(toMatches[1], toMatches[2] - 1, toMatches[3], 23, 59, 59);
		
		var fromTimestamp = fromDateObj.getTime();
		var toTimestamp = toDateObj.getTime();
		
		if (fromTimestamp >= toTimestamp) {
			alert('Your from date is after your to date.');
			return;
		}
		
		this.resetLineChart1();
		this.setState({
			readyForInteraction: false,
			
			word: word,
			provisionalWord: word,
			wordValidationState: null,
			
			submittingWord: false,
			
			suggestedWordsVisible: false,
			
			outputAreaVisible: true,
			scrollToOutputArea: true,
			
			tweets: [],
			tweetPoints: [],
			loadStartTimestamp: -1,
			loadEndTimestamp: -1,
			loadTimesKnown: false,
			aggregationMillis: 1000,
			
			scoreMax: 0,
			scoreMin: 0,
			scoreMinMaxKnown: false,
			negativeCount: 0,
			negativeAverage: 0,
			neutralCount: 0,
			neutralAverage: 0,
			positiveCount: 0,
			positiveAverage: 0,
			totalCount: 0,
			totalAverage: 0,
			
			displayedTweets: [],
			displayedTweetsAge: 0,
			
			autoupdatePaused: true,
			
			demoCount: 0
		});
		
		var intervalMillis = (toTimestamp - fromTimestamp) / config.historyIntervalCount;
		this.loadHistoryPoint(word, fromTimestamp, toTimestamp, intervalMillis);
	}
	
	loadHistoryPoint(word, fromTimestamp, toTimestamp, intervalMillis) {
		this.getAggregatedData(word, fromTimestamp, fromTimestamp + intervalMillis, function(data) {
			if (data != null) {
				var tweetPoint = {
					date: data.date,
					values: [data.totalNegative, data.totalNeutral, data.totalPositive, data.totalSentiment],
					counts: [data.negativeCount, data.neutralCount, data.positiveCount, data.totalCount]
				};
				
				var tweetPoints = this.state.tweetPoints.slice();
				tweetPoints.push(tweetPoint);
				
				var scoreMax = (!this.state.scoreMinMaxKnown) ? data.max : (Math.max(this.state.scoreMax, data.max));
				var scoreMin = (!this.state.scoreMinMaxKnown) ? data.min : (Math.min(this.state.scoreMin, data.min));
				
				var negativeCount = this.state.negativeCount + data.negativeCount;
				var negativeAverage = this.combineAverages(this.state.negativeAverage, this.state.negativeCount, data.averageNegative, data.negativeCount);
				
				var neutralCount = this.state.neutralCount + data.neutralCount;
				var neutralAverage = this.combineAverages(this.state.neutralAverage, this.state.neutralCount, data.averageNeutral, data.neutralCount);
				var positiveCount = this.state.positiveCount + data.positiveCount;
				var positiveAverage = this.combineAverages(this.state.positiveAverage, this.state.positiveCount, data.averagePositive, data.positiveCount);
				var totalCount = this.state.totalCount + data.totalCount;
				var totalAverage = this.combineAverages(this.state.totalAverage, this.state.totalCount, data.averageTotal, data.totalCount);
				
				this.setState({
					tweetPoints: tweetPoints,
					
					scoreMinMaxKnown: true,
					scoreMax: scoreMax,
					scoreMin: scoreMin,
					
					negativeCount: negativeCount,
					negativeAverage: negativeAverage,
					neutralCount: neutralCount,
					neutralAverage: neutralAverage,
					positiveCount: positiveCount,
					positiveAverage: positiveAverage,
					totalCount: totalCount,
					totalAverage: totalAverage
				});
				this.repaintLineChart1();
			}
			
			if (fromTimestamp + intervalMillis >= toTimestamp) {
				this.setState({
					readyForInteraction: true
				});
			} else {
				this.loadHistoryPoint(word, fromTimestamp + intervalMillis, toTimestamp, intervalMillis);
			}
		}, this);
	}
	
	renderWordSuggestions() {
		return <div>
			<p className="text-center medium-vertical-margin">or</p>
			<Button block disabled={!this.state.readyForInteraction} bsSize="large" onClick={(event) => this.wordSuggestionsRequested(event)}>Select Word from List</Button>
			{this.state.suggestedWordsVisible
				?	(
						<Modal show={true} animation={false} onHide={() => this.wordSuggestionsModalHiding()}>
							<ModalHeader closeButton={!this.state.suggestedWordsLoading}>
								<ModalTitle>
									Words
								</ModalTitle>
							</ModalHeader>
							<ModalBody>
								{this.state.suggestedWordsLoading
									?	(<div className="loader-block"><span className="sr-only">Loading...</span></div>)
									:	(this.state.suggestedWords.length === 0
										?	<p>There are no words yet for the user &quot;{this.state.userId}&quot;.</p>
										:	(<div>
												<h2>Track Current Tweets</h2>
												<ul>
													{this.renderArray(this.state.suggestedWords, function(item, index) {
														return <li key={index}><a href="#" onClick={(event) => this.selectedSuggestedWord(event, item.text)}>{item.text}</a></li>;
													}, this)}
												</ul>
												<h2>Track Historic Tweets</h2>
												<form onSubmit={(event) => this.historyFormSubmitted(event)}>
													<FormGroup controlId="word" bsSize="large" validationState={this.state.userIdValidationState}>
														<ControlLabel>Word</ControlLabel>
														<FormControl componentClass="select" placeholder="select" onChange={(event) => this.historyWordSelected(event)}>
															<option key="-1" value="---">--- Please Select ---</option>
															{this.renderArray(this.state.suggestedWords, function(item, index) {
																return <option key={index} value={item.text}>{item.text}</option>;
															}, this)}
														</FormControl>
													</FormGroup>
													<div className="row">
														<div className="col-xs-12 col-sm-6">
															<ControlLabel>From Date (YYYY-MM-DD)</ControlLabel>
															<FormGroup controlId="fromDate" bsSize="large" validationState={this.state.userIdValidationState}>
																<FormControl
																	autoFocus
																	type="text"
																	value={this.state.provisionalHistoryFromDate}
																	onChange={(event) => this.historyFromDateChanged(event)}
																/>
															</FormGroup>
														</div>
														<div className="col-xs-12 col-sm-6">
															<ControlLabel>To Date (YYYY-MM-DD)</ControlLabel>
															<FormGroup controlId="toDate" bsSize="large" validationState={this.state.userIdValidationState}>
																<FormControl
																	autoFocus
																	type="text"
																	value={this.state.provisionalHistoryToDate}
																	onChange={(event) => this.historyToDateChanged(event)}
																/>
															</FormGroup>
														</div>
													</div>
													<Button block disabled={!this.state.readyForInteraction} type="submit" bsSize="large">Go!</Button>
												</form>
											</div>)
										)
								}
							</ModalBody>
						</Modal>
					)
				: ''
			}
		</div>;
	}
	
	// --- ^^^ --- WORD SUGGESTIONS --------------------------------------------
	
	// --- vvv --- AUTOUPDATING ------------------------------------------------
	
	runAutoupdate() {
		this.setState({ autoupdateDone: false });
		
		var fromTimestamp = this.state.loadTimesKnown ? this.state.loadEndTimestamp : ((new Date()).getTime() - this.state.autoupdateInterval - config.tweetFetchLag);
		var toTimestamp = (new Date()).getTime() - config.tweetFetchLag;
		
		this.getAggregatedData(this.state.word, fromTimestamp, toTimestamp, function(data) {
			if (data != null) {
				var tweetPoint = {
					date: data.date,
					values: [data.totalNegative, data.totalNeutral, data.totalPositive, data.totalSentiment],
					counts: [data.negativeCount, data.neutralCount, data.positiveCount, data.totalCount]
				};
				
				var tweetPoints = this.state.tweetPoints.slice();
				tweetPoints.push(tweetPoint);
				
				var scoreMax = (!this.state.scoreMinMaxKnown) ? data.max : (Math.max(this.state.scoreMax, data.max));
				var scoreMin = (!this.state.scoreMinMaxKnown) ? data.min : (Math.min(this.state.scoreMin, data.min));
				
				var negativeCount = this.state.negativeCount + data.negativeCount;
				var negativeAverage = this.combineAverages(this.state.negativeAverage, this.state.negativeCount, data.averageNegative, data.negativeCount);
				
				var neutralCount = this.state.neutralCount + data.neutralCount;
				var neutralAverage = this.combineAverages(this.state.neutralAverage, this.state.neutralCount, data.averageNeutral, data.neutralCount);
				var positiveCount = this.state.positiveCount + data.positiveCount;
				var positiveAverage = this.combineAverages(this.state.positiveAverage, this.state.positiveCount, data.averagePositive, data.positiveCount);
				var totalCount = this.state.totalCount + data.totalCount;
				var totalAverage = this.combineAverages(this.state.totalAverage, this.state.totalCount, data.averageTotal, data.totalCount);
				
				var displayedTweets = data.displayedTweets;
				
				this.setState({
					autoupdateDone: true,
					
					tweetPoints: tweetPoints,
					displayedTweets: displayedTweets,
					
					scoreMinMaxKnown: true,
					scoreMax: scoreMax,
					scoreMin: scoreMin,
					
					negativeCount: negativeCount,
					negativeAverage: negativeAverage,
					neutralCount: neutralCount,
					neutralAverage: neutralAverage,
					positiveCount: positiveCount,
					positiveAverage: positiveAverage,
					totalCount: totalCount,
					totalAverage: totalAverage,
					
					loadStartTimestamp: this.state.loadTimesKnown ? this.state.loadStartTimestamp : fromTimestamp,
					loadEndTimestamp: toTimestamp,
					loadTimesKnown: true
				});
				
				this.repaintLineChart1();
			} else {
				this.setState({
					autoupdateDone: true
				});
			}
		}, this);
	}
	
	autoupdateLoop() {
		if (!this.state.autoupdatePaused && this.state.autoupdateDone && this.state.remainingAutoupdates !== 0) {
			this.runAutoupdate();
		}
		setTimeout(() => this.autoupdateLoop(), this.state.autoupdateInterval);
	}
	
	startAutoupdateLoop() {
		if (!this.state.autoupdateLoopStarted) {
			this.autoupdateLoop();
			this.setState({ autoupdateLoopStarted: true });
		}
	}
	
	// --- ^^^ --- AUTOUPDATING ------------------------------------------------
	
	// --- vvv --- DATA VISUALIZATION ------------------------------------------
	
	resetLineChart1() {
		var svg = d3.select(this.refs.lineChart1Svg);
		
		svg.selectAll("*").remove();
		
		svg.append('g').attr(
			'transform', 
			'translate(' + config.lineChart1.margin.left + ',' + config.lineChart1.margin.top + ')'
		);
	}
	
	repaintLineChart1() {
		this.lineChart1.x.domain(d3.extent(this.state.tweetPoints, function(d) { return d.date; }));
		this.lineChart1.y.domain(this.state.scoreMinMaxKnown ? [this.state.scoreMin, this.state.scoreMax] : [config.lineChart1.initY.min, config.lineChart1.initY.max]);
		
		var svg = d3.select(this.refs.lineChart1Svg);
		
		if (svg.selectAll('.line').size() === 0) {
			var marginG = svg.select('g');
			
			for (var i = 0; i < this.lineChart1.valueLines.length; ++i) {
				marginG.append('path')
					.attr('class', 'line line-' + i)
					.attr('d', this.lineChart1.valueLines[i](this.state.tweetPoints));
			}
			
			marginG.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0,' + config.lineChart1.height + ')')
				.call(this.lineChart1.xAxis);
			
			marginG.append('g')
				.attr('class', 'y axis')
				.call(this.lineChart1.yAxis);
		} else {
			var trans = svg.transition();
			
			for (var j = 0; j < this.lineChart1.valueLines.length; ++j) {
				trans.select('.line-' + j)
					.duration(0.8 * this.state.autoupdateInterval)
					.attr('d', this.lineChart1.valueLines[j](this.state.tweetPoints));
			}
			
			trans.select(".x.axis")
				.duration(0.8 * this.state.autoupdateInterval)
				.call(this.lineChart1.xAxis);
		
			trans.select(".y.axis")
				.duration(400)
				.call(this.lineChart1.yAxis);
		}
	}
	
	renderDisplayedTweets() {
		return <ul className="displayed-tweets">
			{
				this.renderArray(this.state.displayedTweets, function(tweet, index) {
					return <li key={index} className={ 'displayed-tweet age-' + this.state.displayedTweetsAge + ' sentiment-class-' + this.getSentimentClass(tweet) }>{tweet.text}</li>
				}, this)
			}
		</ul>;
	}
	
	// --- ^^^ --- DATA VISUALIZATION ------------------------------------------
	
	// --- vvv --- MAIN RENDERING METHOD ---------------------------------------
	
	render() {
		return <div className="container-fluid app-container">
			<div className="header-ribbon-1 row">
				<div className="col-xs-6 col-sm-4">
					<span className="brand"><span className="sr-only">LambdaLytics</span></span>
				</div>
				<div className="col-xs-6 col-sm-8">
					{this.state.userId == null
						? ''
						: this.renderUserStateForm()
					}
				</div>
			</div>
			<div className="input-section-1 row">
				<div className="col-xs-12">
					<div className="input-section-1-content-1">
						{this.state.userId == null
							? this.renderUserIdForm()
							: this.renderWordForm()
						}
						{this.state.userId == null
							? ''
							: this.renderWordSuggestions()
						}
					</div>
				</div>
			</div>
			<div ref="outputArea" className={'output-section-1 row ' + (this.state.outputAreaVisible ? 'output-visible' : 'output-hidden')}>
				<div className="col-xs-12">
					<h2>Tracking &quot;{this.state.word}&quot; for User &quot;{this.state.userId}&quot;</h2>
					{this.state.submittingWord
						?	(<div className="loader-block"><span className="sr-only">Loading...</span></div>)
						:	''
					}
					
						
						
						
					<div className="row">
						<div className="col-xs-12 col-sm-8">
							<div className="x-scroll">
								<svg
									className="line-chart-1-svg"
									ref="lineChart1Svg"
									width={
										(config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount)
											?	0
											:	(config.lineChart1.width + config.lineChart1.margin.left + config.lineChart1.margin.right)
									}
									height={
										(config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount)
											?	0
											:	(config.lineChart1.height + config.lineChart1.margin.top + config.lineChart1.margin.bottom)
									}
								></svg>
							</div>
						</div>
						<div className="col-xs-12 col-sm-4">
							<div className="row">
								<div className="col-xs-12 col-sm-8">
									Total Number
								</div>
								<div className="col-xs-12 col-sm-4 text-right">
									{this.state.totalCount}
								</div>
							</div>
							
							{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
								:	<div className="row">
										<div className="col-xs-12 col-sm-8">
											Total Average
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.totalAverage.toFixed(3)}
										</div>
									</div>
							}
							
							{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
								:	<div className="row">
										<div className="col-xs-12 col-sm-8">
											Total Maximum
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.scoreMax}
										</div>
									</div>
							}
							
							{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
								:	<div className="row">
										<div className="col-xs-12 col-sm-8">
											Total Minimum
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.scoreMin}
										</div>
									</div>
							}
							
							{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
								:	<div className="row">
										<div className="col-xs-12">
											{ this.renderDisplayedTweets() }
										</div>
									</div>
							}
						</div>
					</div>
					{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
						:	<div className="row">
								<div className="col-xs-12 col-sm-4">
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Number of Negative
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.negativeCount}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Percentage of Negative
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.formatPercentage(this.state.negativeCount, this.state.totalCount, '#')}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Average Negative
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.negativeAverage.toFixed(3)}
										</div>
									</div>
								</div>
								
								<div className="col-xs-12 col-sm-4">
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Number of Neutral
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.neutralCount}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Percentage of Neutral
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.formatPercentage(this.state.neutralCount, this.state.totalCount, '#')}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Average Neutral
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.neutralAverage.toFixed(3)}
										</div>
									</div>
								</div>
								<div className="col-xs-12 col-sm-4">
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Number of Positive
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.positiveCount}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Percentage of Positive
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.formatPercentage(this.state.positiveCount, this.state.totalCount, '#')}
										</div>
									</div>
									
									<div className="row">
										<div className="col-xs-12 col-sm-8">
											Average Positive
										</div>
										<div className="col-xs-12 col-sm-4 text-right">
											{this.state.positiveAverage.toFixed(3)}
										</div>
									</div>
								</div>
							</div>
					}
									
					{ (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) ? ''
						:	<div className="row">
								<div className="col-xs-12">
									<div className={'bar-chart-1 ' + (this.state.totalCount > 0 ? 'chart-active' : 'chart-inactive')}>
										<div className="bar negative-bar" style={{width: this.formatPercentage(this.state.negativeCount, this.state.totalCount, '33.333%')}}>&nbsp;</div>
										<div className="bar neutral-bar" style={{width: this.formatPercentage(this.state.neutralCount, this.state.totalCount, '33.333%')}}>&nbsp;</div>
										<div className="bar positive-bar" style={{width: this.formatPercentage(this.state.positiveCount, this.state.totalCount, '33.333%')}}>&nbsp;</div>
									</div>
								</div>
							</div>
					}
					
					<div className="row medium-vertical-margin">
						<div className="col-xs-12 col-sm-4">
							Demo Load: {this.insertThousendSeparators(this.state.demoCount)}
						</div>
						<div className="col-xs-12 col-sm-8">
							<Button disabled={!this.state.readyForInteraction} onClick={(event) => this.demoCountIncreaseRequested(event)} type="button" bsSize="small">Increase</Button>
						</div>
					</div>
					
				</div>
			</div>
		</div>;
	}
	
	// --- ^^^ --- MAIN RENDERING METHOD ---------------------------------------
	
	// --- vvv --- LIFECYCLE EVENTS --------------------------------------------
	
	async componentDidMount() {
		this.setState({
			readyForInteraction: true
		});
		this.startAutoupdateLoop();
		this.startDemoLoop();
	}
	
	async componentDidUpdate() {
		if (this.state.scrollToOutputArea) {
			this.scrollToOutputArea();
			this.setState({ scrollToOutputArea: false });
		}
	}
	
	// --- ^^^ --- LIFECYCLE EVENTS --------------------------------------------
}

export default App;