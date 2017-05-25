LambdaLytica Frontend
=====================

The LambdaLytics front end is built with React JS.

Before you start the front end for testing, please adjust the configuration in
the file ".../ase17-frontend/src/config.js". There you have to change the URLs
of the Lambda Functions that the front end is going to call. You have to
change the following properties:

- `lambda.addUser.url`
- `lambda.getWords.url`
- `lambda.addWord.url`
- `lambda.addWord.url`
- `lambda.produceRandomTweets.url`

After that you can test the front end locally by doing the following:

1) `cd` to ".../ase17-frontend" (the directory containing this README.md file)
2) run `npm install`
3) run `npm start`