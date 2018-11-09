import React from 'react';

import { 
  ActivityIndicator,
  Clipboard, 
  Animated, 
  Easing, 
  StyleSheet,
  LayoutAnimation, 
  BackHandler, 
  ScrollView, 
  View,
  SafeAreaView,
} from 'react-native';


// Local imports
import TagNodeView from './TagNodeView';
import Settings from './Settings';
import TagContainer from './TagContainer';
import SelectionDrawer from './SelectionDrawer';

// Paper
import {
  Appbar,
  Button,
  DefaultTheme,
  Surface,
  FAB,
  Paragraph,
  Title,
  Snackbar,
  Portal,
  TouchableRipple,
} from 'react-native-paper';

"use strict";

let maxTags = 0;

function random32bit() {
  // Use pseudorandom, the odds of colliding paths is tiny.
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  let str = num.toString(16).toUpperCase();
  return '00000000'.slice(str.length) + str;
}

export default class Root extends React.Component {
  constructor(props) {
    super(props);

    this.backSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBack)

    // Selection State is populated by paths into the node data tree. ie
    // nodeData = [{path: 'foo', children: [{path: 'bar'}]}, {path: 'baz'}]
    // selectedState = [['foo', 'bar'], ['baz']] // 'foo' is not selected
    this.state = {
      shuffledTags: new Array(),
      selectionState: new Array(),
      shuffle: false,
      nodeData: null,
      undoNodeData: null,
      bottomDockSlideIn: new Animated.Value(0),
      undoSnackBarVisible: false,
      mode: 'none',
    };

    console.log("Fetching user data...");
    Settings.getParsedNodeData().then((data) => {
      console.log("Loaded user data");
      this.setState({nodeData: data});
    }, (e) => {
      console.log(e);
      console.log("Reverting to empty set.");
      console.log(Settings.InitialData);
      this.setState({nodeData: Settings.InitialData});
    });

    Settings.getSavedPreferences().then((data) => {
      maxTags = data.copyLimit; // ModX!
    });
  }

  handleBack = () => {
    if (this.state.mode == 'selection') {
      this.cancelSelection();
      return true;
    } else if (this.state.mode == 'edit') {
      this.setState({mode: 'none'});
      return true;
    }
    return false;
  }

  componentWillUnmount = () => {
    this.backSubscription && this.backSubscription.remove();
  }

  cancelSelection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({selectionState: new Array(), mode: 'none'}, () => {
      this.shuffleSelection();
      this.props.screenProps.setDrawerLock(false);
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
    this.onEditNode(path.concat(random32bit()));
  }

  onDeleteNode = (path) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let nodePath = path.pop();
    let parentNode = this.getNodeByPath(path, newState);
    let nodeIdx = parentNode.children.findIndex((value) => {
      return value.path == nodePath;
    });
    parentNode.children.splice(nodeIdx, 1);
    this.setState({nodeData: newState, undoNodeData: this.state.nodeData, undoSnackBarVisible: true}, () => {
      Settings.saveNodeData(this.state.nodeData);
    });
  }

  onEditSubmitted = (path, newItems, title) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let node = this.getNodeByPath(path, newState);

    // Early out if nothing is entered.
    if (node == undefined && newItems.length == 0 && title == undefined) {
      this.props.screenProps.setDrawerLock(false);
      return;
    }
        
    if (!node) {
      node = {
        path: path.pop(),
        children: [],
        data: newItems,
        title: title,
      }
      let parent = this.getNodeByPath(path, newState);
      parent.children.push(node);
    } else {
      node.data = newItems;
      node.title = title;
    }

    this.setState({nodeData: newState}, () => {
      Settings.saveNodeData(this.state.nodeData);
      this.props.screenProps.setDrawerLock(false);
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

  onNodeLongPress = (path) => {
    switch (this.state.mode) {
      case 'none':
      case 'selection':
        this.toggleNodeSelection(path);
        break;
      case 'edit':
        // Do nothing?
        break;
    }
  }

  onNodePress = (path) => {
    switch (this.state.mode) {
      case 'none':
        // Presumably we can't get to here.
        break;
      case 'selection':
        this.toggleNodeSelection(path);
        break;
      case 'edit':
        // Do nothing?
        break;
    }
  }

  toggleNodeSelection = (path) => {
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

    let mode = selectionState.length ? 'selection' : 'none';
    LayoutAnimation.easeInEaseOut();
    this.setState({selectionState, mode}, () => {
      this.shuffleSelection();
      this.props.screenProps.setDrawerLock(this.state.mode == 'selection');
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
    let firstNTags = this.state.shuffledTags;
    if (maxTags) {
      firstNTags = firstNTags.slice(0, maxTags);
    }
    let tagsString = firstNTags.reduce((acc, x) => {
      return acc + "#" + x.text + " ";
    }, "");
    console.log("Copying to clipboad:");
    console.log(tagsString);
    Clipboard.setString(tagsString);
    this.setState({copiedSnackbarVisible: true})
  }

  getSelectionWidget = () => {
    return (
      <SelectionDrawer open={this.state.mode == 'selection'} items={this.state.shuffledTags}/>
    );
    let quotaNode = <View/>
    let quota = this.state.shuffledTags.length;
    if (maxTags != 0) {
      if (quota > maxTags) {
        quota = maxTags;
      }
      let quotaStyle = {};
      if (quota == maxTags) {
        quotaStyle = {color: '#3f3'};
      }
      quotaNode = <Paragraph style={quotaStyle}>{quota}<Paragraph>/{maxTags}</Paragraph></Paragraph>
    }
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
    /*        <View style={{margin: 16}}>
          {
            this.state.shuffledTags.length ? this.state.shuffledTags.reduce((acc, x)=> {
                idx++;
                acc.push(<Paragraph key={idx} style={x.style}>{"#" + x.text + " "}</Paragraph>);
                return acc;
              }, new Array()) : "Selection has no tags!"
          }
        </View>
*/
    return (
      <Surface style={{opacity: this.state.bottomDockSlideIn, elevation: elevateIn, width: '100%', height: slideUp}}>
        <Button title="preview" onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          this.setState({selectionPreview: !this.state.selectionPreview})}
        }>Hello</Button>
        <TagContainer preview={this.state.selectionPreview} items={this.state.shuffledTags}/>
        <View style={styles.bottomFabContainer}>
          {quotaNode}
          <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon={this.state.shuffle ? "shuffle" : "list"} onPress={this.onShuffle}/>
          <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon="assignment" onPress={this.copyTags}/>
        </View>
      </Surface>
    );
  }

  getContentView = () => {
    if (this.state.nodeData != undefined) {
      return (
        <SafeAreaView style={{flex: 1}}>
          <ScrollView>
            <View style={{padding: 4}}>
            {
              this.state.nodeData.children &&
              this.state.nodeData.children.map((child) =>
                <TagNodeView
                  style={{margin: 4}}
                  key={child.path}
                  onEditNode={this.onEditNode}
                  onAddNode={this.onAddNode}
                  onDeleteNode={this.onDeleteNode}
                  onNodeLongPress={this.onNodeLongPress}
                  onNodePress={this.onNodePress}
                  onHighPriority={this.onHighPriorityNode}
                  mode={this.state.mode}
                  nodeData={child}
                  pathForNode={this.createPathForNode}
                  selectedPredicate={this.selectedPredicate}
                  parentPath={new Array(this.state.nodeData.path)}/>
              )
            }
            {
              this.state.mode == 'edit' &&
              <Surface style={{margin: 10, elevation: 4, borderRadius: 4, alignItems: 'center', opacity: 0.6}}>
                <TouchableRipple style={{flex: 1, marginVertical: 4}} onPress={()=>{this.onAddNode(["root"])}}>
                  <Title>Add New Section</Title>
                </TouchableRipple>
              </Surface>
            }
            </View>
          </ScrollView>
          {
            this.getSelectionWidget()
          }
        </SafeAreaView>
      );
    } else {
      return (
        <View style={{justifyContent: 'center'}}>
          <ActivityIndicator size="large" style={{padding: 32}}/>
        </View>
      );
    }
  }

  appBarModeParams = {
    none: {
      title: "Taggy McTagface",
      backgroundColor: DefaultTheme.colors.primary,
      action: () => this.props.navigation.replace("Settings"),
      icon: "settings",
    },
    selection: {
      title: "Select Tag",
      backgroundColor: DefaultTheme.colors.accent,
      action: () => this.cancelSelection(),
      icon: "cancel",
    },
    edit: {
      title: "Edit List",
      backgroundColor: DefaultTheme.colors.accent,
      action: () => this.setState({mode: 'none'}),
      icon: "cancel",
    },
  };

  render() {
    let appbarParams = this.appBarModeParams[this.state.mode];
    return (
      <View style={StyleSheet.absoluteFill}>
        <Appbar.Header style={{backgroundColor: appbarParams.backgroundColor}}>
          <Appbar.Action 
            size={30} 
            icon={appbarParams.icon}
            onPress={appbarParams.action}/>
          <Appbar.Content
            title={appbarParams.title} // TODO: Routename?
          />
          {
            this.state.mode == 'none' && 
            <Appbar.Action 
              icon={"border-color"}
              onPress={() => this.setState({mode: 'edit'})}/>
          }
        </Appbar.Header>
        {
          this.getContentView()
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
  }
}
