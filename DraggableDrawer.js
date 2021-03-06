import React from 'react';

import {
  BackHandler,
  LayoutAnimation,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

import {
  Surface,
  Divider,
} from 'react-native-paper';

import Icon from 'react-native-vector-icons/MaterialIcons';

const closedProps = {
  height: 1,
}

export default class DraggableDrawer extends React.PureComponent {
  static defaultProps = {
    minProps: {
      height: 200,
    },
    maxProps: {
      height: '100%',
    },
  }

  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
    };
  }

  render() {
    let sizeProps = this.props.open ? 
      (this.props.expanded ? this.props.maxProps : this.props.minProps) :
      closedProps;

    let content = this.props.expanded ? this.props.contentMax : this.props.contentMin;
    let iconName = this.props.expanded ? 'keyboard-arrow-down' : 'keyboard-arrow-up';
    return (
      <Surface style={[styles.defaultStyle, this.props.style, sizeProps]}>
      {
        this.props.open &&
        <View style={{flexDirection: 'column'}}>
          <TouchableWithoutFeedback onPress={this.props.onExpandPressed}>
            <Icon style={{textAlign: 'center'}} name={iconName} size={30}/>
          </TouchableWithoutFeedback>
          <Divider/>
          { content }
        </View>
      }
      </Surface>
    );
  }
}

const styles = StyleSheet.create({
  defaultStyle: {
    elevation: 8,
    backgroundColor: 'white',
  }
})