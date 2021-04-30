import './App.css';
import React, { Component } from 'react';
import InfiniteScroll from './InfiniteScroll';

class App extends Component {
  render () {
    return (
      <div className="App">
        <h1 className="header">Header</h1>
        <InfiniteScroll />
      </div>
    );
  }
}

export default App;
