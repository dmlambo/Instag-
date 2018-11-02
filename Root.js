import React from 'react';
import { StyleSheet, LayoutAnimation, BackHandler, ScrollView, View } from 'react-native';
import { createStackNavigator } from 'react-navigation';

// Local imports
import TagNodeView from './TagNodeView'
import TagEditModal from './TagEditModal'
import CopyModal from './CopyModal'

// Paper
import {
  DefaultTheme,
  IconButton,
  FAB,
} from 'react-native-paper';

"use strict";

// TODO: My kingdom for type checking. Look into Flow.
const testData = {
  title: "root",
  children: [
    {
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
  }]}]};

class Root extends React.Component {
  static navigationOptions = ({navigation}) => {
    var selectionMode = navigation.getParam("selectionMode");
    var backgroundColor = selectionMode ? DefaultTheme.colors.accent : DefaultTheme.colors.surface; 
    var cancelSelection = navigation.getParam("cancelSelection");
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
      nodeData: testData,
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

  getNodeByPath = (path, node) => {
    console.log("Path: " + path);
    console.log("title: " + node.title);
    let pathCopy = path.slice(0);
    let pathComponent = pathCopy.shift();
    console.log("PathComponent: " + pathComponent);

    if (pathComponent != node.title) {
      return null;
    }

    if (!pathCopy.length) {
      return node;
    }

    for (i in node.children) {
      let childNode = this.getNodeByPath(pathCopy, node.children[i]);
      if (childNode) return childNode;
    }

    return null;
  }

  onEditNode = (path) => {
    let node = this.getNodeByPath(path.slice(0), this.state.nodeData);
    this.props.navigation.push("Edit", {...node, path, onSubmitted: this.onEditSubmitted});
  }
  
  onAddNode = (path) => {
    let node = this.getNodeByPath(path.slice(0), this.state.nodeData);
    this.props.navigation.push("Add", {...node, path, onSubmitted: this.onEditSubmitted});
  }

  onDeleteNode = (path) => {

  }

  onEditSubmitted = (path, newItems) => {
    console.log("New items submitted to " + path + ": " + newItems);
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    console.log(oldStateJSON);
    this.getNodeByPath(path, newState).data = newItems;
    this.setState({nodeData: newState});
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
      <ScrollView>
        <View style={styles.container}>
        {
          this.state.nodeData.children &&
          this.state.nodeData.children.map((child, idx) =>
            <TagNodeView
              key={idx}
              onEditNode={this.onEditNode}
              onNodeSelected={this.onNodeSelected}
              selectionMode={this.state.selectionState.length > 0}
              nodeData={child}
              pathForNode={this.createPathForNode}
              selectedPredicate={this.selectedPredicate}
              parentPath={new Array(this.state.nodeData.title)}/>
          )
        }
          <View style={styles.fabContainer}>
          {
            this.state.selectionState.length == 0 &&
            <FAB icon="add" onPress={()=>{}}/>
          }
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  fabContainer: {
    margin: 8,
    alignItems: 'center',
    width: '100%',
  }
});

export default createStackNavigator({
  Root: { screen: Root },
  Edit: { screen: TagEditModal },
  Copy: { screen: CopyModal },
});