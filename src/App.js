import './App.css';
import React, { Component } from 'react';
import InfiniteScroll from './InfiniteScroll';
import {testData} from './data';

class App extends Component {

  getRenderItemDOM = (data, index) => {
    return  <p className="list-item-text">{data.name + " ----- " + data.text}</p>;
  }

  render () {
    // static data
    return (
      <div className="App">
        <h1 className="header">Header</h1>
        <InfiniteScroll isDataStatic={true} 
          totalStaticData={testData} 
          sliderSize={15}
          getListItemDOM = {this.getRenderItemDOM}
        />
      </div>
    );
    // dynamic data
    /*return (
      <div className="App">
        <h1 className="header">Header</h1>
        <InfiniteScroll />
      </div>
    );*/
  }
}

export default App;
