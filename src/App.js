import './App.css';
import React, { Component } from 'react';
// import InfiniteScroll from './InfiniteScrollStatic';
import InfiniteScroll from './InfiniteScrollDynamic';
import {testData} from './data';

class App extends Component {

  getRenderItemDOM = (data, index) => {
    return  <p className="list-item-text">{data.name + " ----- " + data.text}</p>;
  }

  getRangeData = (start, end) => {
    return Promise.resolve({data: testData.slice(start, end), isLast: testData.length - 1 <= end});
  }

  getLoadingUI = () => {
    return <h1>Loading......</h1>
  }

  render () {
    // static data
    // return (
    //   <div className="App">
    //     <h1 className="header">Header</h1>
    //     <InfiniteScroll
    //       totalStaticData={testData} 
    //       sliderSize={15}
    //       getListItemDOM = {this.getRenderItemDOM}
    //     />
    //   </div>
    // );
    // dynamic data
    return (
      <div className="App">
        <h1 className="header">Header</h1>
        <InfiniteScroll 
        sliderSize={15}
        getLoadingUI={this.getLoadingUI}
        getListItemDOM={this.getRenderItemDOM}
        getRangeData={this.getRangeData}
        dataIndex="name"/>
      </div>
    );
  }
}

export default App;
