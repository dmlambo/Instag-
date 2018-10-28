import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

'use strict';

// 3rd Party Imports
import Modal from "react-native-modal";

// Local imports
import TagContainer from './TagContainer';

// TagNodeView acts as a tree-view visual node, showing each node's
// data, and a list of children underneath, each of which can be
// expanded, and edited.
// TODO: Serialization
export default class TagNodeView extends React.Component {
  constructor(props) {
    super(props);

    // TODO: How do we handle serialization? Should we deserialize on construction?
    // Who changes the data? Is there a manager of some kind? Does the tree
    // hold refs to React components? (I feel like that's contradictory to
    // React design)

    this.state = {
      expanded: false,
      children: props.children,
      data: props.data,
      title: props.title,
    }
  }

  getExpandView = () => {
    if (this.state.expanded) {
      return (
        <Icon style={styles.titleBarExpand} name="chevron-thin-down"/>
      );
    } else {
      return (
        <Icon style={styles.titleBarExpand} name="chevron-thin-right"/>
      )
    }
  }

  showEditModal = () => {
    this.setState({editModalVisible: true});
  }

  getContentView = () => {
    if (this.state.expanded) {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={styles.insetBar}/>
          <View style={styles.insetBarCap}/>
          <View style={{flexDirection: 'column', flex: 1.0}}>
            <View style={styles.contentView}>
              <Text style={{padding: 5, flex: 1.0}}>{this.state.data}</Text>
              <TouchableOpacity onPress={this.showEditModal}>
                <Icon style={styles.titleBarExpand} name="edit"/>
              </TouchableOpacity>
            </View>
            {
              this.getChildViews()
            }
          </View>
        </View>
      );
    }
  }

  getChildViews = () => {
    if (this.state.children) {
      return this.state.children.map(({title, data, children}, idx) =>
          <TagNodeView key={idx} children={children} title={title} data={data}/>
      );
    } else {
      return <View/>;
    }
  }

  onExpandPress = () => {
    this.setState({expanded: !this.state.expanded});
  }

  onMenuPress = () => {
    
  }

  render() {
    // |ˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉ|    |ˉˉˉˉˉˉˉˉˉˉˉˉˉ|
    // | >               Title               ... | -> | Add Section |
    // |_________________________________________|    | Delete  ... |
    // :  #foo #bar #baz                    Edit :
    // :-----------------------------------------:
    // ( Everything under is another TagNodeView )
    return (
      <View style={this.props.style}>
        <Modal isVisible={this.state.editModalVisible}>
          <TagContainer/>
        </Modal>
        <View style={styles.titleBar}>
          <TouchableOpacity onPress={this.onExpandPress}>
            {
              this.getExpandView(this.state.expanded)
            }
          </TouchableOpacity>
          <Text style={styles.titleBarText}>{this.props.title}</Text>
          <TouchableOpacity onPress={this.onMenuPress}>
            <Icon style={styles.titleBarMenu} name="menu"/>
          </TouchableOpacity>
        </View>
        <View>
          { 
            this.getContentView(this.state.expanded) 
          }
        </View>
        <View style={styles.separatorBar}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  titleBar: {
    height: 50,
    width: '100%',
    backgroundColor: '#bbe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    // Shadows
    shadowColor: "black",
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10.0,
  },
  titleBarText: {
    fontSize: 24,
    textAlign: 'center',
    flex: 1.0,
  },
  titleBarExpand: {
    fontSize: 24,
    padding: 5,
  },
  titleBarMenu: {
    fontSize: 34,
    padding: 5,
  },
  contentView: {
    flexDirection: 'row',
    backgroundColor: '#bbb',
  },
  insetBar: {
    height: '100%',
    width: 8,
    backgroundColor: '#aac',
  },
  insetBarCap: {
    height: '100%',
    width: 1,
    backgroundColor: '#eee',
  },
  separatorBar: {
    height: 2,
    width: '100%',
    backgroundColor: '#aaa',
  }  
});