import React, { Component } from 'react';
import './Home.css';

class Home extends Component {
  render() {
    return (
      <div className="Home">
        <div className="lander">
          <h1>Twitterment</h1>
          <p>A twitter sentiment analysis app</p>
        </div>
      </div>
    );
  }
}

export default Home;