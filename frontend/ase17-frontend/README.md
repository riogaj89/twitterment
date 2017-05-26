LambdaLytica Frontend
=====================

Deployment Instructions
-----------------------

The LambdaLytics front end is built with React JS.

Before you start the front end for testing, please adjust the configuration in
the file ".../ase17-frontend/src/config.js". There you have to change the URLs
of the Lambda Functions that the front end is going to call. You have to
change the following properties (you can search for "PLEASE CHANGE"):

- `lambda.addUser.url`: This is the URL for the "POST user" request
  ("https://.../user"). Insert the URL for your Lambda function analogously
  to the URL that is provided as example in the "config.js" file.
- `lambda.getWords.url`: This is the URL for the "GET keyword" request
  ("https://.../keyword").
- `lambda.addWord.url`: This is the URL for "POST keyword" request 
  ("https://.../keyword").
- `lambda.getAggregatedData.url`: This is the URL of the "GET tweets" request
  ("https://.../tweets").
- `lambda.produceRandomTweets.url`: This is the URL of the "POST random"
  request ("https://.../tweets").

After that you can test the front end locally by doing the following:

1) `cd` to ".../ase17-frontend" (the directory containing this README.md file)
2) run `npm install`
3) run `npm start`