import React from 'react';

import { 
  StyleSheet,
  View, 
} from 'react-native';

import {
  FAB,
} from 'react-native-paper';

import DraggableDrawer from './DraggableDrawer';
import TagContainer from './TagContainer';

let maxTags = 0;

export default class SelectionDrawer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shuffle: false,
    }
  }

  render() {
    let quotaNode = <View/>
    let quota = this.props.items;
    if (maxTags != 0) {
      if (quota > maxTags) {
        quota = maxTags;
      }
      let quotaStyle = {};
      if (quota == maxTags) {
        quotaStyle = {color: '#3f3'};
      }
      quotaNode = <Paragraph style={quotaStyle}>{quota}<Paragraph>/{maxTags}</Paragraph></Paragraph>
    }

    let previewComponents = <TagContainer style={{width: '100%', height: '100%'}} preview items={this.props.items}/>
    let chipComponents = <TagContainer style={{width: '100%', height: '100%'}} items={this.props.items}/>

    return (
      <View>
        <DraggableDrawer open={this.props.open} contentMin={previewComponents} contentMax={chipComponents}/>
        {
          this.props.open && 
          <View style={styles.bottomFabContainer}>
            {quotaNode}
            <FAB style={styles.bottomFab} disabled={!this.props.items || !this.props.items.length} icon={this.state.shuffle ? "shuffle" : "list"} onPress={this.onShuffle}/>
            <FAB style={styles.bottomFab} disabled={!this.props.items || !this.props.items.length} icon="assignment" onPress={this.copyTags}/>
          </View>
        }
      </View>
    );
  }  
}

const styles = StyleSheet.create({
  bottomFabContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bottomFab: {
    elevation: 8,
    margin: 8,
  }
});