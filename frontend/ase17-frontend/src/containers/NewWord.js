import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import {
  FormGroup,
  FormControl,
  ControlLabel,
} from 'react-bootstrap';
import LoaderButton from '../components/LoaderButton';
import './NewWord.css';
import { invokeApig } from '../libs/awsLib';

class NewWord extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isLoading: null,
      content: '',
    };
  }

  validateForm() {
    return this.state.content.length > 0;
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleFileChange = (event) => {
    this.file = event.target.files[0];
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      await this.createWord({
        content: this.state.content,
      });
      this.props.history.push('/');
    }
    catch(e) {
      alert(e);
      this.setState({ isLoading: false });
    }

  }

  createWord(word) {
    return invokeApig({
      path: '/words',
      method: 'POST',
      body: word,
    }, this.props.userToken);
  }

  render() {
    return (
      <div className="NewWord">
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="content">
            <ControlLabel>Keyword</ControlLabel>
            <FormControl
              autoFocus
              onChange={this.handleChange}
              value={this.state.content}
              componentClass="textarea"
              placeholder="Your brand/keyword here..." />
          </FormGroup>
          <LoaderButton
            button
            bsStyle="primary"
            bsSize="Large"
            disabled={ ! this.validateForm() }
            type="submit"
            isLoading={this.state.isLoading}
            text="Submit"
            loadingText="Running Analysis…" />
        </form>
      </div>
    );
  }
}

export default withRouter(NewWord);