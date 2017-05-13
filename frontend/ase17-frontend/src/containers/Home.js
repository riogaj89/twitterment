import React, { Component } from 'react';
import './Home.css';
import {
  withRouter,
  Link
} from 'react-router-dom';

class Home extends Component {
  render() {
    return (
      <div className="Home">
        <div className="lander">
          <h1>Twitterment</h1>
          <p>A twitter sentiment analysis app</p>
					<p>Demos</p>
					<ul>
						<li>
							<Link to={'/chart/' + encodeURI('bert') + '/' + encodeURI('Donald Trump')}>
								Chart: {'/chart/' + encodeURI('bert') + '/' + encodeURI('Donald Trump')}
							</Link>
						</li>
					</ul>
        </div>
      </div>
    );
  }
}

export default withRouter(Home);