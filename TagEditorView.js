import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView } from 'react-native';

// Local Imports
import TextModal from './TextModal';
import TagContainer from './TagContainer';

// Paper
import { FAB } from "react-native-paper";

'use strict';

export default class TagEditorView extends React.Component {
  constructor(props) {
    super(props);
  }

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
      if (compareItems.find(x => { return lowerItem === x.text.toLowerCase()})) {
        acc.intersection.push(item);
      } else {
        acc.unique.push(item);
      }
      return acc;
    }, {intersection: new Array(), unique: new Array()});
  }

  onHashtagsAdded = (text) => {
    let items = this.stringToItems(text);
    let uniqueItems = items.reduce((acc, item) => {
      let lowerItem = item.toLowerCase();
      if (!acc.find(x => { return lowerItem === x.toLowerCase()})) {
        acc.push(item);
      }
      return acc;
    }, new Array());
    let intersectionSet = this.props.items ? this.props.items : new Array();
    let intersection = this.intersectItems(uniqueItems, intersectionSet);

    console.log("Adding " + intersection.unique.map(x => "#" + x).join(' '));
    this.props.onAddItems(intersection.unique);
    return true;
  }

  onFilterText = (text) => {
    let items = this.stringToItems(text);
    let intersectionSet = this.props.items ? this.props.items : new Array();
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
    // Cannot use layoutanimation, since measure gives you the pre-animated
    // positions.
    //LayoutAnimation.easeInEaseOut();
    // We're going to trust that the items are all there. Right?
    this.setState({items}, callback);
  };

  render() {
      // KeyboardAvoidingView BUG! https://github.com/facebook/react-native/issues/13754
      // View doesn't go back to its original size.
      return (
        <View>      
          <TagContainer 
            style={{width: '100%', height: '100%'}} 
            items={this.props.items}
            onRemoveItem={this.props.onRemoveItem}
            onReorderItems={this.props.onReorderItems}
            editModalVisible={this.props.editModalVisible} 
            onRequestModalClose={this.props.onRequestModalClose}/>
          <TextModal
            visible={this.props.editModalVisible}
            onRequestClose={this.props.onRequestModalClose}
            onTextAccepted={this.onHashtagsAdded}
            onFilterText={this.onFilterText}/>
        </View>
    );
  }
};

const styles = StyleSheet.create({
  fab: {
    margin: 16,
  },
  fabKAV: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  }
});