import React from 'react';

import { StyleSheet, View, StatusBar, PanResponder, Animated, Easing, TextInput } from 'react-native';

// Local imports
import MeasuredView from './MeasuredView';

//import { SafeAreaView } from 'react-navigation';
// Paper
import { DefaultTheme, Portal, Chip, withTheme, Paragraph } from "react-native-paper";

"use strict";

class TagContainer extends React.Component {
  static DefaultProps = {
    preview: 'false',
  }

  constructor(props) {
    super(props);
    
    // temp
    this.state = {
      panX: new Animated.Value(0),
      panY: new Animated.Value(0),
      dragElem: undefined,
      hitElem: undefined,
      topLevelView: undefined,
      caret: undefined,
    };
    this.tagPositions = {};

    // Pan gesture is used to move tags from place to place
    // The tags are Measured and hit-tested manually, since the tags
    // cannot be moved when in a flex-box, and also cannot be moved
    // in the visual tree without losing the gesture. (Possible bug: 
    // terminate/release is not called)
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Ugh. The gesture responder chain is all sorts of inadequate.
        // Just deal with this later.
        var dist = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        return (
          this.state.hitElem != undefined && 
          this.tagPositions[this.state.hitElem] != undefined && 
          dist > 16 
        );
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        // gestureState.d{x,y} will be set to zero now
        console.log("Granted...");

        var idx = this.props.items.indexOf(this.state.hitElem);

        // Bind values
        var x = evt.nativeEvent.pageX;
        var y = evt.nativeEvent.pageY;

        console.log("Index of " + this.state.hitElem + " is " + idx);

        this.setState({dragElem: this.state.hitElem, items:this.props.items, fingerX: 0, fingerY: 0},
        () => {
          var tagPosition = this.tagPositions[this.state.dragElem];
          var tagXOffset = new Animated.Value(-tagPosition.width / 2);
          var tagYOffset = new Animated.Value(-tagPosition.height / 2);
          this.state.panX.setValue(x);
          this.state.panY.setValue(y);

          // Translate upwards so you can see what you're dragging
          var pop = new Animated.Value(0);
          Animated.timing(
            pop,
            {
              toValue: -70,
              duration: 300,
              easing: Easing.inOut(Easing.sin),
            }
          ).start();

          var expand = new Animated.Value(1.0);
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

          var dragItem =             
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
              }]}>{this.state.dragElem}</Chip>

          // TODO: Is this OK?
          this.setState({topLevelView: dragItem});
        });
      },
      onPanResponderMove: Animated.event([
        {nativeEvent: {pageX: this.state.panX, pageY: this.state.panY}, }, 
        null],
        {listener: (evt, gestureState) => {
          var swapTag = this.closestTest(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          let tagPosition = this.tagPositions[swapTag.closest];
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
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Release...");

        let {closest, side} = this.state.swapTag;

        if (closest != this.state.dragElem) {
          let items = this.props.items.slice(0);
          var idx = items.indexOf(this.state.dragElem);
          items.splice(idx, 1);
          let closestIdx = items.indexOf(closest);
          items.splice(closestIdx+side, 0, this.state.dragElem);
          this.props.onReorderItems(items);
        }

        this.setState({
          dragElem: undefined, 
          hitElem: undefined,
          closest: undefined, 
          topLevelView: undefined,
          swapTag: undefined,
          caret: undefined,
        });
        // Gesture succeeded, so figure out where to put it in the list.
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("Terminate...");
        this.setState({
          dragElem: undefined, 
          hitElem: undefined,
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
    // TODO: Padding and margins don't stack on the edges of the
    // buttons, so we need a smarter fat-fingers test.
    if (StatusBar.currentHeight) {
      y += StatusBar.currentHeight;
    }

    var centerX = x + width / 2.0;
    var centerY = y + height / 2.0; 

    //console.log("Tag dimension for " + tag + " is " + screenX + " " + screenY + " " + width + "x" + height);
    this.tagPositions[tag] = {x, y, centerX, centerY, width, height, upToDate: true};
  }

  closestTest = (screenX, screenY) => {
    // Find closest to center of each tag. This has implications for long
    // tags next to short tags, with a selection bias towards the smaller.
    var closestTag = Number.MAX_SAFE_INTEGER;
    var closest = "";
    var side = 0;

    // offset Y so we can more easily see where it's being dropped
    let safeScreenY = screenY - 40;

    for (var key in this.tagPositions) {
      var val = this.tagPositions[key];
      var distX = val.centerX - screenX;
      var distY = val.centerY - safeScreenY;
      var dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < closestTag) {
        closestTag = dist;
        closest = key;
        if (distX > 0) {
          side = 0;
        } else {
          side = 1;
        }
      }
    };

    return {closest, side};
  }

  render() {
    let elementView = null;

    if (this.props.preview) {
      elementView = ({text, style}) => <View key={text} collapsable={false}><Paragraph style={style}>#{text} </Paragraph></View>;
    } else {
      elementView = ({text, style}) =>
      <View key={text} collapsable={false}>
      <MeasuredView
          onStartShouldSetResponder={() => {this.setState({hitElem: text}); return true;}}
          setDimensions={this.setTagDimensions} tag={text}>
        <Chip
          style={[styles.tag, this.state.dragElem === text && styles.movingTag]} 
          responder={() => {}}
          onClose={() => this.props.onRemoveItem(text)}>
            {text}
        </Chip>
      </MeasuredView>
      </View>
    }

    return (
      <View style={this.props.style} {...this._panResponder.panHandlers}>
        <View style={styles.flextainer}>
          {
            this.props.items && this.props.items.map(elementView)
          }
        </View>
        <Portal>
          {this.state.topLevelView}
          { this.state.caret && <View
              style={{position: 'absolute',
              top: this.state.caret.y,
              left: this.state.caret.x,
              width: 4,
              height: 36,
              backgroundColor: DefaultTheme.colors.accent,
              borderRadius: 2,
              opacity: 0.5,
          }}/> }
        </Portal>
      </View>
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
    elevation: 4,
  },
  flextainer: {
    margin: 8,
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});

export default withTheme(TagContainer);