import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, PanResponder, Animated, Easing } from 'react-native';

// Local imports
import TagButton from './TagButton';
import * as CommonStyles from './styles/common'

"use strict";

const AnimatedTagButton = Animated.createAnimatedComponent(TagButton);

export default class TagContainer extends React.Component {
  onAddHashtag = () => {};
  constructor(props) {
    super(props);
    
    this.onTopLevelViewChanged = this.props.onTopLevelViewChanged;
    // temp
    this.state = {
      items: ["one", "two", "kitties", "doggos", "snip", "snap", "woof", "oof", "owie"],
      panX: new Animated.Value(0),
      panY: new Animated.Value(0),
    };
    this.tagPositions = {};
    this.tagPositionsFatFinger = {};

    // Pan gesture is used to move tags from place to place
    // The tags are Measured and hit-tested manually, since the tags
    // cannot be moved when in a flex-box, and also cannot be moved
    // in the visual tree without losing the gesture. (Possible bug: 
    // terminate/release is not called)
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // If the drag happens on an element, the gesture should succeed,
        // otherwise we throw it out. This should allow parent scrollviews'
        // gestures to succeed.
        this.hitElem = this.hitTest(evt.nativeEvent.pageX, evt.nativeEvent.pageY);

        console.log("Drag element is " + this.hitElem);

        return this.hitElem != undefined;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,

      onPanResponderGrant: (evt, gestureState) => {
        // gestureState.d{x,y} will be set to zero now
        console.log("Granted...");

        var idx = this.state.items.indexOf(this.hitElem);

        console.log("Index of " + this.hitElem + " is " + idx);

        this.setState({dragElem: this.hitElem, items:this.state.items, fingerX: 0, fingerY: 0},
        () => {
          this.state.panX.setValue(0);
          this.state.panY.setValue(0);

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


          var position = this.tagPositions[this.state.dragElem];
          var dragItem =             
            this.state.dragElem &&
              <AnimatedTagButton style={{
                transform: [{scaleX: expand}, {scaleY: expand}],
                position: 'absolute',
                left: Animated.add(this.state.panX, new Animated.Value(position.screenX)),
                top: Animated.add(Animated.add(this.state.panY, new Animated.Value(position.screenY)), pop),
                width: position.width,
                height: position.height,
              }} title={this.state.dragElem}/>

          this.onTopLevelViewChanged(dragItem);
        });
      },
      onPanResponderMove: Animated.event([
        null, 
        {dx: this.state.panX, dy: this.state.panY}],
        {listener: (evt, gestureState) => {
          var closest = this.closestTest(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          this.setState({...this.state, closest});
        }}
      ),
      
      /* (evt, gestureState) => {
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        console.log("Move...");
        
        this.setState({...this.state, fingerX: gestureState.dx, fingerY: gestureState.dy});

        // We've captured a tag, now just show it hovering under the finger.
      }*/
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        console.log("Release...");

        this.setState({dragElem: undefined, items:this.state.items});
        this.onTopLevelViewChanged(null);
        // Gesture succeeded, so figure out where to put it in the list.
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("Terminate...");
        this.setState({dragElem: undefined, items:this.state.items});
        this.onTopLevelViewChanged(null);
        // Gesture was cancelled for some reason, replace the tag where it started.
      },
    });

    this.onAddHashtag = props.onAddHashtag;
  }

  setTagDimensions = (tag, screenX, screenY, width, height) => {
    // TODO: Padding and margins don't stack on the edges of the
    // buttons, so we need a smarter hit test. 
    //var pad = CommonStyles.BUTTON_SPACING;
    var pad = CommonStyles.BUTTON_PADDING;
    var sX = screenX - pad;
    var sY = screenY - pad;
    var sW = width + pad * 2;
    var sH = height + pad * 2;

    console.log("Tag dimension for " + tag + " is " + screenX + " " + screenY + " " + width + "x" + height);
    this.tagPositions[tag] = {screenX: screenX, screenY: screenY, width: width, height: height};
    this.tagPositionsFatFinger[tag] = {screenX: sX, screenY: sY, width: sW, height: sH};
  }

  hitTest = (screenX, screenY) => {
    console.log("Hit test at " + screenX + ", " + screenY);
    for (var key in this.tagPositionsFatFinger) {
      var val = this.tagPositionsFatFinger[key];
      if (screenX >= val.screenX && screenY >= val.screenY &&
          screenX <= (val.screenX + val.width) && screenY <= (val.screenY + val.height)) {
            return key;
          }
    }
    return undefined;
  }

  closestTest = (screenX, screenY) => {
    var lastY = -1;
    var lines = [];
    var idx = -1;

    // Organize the tags into lines
    for (var key in this.tagPositionsFatFinger) {
      var val = this.tagPositionsFatFinger[key];
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

    return closestKey;
  }

  render() {
    return (
      <View style={styles.container} {...this._panResponder.panHandlers}>
        <View style={styles.flextainer}>
          {
            this.state.items.map((x) => 
              <TagButton style={this.state.closest === x ? styles.closestTag : styles.tag} title={x} key={x} onClose={() => {this.onClose && this.onClose(x)}}
                setDimensions={this.setTagDimensions}/>
            )
          }
          <TouchableOpacity onPress={this.onAddHashtag}>
            <Text style={styles.addButton}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  movingTag: {
    opacity: 0.1,
    backgroundColor: '#44d'
  },
  tag: {
    backgroundColor: '#aaa'
  },
  closestTag: {
    backgroundColor: '#f55'
  },
  container: {
    width: 400,
    height: 400,
    backgroundColor: '#eee'
  },
  flextainer: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addButton: {
    fontSize: CommonStyles.BUTTON_TEXT_SIZE,
    color: '#55f',
    paddingLeft: CommonStyles.BUTTON_PADDING,
    paddingRight: CommonStyles.BUTTON_PADDING,
  },
});