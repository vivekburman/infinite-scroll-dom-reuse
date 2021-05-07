import './App.css';
import React, { Component } from 'react';
import InfiniteScrollStatic from './InfiniteScrollStatic';
import InfiniteScrollDynamic from './InfiniteScrollDynamic';
import {testDataStatic, testDataDynamic} from './data';


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
      return Promise.resolve({data: testDataDynamic.slice(start, end), isLast: testDataDynamic.length - 1 <= end});
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({data: testDataDynamic.slice(start, end), isLast: testDataDynamic.length - 1 <= end});
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
        <h1 className="header">Header</h1>
        <div className="flex">
          <button onClick={this.showDynamic}>
            Dynamic
          </button>
          <button onClick={this.showStatic}>
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
            totalStaticData={testDataStatic} 
            sliderSize={15}
            getListItemDOM = {this.getRenderItemDOM}/>
          }
          
        </div>
      </div>
    );
  }
}

export default App;
