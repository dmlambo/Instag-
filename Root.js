import React from 'react';
import { createStackNavigator } from 'react-navigation';

import { 
  ActivityIndicator,
  Clipboard, 
  Animated, 
  Easing, 
  StyleSheet,
  LayoutAnimation, 
  BackHandler, 
  ScrollView, 
  View } from 'react-native';


// Local imports
import TagNodeView from './TagNodeView';
import TagEditModal from './TagEditModal';
import Settings from './Settings';

// Paper
import {
  DefaultTheme,
  IconButton,
  Surface,
  FAB,
  Paragraph,
  Snackbar,
  Portal,
} from 'react-native-paper';

"use strict";

// TODO: Save in preferences.
let maxTags = 5;

function random32bit() {
  // Use pseudorandom, the odds of colliding paths is tiny.
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  let str = num.toString(16).toUpperCase();
  return '00000000'.slice(str.length) + str;
}

// TODO: My kingdom for type checking. Look into Flow.
const testData = {
  path: "root",
  title: "root",
  children: [
    {
      path: random32bit(),
      title: "One!",
      data: ["lorem", "ipsum", "ipsum2", "ipsum5", "ipsum6", "ipsum12", "ipsum123"],
      children: [
        {
          path: random32bit(),
          title: "SubOne", 
          data:["dolor", "amet"], 
          children: [
            {
              title: "SubSubOne", 
              data:["dolor", "amet"], 
              children: [{title: "har"}]}]
        },
        {
          path: random32bit(),
          title: "SubTwo", 
          data:["dolor", "amet"],
          children: [
            {
              path: random32bit(),
              title: "SubSubTwo", 
              data:["bloo", "blah"]}]
        },{
          path: random32bit(),
          title: "SubThree", 
          data:["dolor", "amet"],
          children: [
            {
              path: random32bit(),
              title: "SubSubThree", 
              data:["bloo", "blah"]}]
  }]}]};

class Root extends React.Component {
  static navigationOptions = ({navigation}) => {
    var selectionMode = navigation.getParam("selectionMode");
    var backgroundColor = selectionMode ? DefaultTheme.colors.accent : DefaultTheme.colors.surface; 
    var cancelSelection = navigation.getParam("cancelSelection");
    var title = selectionMode ? "Select Tags" : "Tags";
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
    // nodeData = [{path: 'foo', children: [{path: 'bar'}]}, {path: 'baz'}]
    // selectedState = [['foo', 'bar'], ['baz']] // 'foo' is not selected
    this.state = {
      shuffledTags: new Array(),
      selectionState: new Array(),
      shuffle: false,
      nodeData: null,
      undoNodeData: testData,
      bottomDockSlideIn: new Animated.Value(0),
      undoSnackBarVisible: false,
    };

    Settings.getParsedNodeData().then((data) => {
      this.setState({nodeData: data}, (prev) => {
        console.log(this.state.nodeData);
        console.log("did the thing.");
      });
    }, (e) => {
      console.log(e);
      console.log("Reverting to empty set.");
      console.log(Settings.InitialData);
      this.setState({nodeData: Settings.InitialData});
    });

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
      this.shuffleSelection();
      this.props.navigation.setParams({selectionMode: false})
    });
  }

  getNodeByPath = (path, node) => {
    let pathCopy = path.slice(0);
    let pathComponent = pathCopy.shift();

    if (pathComponent != node.path) {
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
    console.log("Path is: " + path);
    let node = this.getNodeByPath(path.slice(0), this.state.nodeData);
    this.props.navigation.push("Edit", {...node, path, onSubmitted: this.onEditSubmitted});
  }
  
  onAddNode = (path) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let node = this.getNodeByPath(path, newState);
    if (!Array.isArray(node.children)) {
      console.warn("Internal data malformed, at path " + path);
      node.children = new Array();
    }
    let child = {
      path: random32bit(),
      title: "New Section",
      children: [],
    };
    node.children.push(child);
    this.setState({nodeData: newState}, () => {
      Settings.saveNodeData(this.state.nodeData);
      this.onEditNode(path.concat(child.path))
    });
  }

  onDeleteNode = (path) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let nodePath = path.pop();
    let parentNode = this.getNodeByPath(path, newState);
    let nodeIdx = parentNode.children.find((value) => {
      return value.path == nodePath;
    })
    parentNode.children.splice(nodeIdx, 1);
    this.setState({nodeData: newState, undoNodeData: this.state.nodeData, undoSnackBarVisible: true}, () => {
      Settings.saveNodeData(this.state.nodeData);
    });
  }

  onEditSubmitted = (path, newItems, title) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let node = this.getNodeByPath(path, newState);
    if (!node.data) {
      node.data = new Array();
    }
    node.data = newItems;
    node.title = title;
    this.setState({nodeData: newState}, () => {
      Settings.saveNodeData(this.state.nodeData);
    });
  }

  onHighPriorityNode = (path) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let node = this.getNodeByPath(path, newState);
    node.highPriority = !node.highPriority;

    // If it was selected, we need to remove it from the list, and readd at the
    // beginning or end.
    var selectionState = this.state.selectionState.slice(0);
    var nodeIdx = this.state.selectionState.indexOf(path);
    
    if (nodeIdx != -1) {
      selectionState.splice(nodeIdx, 1);
      if (node.highPriority) {
        selectionState.unshift(path);
      } else {
        selectionState.push(path);
      }
    }

    this.setState({nodeData: newState, selectionState}, () => {
      Settings.saveNodeData(this.state.nodeData);
      this.shuffleSelection();
    });  
  }

  onNodeSelected = (path) => {
    var selectionState = this.state.selectionState.slice(0);
    var nodeIdx = this.state.selectionState.indexOf(path);
    
    // Flip flop selection
    if (nodeIdx == -1) {
      let node = this.getNodeByPath(path, this.state.nodeData);
      if (node.highPriority) {
        selectionState.unshift(path);
      } else {
        selectionState.push(path);
      }
    } else {
      selectionState.splice(nodeIdx, 1);
    }

    this.setState({selectionState}, () => {
      this.shuffleSelection();
      this.props.navigation.setParams({selectionMode: this.state.selectionState.length})
    });
  }

  createPathForNode = (props) => {
    return Array.prototype.concat(props.parentPath, props.nodeData.path);
  }

  selectedPredicate = (path) => {
    return this.state.selectionState.indexOf(path) != -1;
  }

  shuffle = (arr, start, end) => {
    for (let i = start; i < end; i++) {
      let startIdx = i;
      let span = end - startIdx;
      let element = startIdx + Math.floor(Math.random() * span);
      let temp = arr[i];
      arr[i] = arr[element];
      arr[element] = temp;
    }
  }

  shuffleSelection = () => {
    const highPriStyle = {color: 'red', fontWeight: 'bold'};
    const lowPriStyle = {};
    const truncatedStyle = {color: 'gray'};

    if (this.state.selectionState.length > 0) {
      // To transform the tags into a copyable string, we follow these steps:
      // 1. Remove duplicates
      // 2. Shuffle low-priority tags
      // 3. Truncate low-priority tags to shore up the numbers
      // 4. Randomize this new list
      // 5. Display high priority in one colour, low in another, and truncated a third
      let highPriIdx = 0; // For shuffling.
      let selectedData = this.state.selectionState.reduce((acc, value, idx) => {
        let node = this.getNodeByPath(value, this.state.nodeData);
        if (node.data) {
          return acc.concat(node.data.map(x => { 
            return {
              text: x, 
              style: node.highPriority ? highPriStyle : lowPriStyle
            };
          }));
        } else {
          return acc;
        }
      }, new Array());

      // Since all high priority tags are at the top of the list, this prefers them.
      let duplicatesRemoved = selectedData.reduce((acc, value) => {
        if (acc.findIndex(x => { return value.text == x.text; }) != -1) {
          return acc;
        } else {
          if (value.style == highPriStyle) highPriIdx++;
          return acc.concat(value);
        }
      }, new Array());

      if (this.state.shuffle) {
        // Shuffle high priority tags
        this.shuffle(duplicatesRemoved, 0, highPriIdx);

        // Shuffle low priority tags
        this.shuffle(duplicatesRemoved, highPriIdx, duplicatesRemoved.length);

        // Shuffle first n tags
        let truncationLength = Math.min(maxTags, duplicatesRemoved.length);
        this.shuffle(duplicatesRemoved, 0, truncationLength);
      }

      // Truncate
      for (let i = maxTags; i < duplicatesRemoved.length; i++) {
        duplicatesRemoved[i].style = truncatedStyle;
      }

      this.setState({shuffledTags: duplicatesRemoved});
    }   
  }

  onShuffle = () => {
    this.setState({shuffle: !this.state.shuffle}, (prev) => { 
      this.shuffleSelection();
    });
  }

  copyTags = () => {
    let tagsString = this.state.shuffledTags.slice(0, maxTags).reduce((acc, x) => {
      return acc + "#" + x.text + " ";
    }, "");
    console.log("Copying to clipboad:");
    console.log(tagsString);
    Clipboard.setString(tagsString);
    this.setState({copiedSnackbarVisible: true})
  }

  getSelectionWidget = () => {
    let slideUp = this.state.bottomDockSlideIn.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 180],
    });
    let elevateIn = this.state.bottomDockSlideIn.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    });

    if (this.state.selectionState.length > 0) {
      Animated.timing(
        this.state.bottomDockSlideIn,
        {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
        }).start();
    } else {
      Animated.timing(
        this.state.bottomDockSlideIn,
        {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
        }).start();
    }
    let idx = 0;
    return (
      <Surface style={{opacity: this.state.bottomDockSlideIn, elevation: elevateIn, width: '100%', height: slideUp}}>
        <Paragraph style={{margin: 16}}>
          {
            this.state.shuffledTags.length ? this.state.shuffledTags.reduce((acc, x)=> {
                idx++;
                acc.push(<Paragraph key={idx} style={x.style}>{"#" + x.text + " "}</Paragraph>);
                return acc;
              }, new Array()) : "Selection has no tags!"
          }
        </Paragraph>
        <View style={styles.bottomFabContainer}>
          <Paragraph>Limit {maxTags}</Paragraph>
          <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon={this.state.shuffle ? "shuffle" : "list"} onPress={this.onShuffle}/>
          <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon="assignment" onPress={this.copyTags}/>
        </View>
      </Surface>
    );
  }

  getContentView = () => {
    if (this.state.nodeData != undefined) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <ScrollView>
            <View style={styles.container}>
            {
              this.state.nodeData.children &&
              this.state.nodeData.children.map((child, idx) =>
                <TagNodeView
                  key={idx}
                  onEditNode={this.onEditNode}
                  onAddNode={this.onAddNode}
                  onDeleteNode={this.onDeleteNode}
                  onNodeSelected={this.onNodeSelected}
                  onHighPriority={this.onHighPriorityNode}
                  selectionMode={this.state.selectionState.length > 0}
                  nodeData={child}
                  pathForNode={this.createPathForNode}
                  selectedPredicate={this.selectedPredicate}
                  parentPath={new Array(this.state.nodeData.path)}/>
              )
            }
            </View>
            <View style={styles.fabContainer}>
              {
                this.state.selectionState.length == 0 &&
                <FAB icon="add" small onPress={()=>{this.onAddNode(["root"])}}/>
              }
            </View>
          </ScrollView>
          {
            this.getSelectionWidget()
          }
          <Portal>
            <Snackbar
              duration={3000}
              visible={this.state.undoSnackBarVisible}
              onDismiss={() => this.setState({ undoSnackBarVisible: false })}
              action={{
                label: 'Undo',
                onPress: () => {
                  this.setState({nodeData: this.state.undoNodeData, undoSnackBarVisible: false})
                },
              }}
            >
              Tags deleted
            </Snackbar>
            <Snackbar
              duration={1500}
              visible={this.state.copiedSnackbarVisible}
              onDismiss={() => this.setState({copiedSnackbarVisible: false})}
              action={{
                label: 'Dismiss',
                onPress: () => {
                  this.setState({copiedSnackbarVisible: false}, () => {
                    Settings.saveNodeData(this.state.nodeData);
                  })
                },
              }}
            >
              Tags copied to clipboard!
            </Snackbar>
          </Portal>
        </View>
      );
    } else {
      return (
        <View style={{justifyContent: 'center'}}>
          <ActivityIndicator size="large" style={{padding: 32}}/>
        </View>
      );
    }
  }
  render() {
    return (
      <View style={StyleSheet.absoluteFill}>
      {
        this.getContentView()
      }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fabContainer: {
    margin: 8,
    alignItems: 'center',
    width: '100%',
  },
  bottomFabContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bottomFab: {
    margin: 8,
  }
});

export default createStackNavigator({
  Root: { screen: Root },
  Edit: { screen: TagEditModal },
});