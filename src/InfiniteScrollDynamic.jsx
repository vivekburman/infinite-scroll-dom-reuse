import React, { Component, createRef } from 'react';
import Proptypes from 'prop-types';
const N = 15;
class InfiniteScroll extends Component {
  constructor(props) {
    super(props);
    /**
     * topRef: Reference to top list item
     * bottomRef: Reference to bottom list item
     * rootRef: Reference to wrapper of list
     * wrapperOffset: Wrapper starting point location when first rendered
     * sliderSize: Number of elements to visible at any point of time
     * boundary: internal variable to point to current subset location of actual data which is shown
     * snapshot: Before update capture the current state
     * elementsSwapped: Count of how many elements needs to be swapped
     */
    this.topRef = createRef();
    this.bottomRef = createRef();
    this.rootRef = createRef();
    this.wrapperOffset = null;
    this.sliderSize = this.props.sliderSize || N;
    this.boundary = {
      start: 0,
      end: this.sliderSize
    };
    this.state = {
      data: [],
      loading: true,
    };
    this.SCROLL_MODES = {
      'TOP': "top",
      'BOTTOM': "bottom"
    };
    this.observer = null;
    this.currentScrollMode = this.SCROLL_MODES.BOTTOM;
    this.elementsSwapped = this.sliderSize;
  }
  
  shouldAddInlineLoader = () => {
    return this.state.loading && this.state.data.length != 0;
  }

  renderList = () => {
    const list = []
    const {data} = this.state;
    for(let i =0 ; i < this.sliderSize; i++) {
      list.push(
        <li
        key={data[i].name} 
        id={i === 0 ? this.SCROLL_MODES.TOP : i === (this.sliderSize - 1) ? this.SCROLL_MODES.BOTTOM : ''}
        className="list-item-wrapper visible-hidden"
        ref={this.getReference(i)}>
          {
            this.props.getListItemDOM(data[i], i)
          }
        </li>
      );
    }
    if (this.shouldAddInlineLoader()) {
      const el = <li key="loading" id="loader" className="list-item-wrapper">
        {
          this.props.getLoadingUI()
        }
      </li>;
      this.currentScrollMode === this.SCROLL_MODES.BOTTOM ? list.push(el) : list.unshift(el);
    }
    return list;
  }
  positionElementsBottom = (childrenNodes) => {
    let wrapperNewHeight = 0;
    childrenNodes.forEach((el, index, arr) => {
      if (this.sliderSize - this.elementsSwapped <= index) {
        const {selfHeight, offset} = this.getPosition(arr, index);
        el.style.transform = `translateY(${offset}px)`;
        wrapperNewHeight = selfHeight + offset;
        el.classList.remove("visible-hidden");
      }
    });
    return wrapperNewHeight;
  }

  positionElementsTop = (childrenNodes) => {
    let  i = childrenNodes.length - 1;
    while (i >= 0) {
      if (this.elementsSwapped > i) {
        const el = childrenNodes[i];
        const {offset} = this.getPosition(childrenNodes, i);
        el.style.transform = `translateY(${offset}px)`;
        el.classList.remove("visible-hidden");
      }
      i--;
    }
  }

  newHeightNeeded = (rootRef, newHeight) => {
    const height = +rootRef.style.height.slice(0, -2);
    return height < newHeight;
  }

  positionElements = () => {
    if (this.rootRef.current) {
      const rootRef = this.rootRef.current;
      const currentScrollMode = this.currentScrollMode;
      requestAnimationFrame(() => {
        const childrenNodes = Array.from(rootRef.children);
        let wrapperNewHeight = 0;
        if (this.currentScrollMode === this.SCROLL_MODES.BOTTOM) {
          wrapperNewHeight = this.positionElementsBottom(childrenNodes);   
        } else {
          this.positionElementsTop(childrenNodes);   
        }
        if (currentScrollMode === this.SCROLL_MODES.BOTTOM && this.newHeightNeeded(rootRef, wrapperNewHeight)) {
          rootRef.style.height = wrapperNewHeight + "px";
        }
        this.attachObserver();
        });
    }
  }
  async componentDidMount() {
    const {data, isLast} = await this.props.getRangeData(this.boundary.start, this.boundary.end);
    this.setDynamicDataToState(data, isLast);
  }
  componentDidUpdate() {
    this.positionElements();
    if (!this.observer) {
      this.initiateObserver();
      this.setWrapperOffset(); 
    }
  }
  setWrapperOffset = () => {
    this.wrapperOffset = this.rootRef.current ? this.rootRef.current.getBoundingClientRect().top : 0;
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
    res.offset = (+style.split("(")[1].trim().slice(0, -3)) + 
      (isBottomScroll ?  arr[i].getBoundingClientRect().height : -arr[index].getBoundingClientRect().height);
    return res;
  }

  getTransformY = (dom) => {
    const style = dom.style.transform;
    if (!style || !style.length) return 0;
    return +style.split("(")[1].trim().slice(0, -3);
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

  getTopNextElements = async (elementsToBeSwapped) => {
    if (this.boundary.start == 0) return;
    this.elementsSwapped = 1;
    this.setCurrentScrollMode(this.SCROLL_MODES.TOP);
    this.setState({loading: true});
    elementsToBeSwapped -= 1;
    const dataIndex = this.props.dataIndex;
    const _stateData = this.state.data;
    const _fetchEnd = _stateData[0][dataIndex];
    const _fetchStart = Math.max(0, _fetchEnd - elementsToBeSwapped);
    let {data} = await this.props.getRangeData(_fetchStart, _fetchEnd);
    if (data.length === 0) {
      this.setState({loading: false});
      this.elementsSwapped = 0;
    } else {
        const isFirst = data[0][dataIndex] === 0;
        if (isFirst) {
          elementsToBeSwapped = data.length;
        }
        data = [...data, ...this.state.data.slice(0, this.sliderSize - elementsToBeSwapped)];
        const _start = data[0][dataIndex];
        const _end = data[data.length - 1][dataIndex] + 1;

        if (this.isUpdateNeeded(_start, _end)) {
          this.updateState(_start, _end, data);
          this.elementsSwapped = elementsToBeSwapped;           
        }
    }
  }
  getOutOfViewportElementsTop = () => {
    if(this.rootRef.current) {
      let i = 0;
      const thresholdHeight = document.scrollingElement.scrollTop - this.rootRef.current.clientTop + window.innerHeight - this.wrapperOffset;
      const children = Array.from(this.rootRef.current.children);
      for (i = children.length - 1; i >=0; i--) {
        if (thresholdHeight >= this.getTransformY(children[i])) {
          break;
        } 
      }
      i > 0 && this.getTopNextElements(children.length - i);
    }
  }

  getBottomNextElements = async (elementsToBeSwapped) => {
    this.setCurrentScrollMode(this.SCROLL_MODES.BOTTOM);
    this.elementsSwapped = 0;
    this.setState({loading: true});
    elementsToBeSwapped -= 1;
    const dataIndex = this.props.dataIndex;
    const _stateData = this.state.data;
    const _fetchStart = _stateData[_stateData.length - 1][dataIndex] + 1;
    const _fetchEnd = _fetchStart + elementsToBeSwapped;

    let {data, isLast} = await this.props.getRangeData(_fetchStart, _fetchEnd);
    if (data.length === 0) {
      this.setState({loading: false});
      this.elementsSwapped = 0;
    } else {
      if (isLast) {
        elementsToBeSwapped = data.length;
      }
      data = [...this.state.data.slice(elementsToBeSwapped), ...data];
      const _start = data[0][dataIndex];
      const _end = data[data.length - 1][dataIndex] + 1;

      if (this.isUpdateNeeded(_start, _end)) {
        this.updateState(_start, _end, data);
        this.elementsSwapped = elementsToBeSwapped;           
      }
    }
  }

  getOutOfViewportElementsBottom = () => {
    if(this.rootRef.current) {
      let i = 0;
      const thresholdHeight = document.scrollingElement.scrollTop - this.wrapperOffset;
      const children = Array.from(this.rootRef.current.children);
      for (i=0; i < children.length; i++) {
        if (thresholdHeight <= this.getTransformY(children[i]) + children[i].getBoundingClientRect().height) {
          break;
        } 
      }
      i > 0 && this.getBottomNextElements(i);
    }
  }

  getOutOfViewportElements = (mode) => {
    if (mode === this.SCROLL_MODES.TOP) {
      this.getOutOfViewportElementsTop(mode);
    } else if (mode === this.SCROLL_MODES.BOTTOM) {
      this.getOutOfViewportElementsBottom(mode);
    }
  }

  isUpdateNeeded = (start, end) => {
    if (start < 0 || start > end || end < start || 
      (start === this.boundary.start && end === this.boundary.end)) return false; 
    return true;
  }

  setCurrentScrollMode = (mode) => this.currentScrollMode = mode;

  updateState = (start, end, dynamicData) => {
    this.resetObservation();
    this.boundary = {
      start: start,
      end: end
    };
    this.setState({data: dynamicData, loading: false});
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
    else if (index === this.sliderSize - 1) return this.bottomRef;
  }

  setDynamicDataToState = (data, isLast) => {
    this.setState({data: data, loading: false, isLast, addNewHeight: true});
  }

  render () {
    const {data, loading} = this.state;
    return (
      <div className="App">
        <p>Dynamic</p>
        {
          data.length === 0 && loading ?
          this.props.getLoadingUI() : 
          <ul className="list-wrapper"
          ref={this.rootRef}>
            {
              this.renderList()
            }
          </ul>
        }
        
      </div>
    );
  }
}

InfiniteScroll.propTypes = {
  sliderSize: Proptypes.number,
  dataIndex: Proptypes.string,
  getRangeData: Proptypes.func,
  getListItemDOM: Proptypes.func,
  getLoadingUI: Proptypes.func
}

export default InfiniteScroll;
