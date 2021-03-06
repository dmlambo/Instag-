import React from 'react';

import { 
  ActivityIndicator,
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
import SelectionDrawer from './SelectionDrawer';

// Paper
import {
  Appbar,
  Surface,
  Title,
  Snackbar,
  Portal,
  TouchableRipple,
  withTheme,
} from 'react-native-paper';

"use strict";

function random32bit() {
  // Use pseudorandom, the odds of colliding paths is tiny.
  let num = Math.floor(Math.random() * Math.pow(2, 32));
  let str = num.toString(16).toUpperCase();
  return '00000000'.slice(str.length) + str;
}

class Root extends React.Component {
  constructor(props) {
    super(props);

    this.appBarModeParams = {
      none: {
        title: "Tagerty",
        action: () => this.props.navigation.replace("Settings"),
        theme: {colors: {...props.theme.colors, primary: 'white'}},
        icon: "settings",
        rightSideActions: [
          <Appbar.Action 
            key="1"
            icon={"clear-all"}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              this.setState({mode: 'selection'})}
            }/>,
          <Appbar.Action 
            key="2"
            icon={"border-color"}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              this.setState({mode: 'edit'})}
            }/>
        ]
      },
      selection: {
        title: "Select Tags",
        action: () => {
          if (this.state.drawerExpanded)
          { 
            LayoutAnimation.easeInEaseOut();
            this.setState({drawerExpanded: false}); 
          } else { 
            this.cancelSelection()
          }},
        theme: {colors: {...props.theme.colors, primary: '#222', text: 'white'}},
        icon: () => 
          this.state.drawerExpanded ? 
          "arrow-back" : "cancel",
      },
      edit: {
        title: "Edit List",
        action: () => {
          LayoutAnimation.easeInEaseOut();
          this.setState({mode: 'none'})
        },
        theme: {colors: {...props.theme.colors, primary: '#222', text: 'white'}},
        icon: "cancel",
      },
    };  

    this.backSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBack)

    // Selection State is populated by paths into the node data tree. ie
    // nodeData = [{path: 'foo', children: [{path: 'bar'}]}, {path: 'baz'}]
    // selectedState = [['foo', 'bar'], ['baz']] // 'foo' is not selected
    this.state = {
      selectionState: new Array(),
      nodeData: null,
      undoNodeData: null,
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
      if (this.state.drawerExpanded) {
        LayoutAnimation.easeInEaseOut();
        this.setState({drawerExpanded: false});
        return true;  
      }
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

  onExpandDrawerPressed = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({drawerExpanded: !this.state.drawerExpanded});
  }

  cancelSelection = () => {
    this.selectionDrawer.selectionCancelled();
    LayoutAnimation.easeInEaseOut();
    this.setState({selectionState: new Array(), mode: 'none', drawerExpanded: false}, () => {
      this.props.screenProps.setDrawerLock(false);
    });
  }

  onEditNode = (path) => {
    console.log("Path is: " + path);
    let node = Settings.getNodeByPath(path, this.state.nodeData);
    this.props.navigation.push("Edit", {...node, path, onSubmitted: this.onEditSubmitted});
  }
  
  onAddNode = (path) => {
    this.onEditNode(path.concat(random32bit()));
  }

  onDeleteNode = (path) => {
    let oldStateJSON = JSON.stringify(this.state.nodeData);
    let newState = JSON.parse(oldStateJSON);
    let nodePath = path.pop();
    let parentNode = Settings.getNodeByPath(path, newState);
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
    let node = Settings.getNodeByPath(path, newState);

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
      let parent = Settings.getNodeByPath(path, newState);
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
    let node = Settings.getNodeByPath(path, newState);
    node.highPriority = !node.highPriority;

    // If it was selected, we need to remove it from the list, and readd at the
    // beginning or end.
    var selectionState = this.state.selectionState.slice(0);
    var nodeIdx = this.state.selectionState.indexOf(path);
    
    if (nodeIdx != -1) {

      selectionState.splice(nodeIdx, 1);
      this.selectionDrawer.selectionChanged([{path, node}], [path]);
      if (node.highPriority) {
        selectionState.unshift(path);
      } else {
        selectionState.push(path);
      }
    }

    this.setState({nodeData: newState, selectionState}, () => {
      Settings.saveNodeData(this.state.nodeData);
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
      let node = Settings.getNodeByPath(path, this.state.nodeData);
      if (node.highPriority) {
        selectionState.unshift(path);
      } else {
        selectionState.push(path);
      }
      this.selectionDrawer.selectionChanged([{path, node}]);
    } else {
      selectionState.splice(nodeIdx, 1);
      this.selectionDrawer.selectionChanged(null, [path]);
    }

    LayoutAnimation.easeInEaseOut();
    this.setState({selectionState, mode: 'selection'}, () => {
      this.props.screenProps.setDrawerLock(true);
    });
  }

  selectedPredicate = (path) => {
    return this.state.selectionState.indexOf(path) != -1;
  }

  getSelectionWidget = () => {
    return (
      <SelectionDrawer 
        open={this.state.mode == 'selection'}
        ref={x => this.selectionDrawer = x}
        onExpandPressed={this.onExpandDrawerPressed} 
        expanded={this.state.drawerExpanded} 
        selectionState={this.state.selectionState}
        nodeData={this.state.nodeData}/>
    );
  }

  getContentView = () => {
    if (this.state.nodeData != undefined) {
      return (
        <SafeAreaView style={{flex: 1}}>
          <ScrollView contentContainerStyle={{paddingBottom: 24}}>
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
                  selectedStyle={{elevation: 16, borderColor: '#111'}}
                  pathForNode={Settings.createPathForNode}
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

  render() {
    let appbarParams = this.appBarModeParams[this.state.mode];
    return (
      <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'white'}}>
        <Appbar.Header theme={appbarParams.theme}>
          <Appbar.Action 
            size={30} 
            icon={typeof appbarParams.icon == 'function' ? appbarParams.icon() : appbarParams.icon}
            onPress={appbarParams.action}/>
          <Appbar.Content
            title={appbarParams.title} // TODO: Routename?
          />
          {
            appbarParams.rightSideActions
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
        </Portal>
      </View>
    );
  }
}

export default withTheme(Root);