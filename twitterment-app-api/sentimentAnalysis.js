import sentiment from 'sentiment';

export function sentiments(text) {
  return sentiment(text);
};