import './App.css';
import React, { Component, createRef } from 'react';
import {testData} from './data';

const N = 15;
const lastIndex = N - 1;
class App extends Component {
  constructor(props) {
    super(props);
    this.topRef = createRef();
    this.bottomRef = createRef();
    this.rootRef = createRef();
    this.boundary = {
      start: 0,
      end: N
    };
    this.testData = testData;
    this.state = {
      data: this.testData.slice(this.boundary.start, this.boundary.end),
      addNewHeight: true
    };
    this.SCROLL_MODES = {
      'TOP': "top",
      'BOTTOM': "bottom"
    };
    this.observer = null;
    this.currentScrollMode = this.SCROLL_MODES.BOTTOM;
    this.snapshot = null;
    this.elementsSwapped = N;
  }
  renderList = () => {
    const list = []
    const {data} = this.state;
    for(let i =0 ; i < N;i++) {
      list.push(
        <li
        key={data[i].name} 
        id={i === 0 ? this.SCROLL_MODES.TOP : i === lastIndex ? this.SCROLL_MODES.BOTTOM : ''}
        className="list-item-wrapper visible-hidden"
        ref={this.getReference(i)}>
          <p className="list-item-text">{data[i].name + " ----- " + data[i].text}</p>
          {/* <img src={data[i].url} 
          alt={data[i].name}/> */}
        </li>
      )
    }
    return list;
  }
  positionElements = (snapshot) => {
    if (this.rootRef.current) {
      const rootRef = this.rootRef.current;
      const currentScrollMode = this.currentScrollMode;
      requestAnimationFrame(() => {
        const childrenNodes = Array.from(rootRef.children);
        let wrapperNewHeight = 0;
        if (this.currentScrollMode == this.SCROLL_MODES.BOTTOM) {
          childrenNodes.forEach((el, index, arr) => {
            if (N - this.elementsSwapped <= index) {
              const {selfHeight, offset} = this.getPosition(arr, index);
              el.style.transform = `translate(100px, ${offset}px)`;
              wrapperNewHeight = selfHeight + offset;           
              el.classList.remove("visible-hidden");
            }
          });
        } else {
          for(let i = childrenNodes.length - 1; i >= 0; i--) {
            if (this.elementsSwapped > i) {
              const el = childrenNodes[i];
              const {offset} = this.getPosition(childrenNodes, i);
              el.style.transform = `translate(100px, ${offset}px)`;
              el.classList.remove("visible-hidden");
            }
          }
        }
        
        if (currentScrollMode === this.SCROLL_MODES.BOTTOM && this.state.addNewHeight) {
          rootRef.style.height = wrapperNewHeight + "px";
        }
        this.attachObserver();
        });
    }
  }
  componentDidMount() {
    this.positionElements();
    this.initiateObserver();
  }
  componentDidUpdate() {
    this.positionElements(this.snapshot);
  }
  getPosition = (arr, index) => {
    const res = {
      selfHeight: arr[index].getBoundingClientRect().height,
      offset: 0
    };
    const isBottomScroll = this.SCROLL_MODES.BOTTOM === this.currentScrollMode;
    if (isBottomScroll && index < 1) return res;
    const i = isBottomScroll ? index - 1 : index + 1;
    const style = arr[i].style.transform;
    if (!style || !style.length) return res;
    res.offset = (+style.split(",")[1].trim().slice(0, -3)) + 
      (isBottomScroll ?  arr[i].getBoundingClientRect().height : -arr[index].getBoundingClientRect().height);
    return res;
  }

  getTransformY = (dom) => {
    const style = dom.style.transform;
    if (!style || !style.length) return 0;
    return +style.split(",")[1].trim().slice(0, -3);
  }
  initiateObserver = () => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0
    }
    this.observer = new IntersectionObserver(this.callback, options);
  }

  attachObserver = () => {
    this.topRef.current && this.observer.observe(this.topRef.current);
    this.bottomRef.current && this.observer.observe(this.bottomRef.current);
  }

  getOutOfViewportElements = (mode) => {
    if (mode === this.SCROLL_MODES.TOP) {
      if(this.rootRef.current) {
        let i = 0;
        const thresholdHeight = document.scrollingElement.scrollTop - this.rootRef.current.clientTop + window.innerHeight;
        const children = Array.from(this.rootRef.current.children);
        for (i = children.length - 1; i >=0; i--) {
          if (thresholdHeight >= this.getTransformY(children[i])) {
            break;
          } 
        }
        i = children.length - 1 - i;
        i = Math.min(i, this.boundary.start);
        if (i > 0) {
          if (this.boundary.start == 1) {
            const _start = 0;
            const _end = N;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(0, N, mode);
              this.elementsSwapped = 1;
            }
          } else {
            const _start = this.boundary.start - i + 1;
            const _end = this.boundary.end - i + 1;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(_start, _end, mode);
              this.elementsSwapped = i;
            }
          }
        }
      }
    } else if (mode === this.SCROLL_MODES.BOTTOM) {
      if(this.rootRef.current) {
        let i = 0;
        const thresholdHeight = document.scrollingElement.scrollTop;
        const children = Array.from(this.rootRef.current.children);
        for (i=0; i < children.length; i++) {
          if (thresholdHeight <= this.getTransformY(children[i]) + children[i].getBoundingClientRect().height) {
            break;
          } 
        }
        i = Math.min(i, this.testData.length - 1 - this.boundary.end);
        if (i > 0) {
          if (this.boundary.end == this.testData.length - 2) {
            const _start = this.testData.length - N;
            const _end = this.testData.length;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(_start, _end, mode);
              this.elementsSwapped = 2;
            }
          } else {
            const _start = this.boundary.start + i - 1;
            const _end = this.boundary.end + i - 1;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(_start, _end, mode);
              this.elementsSwapped = i;  
            }
          }
        }
      }
    }
  }

  isUpdateNeeded = (start, end) => {
    if (start < 0 || start > end || end < start || end > this.testData.length 
      || (start == this.boundary.start && end == this.boundary.end)) {
      return false;
    }
    return true;
  }

  getPrevSnapShot = () => {
    return {
      bottomRef: this.bottomRef.current.getBoundingClientRect(),
      topRef: this.topRef.current.getBoundingClientRect(),
      scrollPosition: this.snapshot ? document.scrollingElement.scrollTop + this.snapshot.scrollPosition 
      : document.scrollingElement.scrollTop
    };
  }
  updateState = (start, end, mode) => {
    this.snapshot = this.getPrevSnapShot();
    this.resetObservation();
    this.currentScrollMode = mode;
    this.boundary = {
      start: start,
      end: end
    };
    this.setState(this.getNewState(start, end));
  }
  getNewState = (start, end) => {
    let addNewHeight = false;
    const data = this.testData.slice(start, end).map((i) => {
      if (!i.hasOwnProperty('visited')) addNewHeight = true; 
      i.visited = true
      return i;
    });
    return {data, addNewHeight};
  }
  callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.id === this.SCROLL_MODES.BOTTOM) {
        this.getOutOfViewportElements(this.SCROLL_MODES.BOTTOM);
      }
      if (entry.isIntersecting && entry.target.id === this.SCROLL_MODES.TOP) {
        this.getOutOfViewportElements(this.SCROLL_MODES.TOP);
      }
    }); 
  }
  resetObservation = () => {
    this.observer.unobserve(this.bottomRef.current);
    this.observer.unobserve(this.topRef.current);
    this.bottomRef = createRef();
    this.topRef = createRef();
  }
  getReference = (index) => {
    if (index === 0) return this.topRef;
    else if (index === lastIndex) return this.bottomRef;
  }
  render () {
    return (
      <div className="App">
        <ul className="list-wrapper"
        ref={this.rootRef}>
          {this.renderList()}
        </ul>
      </div>
    );
  }
}

export default App;
