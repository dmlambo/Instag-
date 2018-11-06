import React from 'react';
import { StyleSheet, Text, View, UIManager } from 'react-native';
import { SafeAreaView, DrawerItems, createDrawerNavigator } from 'react-navigation';

// Local imports
import Root from './Root';
import Settings from './Settings';

// Paper
import { Provider as PaperProvider, DefaultTheme, FAB, Title } from 'react-native-paper';

"use strict";

// WARNING: This breaks things. Causes issues with visibility and TextViews.
// Provides CALayer-style implicit animation
//UIManager.setLayoutAnimationEnabledExperimental &&
//  UIManager.setLayoutAnimationEnabledExperimental(true);

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
  Settings: {
    screen: Settings
  }
}, {
  contentComponent: DrawerComponent,
});

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      drawerLocked: false
    }
  }

  // BUG: https://github.com/react-navigation/react-navigation/issues/4201
  // Fix is in an alpha release, but not a stable release.
  setDrawerLock = (drawerLocked) => {
    this.setState({drawerLocked});
  }

  render() {
    return (
      <PaperProvider theme={DefaultTheme}>
        <RootNavigator screenProps={{setDrawerLock: this.setDrawerLock, drawerLockMode: this.state.drawerLocked ? 'locked-closed' : 'unlocked'}}/>
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