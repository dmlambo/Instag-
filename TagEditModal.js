import React from 'react';
import { StyleSheet, Button, Text, View, TouchableOpacity } from 'react-native';

// Local Imports
import TextModal from './TextModal';
import TagContainer from './TagContainer';

// Paper
import { FAB } from "react-native-paper";

// Navigation
import { createStackNavigator, withNavigation } from "react-navigation";

'use strict';

export default class TagEditModal extends React.Component {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.getParam("title"),
      headerRight: (
        <Button
          onPress={() => alert('This is a button!')}
          title="Info"
          color="#fff"
        />
      )
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      editModalVisible: false,
      items: this.props.navigation.getParam("items", []),
    }
  }

  // Show modal
  onAddHashtag = () => {
    this.setState({...this.state, editModalVisible: true});
  };

  // Not interested in the text, back button pressed.
  onRequestModalClose = () => {
    this.setState({...this.state, editModalVisible: false});
  };  

  onAdd = (text) => {
    console.log("Adding #" + text);
    var newItems = this.state.items ? this.state.items.slice() : [];
    newItems.push(text);
    this.setState({items: newItems, editModalVisible: false})
  }

  onFilterText = (text) => {
    if (text == "") {
      return "Enter hashtag";
    }
    if (this.state.items && this.state.items.indexOf(text) != -1) {
      return "Hashtag already in the list";
    }
    return undefined;
  }
  
  render() {
    return (
      <View style={StyleSheet.absoluteFill}>
        <TagContainer items={this.state.items}/>
        <FAB
          style={styles.fab}
          icon="add"
          onPress={this.onAddHashtag}/>
        <TextModal
          visible={this.state.editModalVisible}
          onRequestClose={this.onRequestModalClose} 
          onTextAccepted={this.onAdd}
          onFilterText={this.onFilterText}/>

      </View>
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