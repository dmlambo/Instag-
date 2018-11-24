import React from 'react';

import { 
  StyleSheet, 
  View, 
  PanResponder,
  Animated,
  ScrollView,
  Easing, 
} from 'react-native';

// Local imports
import MeasuredView from './MeasuredView';

//import { SafeAreaView } from 'react-navigation';
// Paper
import { Portal, Chip, withTheme, Paragraph } from "react-native-paper";

"use strict";

class TagContainer extends React.PureComponent {
  constructor(props) {
    super(props);
    
    // temp
    this.state = {
      panX: new Animated.Value(0),
      panY: new Animated.Value(0),
      dragElem: undefined,
      topLevelView: undefined,
      caret: undefined,
      scrollEnabled: true,
    };
    this.tagPositions = {};
    this.columns = new Array(64);

    // Pan gesture is used to move tags from place to place
    // The tags are Measured and hit-tested manually, since the tags
    // cannot be moved when in a flex-box, and also cannot be moved
    // in the visual tree without losing the gesture. (Possible bug: 
    // terminate/release is not called)
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        let shouldSet = this.hitElem != undefined && 
          this.tagPositions[this.hitElem.text] != undefined; 

        if(shouldSet) {
          this.scrollView.setNativeProps({scrollEnabled: false});
        }

        return shouldSet;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Ugh. The gesture responder chain is all sorts of inadequate.
        let dist = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        let shouldSet = this.hitElem != undefined && 
          this.tagPositions[this.hitElem.text] != undefined //&& 
          //dist > 16
        
        if(shouldSet) {
          this.scrollView.setNativeProps({scrollEnabled: false});
        }

        return shouldSet;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        // gestureState.d{x,y} will be set to zero now
        console.log("Granted...");

        this.scrollView.setNativeProps({scrollEnabled: false});
        let idx = this.props.items.indexOf(this.hitElem);

        // Bind values
        let x = evt.nativeEvent.pageX;
        let y = evt.nativeEvent.pageY;

        this.setState({dragElem: this.hitElem, items:this.props.items, fingerX: 0, fingerY: 0},
        () => {
          let tagPosition = this.tagPositions[this.state.dragElem.text];
          let tagXOffset = new Animated.Value(-tagPosition.width / 2);
          let tagYOffset = new Animated.Value(-tagPosition.height / 2);
          this.state.panX.setValue(x);
          this.state.panY.setValue(y);

          // Translate upwards so you can see what you're dragging
          let pop = new Animated.Value(0);
          Animated.timing(
            pop,
            {
              toValue: -70,
              duration: 300,
              easing: Easing.inOut(Easing.sin),
            }
          ).start();

          let expand = new Animated.Value(1.0);
          Animated.loop(
            Animated.sequence([
              Animated.timing(
                expand,
                {
                  toValue: 1.2,
                  duration: 500,
                  easing: Easing.inOut(Easing.sin),
                }
              ),
              Animated.timing(
                expand,
                {
                  toValue: 1.0,
                  duration: 500,
                  easing: Easing.inOut(Easing.sin),
                }
              ),
            ])
          ).start();

          let dragItem =             
            this.state.dragElem &&
              <Chip
                onClose={() => {}}
                style={[
                  styles.tag,
                  {
                    elevation: 15,
                    transform: [{scaleX: expand}, {scaleY: expand}],
                    position: 'absolute',
                    left: Animated.add(this.state.panX, tagXOffset),
                    top: Animated.add(Animated.add(this.state.panY, pop), tagYOffset),
                    margin: 0,
              }]}>{this.state.dragElem.text}</Chip>

          // TODO: Is this OK?
          this.setState({topLevelView: dragItem});
        });
      },
      onPanResponderMove: Animated.event([
        {nativeEvent: {pageX: this.state.panX, pageY: this.state.panY}, }, 
        null],
        {listener: (evt, gestureState) => {
          let hitElemPosition = this.tagPositions[this.hitElem.text];
          let swapTag = this.closestTest(hitElemPosition.centerX + gestureState.dx, hitElemPosition.centerY + gestureState.dy);
          
          // Probably still measuring.
          if (!swapTag) {
            return;
          }

          let tagPosition = this.tagPositions[swapTag.closest.text];
          let x = tagPosition.x - 2;
          let y = tagPosition.y;

          if (swapTag.side) {
            x += tagPosition.width;
          }

          let caret = {x, y};

          if (caret === this.state.caret && swapTag == this.state.swapTag) {
            return;
          }
          this.setState({caret, swapTag});
        }}
      ),
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Release...");

        if (this.state.swapTag) {
          let {closest, side} = this.state.swapTag;

          if (closest != this.state.dragElem) {
            let items = this.props.items.slice(0);
            let idx = items.indexOf(this.state.dragElem);
            items.splice(idx, 1);
            let closestIdx = items.indexOf(closest);
            items.splice(closestIdx+side, 0, this.state.dragElem);
            this.props.onReorderItems(items);
          }
        }

        this.hitElem = undefined;

        this.scrollView.setNativeProps({scrollEnabled: true});

        this.setState({
          dragElem: undefined, 
          closest: undefined, 
          topLevelView: undefined,
          swapTag: undefined,
          caret: undefined,
        });
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("Terminate...");
        this.hitElem = undefined;

        this.scrollView.setNativeProps({scrollEnabled: true});

        this.setState({
          dragElem: undefined, 
          closest: undefined, 
          topLevelView: undefined,
          swapTag: undefined,
          caret: undefined,
        });
        // Gesture was cancelled for some reason, replace the tag where it started.
      },
    });
  }

  setTagDimensions = (tag, x, y, width, height) => {
    let centerX = x + width / 2.0;
    let centerY = y + height / 2.0;
    let column = Math.round(y / height);
    let prevItem = this.tagPositions[tag.text];
    let newItem = {tag, x, y, centerX, centerY, width, height, column};

    this.itemHeight = height;

    if (prevItem) {
      let columnArray = this.columns[prevItem.column];
      columnArray.splice(columnArray.indexOf(prevItem), 1);
    }

    if (!this.columns[column]) {
      this.columns[column] = new Array();
    }

    this.columns[column].push(newItem);

    this.evaluateNColumns();

    this.tagPositions[tag.text] = newItem;
  }

  evaluateNColumns = () => {
    let nColumns = 0;
    this.columns.reduce((acc, x) => {
      if (x.length) {
        nColumns++;
      }
    }, null);

    this.nColumns = nColumns;
  }

  closestTest = (screenX, screenY) => {
    // Find closest to center of each tag. This has implications for long
    // tags next to short tags, with a selection bias towards the smaller.
    let closestTag = Number.MAX_SAFE_INTEGER;
    let closest = null;
    let side = 0;

    // offset Y so we can more easily see where it's being dropped
    let safeScreenY = screenY - 80;
    let column = Math.floor(safeScreenY / this.itemHeight);
    column = Math.min(Math.max(0, column), this.nColumns-1);

    let columnItems = this.columns[column];

    if (!columnItems) {
      return null;
    }

    for (let item of columnItems) {
      let dist = item.centerX - screenX;
      let absDist = Math.abs(dist);

      if (absDist < closestTag) {
        closestTag = absDist;
        closest = item.tag;
        if (dist > 0) {
          side = 0;
        } else {
          side = 1;
        }
      }
    };

    return closest ? {closest, side} : null;
  }

  render() {
    let elementView = null;

    if (this.props.preview) {
      elementView = (item, idx) => {
        if (item.cull) {
          return;
        }
        let opacityStyle = item.opacity ? {opacity: item.opacity} : {};
        let colorStyle = item.color ? {color: item.color} : {};
        let additionalStyle = this.props.stylePredicate ? 
          this.props.stylePredicate(item, idx) : {};
        return (
          <View key={item.text} collapsable={false}><Paragraph collapsable={false} style={[colorStyle, opacityStyle, additionalStyle]}>#{item.text} </Paragraph></View>
        );
      }
    } else {
      elementView = (item, idx) => {
        let text = item.text;
        let color = item.color;
        let opacity = item.opacity ? item.opacity : 1.0;
        let backgroundColor = color ? {backgroundColor: color} : {};
        return (
          <MeasuredView
              fromView={()=>this.parentView}
              key={text}
              collapsable={false}
              onStartShouldSetResponder={() => {this.hitElem = item; this.scrollView.setNativeProps({scrollEnabled: false}); return false;}}
              setDimensions={this.setTagDimensions} tag={item}>
            <Chip collapsable={false}
              style={[styles.tag, backgroundColor, {opacity}, this.state.dragElem === item && styles.movingTag]} 
              responder={() => {}}
              onClose={() => {
                if (this.props.onRemoveItem(item)) {
                  let item = this.tagPositions[text];
                  let columnArray = this.columns[item.column];
                  columnArray.splice(columnArray.indexOf(item), 1);
                  delete this.tagPositions[text];
                  this.evaluateNColumns();
                }
              }}>
                {text}
            </Chip>
          </MeasuredView>
        );
      }
    }

    return (
      <ScrollView style={this.props.style} ref={x => this.scrollView = x} contentContainerStyle={{paddingBottom: 80}}>
        <View style={styles.flextainer} {...this._panResponder.panHandlers} ref={x => this.parentView = x}>
          {
            this.props.items && this.props.items.map(elementView)
          }
          { 
            this.state.caret &&
            <View
              style={{position: 'absolute',
              top: this.state.caret.y,
              left: this.state.caret.x,
              width: 4,
              height: 36,
              backgroundColor: this.props.theme.colors.accent,
              borderRadius: 2,
              opacity: 0.5, }}
              /> 
          }
          
          {
            // Debug
            /* Object.keys(this.tagPositions).map(x => {
              item = this.tagPositions[x];
              return (
              <View 
                key={x}
                style={{
                  opacity: 0.25, 
                  backgroundColor: 'blue', 
                  position: 'absolute', 
                  width: 5, 
                  height: 5, 
                  left: item.centerX, 
                  top: item.centerY}}/>
              );
            })*/
          }
        </View>
        <Portal>
          {this.state.topLevelView}
        </Portal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  movingTag: {
    opacity: 0.25,
  },
  tag: {
    backgroundColor: '#fff',
    margin: 3,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  flextainer: {
    margin: 8,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});

export default withTheme(TagContainer);