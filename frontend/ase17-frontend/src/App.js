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
			// console.log(url, fromTimestamp, toTimestamp, loadedData);
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
	
	produceRandomTweets(number, listenerFunction, thisArg, waitForResponse) {
		var url = config.lambda.produceRandomTweets.url(
			config.lambda.produceRandomTweets.params.number, number
		);
		// console.log(url);
		
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
		if (demoCount >= 10000) return demoCount;
		return 10 * demoCount;
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
		// this.setState({ demoTaskDone: false });
		
		//for (var i = 0; i < 10; ++i) {
			this.produceRandomTweets(demoCount, function(success) {
				// this.setState({ demoTaskDone: true });
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
		
		// console.log('Setting loadEndTimestamp', toTimestamp, ', before', this.state.loadEndTimestamp);
		
		this.setState({
			loadStartTimestamp: this.state.loadTimesKnown ? this.state.loadStartTimestamp : fromTimestamp,
			loadEndTimestamp: toTimestamp,
			loadTimesKnown: true,
			tweets: allTweets, // xxa xxb
			tweetPoints: tweetPoints,
			aggregationMillis: aggregationMillis
		});
		
		// console.log('loadEndTimestamp', this.state.loadEndTimestamp);
		
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
							<Button block disabled={!this.state.readyForInteraction} type="submit" bsSize="large">Go!</Button>
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
				this.finishWordSubmission(word, this.state.suggestedWords.indexOf(word) === -1);
			} else {
				this.setState({
					suggestedWordsLoading: true
				});
				this.getWords(this.state.userId, function(words) {
					this.setState({
						suggestedWordsLoading: false,
						suggestedWords: words
					});
					this.finishWordSubmission(word, words.indexOf(word) === -1);
				}, this);
			}
		} else {
			this.setState({ wordValidationState: 'error' });
		}
	}
	
	finishWordSubmission(word, addWord) {
		this.resetLineChart1();
		if (addWord) {
			this.addWord(this.state.userId, word, (new Date()).getTime(), function(success) {
				var newSuggestedWords = this.state.suggestedWords.slice();
				newSuggestedWords.push(word);
				newSuggestedWords.sort(function(a, b) { return a.text.localeCompare(b.text); });
				
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
										:	(<ul>
												{this.renderArray(this.state.suggestedWords, function(item, index) {
													return <li key={index}><a href="#" onClick={(event) => this.selectedSuggestedWord(event, item.text)}>{item.text}</a></li>;
												}, this)}
											</ul>)
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
		
		// console.log('Are the loading times known? ', this.state.loadTimesKnown);
		
		// var fromTimestamp = (this.state.loadTimesKnown ? this.state.loadEndTimestamp : ((new Date()).getTime() - this.state.autoupdateInterval)) - config.tweetFetchLag;
		var fromTimestamp = this.state.loadTimesKnown ? this.state.loadEndTimestamp : ((new Date()).getTime() - this.state.autoupdateInterval - config.tweetFetchLag);
		// var fromTimestamp = (this.state.loadTimesKnown ? this.state.loadEndTimestamp : ((new Date()).getTime() - 3 * 60 * 60 * 1000)) - config.tweetFetchLag;
		var toTimestamp = (new Date()).getTime() - config.tweetFetchLag;
		
		console.log('*** autoupdate: ', fromTimestamp, toTimestamp);
		console.log('  without lag: ', fromTimestamp + config.tweetFetchLag, toTimestamp + config.tweetFetchLag);
		
		this.getTweets(this.state.userId, this.state.word, fromTimestamp, toTimestamp, function(tweets) {
			if (tweets != null) {
				if (config.simpleCount >= 0 && this.state.totalCount >= config.simpleCount) {
					this.setState({
						totalCount: this.state.totalCount + tweets.length
					});
				} else {
					this.integrateTweets(tweets, fromTimestamp, toTimestamp);
					if (this.state.displayedTweetsAge >= this.state.displayedTweetsMaxAge) {
						this.updateDisplayedTweets(tweets);
						this.setState({ displayedTweetsAge: 0 });
					} else {
						this.setState({ displayedTweetsAge: this.state.displayedTweetsAge + 1 });
					}
				}
			}
			this.setState({
				autoupdateDone: true,
				remainingAutoupdates: this.state.remainingAutoupdates > 0 ? this.state.remainingAutoupdates - 1 : this.state.remainingAutoupdates
			});
			this.repaintLineChart1();
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