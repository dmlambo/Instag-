import React from 'react';

import { 
  SafeAreaView, 
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Local Imports
import TagEditorView from './TagEditorView'

// Paper
import { Appbar, FAB, TextInput } from "react-native-paper";

'use strict';

export default class TagEditModal extends React.Component {
  constructor(props) {
    super(props);

    this.blurSubscription = this.props.navigation.addListener('willBlur', payload => {
      this.props.navigation.getParam("onSubmitted")(this.props.navigation.getParam("path"), this.state.items, this.state.title);
    })

    this.state = {
      editModalVisible: false,
      items: this.props.navigation.getParam("data", []),
      title: this.props.navigation.getParam("title"),
    }
  }

  onRemove = (text) => {
    console.log("Removing #" + text);
    var newItems = this.state.items ? this.state.items.slice(0) : new Array();
    var idx = newItems.indexOf(text);
    newItems.splice(idx, 1);
    this.setState({items: newItems});
    return true;
  }

  onAddItems = (items) => {
    this.setState({items: this.state.items.concat(items), editModalVisible: false});
  }

  onReorderItems = (items, callback) => {
    // Cannot use layoutanimation, since measure gives you the pre-animated
    // positions.
    //LayoutAnimation.easeInEaseOut();
    // We're going to trust that the items are all there. Right?
    let itemsText = items.map(({text}) => text);
    this.setState({items: itemsText}, callback);
  };

  render() {
      // KeyboardAvoidingView BUG! https://github.com/facebook/react-native/issues/13754
      // View doesn't go back to its original size.

      // There's a PR to add fontSize support in Paper TextInput styling
      // https://github.com/callstack/react-native-paper/pull/543
      return (
        <View style={{flex: 1}}>        
          <Appbar.Header>
            <Appbar.Content
              title="Edit Section"
            />
            <Appbar.BackAction
              onPress={() => this.props.navigation.goBack()}
            />
          </Appbar.Header>
          <SafeAreaView style={{flex: 1.0, flexDirection: 'column'}}>
            <TextInput
              style={{margin: 8, minWidth: 160, backgroundColor: '#fff1'}} 
              label="Section Title" 
              value={this.state.title}
              autoFocus={!this.state.title}
              onChangeText={(x) => { this.setState({title: x})}}
              />
            <View style={{margin: 8, borderWidth: 1, borderRadius: 4, borderColor: "#0004", flex: 1}}>
              <TagEditorView 
                style={{width: '100%', height: '100%'}} 
                items={this.state.items.map(x => {return {text: x}})} 
                onRemoveItem={this.onRemove} 
                onAddItems={this.onAddItems} 
                onReorderItems={this.onReorderItems}
                editModalVisible={this.state.editModalVisible} 
                onRequestModalClose={() => this.setState({editModalVisible: false})}/>
            </View>
            <FAB style={styles.bottomFab} icon="add" onPress={() => this.setState({editModalVisible: true})}/>
          </SafeAreaView>
        </View>
    );
  }
};

const styles = StyleSheet.create({
  bottomFab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 16,
  },
})