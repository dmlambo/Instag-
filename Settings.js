import React from 'react';

import { View, AsyncStorage, Clipboard } from 'react-native';

// Paper
import { 
  Button, 
  Dialog, 
  Paragraph, 
  Portal, 
  List, 
  Appbar, 
  Snackbar } from 'react-native-paper';

// TODO: MobX
// XXX: We're counting on the destruction of the home screen to reload our user data
export default class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clearDataConfirmVisible: false,
      clearDataSnackbarVisible: false,
      snackbarMessage: "",
    };
  }
  
  static InitialData = {path: 'root', children: new Array()};
  static NodeDataKey = 'userDataRoot';

  static getSavedNodeData = async () => {
    return await AsyncStorage.getItem(Settings.NodeDataKey);
  }

  static getParsedNodeData = async () => {
    let jsonData = JSON.parse(await Settings.getSavedNodeData());
    if (!jsonData || jsonData.path != 'root') {
      throw new Error("User data malformed!");
    }
    return jsonData;
  }

  static saveNodeData = async (data) => {
    try {
      await AsyncStorage.setItem(Settings.NodeDataKey, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving user data:");
      console.error(e);
    }
  }

  static parseAndVerifyNodeData = (data) => {
    let jsonData = JSON.parse(data);
    if (!jsonData || jsonData.path != 'root') {
      throw new Error("User data malformed!");
    }
  }

  copyNodeData = () => {
    Settings.getSavedNodeData().then((data) => {
      if (!data) {
        this.showSnackbar("Error fetching user data!");
      } else {
        Clipboard.setString(data);
        this.showSnackbar("JSON blob copied to clipboard!");
      }
    });
  }

  replaceNodeData = () => {
    Clipboard.getString().then((data) => {
      try {
        let jsonData = JSON.parse(data);
        if (!jsonData || jsonData.path != 'root') {
          console.error("Error parsing JSON data:");
          console.error("Root node should have an element \"path\" equal to \"root\".");
          console.error(data);
          this.showSnackbar("JSON data malformed!");
        } else {
          AsyncStorage.setItem(Settings.NodeDataKey, data);
        }
      } catch(e) {
        console.error("Error parsing JSON data:");
        console.error(error);
        this.showSnackbar("Data is not JSON!");   
      }
    }, (error) => {
      console.error("Error reading from clipboard:");
      console.error(error);
      this.showSnackbar("Error reading clipboard!");
    })

  }

  showClearDataConfirmDialog = () => {
    this.setState({clearDataConfirmVisible: true});
  }

  hideClearDataConfirmDialog = () => {
    this.setState({clearDataConfirmVisible: false});
  }

  onClearData = () => {
    AsyncStorage.clear().then(() => {
      this.showSnackbar("Tag data cleared!");
    })
  }

  showSnackbar = (msg) => {
    this.setState({
      clearDataSnackbarVisible: true,
      snackbarMessage: msg,
    });
  }

  render() {
    return (
      <View>
        <Appbar.Header>
          <Appbar.Content
            title="Settings"
          />
          <Appbar.BackAction
            onPress={this._goBack}
          />
        </Appbar.Header>
        <List.Section title="Import/Export Tags">
          <List.Item 
            left={() => <List.Icon icon="assignment" />} 
            onPress={this.copyNodeData}
            title="Copy JSON blob to clipboard"/>
          <List.Item 
            left={() => <List.Icon icon="cloud-download" />} 
            onPress={this.replaceNodeData}
            title="Replace JSON blob from clipboard"/>
          <List.Item 
            left={() => <List.Icon icon="delete"/>}
            onPress={this.showClearDataConfirmDialog} 
            title="Clear Tag Data"/>
        </List.Section>
        <Portal>
          <Dialog
            visible={this.state.clearDataConfirmVisible}
            onDismiss={this.hideClearDataConfirmDialog}>
            <Dialog.Title>WARNING</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Are you sure you want delete all stored tag data?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={this.hideClearDataConfirmDialog}>Cancel</Button>
              <Button onPress={() => { this.onClearData(); this.hideClearDataConfirmDialog() }}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
          <Snackbar 
            duration={1500}
            visible={this.state.clearDataSnackbarVisible}
            onDismiss={() => this.setState({clearDataSnackbarVisible: false})}
            action={{
              label: 'Dismiss',
              onPress: () => {
                this.setState({clearDataSnackbarVisible: false})
              }}}>
            {this.state.snackbarMessage}
          </Snackbar>
        </Portal>
      </View>
    );
  }
}