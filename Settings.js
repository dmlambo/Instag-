import React from 'react';

import { AsyncStorage } from 'react-native';

// Paper
import { List } from 'react-native-paper';

const NodeDataKey = 'userDataRoot';

export default class Settings extends React.Component {
  render() {
    return (
        <List.Section title="Import/Export data">
          <List.Item 
            left={() => <List.Icon icon="assignment" />} 
            title="Copy JSON blob to clipboard"/>
          <List.Item 
            left={() => <List.Icon icon="cloud-download" />} 
            title="Replace JSON blob from clipboard"/>
          <List.Item 
            left={() => <List.Icon icon="delete"/>}
            onPress={() => AsyncStorage.clear()} 
            title="Clear Tag Data"/>
        </List.Section>
    );
  }
}

export { NodeDataKey };