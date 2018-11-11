import PropTypes from 'prop-types';

import React from 'react';
import { findNodeHandle, View } from 'react-native';

"use strict";

export default class MeasuredView extends React.PureComponent {
	static propTypes = {
		setDimensions: PropTypes.func.isRequired,
	}

	onLayout = (nativeEvent) => {
		if (this.element != undefined) {
			let view = findNodeHandle(this.props.fromView());
			this.element.measureLayout(view, this.onMeasure, (x) => {console.error(x)});
		} else {
			console.log("No reference to tag");
		}
	};

	onMeasure = (x, y, width, height, pageX, pageY) => {
		this.props.setDimensions(this.props.tag, x, y, width, height, pageX, pageY);
	};

	render() {
		return (
			<View {...this.props} onLayout={this.onLayout} ref={x => this.element = x}>
				{this.props.children}
			</View>
		);
	}
};
