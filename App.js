import React from 'react';
import { StyleSheet, Text, View, UIManager } from 'react-native';
import { SafeAreaView, DrawerItems, createDrawerNavigator } from 'react-navigation';

// Local imports
import Root from './Root'

// Paper
import { Provider as PaperProvider, DefaultTheme, FAB, Title } from 'react-native-paper';

"use strict";

// WARNING: This breaks things. Causes issues with visibility and TextViews.
// Provides CALayer-style implicit animation
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const DrawerComponent = (props) => (
  <SafeAreaView forceInset={{ top: 'always', horizontal: 'never' }}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <FAB style={{backgroundColor: '#88f', margin: 8}} icon="account-circle"/>
      <Title>Not Logged In</Title>
    </View>
    <DrawerItems {...props}/>
  </SafeAreaView>
);

let RootNavigator = createDrawerNavigator({
  Tags: { 
    screen: Root
  },
}, {
  contentComponent: DrawerComponent
});
  
export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PaperProvider theme={DefaultTheme}>
        <RootNavigator/>
      </PaperProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffa',
    justifyContent: 'center',
  },
});