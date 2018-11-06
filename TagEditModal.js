import React from 'react';
import { StyleSheet, View, KeyboardAvoidingView } from 'react-native';

// Local Imports
import TextModal from './TextModal';
import TagContainer from './TagContainer';

// Paper
import { FAB, Button, TextInput, TextInputMask } from "react-native-paper";

// Navigation
import { createStackNavigator, withNavigation } from "react-navigation";

'use strict';

export default class TagEditModal extends React.Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerTitle: (
        // There's a PR to add fontSize support in Paper TextInput styling
        // https://github.com/callstack/react-native-paper/pull/543
        <TextInput 
          navigation={navigation}
          style={{flex: 1, margin: 4, backgroundColor: '#fff'}} 
          label="Section Title" 
          value={navigation.getParam("title")}
          onChangeText={navigation.getParam("titleChanged")}
          />
      )
    }
  };

  constructor(props) {
    super(props);

    this.blurSubscription = this.props.navigation.addListener('willBlur', payload => {
      this.props.navigation.setParams({titleChanged: null});
      this.props.navigation.getParam("onSubmitted")(this.props.navigation.getParam("path"), this.state.items, this.props.navigation.getParam("title"));
    })

    this.props.navigation.setParams({titleChanged: this.titleChanged});

    this.state = {
      editModalVisible: false,
      items: this.props.navigation.getParam("data", []),
    }
  }

  titleChanged = (title) => {
    console.log("New title" + title);
    this.props.navigation.setParams({title});
  }

  // Show modal
  onAddHashtag = () => {
    this.setState({...this.state, editModalVisible: true});
  };

  // Not interested in the text, back button pressed.
  onRequestModalClose = () => {
    this.setState({...this.state, editModalVisible: false});
  };

  stringToItems = (text) => {
    let trimText = text.trim().replace(/\#/g, '');
    if (!trimText) {
      return new Array();
    }
    return trimText.split(" ");
  }

  intersectItems = (items, compareItems) => {
    return items.reduce((acc, item) => {
      let lowerItem = item.toLowerCase();
      if (compareItems.find(x => { return lowerItem === x.toLowerCase()})) {
        acc.intersection.push(item);
      } else {
        acc.unique.push(item);
      }
      return acc;
    }, {intersection: new Array(), unique: new Array()});
  }

  onAdd = (text) => {
    let items = this.stringToItems(text);
    let uniqueItems = items.reduce((acc, item) => {
      let lowerItem = item.toLowerCase();
      if (!acc.find(x => { return lowerItem === x.toLowerCase()})) {
        acc.push(item);
      }
      return acc;
    }, new Array());
    let intersectionSet = this.state.items ? this.state.items : new Array();
    let intersection = this.intersectItems(uniqueItems, intersectionSet);

    console.log("Adding " + intersection.unique.map(x => "#" + x).join(' '));
    var newItems = this.state.items ? this.state.items.slice(0) : new Array();
    newItems = newItems.concat(intersection.unique);
    this.setState({items: newItems, editModalVisible: false})
    return true;
  }

  onRemove = (text) => {
    console.log("Removing #" + text);
    var newItems = this.state.items ? this.state.items.slice(0) : new Array();
    var idx = newItems.indexOf(text);
    newItems.splice(idx, 1);
    this.setState({items: newItems});
  }

  onFilterText = (text) => {
    let items = this.stringToItems(text);
    let intersectionSet = this.state.items ? this.state.items : new Array();
    let intersection = this.intersectItems(items, intersectionSet);
    switch (intersection.intersection.length) {
      case 0:
        if (intersection.unique.length) {
          return undefined;
        } else {
          return "Enter hashtag";
        }
      case 1: 
        return "Hashtag " + intersection.intersection + " already in the list";
      default:
        return "Hashtags already in the list: " + intersection.intersection.join(', ');
    }
  }

  onReorderItems = (items, callback) => {
    // We're going to trust that the items are all there. Right?
    this.setState({items}, callback);
  };

  render() {
    return (
      // BUG! https://github.com/facebook/react-native/issues/13754
      // View doesn't go back to its original size.
      <KeyboardAvoidingView style={StyleSheet.absoluteFill} behavior="height" keyboardVerticalOffset={75}>
        <TagContainer items={this.state.items} onRemoveItem={this.onRemove} onReorderItems={this.onReorderItems}/>
        <FAB
          style={styles.fab}
          icon="add"
          onPress={this.onAddHashtag}/>
        <TextModal
          visible={this.state.editModalVisible}
          onRequestClose={this.onRequestModalClose} 
          onTextAccepted={this.onAdd}
          onFilterText={this.onFilterText}/>
      </KeyboardAvoidingView>
    );
  }
};

const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
});