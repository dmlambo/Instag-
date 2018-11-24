import React from 'react';
import { UIManager } from 'react-native';
import { SafeAreaView, DrawerItems, createDrawerNavigator, createStackNavigator } from 'react-navigation';

// Local imports
import Root from './Root';
import Settings from './Settings';
import TagEditModal from './TagEditModal';

// Paper
import { 
  Provider as PaperProvider, 
  Button,
  DefaultTheme, 
} from 'react-native-paper';

"use strict";

// WARNING: This breaks things. Causes issues with visibility and TextViews.
// Provides CALayer-style implicit animation
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const DrawerComponent = (props) => (
  <SafeAreaView forceInset={{ top: 'always', horizontal: 'never' }}>
    <DrawerItems {...props}/>
    <Button icon="settings" onPress={() => {
      props.navigation.replace("Settings");
      }}>
        Settings
    </Button>
  </SafeAreaView>
);

let RootNavigator = createDrawerNavigator({
  Tags: {
    screen: Root
  },
}, {
  contentComponent: DrawerComponent,
});

let TopStackNavigator = createStackNavigator({
  Root: {
    screen: Root,
  },
  Settings: {
    screen: Settings,
  },
  Edit: { 
    screen: TagEditModal 
  },
}, {
  headerMode: 'none',
});

const mainTheme = {
  ...DefaultTheme,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
    text: '#333',
    primary: 'white',
  }
}

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
      <PaperProvider theme={mainTheme}>
        <TopStackNavigator screenProps={{setDrawerLock: this.setDrawerLock, drawerLockMode: this.state.drawerLocked ? 'locked-closed' : 'unlocked'}}/>
      </PaperProvider>
    );
  }
}
