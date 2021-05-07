import './App.css';
import React, { Component } from 'react';
import InfiniteScrollStatic from './InfiniteScrollStatic';
import InfiniteScrollDynamic from './InfiniteScrollDynamic';
import {testData} from './data';


let i = 1;
class App extends Component {

  constructor(props) {
    super(props);
    this.MODES = {
      "DYNAMIC": 1,
      "STATIC": 2
    };
    this.state = {
      activeMode: this.MODES.DYNAMIC
    }
  }
  getRenderItemDOM = (data, index) => {
    return  <p className="list-item-text">{data.name + " ----- " + data.text}</p>;
  }

  getRangeData = (start, end) => {
    if (i == 1) {
      i++;
      return Promise.resolve({data: testData.slice(start, end), isLast: testData.length - 1 <= end});
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({data: testData.slice(start, end), isLast: testData.length - 1 <= end});
      }, 5000);
    })
  }

  getLoadingUI = () => {
    return <h1>Loading......</h1>
  }


  showDynamic = () => {
    this.setState({activeMode: this.MODES.DYNAMIC});
  }

  showStatic = () => {
    this.setState({activeMode: this.MODES.STATIC});
  }

  render () {
    return (
      <div className="App">
        <h1 className="header">
          <em>
            Infinite Scroll with DOM Reuse for both Static and Dynamic
            data
          </em>
        </h1>
        <div className="flex">
          <button className={
              "button " +
              (this.state.activeMode === this.MODES.DYNAMIC ? "selected" : "")
            }
            onClick={this.showDynamic}>
            Dynamic
          </button>
          <button className={
              "button " +
              (this.state.activeMode === this.MODES.STATIC ? "selected" : "")
            } onClick={this.showStatic}>
            Static
          </button>
        </div>
        <div>
          {
            this.state.activeMode == this.MODES.DYNAMIC ?
          <InfiniteScrollDynamic 
            sliderSize={15}
            getLoadingUI={this.getLoadingUI}
            getListItemDOM={this.getRenderItemDOM}
            getRangeData={this.getRangeData}
            dataIndex="name"/>
            :
          <InfiniteScrollStatic
            totalStaticData={testData} 
            sliderSize={15}
            getListItemDOM = {this.getRenderItemDOM}/>
          }
          
        </div>
      </div>
    );
  }
}

export default App;
