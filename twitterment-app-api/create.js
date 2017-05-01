import uuid from 'uuid';
import * as dynamoDbLib from './libs/dynamodb-lib';
import { success, failure } from './libs/response-lib';

export async function main(event, context, callback) {
  const data = JSON.parse(event.body);
  console.log("Here is the :" + data.content);
  const params = {
    TableName: 'twitter_words',
    Item: {
      userId: event.requestContext.authorizer.claims.sub,
      wordId: uuid.v1(),
      content: data.content,
      createdAt: new Date().getTime(),
    },
  };

  try {
    const result = await dynamoDbLib.call('put', params);
    console.log("Here again: " + params.Item.content);
    callback(null, success(params.Item));
  }
  catch(e) {
    callback(null, failure({status: false}));
  }
};