import React from 'react';

import {
  ActivityIndicator,
  Clipboard,
  StyleSheet,
  View, 
  Text,
  ScrollView,
} from 'react-native';

import {
  FAB,
  Paragraph,
  Portal,
  Snackbar,
  Surface,
} from 'react-native-paper';

import DraggableDrawer from './DraggableDrawer';
import TagContainer from './TagContainer';
import Settings from './Settings';
import TagEditorView from './TagEditorView';

export default class SelectionDrawer extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      shuffle: false,
      maxTags: -1, // Show activity spinner until it's loaded?
      shuffledTags: new Array(),
      copiedSnackbarVisible: false,
    }

    this.addedItems = new Array();
    this.selectedItems = new Array();

    // Keep in mind this is only the initial value, we don't save this number
    // when the user changes it in the selection drawer; they need to change
    // the preference from Settings.
    Settings.getSavedPreferences().then((data) => {
      console.log("Loaded stored copy limit: " + data.copyLimit);
      this.setState({maxTags: parseInt(data.copyLimit)}); // TODO: ModX!
    });
  }

  // Must be called to order a reshuffle.
  selectionChanged(added, removed) {
    const highPriColor = 'red';
    const lowPriColor = '';

    if (removed) {
      for (let path of removed) {
        this.selectedItems = this.selectedItems.filter(x => x.path != path);
      }
    }

    if (added) {
      for (let {path, node} of added) {
        if (node.data) {
          let newItems = node.data.map(x => {
            return {
              text: x, 
              color: node.highPriority ? highPriColor : lowPriColor,
              path: path,
              highPriority: node.highPriority,
            };
          });
          if (node.highPriority) {
            this.selectedItems = newItems.concat(this.selectedItems);
          } else {
            this.selectedItems = this.selectedItems.concat(newItems);
          }
        }
      }
    }

    let shuffledTags = this.getShuffledSelection(this.addedItems.concat(this.selectedItems), this.state.shuffle, this.state.maxTags);
    this.setState({shuffledTags});
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

  getShuffledSelection = (selectedItems, shuffle, maxTags) => {
    let highPriIdx = 0; // So we can shuffle low-pri first.

    // Since all high priority and added tags are at the top of the list, this prefers them.
    let duplicatesRemoved = selectedItems.reduce((acc, value) => {
      if (acc.findIndex(x => { return value.text == x.text; }) != -1) {
        return acc;
      } else {
        if (value.highPriority) highPriIdx++;
        return acc.concat(value);
      }
    }, new Array());

    if (shuffle) {
      // Shuffle high priority tags
      this.shuffle(duplicatesRemoved, 0, highPriIdx);

      // Shuffle low priority tags
      this.shuffle(duplicatesRemoved, highPriIdx, duplicatesRemoved.length);

      // Shuffle first n tags
      let truncationLength = Math.min(maxTags, duplicatesRemoved.length);
      this.shuffle(duplicatesRemoved, 0, truncationLength);
    }

    return duplicatesRemoved;
  }

  onShuffle = () => {
    this.setState({shuffle: !this.state.shuffle}, () => {
      // Lets order up another update shall we?
      this.selectionChanged();
    });
  }

  copyTags = () => {
    let firstNTags = this.state.shuffledTags;
    if (this.state.maxTags) {
      firstNTags = firstNTags.slice(0, this.state.maxTags);
    }
    let tagsString = firstNTags.reduce((acc, x) => {
      return acc + "#" + x.text + " ";
    }, "");
    console.log("Copying to clipboad:");
    console.log(tagsString);
    Clipboard.setString(tagsString);
    this.setState({copiedSnackbarVisible: true})
  }

  onReorderItems = (shuffledTags) => {
    this.setState({shuffledTags});
  }

  onRemove = (item) => {
    let newItems = this.state.shuffledTags.slice(0);
    let idx = newItems.indexOf(item);
    let addedIdx = this.addedItems.indexOf(item);

    if (addedIdx > -1) {
      newItems.splice(idx, 1);
      this.addedItems.splice(addedIdx, 1);
      this.setState({shuffledTags: newItems});
      return true;
    } else {
      let curItem = newItems[idx]
      curItem.cull = !curItem.cull;
      if (curItem.cull) {
        curItem.opacity = 0.3;
      } else {
        curItem.opacity = 1.0;
      }
      this.setState({shuffledTags: newItems});
      return false;
    }
  }

  onAddItems = (items) => {
    let newItems = items.map(x => { return {text: x, color: '#ccf', highPriority: true} });
    this.addedItems = this.addedItems.concat(newItems);
    this.setState({
      shuffledTags: newItems.concat(this.state.shuffledTags),
      editModalVisible: false,
    });
  }

  onReorderItems = (items, callback) => {
    // Cannot use layoutanimation, since measure gives you the pre-animated
    // positions.
    //LayoutAnimation.easeInEaseOut();
    this.setState({shuffledTags: items}, callback);
  };

  onCycleMaxTags = () => {
    let idx = Settings.maxTagValues.indexOf(this.state.maxTags);
    idx = (idx + 1) % Settings.maxTagValues.length;
    this.setState({maxTags: Settings.maxTagValues[idx]});
  }

  render() {
    let quota = this.state.shuffledTags && 
      this.state.shuffledTags.length > this.state.maxTags ? this.state.maxTags : this.state.shuffledTags.length;

    let previewComponents = 
      <TagContainer 
        preview
        stylePredicate={(item, idx) => idx && this.state.maxTags > 0 && idx >= this.state.maxTags && {opacity: 0.1}}
        style={{width: '100%', height: '100%'}}
        items={this.state.shuffledTags} 
        onReorderItems={() => {}}/>
    let chipComponents = 
      <TagEditorView 
        style={{width: '100%', height: '100%'}} 
        items={this.state.shuffledTags} 
        onRemoveItem={this.onRemove} 
        onAddItems={this.onAddItems}
        onReorderItems={this.onReorderItems}
        editModalVisible={this.state.editModalVisible} 
        onRequestModalClose={() => this.setState({editModalVisible: false})}/>

    return (
      <View>
        <DraggableDrawer 
          expanded={this.props.expanded} 
          onExpandPressed={this.props.onExpandPressed} 
          open={this.props.open} 
          contentMin={previewComponents}
          contentMax={chipComponents}/>
        {
          this.state.maxTags >= 0 ?
          (
            this.props.open && (
              this.props.expanded ? 
              <View key="0" style={styles.bottomFabContainer}>
                <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon={this.state.shuffle ? "shuffle" : "list"} onPress={this.onShuffle}/>
                <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon="assignment" onPress={this.copyTags}/>
                <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon="add" onPress={() => this.setState({editModalVisible: true})}/>
              </View>
              :
              <View key="1" style={styles.bottomFabContainer}>
                <FAB style={styles.bottomFab} label={this.state.maxTags ? quota + "/" + this.state.maxTags : "No Limit"} icon="filter-list" disabled={!this.state.shuffledTags.length} onPress={this.onCycleMaxTags}/>
                <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon={this.state.shuffle ? "shuffle" : "list"} onPress={this.onShuffle}/>
                <FAB style={styles.bottomFab} disabled={!this.state.shuffledTags.length} icon="assignment" onPress={this.copyTags}/>
              </View>
            ) 
          ) : <ActivityIndicator/>
        }
        <Portal>
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

const styles = StyleSheet.create({
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
    elevation: 8,
    margin: 8,
  }
});