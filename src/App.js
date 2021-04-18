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
      data: this.testData.slice(this.boundary.start, this.boundary.end)
    };
    this.SCROLL_MODES = {
      'TOP': "top",
      'BOTTOM': "bottom"
    };
    this.heightAdjustments = {
      bottom: 0,
      top: 0
    };
    this.observer = null;
    this.currentScrollMode = this.SCROLL_MODES.BOTTOM;
    this.snapshot = null;
    this.elementsSwapped = {
      bottom: N,
      top: 0
    };
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
        let pixelsAdded = 0;
        childrenNodes.forEach((el, index, arr) => {
          if (N - this.elementsSwapped.bottom <= index) {
            const {selfHeight, offset} = this.getPosition(arr, index);
            el.style.transform = `translate(100px, ${offset}px)`;
            pixelsAdded += selfHeight;           
            el.classList.remove("visible-hidden");
          }
        });
        const prevHeight = rootRef.offsetHeight;
        if (currentScrollMode === this.SCROLL_MODES.BOTTOM) {
          this.heightAdjustments.bottom = snapshot ? (this.heightAdjustments.bottom + pixelsAdded) : this.heightAdjustments.bottom;
          rootRef.style.height = (prevHeight + pixelsAdded) + "px";
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
    if (index < 1)return res;
    const style = arr[index - 1].style.transform;
    if (!style || !style.length) return res;
    res.offset = (+style.split(",")[1].trim().slice(0, -3)) + arr[index - 1].getBoundingClientRect().height;
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
        let offset = 0;
        let i = 0;
        const thresholdHeight = this.rootRef.current.scrollHeight - 
          (document.scrollingElement.scrollTop - this.rootRef.current.clientTop + this.rootRef.current.offsetHeight);
        const children = Array.from(this.rootRef.current.children);
        for (i=children.length - 1; i >=0; i--) {
          offset += children[i].offsetHeight;
          if (thresholdHeight <= offset) {
            break;
          } 
        }
        i = children.length - 1 - i;
        i = Math.min(i, this.boundary.start);
        i !== 0 && this.updateState(this.boundary.start - i, this.boundary.end - i + 1, mode);
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
        i = Math.min(i, testData.length - 1 - this.boundary.end);
        i !== 0 && this.updateState(this.boundary.start + i, this.boundary.end + i, mode);
        this.elementsSwapped.bottom = i;
      }
    }
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
    if (start == this.boundary.start && end == this.boundary.end) {
      return;
    }
    this.snapshot = this.getPrevSnapShot();
    this.resetObservation();
    this.currentScrollMode = mode;
    this.boundary = {
      start: start,
      end: end
    };
    this.setState({
      data: this.testData.slice(start, end)
    })
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
