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
     * isDataStatic: Is all the data to be rendered available at before initial render
     * boundary: internal variable to point to current subset location of actual data which is shown
     * totalStaticData: totalStaticData original array where all the data is sitting
     * snapshot: Before update capture the current state
     * elementsSwapped: Count of how many elements needs to be swapped
     */
    this.topRef = createRef();
    this.bottomRef = createRef();
    this.rootRef = createRef();
    this.wrapperOffset = null;
    this.sliderSize = this.props.sliderSize || N;
    this.isDataStatic = this.props.isDataStatic || false;
    this.boundary = {
      start: 0,
      end: this.sliderSize
    };
    this.totalStaticData = this.isDataStatic ? this.props.totalStaticData : null;
    this.state = {
      data: this.isDataStatic ? this.totalStaticData.slice(this.boundary.start, this.boundary.end) 
        : [],
      loading: !this.isDataStatic,
      addNewHeight: this.isDataStatic
    };
    this.SCROLL_MODES = {
      'TOP': "top",
      'BOTTOM': "bottom"
    };
    this.observer = null;
    this.currentScrollMode = this.SCROLL_MODES.BOTTOM;
    this.elementsSwapped = this.props.isDataStatic ? this.sliderSize : 0;
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
      )
    }
    return list;
  }
  positionElements = () => {
    if (this.rootRef.current) {
      const rootRef = this.rootRef.current;
      const currentScrollMode = this.currentScrollMode;
      requestAnimationFrame(() => {
        const childrenNodes = Array.from(rootRef.children);
        let wrapperNewHeight = 0;
        if (this.currentScrollMode == this.SCROLL_MODES.BOTTOM) {
          childrenNodes.forEach((el, index, arr) => {
            if (this.sliderSize - this.elementsSwapped <= index) {
              const {selfHeight, offset} = this.getPosition(arr, index);
              el.style.transform = `translateY(${offset}px)`;
              wrapperNewHeight = selfHeight + offset;           
              el.classList.remove("visible-hidden");
            }
          });
        } else {
          for(let i = childrenNodes.length - 1; i >= 0; i--) {
            if (this.elementsSwapped > i) {
              const el = childrenNodes[i];
              const {offset} = this.getPosition(childrenNodes, i);
              el.style.transform = `translateY(${offset}px)`;
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
  async componentDidMount() {
    if (this.isDataStatic) {
      this.positionElements();
      this.initiateObserver();
      this.setWrapperOffset();
    } else {
      const {data, isLast} = await this.props.getRangeData(this.boundary.start, this.boundary.end);
      this.setDynamicDataToState(data, isLast);
    }
  }
  componentDidUpdate() {
    this.positionElements();
    this.initiateObserver();
    this.setWrapperOffset(); 
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
      i = children.length - 1 - i;
      i = Math.min(i, this.boundary.start);
      if (i > 0) {
        if (this.boundary.start == 1) {
          const _start = 0;
          const _end = this.sliderSize;
          if (this.isUpdateNeeded(_start, _end)) {
            this.updateState(0, this.sliderSize, mode);
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
  }

  getBottomNextElememts = (elementsToBeSwapped, mode) => {
    elementsToBeSwapped = Math.min(elementsToBeSwapped, this.totalStaticData.length - 1 - this.boundary.end);
    if (elementsToBeSwapped > 0) {
      if (this.boundary.end == this.totalStaticData.length - 2) {
        const _start = this.totalStaticData.length - this.sliderSize;
        const _end = this.totalStaticData.length;
        if (this.isUpdateNeeded(_start, _end)) {
          this.updateState(_start, _end, mode);
          this.elementsSwapped = 2;
        }
      } else {
        const _start = this.boundary.start + elementsToBeSwapped - 1;
        const _end = this.boundary.end + elementsToBeSwapped - 1;
        if (this.isUpdateNeeded(_start, _end)) {
          this.updateState(_start, _end, mode);
          this.elementsSwapped = elementsToBeSwapped;  
        }
      }
    }
  }

  getCommonItemsIndexInArray = (arrA, arrB, id) => {
    let i = 0, j = 0;
    for(i = 0; i < arrA.length; i++) {
      if (arrA[i][id] == arrB[0][id]) break;
    }
    while(arrA[i][id] == arrB[j][id]) {
      j++;
    }
    return j;
  }


  getBottomNextElementsPromise = async (elementsToBeSwapped) => {
    this.setState({loading: true});
    const {data, isLast} = await this.props.getRangeData(this.boundary.start + elementsToBeSwapped, this.boundary.end + elementsToBeSwapped);
    if (data.length == 0) {
      this.setState({loading: false});
      this.elementsSwapped = 0;
    } else {
        const dataIndex = this.props.dataIndex;
        elementsToBeSwapped = (elementsToBeSwapped, data.length - this.getCommonItemsIndexInArray(this.state.data, data, dataIndex));
        if (elementsToBeSwapped > 0) {
          if (isLast) {
            const _start = data[data.length - 1][dataIndex] + 1 - this.sliderSize;
            const _end = data[data.length - 1][dataIndex] + 1;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(_start, _end, mode);
              this.elementsSwapped = 2;
            }
          } else {
            const _start = this.totalStaticData.length - this.sliderSize;
            const _end = this.totalStaticData.length;
            if (this.isUpdateNeeded(_start, _end)) {
              this.updateState(_start, _end, mode);
              this.elementsSwapped = 2;
            }
          }
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
      this.isDataStatic ? this.getBottomNextElememts(i, this.SCROLL_MODES.BOTTOM) 
        : this.getBottomNextElementsPromise(i, this.SCROLL_MODES.BOTTOM);
    }
  }

  getOutOfViewportElements = (mode) => {
    if (mode === this.SCROLL_MODES.TOP) {
      this.getOutOfViewportElementsTop();
    } else if (mode === this.SCROLL_MODES.BOTTOM) {
      this.getOutOfViewportElementsBottom();
    }
  }

  isUpdateNeeded = (start, end) => {
    if (start < 0 || start > end || end < start || end > this.totalStaticData.length 
      || (start == this.boundary.start && end == this.boundary.end)) {
      return false;
    }
    return true;
  }
  updateState = (start, end, mode) => {
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
    const data = this.totalStaticData.slice(start, end).map((i) => {
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
    else if (index === this.sliderSize - 1) return this.bottomRef;
  }

  setDynamicDataToState = (data, isLast) => {
    this.setState({data: data, loading: false, isLast});
  }

  render () {
    const {data, loading} = this.state;
    return (
      <div className="App">
        {
          this.isDataStatic ? 
          <ul className="list-wrapper"
          ref={this.rootRef}>
            {this.renderList()}
          </ul>
          :
          loading ?
          this.props.getLoadingUI() : 
          <ul className="list-wrapper"
          ref={this.rootRef}>
            {this.renderList()}
          </ul>
        }
        
      </div>
    );
  }
}

InfiniteScroll.propTypes = {
  sliderSize: Proptypes.number,
  dataIndex: Proptypes.string,
  isDataStatic: Proptypes.bool,
  totalStaticData: Proptypes.array,
  getRangeData: Proptypes.func,
  getListItemDOM: Proptypes.func,
  getLoadingUI: Proptypes.func
}

export default InfiniteScroll;
