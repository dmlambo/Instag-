import React from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, PanResponder, Animated, Easing, TextInput } from 'react-native';

// Local imports
import TagButton from './TagButton';
import * as CommonStyles from './styles/common'

// 3rd Party Imports
import Icon from 'react-native-vector-icons/Entypo';

// Paper
import { DefaultTheme, Portal, Chip, TouchableRipple, Surface, withTheme } from "react-native-paper";

"use strict";

const AnimatedChip = Animated.createAnimatedComponent(Chip);

class TagContainer extends React.Component {
  constructor(props) {
    super(props);
    
    // temp
    this.state = {
      items: this.props.items,
      panX: new Animated.Value(0),
      panY: new Animated.Value(0),
      dragElem: undefined,
      hitElem: undefined,
      topLevelView: undefined,
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
        return false;
        var dist = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        return dist > 16;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        // gestureState.d{x,y} will be set to zero now
        console.log("Granted...");

        var idx = this.state.items.indexOf(this.state.hitElem);

        // Bind values
        var x = evt.nativeEvent.pageX;
        var y = evt.nativeEvent.pageY;

        console.log("Index of " + this.state.hitElem + " is " + idx);

        this.setState({dragElem: this.state.hitElem, items:this.state.items, fingerX: 0, fingerY: 0},
        () => {
          var tagPosition = {width: 100, height: 32}; //this.tagPositions[this.state.dragElem];
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

          var tagPosition = this.tagPositions[this.state.dragElem];

          var position = {width: 100, height: 32};// this.tagPositions[this.state.dragElem];
          var dragItem =             
            this.state.dragElem &&
              <AnimatedChip style={[
                styles.tag,
                {
                  transform: [{scaleX: expand}, {scaleY: expand}],
                  position: 'absolute',
                  left: Animated.add(this.state.panX, tagXOffset),
                  top: Animated.add(Animated.add(this.state.panY, pop), tagYOffset),
                  width: position.width,
                  height: position.height,
              }]} title={this.state.dragElem}/>

          // TODO: Is this OK?
          this.setState({topLevelView: dragItem});
        });
      },
      onPanResponderMove: Animated.event([
        {nativeEvent: {pageX: this.state.panX, pageY: this.state.panY}, }, 
        null],
        {listener: (evt, gestureState) => {
          var {closest, side} = this.closestTest(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          if (closest != this.state.dragElem) {
            var idx = this.state.items.indexOf(this.state.dragElem);
            this.state.items.splice(idx, 1);
            idx = this.state.items.indexOf(closest);
            this.state.items.splice(idx+side, 0, this.state.dragElem);
            this.setState({...this.state});
          }
        }}
      ),
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Release...");

        this.setState({
          dragElem: undefined, 
          hitElem: undefined,
          closest: undefined, 
          topLevelView: undefined,
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
        });
        // Gesture was cancelled for some reason, replace the tag where it started.
      },
    });
  }

  onLayout = (nativeEvent) => {
    if (this.element != undefined) {
        console.log("Measuring tag");
        this.element.measure(this.onMeasure);
    } else {
        console.log("No reference to tag");
    }
  }

  setTagDimensions = (tag, screenX, screenY, width, height) => {
    // TODO: Padding and margins don't stack on the edges of the
    // buttons, so we need a smarter fat-fingers test.
    var centerX = screenX + width / 2.0;
    var centerY = screenY + height / 2.0; 

    //console.log("Tag dimension for " + tag + " is " + screenX + " " + screenY + " " + width + "x" + height);
    this.tagPositions[tag] = {centerX, centerY, screenX, screenY, width, height};
  }

  hitTest = (screenX, screenY) => {
    //console.log("Hit test at " + screenX + ", " + screenY);
    for (var key in this.tagPositions) {
      var val = this.tagPositions[key];
      if (screenX >= val.screenX && screenY >= val.screenY &&
          screenX <= (val.screenX + val.width) && screenY <= (val.screenY + val.height)) {
            return key;
          }
    }
    return undefined;
  }

  closestTest = (screenX, screenY) => {
/* Following code is a RTL-text-style search that finds the closest line
   first, and then the closest tag within that line, much like the carat
   positioning on Android/iOS.
    var lastY = -1;
    var lines = [];
    var idx = -1;

    // Organize the tags into lines
    for (var key in this.tagPositions) {
      var val = this.tagPositions[key];
      if (val.screenY != lastY) {
        idx++;
        lines[idx] = new Map();
        lastY = val.screenY;
      }
      lines[idx].set(key, val);
    }

    var closestLine = Number.MAX_SAFE_INTEGER;
    var closestIdx = -1;
    lines.forEach((val, idx) => {
      var any = val.values().next().value;
      var distTop = Math.abs(any.screenY - screenY);
      var distBot = Math.abs((any.screenY + any.height) - screenY);
      if (distTop < closestLine) { closestLine = distTop; closestIdx = idx; }
      if (distBot < closestLine) { closestLine = distBot; closestIdx = idx; }
    });

    // Find the closest in the line to the pan
    var closestElement = Number.MAX_SAFE_INTEGER;
    var closestKey = "";
    lines[closestIdx].forEach((val, key) => {
      var left = Math.abs(val.screenX - screenX);
      var right = Math.abs((val.screenX + val.width) - screenX);
      if (left < closestElement) {
        closestElement = left;
        closestKey = key;
      }
      if (right < closestElement) {
        closestElement = left;
        closestKey = key;
      }      
    });
    /* RTL-text-style */

    // Find closest to center of each tag. This has implications for long
    // tags next to short tags, with a selection bias towards the smaller.
    var closestTag = Number.MAX_SAFE_INTEGER;
    var closest = "";
    var side = 0;

    for (var key in this.tagPositions) {
      var val = this.tagPositions[key];
      var distX = val.centerX - screenX;
      var distY = val.centerY - screenY;
      var dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < closestTag) {
        closestTag = dist;
        closest = key;
        if (distX < 0) {
          side = 0;
        } else {
          side = 1;
        }
      }
    };

    return {closest, side};
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]} {...this._panResponder.panHandlers}>
        <View style={styles.flextainer}>
          {
            this.props.items && this.props.items.map((x) =>
              /*<TagButton 
                onLongPress={() => this.setState({topLevelview: })}
                style={this.state.dragElem === x ? styles.movingTag : styles.tag} 
                title={x} key={x} 
                onClose={() => {this.onClose && this.onClose(x)}}
                setDimensions={this.setTagDimensions}/>*/
                <Chip 
                  style={this.state.dragElem === x ? styles.movingTag : styles.tag} 
                  key={x} 
                  onPress={() => {}}
                  onClose={() => this.props.onRemoveItem(x)}>
                    {x}
                </Chip>
            )
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  movingTag: {
    backgroundColor: '#44d',
    opacity: 0.1,
    margin: 3,
    height: 32,
  },
  tag: {
    backgroundColor: '#fff',
    margin: 3,
    height: 32,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  flextainer: {
    margin: 8,
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});

export default withTheme(TagContainer);