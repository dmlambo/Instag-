import React from 'react';
import { StyleSheet, LayoutAnimation, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

// Paper
import { DefaultTheme, Surface, Paragraph, Title, withTheme, TouchableRipple } from 'react-native-paper';

'use strict';

// TagNodeView acts as a tree-view visual node, showing each node's
// data, and a list of children underneath, each of which can be
// expanded, edited, and selected.
// TODO: Serialization
class TagNodeView extends React.Component {
  constructor(props) {
    super(props);

    this.path = props.pathForNode(props);

    this.state = {
      expanded: false,
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

  showEditModal = (items) => {
    //this.setState({editModalVisible: true});
    this.props.nagivation.push("Edit", {})
  }

  getContentView = () => {
    if (this.state.expanded) {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flexDirection: 'column', flex: 1.0}}>
            {
              this.getChildViews()
            }
          </View>
        </View>
      );
    }
  }

  onEditNode = () => {
    this.props.onEditNode(this.state.data, this.state.title);
  }

  getChildViews = () => {
    if (this.props.nodeData.children) {
      return this.props.nodeData.children.map((nodeData, idx) =>
          <TagNodeView 
            {...this.props}
            key={idx} 
            nodeData={nodeData}
            parentPath={this.path}/>
      );
    } else {
      return <View/>;
    }
  }

  onExpandPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({expanded: !this.state.expanded});
  }

  onLongPress = () => {
    this.props.onNodeSelected(this.path);
  }

  render() {
    const noTagsText = "No Tags!";
    var tagsText = this.props.nodeData.data == undefined ? 
      noTagsText :
      this.props.nodeData.data.map((x)=>"#" + x).join(" ");
    var selected = this.props.selectedPredicate(this.path);
    var backgroundColor = selected ? DefaultTheme.colors.accent : DefaultTheme.colors.surface;

    // |ˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉ|    |ˉˉˉˉˉˉˉˉˉˉˉˉˉ|
    // | >               Title               ... | -> | Add Section |
    // |                                         |    | Delete  ... |
    // |  #foo #bar #baz                       > |
    // | --------------------------------------- :
    // ( Everything under is another TagNodeView )
    return (
      <Surface style={[styles.container, this.props.style, {backgroundColor}]}>
        <TouchableRipple 
          borderless 
          onPress={this.props.selectionMode ? this.onLongPress : this.onExpandPress} 
          onLongPress={this.onLongPress}
          style={[...StyleSheet.absoluteFillObject, {borderRadius: 4}]}>
          <View>
            <View style={styles.titleBar}>
              <TouchableOpacity onPress={() => this.setState({expanded: !this.state.expanded})}>
                { this.getExpandView(this.state.expanded) }
              </TouchableOpacity>
              <Title style={styles.titleBarText}>{this.props.nodeData.title}</Title>
              <TouchableOpacity style={{padding: 5}} onPress={this.onEditNode}>
                <Icon style={styles.titleBarExpand} name="edit"/>
              </TouchableOpacity>
            </View>
            <Paragraph style={styles.tagsText}>{tagsText}</Paragraph>
            <View>
              { 
                this.getContentView(this.state.expanded) 
              }
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 8, 
    elevation: 4, 
    borderRadius: 4, 
    paddingBottom: 8, 
  },
  titleBar: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBarText: {
    flex: 1.0,
  },
  titleBarExpand: {
    fontSize: 24,
    padding: 5,
  },
  tagsText: {
    margin: 8,
  }
});

export default withTheme(TagNodeView);