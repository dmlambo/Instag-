import React from 'react';
import { StyleSheet, LayoutAnimation, BackHandler } from 'react-native';
import { createStackNavigator } from 'react-navigation';

// Local imports
import TagNodeView from './TagNodeView'
import TagEditModal from './TagEditModal'

// Paper
import {
  DefaultTheme,
  IconButton,
} from 'react-native-paper';

"use strict";

// TODO: My kingdom for type checking. Look into Flow.
const testData = {
  title: "One!",
  data: ["lorem", "ipsum"],
  children: [
    {
      title: "SubOne", 
      data:["dolor", "amet"], 
      children: [
        {
          title: "SubSubOne", 
          data:["dolor", "amet"], 
          children: [{title: "har"}]}]
    },
    {
      title: "SubTwo", 
      data:["dolor", "amet"],
      children: [
        {
          title: "SubSubTwo", 
          data:["bloo", "blah"]}]
    },{
      title: "SubThree", 
      data:["dolor", "amet"],
      children: [
        {
          title: "SubSubThree", 
          data:["bloo", "blah"]}]
}]};

class Root extends React.Component {
  static navigationOptions = ({navigation}) => {
    var selectionMode = navigation.getParam("selectionMode");
    var backgroundColor = selectionMode ? DefaultTheme.colors.accent : DefaultTheme.colors.surface; 
    var cancelSelection = navigation.getParam("cancelSelection");
    var openDrawer = navigation.getParam("openDrawer");
    var title = selectionMode ? "Select Tags" : "";
    return ({ 
      headerStyle: {
        backgroundColor,
      },
      title,
      headerLeft: (
        selectionMode ? 
          <IconButton icon="cancel" size={30} onPress={cancelSelection}/> :
          <IconButton icon="menu" size={32} onPress={navigation.openDrawer}/>
      )
      
    });
  };

  constructor(props) {
    super(props);

    this.backSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBack)

    // This seems wrong.
    this.props.navigation.setParams({
      cancelSelection: this.cancelSelection,
    });

    // Selection State is populated by paths into the node data tree. ie
    // nodeData = [{title: 'foo', children: [{title: 'bar'}]}, {title: 'baz'}]
    // selectedState = [['foo', 'bar'], ['baz']] // 'foo' is not selected
    // Each array is filtered by title and pruned before being handed to the child
    this.state = {
      selectionState: new Array(),
    };
  }

  handleBack = () => {
    if (this.state.selectionState.length > 0) {
      this.cancelSelection();
      return true;
    }
    return false;
  }

  componentWillUnmount = () => {
    this.backSubscription && this.backSubscription.remove();
  }

  cancelSelection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({selectionState: new Array()}, () => {
      this.props.navigation.setParams({selectionMode: false})
    });
  }

  onEditNode = (items, title) => {
    this.props.navigation.push("Edit", {items, title});
  }

  onNodeSelected = (path) => {
    var selectionState = this.state.selectionState.slice(0);
    var nodeIdx = this.state.selectionState.indexOf(path);
    
    // Flip flop selection
    if (nodeIdx == -1) {
      selectionState.push(path);
    } else {
      selectionState.splice(nodeIdx, 1);
    }

    this.setState({selectionState}, () => {
      this.props.navigation.setParams({selectionMode: this.state.selectionState.length})
    });
  }

  createPathForNode = (props) => {
    return Array.prototype.concat(props.parentPath, props.nodeData.title);
  }

  selectedPredicate = (path) => {
    return this.state.selectionState.indexOf(path) != -1;
  }

  render() {
    return (
      <TagNodeView
        onEditNode={this.onEditNode}
        onNodeSelected={this.onNodeSelected}
        selectionMode={this.state.selectionState.length > 0}
        nodeData={testData}
        pathForNode={this.createPathForNode}
        selectedPredicate={this.selectedPredicate}
        parentPath={new Array()}/>
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

export default createStackNavigator({
  Root: { screen: Root },
  Edit: { screen: TagEditModal },
});