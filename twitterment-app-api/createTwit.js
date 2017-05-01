import uuid from 'uuid';
import Twitter from 'twitter';
import * as dynamoDbLib from './libs/dynamodb-lib';
import { success, failure } from './libs/response-lib';
import sentiment from 'sentiment';

const client = new Twitter({
    consumer_key: '2vExKpL7bwRqIUo8CPpnDZZqh',
    consumer_secret: 'YJ3Ya9ZV21jrEcx3BuKTkJvZzU09ojTeZNJoBZ2B8wbeMdFjba',
    access_token_key: '846732875902976002-HPvAujFsByDF281MxLRqdKaRCqgtQOq',
    access_token_secret: 'pt9YIghOzZ9OqC1SPcSt2oLlUjBFMw9miPP18ptWW2KRo',
});

export function main(event, context, callback) {
	const data = JSON.parse(event.body);
	const keyword = data.content;
	console.log("The keyword is: " + keyword);
	console.log('Start Service');
	client.stream('statuses/filter', {track: keyword}, function(stream) {
    	stream.on('data', function(tweet) {
        console.log('New Tweet : ',tweet.text);
        var senti = sentiment(tweet.text);
               
                var params = {
                    TableName:"twitter_words",
                    Item: {
                    	userId: event.requestContext.authorizer.claims.sub,
      					wordId: uuid.v1(),
      					content: data.content,
      					createdAt: new Date().getTime(),
                        idstr: tweet.id_str,
                        name: tweet.user.screen_name,
                        text: tweet.text,
                        follower: tweet.user.followers_count,
                        url: "https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str,
                        language: tweet.user.lang,
                        timezone: tweet.user.time_zone,
                        location: tweet.user.location,
                        score: senti.score,
                       }
                    };

	    try {
	    	const result = dynamoDbLib.call('put', params);
	    	callback(null, success(params.Item));
	  	}
	  	catch(e) {
	    	callback(null, failure({status: false}));	
	    }		
	});
});
}
