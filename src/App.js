import './App.css';
import React, { Component } from 'react';
import InfiniteScrollStatic from './InfiniteScrollStatic';
import InfiniteScrollDynamic from './InfiniteScrollDynamic';
import {testDataStatic, testDataDynamic} from './data';


let i = 1;
class App extends Component {
  getRenderItemDOM = (data, index) => {
    return  <p className="list-item-text">{data.name + " ----- " + data.text}</p>;
  }

  getRangeData = (start, end) => {
    if (i == 1) {
      i++;
      return Promise.resolve({data: testDataDynamic.slice(start, end), isLast: testDataDynamic.length - 1 <= end});
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({data: testDataDynamic.slice(start, end), isLast: testDataDynamic.length - 1 <= end});
      }, 300);
    })
  }

  getLoadingUI = () => {
    return <h1>Loading......</h1>
  }

  render () {
    return (
      <div className="App">
        <h1 className="header">Header</h1>
        <div className="flex">
          <div className="flex-item">
            <div>Dynamic</div>
            <InfiniteScrollDynamic 
              sliderSize={15}
              getLoadingUI={this.getLoadingUI}
              getListItemDOM={this.getRenderItemDOM}
              getRangeData={this.getRangeData}
              dataIndex="name"/>
          </div>
          <div className="flex-item">
            <div>Static</div>
            {/* <InfiniteScrollStatic
              totalStaticData={testDataStatic} 
              sliderSize={15}
              getListItemDOM = {this.getRenderItemDOM}/> */}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
