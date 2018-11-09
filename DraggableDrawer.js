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

export default class DraggableDrawer extends React.Component {
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

    this.backSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBack);

    this.state = {
      expanded: false,
    };
  }

  handleBack = () => {
    if (this.state.expanded) {
      LayoutAnimation.easeInEaseOut();
      this.setState({expanded: false});
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    this.backSubscription && this.backSubscription.remove();
  }

  render() {
    let sizeProps = this.props.open ? 
      (this.state.expanded ? this.props.maxProps : this.props.minProps) :
      closedProps;

    let content = this.state.expanded ? this.props.contentMax : this.props.contentMin;
    return (
      <Surface collapsable={false} style={[styles.defaultStyle, this.props.style, sizeProps]}>
      {
        this.props.open &&
        <TouchableWithoutFeedback style={{height: '100%'}} onPress={() => {
          LayoutAnimation.easeInEaseOut();
          this.setState({expanded: !this.state.expanded});
        }}>
          <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <Icon name="drag-handle" size={24}/>
            { content }
          </View>
        </TouchableWithoutFeedback>
      }
      </Surface>
    );
  }
}

const styles = StyleSheet.create({
  defaultStyle: {
    elevation: 4,
    backgroundColor: 'white',
  }
})