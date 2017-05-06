import React from 'react';
import { Route, Switch } from 'react-router-dom';
import NotFound from './containers/NotFound';
import Home from './containers/Home';
import Login from './containers/Login';
import AppliedRoute from './components/AppliedRoute';
import Signup from './containers/Signup';
import NewWord from './containers/NewWord';
import Chart from './containers/Chart';

export default ({ childProps }) => (
  <Switch>
    <AppliedRoute path="/" exact component={Home} props={childProps} />
    <AppliedRoute path="/login" exact component={Login} props={childProps} />
    <AppliedRoute path="/signup" exact component={Signup} props={childProps} />
    <AppliedRoute path="/word/new" exact component={NewWord} props={childProps} />
    <AppliedRoute path="/chart/:user/:word" exact component={Chart} props={childProps} />
    <Route component={NotFound} />
  </Switch>
);