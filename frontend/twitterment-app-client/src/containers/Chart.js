import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import './Chart.css';
import d3 from 'd3';
import {
  FormGroup,
  FormControl,
  ControlLabel,
  Button
} from 'react-bootstrap';

class Chart extends Component {
	
	constructor(props) {
		super(props);
		
		var me = this;
		
		this.readyForInteraction = false;
		
		// this.startTimeFieldValue = this.millisToTimeString(this.shiftDate(new Date(), -24 * 60 * 60).getTime());
		this.startTimeFieldValue = this.millisToTimeString(this.shiftDate(new Date(), - 60).getTime());
		
		this.chartMargin = {top: 31, right: 20, bottom: 30, left: 50};
		this.chartWidth = 600 - this.chartMargin.left - this.chartMargin.right;
		this.chartHeight = 270 - this.chartMargin.top - this.chartMargin.bottom;
		
		this.chartX = d3.time.scale().range([0, this.chartWidth]);
		this.chartY = d3.scale.linear().range([this.chartHeight, 0]);
		
		this.chartXAxis = d3.svg.axis().scale(this.chartX)
			.orient('bottom').ticks(5);
		
		this.chartYAxis = d3.svg.axis().scale(this.chartY)
			.orient('left').ticks(5);
		
		this.valueline0 = d3.svg.line()
			.x(function(d) { return me.chartX(d.date); })
			.y(function(d) { return me.chartY(d.number === 0 ? 0 : (d.values[0] / d.number)); });
		
		this.valueline1 = d3.svg.line()
			.x(function(d) { return me.chartX(d.date); })
			.y(function(d) { return me.chartY(d.number === 0 ? 0 : (d.values[1] / d.number)); });
		
		this.valueline2 = d3.svg.line()
			.x(function(d) { return me.chartX(d.date); })
			.y(function(d) { return me.chartY(d.number === 0 ? 0 : (d.values[2] / d.number)); });
		
		this.loadedEndMillis = -1;
		this.loadedStartMillis = -1;
		this.loadedData = [];
		
		this.autoUpdateMillis = 1000;
		this.skipAutoUpdates = 0;
		this.autoUpdatePaused = false;
	}
	
	shiftDate(date, deltaSeconds) {
		date.setTime(date.getTime() + deltaSeconds * 1000);
		return date;
	}
	
	millisToTimeString(millis) {
		var zeroPad = function(n) { return (n < 10 ? '0' : '') + n; };
		var date = new Date(millis);
		return date.getFullYear()
			+ '-' + zeroPad(date.getMonth() + 1)
			+ '-' + zeroPad(date.getDate())
			+ ' ' + zeroPad(date.getHours())
			+ ':' + zeroPad(date.getMinutes())
			+ ':' + zeroPad(date.getSeconds());
	}
	
	timeStringToMillis(timeString) {
		var regex = new RegExp('^(\\d{4})-(\\d{2})-(\\d{2}) (\\d{2}):(\\d{2}):(\\d{2})$');
		var match = regex.exec(timeString);
		if (!match) {
			return null;
		}
		var date = new Date(
			parseInt(match[1], 10),
			parseInt(match[2], 10) - 1,
			parseInt(match[3], 10),
			parseInt(match[4], 10),
			parseInt(match[5], 10),
			parseInt(match[6], 10)
		);
		return date.getTime();
	}
	
	
	
	
	
	
	
	
	
	
	
	
	startTimeFieldValueChanged(event) {
		event.preventDefault();
		this.startTimeFieldValue = event.target.value;
	}
	
	rangeFormSubmitted(event) {
		event.preventDefault();
		if (!this.readyForInteraction) {
			alert('Please wait while the chart is loading');
		}
		this.readyForInteraction = false;
		this.autoUpdatePaused = true;
		this.updateChartForForm(function() {
			this.readyForInteraction = true;
			this.autoUpdatePaused = false;
			this.skipAutoUpdates = 1;
		});
	}
	
	newEventHandler(handlerFunction) {
		var me = this;
		return function(event) { handlerFunction.call(me, event); };
	}
	
	
	
	
	
	
	
	
	getDataUrl(user, word, fromMillis, toMillis) {
		return 'http://localhost/twitterment/tweets.php?from=' + fromMillis + '&to=' + toMillis;
	}
	
	processLoadedData(loadedData, user, word, fromMillis, toMillis) {
		if (typeof loadedData[word] === 'undefined') return ['g'];
		
		var data = [];
		for (var i = 0; i < loadedData[word].length; ++i) {
			var loadedTweet = loadedData[word][i];
			data.push({
				text: loadedTweet.text,
				score: loadedTweet.score,
				positive: loadedTweet.positive,
				negative: loadedTweet.negative,
				createdAt: loadedTweet.createdAt
			});
		}
		
		data.sort(function(a, b) { return a.createdAt - b.createdAt; });
		
		return data;
	}
	
	
	
	
	
	
	
	
	loadData(user, word, fromMillis, toMillis, processorFunction) {
		var me = this;
		
		var dataUrl = this.getDataUrl(user, word, fromMillis, toMillis);
		console.log(dataUrl);
		
		fetch(dataUrl).then(function(response) {
			return response.json();
		}).then(function(loadedData) {
			var data = me.processLoadedData(loadedData, user, word, fromMillis, toMillis);
			processorFunction.call(me, data);
		}).catch(function(e) {
			processorFunction.call(me, null);
		});
	}
	
	updateChartForForm(processorFunction) {
		var startMillis = this.timeStringToMillis(this.startTimeFieldValue);
		
		if (startMillis == null) {
			alert('Invalid time: wrong format');
			processorFunction.call(this, []);
			return;
		}
		
		var endMillis = (new Date()).getTime();
		
		if (startMillis >= endMillis) {
			alert('Invalid time: in the future');
			processorFunction.call(this, []);
			return;
		}
		
		var user = this.props.match.params.user;
		var word = this.props.match.params.word;
		
		this.loadData(user, word, startMillis, endMillis, function(data) {
			if (data == null) {
				alert('Loading data failed');
				processorFunction.call(this, []);
			} else {
				this.loadedData = data;
				this.loadedEndMillis = endMillis;
				this.loadedStartMillis = startMillis;
				
				var points = this.makePoints(this.loadedData, startMillis, endMillis);
				
				this.resetChart(points);
				
				processorFunction.call(this, []);
			}
		});
	}
	
	updateChart(processorFunction) {
		var user = this.props.match.params.user;
		var word = this.props.match.params.word;
		
		var startMillis = this.loadedEndMillis;
		var endMillis = (new Date()).getTime();
		
		this.loadData(user, word, startMillis, endMillis, function(data) {
			if (data == null) {
				console.log('Loading data failed');
				processorFunction.call(this, []);
			} else {
				for (var i = 0; i < data.length; ++i) {
					this.loadedData.push(data[i]);
				}
				
				this.loadedEndMillis = endMillis;
				
				var points = this.makePoints(this.loadedData, this.loadedStartMillis, endMillis);
				
				this.resetChart(points);
				
				processorFunction.call(this, []);
			}
		});
	}
	
	updateLoop() {
		console.log('update loop');
		var me = this;
		
		if (this.autoUpdatePaused) {
			setTimeout(function() { me.updateLoop(); }, this.autoUpdateMillis);
		} else if (this.skipAutoUpdates > 0) {
			--this.skipAutoUpdates;
			setTimeout(function() { me.updateLoop(); }, this.autoUpdateMillis);
		} else {
			this.updateChart(function() {
				setTimeout(function() { me.updateLoop(); }, this.autoUpdateMillis);
			})
		}
	}
	
	/*
	updateChart(alertsActive, processorFunction) {
		var startMillis = this.timeStringToMillis(this.startTimeFieldValue);
		
		if (startMillis == null) {
			if (alertsActive) { alert('Invalid time: wrong format'); }
			processorFunction.call(this, []);
			return;
		}
		
		var endMillis = (new Date()).getTime();
		
		if (startMillis >= endMillis) {
			if (alertsActive) { alert('Invalid time: in the future'); }
			processorFunction.call(this, []);
			return;
		}
		
		var loadFromMillis = this.dataLoaded ? this.loadedEndMillis : startMillis;
		
		if (this.dataLoaded && this.loadedStartMillis !== startMillis) {
			this.loadedData.splice(0, this.loadedData.length);
			this.dataLoaded = false;
		}
		
		var user = this.props.match.params.user;
		var word = this.props.match.params.word;
		
		this.loadData(user, word, loadFromMillis, endMillis, function(data) {
			if (data == null) {
				if (alertsActive) { alert('Loading data failed'); }
				processorFunction.call(this, []);
			} else {
				for (var i = 0; i < data.length; ++i) {
					this.loadedData.push(data[i]);
				}
				
				var resetChart = !this.dataLoaded;
				
				this.loadedEndMillis = endMillis;
				if (!this.dataLoaded) {
					this.loadedStartMillis = loadFromMillis;
					this.dataLoaded = true;
				}
				
				var points = this.makePoints(this.loadedData, this.loadedStartMillis, this.loadedEndMillis);
				
				if (resetChart) {
					console.log('Reset with: ', points);
					this.resetChart(points);
				} else {
					console.log('Repaint with: ', points);
					this.repaintChart(points);
				}
				
				processorFunction.call(this, []);
			}
		});
	}
	*/
	
	makePoints(data, startMillis, endMillis) {
		var diffMillis = endMillis - startMillis;
		
		
		var aggregationSecs = 30 * 24 * 60 * 60;
		if (diffMillis < 10 * 60 * 1000) {
			aggregationSecs = 10;
		} else if (diffMillis < 4 * 60 * 60 * 1000) {
			aggregationSecs = 60;
		} else if (diffMillis < 4 * 24 * 60 * 60 * 1000) {
			aggregationSecs = 60 * 60;
		} else if (diffMillis < 21 * 24 * 60 * 60 * 1000) {
			aggregationSecs = 24 * 60 * 60;
		} else if (diffMillis < 90 * 24 * 60 * 60 * 1000) {
			aggregationSecs = 7 * 24 * 60 * 60;
		}
		console.log(aggregationSecs);
		
		var pointCount = Math.ceil(diffMillis / (aggregationSecs * 1000));
		var points = [];
		for (var i = 0; i < pointCount; ++i) {
			points.push({
				date: new Date(startMillis + i * aggregationSecs * 1000),
				values: [0, 0, 0],
				number: 0
			});
		}
		
		for (i = 0; i < data.length; ++i) {
			var item = data[i];
			var pointIndex = Math.min(pointCount - 1, Math.floor(((item.createdAt - startMillis) / diffMillis) * pointCount));
			++points[pointIndex].number;
			points[pointIndex].values[0] += item.negative;
			points[pointIndex].values[1] += item.score;
			points[pointIndex].values[2] += item.positive;
		}
		
		return points;
	}
	
	
	
	
	
	
	
	
	
	resetChart(points) {
		var svg = d3.select('.svg-container svg');
		
		svg.remove();
		svg = d3.select('.svg-container').append('svg')
			.attr('width', this.chartWidth + this.chartMargin.left + this.chartMargin.right)
			.attr('height', this.chartHeight + this.chartMargin.top + this.chartMargin.bottom)
		.append('g')
			.attr(
				'transform', 
				'translate(' + this.chartMargin.left + ',' + this.chartMargin.top + ')'
			)
		;
		
		this.chartX.domain(d3.extent(points, function(d) { return d.date; }));
		this.chartY.domain([d3.min(points, function(d) { return d.number === 0 ? 0 : (d.values[0] / d.number); }), d3.max(points, function(d) { return d.number === 0 ? 0 : (d.values[2] / d.number); })]);
		
		svg.append('path')
			.attr('class', 'line line-0')
			.attr('d', this.valueline0(points));
			
		svg.append('path')
			.attr('class', 'line line-1')
			.attr('d', this.valueline1(points));
		
		svg.append('path')
			.attr('class', 'line line-2')
			.attr('d', this.valueline2(points));
		
		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,' + this.chartHeight + ')')
			.call(this.chartXAxis);
		
		svg.append('g')
			.attr('class', 'y axis')
			.call(this.chartYAxis);
	}
	
	repaintChart(points) {
		this.chartX.domain(d3.extent(points, function(d) { return d.date; }));
		this.chartY.domain([d3.min(points, function(d) { return d.number === 0 ? 0 : (d.values[0] / d.number); }), d3.max(points, function(d) { return d.number === 0 ? 0 : (d.values[2] / d.number); })]);
		
		var svg = d3.select('.svg-container').select('svg').transition();
		
		svg.select('.line-0')
			.duration(750)
			.attr('d', this.valueline0(points));
		svg.select('.line-1')
			.duration(750)
			.attr('d', this.valueline1(points));
		svg.select('.line-2')
			.duration(750)
			.attr('d', this.valueline2(points));
		
		svg.select(".x.axis")
			.duration(750)
			.call(this.chartXAxis);
		svg.select(".y.axis")
			.duration(750)
			.call(this.chartYAxis);
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	async componentDidMount() {
		this.updateChartForForm(function() {
			this.readyForInteraction = true;
			this.skipAutoUpdates = 1;
			this.updateLoop();
		});
		/*
		this.updateChart(false, function() {
			this.readyForInteraction = true;
		});
		*/
		
		/*
		var me = this;
		
		this.resetChart([
			{ date: new Date(2017,  2,  3), values: [1, 2, 3], number: 1 },
			{ date: new Date(2017,  2,  4), values: [-3, -2, -1], number: 1 },
			{ date: new Date(2017,  2,  5), values: [2, 4, 6], number: 1 }
		]);
		
		setTimeout(function() {
			me.repaintChart([
				{ date: new Date(2017,  2,  3), values: [1, 2, 3], number: 1 },
				{ date: new Date(2017,  2,  4), values: [-3, -2, -1], number: 1 },
				{ date: new Date(2017,  2,  5), values: [2, 3, 6], number: 1 },
				{ date: new Date(2017,  2,  6), values: [-1, 3, 8], number: 1 }
			]);
		}, 2000);
		*/
	}
	
	render() {
		return (
			<div className="Chart">
				<h1>Tracking
					&quot;{this.props.match.params.word}&quot;
					for User
					&quot;{this.props.match.params.user}&quot;
				</h1>
				
				<div className="row">
					<div className="col-xs-12">
						<div className="svg-container">
							<svg />
						</div>
					</div>
				</div>
				
				<div className="row">
					<div className="col-xs-12">
						<form onSubmit={this.newEventHandler(this.rangeFormSubmitted)}>
							<FormGroup controlId="starttime" bsSize="large">
								<ControlLabel>Start Time (yyyy-mm-dd hh:mm:ss)</ControlLabel>
								<FormControl
									autoFocus
									type="text"
									onChange={this.newEventHandler(this.startTimeFieldValueChanged)}
									defaultValue={this.startTimeFieldValue} />
							</FormGroup>
							<Button
								block
								bsSize="large"
								type="submit">Apply</Button>
						</form>
					</div>
				</div>
				
			</div>	
		);
	}
}

export default withRouter(Chart);