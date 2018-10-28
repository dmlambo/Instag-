import React from 'react';
import { StyleSheet, Text, View, UIManager } from 'react-native';

// Local imports
import TagContainer from './TagContainer';
import TagNodeView from './TagNodeView'
"use strict";

// WARNING: This breaks things. Causes issues with visibility and TextViews.
// Provides CALayer-style implicit animation
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {topLevel: null};
  }

  onTopLevelViewChanged = (view) => {
    this.setState({topLevel: view});
  }

  render() {
    // On android you cannot draw outside of your view.
    // You can use setClipChildren(false), but it has performance implications.
    // To solve this, the top-level view returned by this App will pass a lambda
    // down the stack that'll be called when the Component wants to display 
    // something on top of the app. 
    return (

      /*
      <View style={styles.container}>
        <TagContainer onTopLevelViewChanged={this.onTopLevelViewChanged}/>
        {
          this.state.topLevel ? this.state.topLevel : null
        }
      </View> */
      <TagNodeView 
        title="One!" 
        data="#lorem #ipsum" 
        children={[
          {
            title: "SubOne", 
            data:"#dolor #amet", 
            children: [{title: "SubSubOne", data:"#bloo #blah", children: [{title: "har"}]}]
          },
          {
            title: "SubTwo", 
            data:"#dolor #amet", 
            children: [{title: "SubSubTwo", data:"#bloo #blah"}]
          },{
            title: "SubThree", 
            data:"#dolor #amet", 
            children: [{title: "SubSubThree", data:"#bloo #blah"}]
        }]}/>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffa',
    justifyContent: 'center',
  },
});
