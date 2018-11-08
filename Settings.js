import React from 'react';

import { 
  BackHandler,
  ScrollView,
  View, 
  AsyncStorage, 
  Clipboard, 
  Picker,
  Platform, } from 'react-native';

// Paper
import { 
  Button, 
  Dialog, 
  Paragraph, 
  Portal, 
  List, 
  Appbar, 
  Snackbar, } from 'react-native-paper';

// TODO: MobX
// XXX: We're counting on the destruction of the home screen to reload our user data
export default class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.backSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBack)

    this.state = {
      clearDataConfirmVisible: false,
      clearDataSnackbarVisible: false,
      snackbarMessage: "",
      copyLimit: 30,
    };

    Settings.getSavedPreferences().then((data) => {
      this.setState(data);
    })
  }
  
  static InitialData = {path: 'root', children: new Array()};
  static NodeDataKey = 'userDataRoot';
  static PreferencesKey = 'preferences';

  static getSavedPreferences = async () => {
    let storedPreferences = await AsyncStorage.getItem(Settings.PreferencesKey);
    if (storedPreferences == null) {
      return {copyLimit: 30};
    }
    return JSON.parse(storedPreferences);
  }

  static savePreferences = async (data) => {
    try {
      await AsyncStorage.setItem(Settings.PreferencesKey, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving preferences data:");
      console.error(e);
    }
  }

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

  handleBack = () => {
    this.props.navigation.replace("Root");
    return true;
  }
  
  componentWillUnmount = () => {
    this.backSubscription && this.backSubscription.remove();
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

  getPicker = () => {
    let options = ["30", "60", "Unlimited"];
    let values = [30, 60, 0];
    let stateChange = (itemValue) => {
      let preferences = {copyLimit: itemValue};
      this.setState(preferences);
      Settings.savePreferences(preferences); // ModX!
    };

    if (Platform.OS == 'ios') {
      return ( 
        <Button title={this.state.value} onPress={() => ActionSheetIOS.showActionSheetWithOptions({
          options,
        }, (idx) => {stateChange(values[idx])})}/>
      );
    } else {
      return (
        <Picker
          selectedValue={this.state.copyLimit}
          style={{ height: 30, width: 100 }}
          onValueChange={stateChange}>
          {
            options.forEach((option, idx) => {
              return <Picker.Item label={option} value={values[idx]}/>
            })
          }
        </Picker>            
      );
    }
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <Appbar.Header>
          <Appbar.Content
            title="Settings"
          />
          <Appbar.BackAction
            onPress={() => this.props.navigation.replace("Root")}
          />
        </Appbar.Header>
        <ScrollView style={{flex:1}}>
          <List.Section title="Options">
          <List.Item
            title="Item copy limit"
            right={() => 
              <Picker
                selectedValue={this.state.copyLimit}
                style={{ height: 30, width: 100 }}
                onValueChange={(itemValue) => {
                  let preferences = {copyLimit: itemValue};
                  this.setState(preferences);
                  Settings.savePreferences(preferences); // ModX!
                }}>
                <Picker.Item label="30" value="30" />
                <Picker.Item label="60" value="60" />
                <Picker.Item label="Unlimited" value="0" />
              </Picker>            
            } />
          </List.Section>
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
        </ScrollView>        
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