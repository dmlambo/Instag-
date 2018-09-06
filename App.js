import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Local imports
import TagContainer from './TagContainer';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <TagContainer />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
});
