import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Local imports
import TagButton from './TagButton';
import * as CommonStyles from './styles/common'


export default class TagContainer extends React.Component {
  items = ["one", "two", "kitties"];
  onAddHashtag = () => {};

  constructor(props) {
    super(props);
    this.onAddHashtag = props.onAddHashtag;
  }

  render() {
    return (
      <View style={styles.container}>
        {
          this.items.map((x,i) => <TagButton title={x} key={i}/>)
        }
        <Text style={styles.addButton}>Add</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addButton: {
    fontSize: CommonStyles.BUTTON_TEXT_SIZE,
    color: '#55f',
    paddingLeft: 3,
    paddingRight: 3,
  },
});