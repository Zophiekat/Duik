/**
 * Constraint tools.
 * @namespace
 * @category Duik
 */
Duik.Constraint = {};

/**
 * The types of IK for three-layer chains.
 * @enum {Number}
 */
Duik.Constraint.IKType = {
    ONE_TWO: 1,
    TWO_ONE: 2,
    FK: 3,
    BEZIER_IK: 4,
    BEZIER_FK: 5
};

/**
 * The list of constraint functions
 * @namespace
 */
Duik.CmdLib['Constraint'] = {};

Duik.CmdLib['Constraint']["List"] = "Duik.Constraint.list()";
Duik.CmdLib['Constraint']["List_with_keyframe"] = "Duik.Constraint.list(true)";
/**
 * List
 * @param {Boolean} [addKeyframe=false] Set to true to automatically add a keyframe to the second slot (which makes it quicker to find in the AE Timeline using the 'U' shortcut)
 */
Duik.Constraint.list = function(addKeyframe) {
    addKeyframe = def(addKeyframe, false);
    var props = DuAEComp.getSelectedProps();
    if (props.length == 0) return;

    DuAE.beginUndoGroup( i18n._("List"));

    var layers = DuAEComp.unselectLayers();
    for (var i = 0, n = props.length; i < n; i++) {
        Duik.Constraint.createList(props[i], addKeyframe);
    }
    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup();
}

/**
 * Adds a list on a property
 * @param {Property|DuAEProperty} prop - The Property
 * @param {Boolean} [addKeyframe=false] Set to true to automatically add a keyframe to the second slot (which makes it quicker to find in the AE Timeline using the 'U' shortcut)
 * @returns {DuAEProperty} The list effect
 */
Duik.Constraint.createList = function(prop, addKeyframe) {
    addKeyframe = def(addKeyframe, false);
    prop = new DuAEProperty(prop);
    if (!prop.riggable()) return;

    DuAE.beginUndoGroup( i18n._("Add list"), false);

    var dim = prop.dimensions();

    var layer = prop.layer;

    var internalListName = "List";
    var listName = i18n._(internalListName);
    var name = prop.getProperty().name + ' | ' + listName;
    var pe;
    if (dim == 1) {
        pe = Duik.PseudoEffect.ONED_LIST;
    }
    else if (dim == 2) {
        internalListName = "2DList";
        listName = i18n._(internalListName);
        pe = Duik.PseudoEffect.TWOD_LIST;
    }
    else if (dim == 3) {
        internalListName = "3DList";
        listName = i18n._(internalListName);
        pe = Duik.PseudoEffect.THREED_LIST;
    }
    else if (dim == 4) {
        internalListName = "Color List";
        listName = i18n._(internalListName);
        pe = Duik.PseudoEffect.COLOR_LIST;
    }
    else return null;

    var effect = pe.apply(layer, name);;

    //set animation with expression
    var anim = prop.animation(false);
    if (anim) {
        var newProp = new DuAEProperty(effect(5));
        newProp.setAnim(anim, 0, true, true, false);
    }
    prop.removeAnimation();

    if (addKeyframe) {
        var index2;
        if (dim == 4) index2 = pe.props["2"]["Color 2"].index;
        else index2 = pe.props["2"]["Value 2"].index;
        effect(index2).setValueAtTime( 0, effect(index2).value );
    }

    var expression = DuAEExpression.Id.LIST + '\n' + DuAEExpression.Library.get(['checkDuikEffect', 'zero']) + '\n';
        
    if (dim == 4) expression += DuAEExpression.Library.get(['blendColor']) + '\n';
        
    expression += [
        'var result = null',
        'for (var i = 1, n = thisLayer("Effects").numProperties; i <= n; i++) {',
        '   var fx = thisLayer.effect(i);',
        '   if (!checkDuikEffect(fx, "' + internalListName  + '")) continue;',
        '   if (!fx.name.indexOf(thisProperty.name) == 0) continue;',
        '   if (!fx.active) continue;',
        ''
    ].join('\n');

    if (dim == 4) expression += [
        '   var v1 = fx(' + pe.props["1"]["Color 1"].index + ').value;',
        '   var w1 = fx(' + pe.props["1"]["Opacity 1"].index + ').value;',
        '   var b1 = fx(' + pe.props["1"]["Blending mode 1"].index + ').value;',
        '   var v2 = fx(' + pe.props["2"]["Color 2"].index + ').value;',
        '   var w2 = fx(' + pe.props["2"]["Opacity 2"].index + ').value;',
        '   var b2 = fx(' + pe.props["2"]["Blending mode 2"].index + ').value;',
        '   var v3 = fx(' + pe.props["3"]["Color 3"].index + ').value;',
        '   var w3 = fx(' + pe.props["3"]["Opacity 3"].index + ').value;',
        '   var b3 = fx(' + pe.props["3"]["Blending mode 3"].index + ').value;',
        '   var v4 = fx(' + pe.props["4"]["Color 4"].index + ').value;',
        '   var w4 = fx(' + pe.props["4"]["Opacity 4"].index + ').value;',
        '   var b4 = fx(' + pe.props["4"]["Blending mode 4"].index + ').value;',
        '   var v5 = fx(' + pe.props["5"]["Color 5"].index + ').value;',
        '   var w5 = fx(' + pe.props["5"]["Opacity 5"].index + ').value;',
        '   var b5 = fx(' + pe.props["5"]["Blending mode 5"].index + ').value;',
        '   if (result === null) result = zero() + v1*w1/100',
        '   else result = blendColor(result, v1, w1/100, b1-1);',
        '   result = blendColor(result, v2, w2/100, b2-1);',
        '   result = blendColor(result, v3, w3/100, b3-1);',
        '   result = blendColor(result, v4, w4/100, b4-1);',
        '   result = blendColor(result, v5, w5/100, b5-1);',
        ''
    ].join('\n');
    else expression += [
        '   var v1 = fx(' + pe.props["1"]["Value 1"].index + ').value;',
        '   var w1 = fx(' + pe.props["1"]["Weight 1"].index + ').value;',
        '   var v2 = fx(' + pe.props["2"]["Value 2"].index + ').value;',
        '   var w2 = fx(' + pe.props["2"]["Weight 2"].index + ').value;',
        '   var v3 = fx(' + pe.props["3"]["Value 3"].index + ').value;',
        '   var w3 = fx(' + pe.props["3"]["Weight 3"].index + ').value;',
        '   var v4 = fx(' + pe.props["4"]["Value 4"].index + ').value;',
        '   var w4 = fx(' + pe.props["4"]["Weight 4"].index + ').value;',
        '   var v5 = fx(' + pe.props["5"]["Value 5"].index + ').value;',
        '   var w5 = fx(' + pe.props["5"]["Weight 5"].index + ').value;',
        '   if (result === null) result = zero();',
        '   result += v1*w1/100+v2*w2/100+v3*w3/100+v4*w4/100+v5*w5/100;',
        ''
    ].join('\n');

    expression += [
        '}',
        'if (result === null) result = value;',
        'result;'
    ].join('\n');

    prop.getProperty().expression = expression;

    DuAE.endUndoGroup( i18n._("Add list"));

    return prop;
}

Duik.CmdLib['Constraint']["Separate Dimensions"] = "Duik.Constraint.separateDimensions()";
/**
 * Separate Dimensions
 */
Duik.Constraint.separateDimensions = function() {
    var props = DuAEComp.getSelectedProps();
    if (props.length == 0) return;

    DuAE.beginUndoGroup( i18n._("Split values"));

    for (var i = 0, num = props.length; i < num; i++) {
        Duik.Constraint.separatePropDimensions(props[i]);
    }

    DuAE.endUndoGroup();
}

/**
 * Separates the dimensions of the properties into an effect.<br />
 * Works with 2D, 3D, and colors
 * @param {Property|DuAEProperty} prop - The property
 * @return {DuAEProperty[]} The seperated properties (or the original one if it could not be separated)
 */
Duik.Constraint.separatePropDimensions = function(prop) {
    var propInfo = new DuAEProperty(prop);
    prop = propInfo.getProperty();

    if (!propInfo.riggable()) return prop;

    var layer = propInfo.layer;
    var dim = propInfo.dimensions();

    if (dim < 2 || dim > 4) return [propInfo];

    if (prop.isSeparationLeader) {
        prop.dimensionsSeparated = true;
        var newProps = [];
        for (var i = 1; i <= dim; i++) {
            var newProp = prop.parentProperty(prop.propertyIndex + i);
            newProp = new DuAEProperty(newProp);
            newProps.push(newProp);
        }
        return newProps;
    }

    if (dim == 2) {
        var pseudo;
        if (propInfo.isScale) pseudo = Duik.PseudoEffect.TWO_DIMENSIONS_SCALE;
        else if (propInfo.isAngle()) pseudo = Duik.PseudoEffect.TWO_DIMENSIONS_ANGLE;
        else pseudo = Duik.PseudoEffect.TWO_DIMENSIONS;

        var effect = pseudo.apply(layer, propInfo.name + " XY");

        prop = propInfo.getProperty();

        var xIndex = pseudo.props['X'].index;
        var yIndex = pseudo.props['Y'].index;

        //copy values
        if (prop.numKeys == 0) {
            effect(xIndex).setValue(prop.value[0]);
            effect(yIndex).setValue(prop.value[1]);
        } else {
            for (var k = prop.numKeys; k > 0; k--) {
                var time = prop.keyTime(k);
                var value = prop.keyValue(k);
                effect(xIndex).setValueAtTime(time, value[0]);
                effect(yIndex).setValueAtTime(time, value[1]);
                prop.removeKey(k);
            }
        }

        //add expression
        prop.expression = [DuAEExpression.Id.SEPARATE_DIMENSIONS,
            'var fx = thisLayer.effect("' + effect.name + '");',
            '[fx(' + xIndex + ').value,fx(' + yIndex + ').value];'
        ].join('\n');

        //return the new props
        var xProp = new DuAEProperty(effect(xIndex));
        var yProp = new DuAEProperty(effect(yIndex));
        return [xProp, yProp];
    }

    if (dim == 3) {
        var pseudo;
        if (propInfo.isScale) pseudo = Duik.PseudoEffect.THREE_DIMENSIONS_SCALE;
        else if (propInfo.isAngle()) pseudo = Duik.PseudoEffect.THREE_DIMENSIONS_ANGLE;
        else pseudo = Duik.PseudoEffect.THREE_DIMENSIONS;

        var effect = pseudo.apply(layer, propInfo.name + " XYZ");

        prop = propInfo.getProperty();

        var xIndex = pseudo.props['X'].index;
        var yIndex = pseudo.props['Y'].index;
        var zIndex = pseudo.props['Z'].index;

        //copy values
        if (prop.numKeys == 0) {
            effect(xIndex).setValue(prop.value[0]);
            effect(yIndex).setValue(prop.value[1]);
            effect(zIndex).setValue(prop.value[2]);
        } else {
            for (var k = prop.numKeys; k > 0; k--) {
                var time = prop.keyTime(k);
                var value = prop.keyValue(k);
                effect(xIndex).setValueAtTime(time, value[0]);
                effect(yIndex).setValueAtTime(time, value[1]);
                effect(zIndex).setValueAtTime(time, value[2]);
                prop.removeKey(k);
            }
        }

        //add expression
        prop.expression = [DuAEExpression.Id.SEPARATE_DIMENSIONS,
            'var fx = thisLayer.effect("' + effect.name + '");',
            '[fx(' + xIndex + ').value,fx(' + yIndex + ').value, fx(' + zIndex + ').value];'
        ].join('\n');

        //return the new props
        var xProp = new DuAEProperty(effect(xIndex));
        var yProp = new DuAEProperty(effect(yIndex));
        var zProp = new DuAEProperty(effect(zIndex));
        return [xProp, yProp, zProp];
    }

    if (dim == 4) {
        var pseudo = Duik.PseudoEffect.COLOR;
        var effect = pseudo.apply(layer, propInfo.name + " RGB/HSL");

        var modeIndex = pseudo.props['Channels'].index;
        var rIndex = pseudo.props['R / H'].index;
        var gIndex = pseudo.props['G / S'].index;
        var bIndex = pseudo.props['B / L'].index;

        effect(modeIndex).setValue(2);
        prop = propInfo.getProperty();

        //copy values
        if (prop.numKeys == 0) {
            var color = prop.value;
            color = new DuColor(color).floatHSL();
            effect(rIndex).setValue(color[0]);
            effect(gIndex).setValue(color[1]);
            effect(bIndex).setValue(color[2]);
        } else {
            for (var k = prop.numKeys; k > 0; k--) {
                var time = prop.keyTime(k);
                var value = prop.keyValue(k);
                value = new DuColor(value).floatHSL();
                effect(rIndex).setValueAtTime(time, value[0]);
                effect(gIndex).setValueAtTime(time, value[1]);
                effect(bIndex).setValueAtTime(time, value[2]);
                prop.removeKey(k);
            }
        }

        //add expression
        prop.expression = [DuAEExpression.Id.SEPARATE_DIMENSIONS,
            'var fx = thisLayer.effect("' + effect.name + '");',
            'var color = [fx(' + rIndex + ').value,fx(' + gIndex + ').value, fx(' + bIndex + ').value, 1];',
            'if (fx(' + modeIndex + ').value == 2) hslToRgb(color);',
            'else color;'
        ].join('\n');

        //return the new props
        var xProp = new DuAEProperty(effect(rIndex));
        var yProp = new DuAEProperty(effect(gIndex));
        var zProp = new DuAEProperty(effect(bIndex));
        return [xProp, yProp, zProp];
    }
}

Duik.CmdLib['Constraint']["Lock"] = "Duik.Constraint.lock()";
/**
 * Lock propery values
 * @param {Property|DuAEProperty|Property[]|DuAeProperty[]|DuList.<Property>|DuList.<DuAEProperty>} [props] - The properties. If omitted, locks the selected properties
 */
Duik.Constraint.lock = function(props) {
    props = def(props, DuAEComp.getSelectedProps() );
    props = new DuList(props);
    if (props.length() == 0) return;

    DuAE.beginUndoGroup( i18n._("Lock properties"));

    DuAEProperty.lock(props);

    DuAE.endUndoGroup();
}

Duik.CmdLib['Constraint']["Zero"] = "Duik.Constraint.zero()";
/**
 * Zero-out selected layers
 * @param {Layer[]|LayerCollection|DuList.<Layer>|Layer} [layers=DuAEComp.getSelectedLayers()] The layer. If omitted, will use all selected layers in the comp
 * @param {Boolean} [placeBelow=false] Put each zero right below its layer instead of at the bottom of the comp
 * @returns {ShapeLayer[]} The zeroes
 */
Duik.Constraint.zero = function(layers, placeBelow) {
    layers = def(layers, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);
    placeBelow = def(placeBelow, false);

    DuAE.beginUndoGroup( i18n._("Add zero"), false);
    DuAEProject.setProgressMode(true);

    var zeroes = [];

    layers.do(function(layer) {
        //create null object
        var zero = DuAEComp.addNull(layer.containingComp);
        var layerparent = layer.parent;
        layer.parent = null;
        zero.position.setValue(layer.position.value);
        zero.rotation.setValue(layer.rotation.value);

        Duik.Layer.copyAttributes(zero, layer, Duik.Layer.Type.ZERO);
        zero.label = layer.label;

        layer.parent = zero;
        zero.scale.setValue(layer.scale.value);
        layer.scale.setValue([100, 100, 100]);

        //parent
        zero.parent = layerparent;

        //lock and hide
        if (placeBelow) zero.moveAfter(layer);
        else zero.moveToEnd();
        zero.shy = true;
        zero.enabled = false;
        zero.selected = false;
        zero.locked = true;
        zeroes.push(zero);
    });

    DuAEProject.setProgressMode(false);
    DuAE.endUndoGroup( i18n._("Add zero"));

    return zeroes;
}

Duik.CmdLib['Constraint']["Move Anchor Point Top"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.TOP)";
Duik.CmdLib['Constraint']["Move Anchor Point Top Right"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.TOP_RIGHT)";
Duik.CmdLib['Constraint']["Move Anchor Point Right"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.RIGHT)";
Duik.CmdLib['Constraint']["Move Anchor Point Bottom Right"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.BOTTOM_RIGHT)";
Duik.CmdLib['Constraint']["Move Anchor Point Bottom"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.BOTTOM)";
Duik.CmdLib['Constraint']["Move Anchor Point Bottom Left"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.BOTTOM_LEFT)";
Duik.CmdLib['Constraint']["Move Anchor Point Left"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.LEFT)";
Duik.CmdLib['Constraint']["Move Anchor Point Top Left"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.TOP_LEFT)";
Duik.CmdLib['Constraint']["Move Anchor Point Center"] = "Duik.Constraint.moveAnchorPoint(DuMath.Location.CENTER)";
/**
 * Repositions the anchor points of the layers
 * @param {DuMath.Location} location The new location of the anchor points relative to the layer bounds.
 * @param {Number} [m=0.0] A margin, in pixels.
 * @param {Boolean} [includeMasks=false] Use masks to compute the bounds.
 * @param {Layer[]|LayerCollection|DuList|Layer} [layers=DuAEComp.getSelectedLayers()] The layer. If omitted, will use all selected layers in the comp
 */
Duik.Constraint.moveAnchorPoint = function(location, m, includeMasks, layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    m = def(m, 0);
    includeMasks = def(includeMasks, false);

    DuAE.beginUndoGroup( i18n._("Move anchor points"), false);
    DuAEProject.setProgressMode(true);

    layers.do(function(layer) {
        // Get the current values
        var apProp = layer.transform.anchorPoint;
        var layerBounds = DuAELayer.sourceRect(layer, undefined, false, includeMasks);

        var t = layerBounds[0];
        var l = layerBounds[1];
        var w = layerBounds[2];
        var h = layerBounds[3];

        var ap = apProp.value;
        var x = ap[0];
        var y = ap[1];

        // Update
        if (location == DuMath.Location.TOP) {
            DuAELayer.repositionAnchorPoint(layer, [l + w / 2, t - m]);
        } else if (location == DuMath.Location.TOP_RIGHT) {
            DuAELayer.repositionAnchorPoint(layer, [l + w + m, t - m]);
        } else if (location == DuMath.Location.RIGHT) {
            DuAELayer.repositionAnchorPoint(layer, [l + w + m, t + h / 2]);
        } else if (location == DuMath.Location.BOTTOM_RIGHT) {
            DuAELayer.repositionAnchorPoint(layer, [l + w + m, t + h + m]);
        } else if (location == DuMath.Location.BOTTOM) {
            DuAELayer.repositionAnchorPoint(layer, [l + w / 2, t + h + m]);
        } else if (location == DuMath.Location.BOTTOM_LEFT) {
            DuAELayer.repositionAnchorPoint(layer, [l - m, t + h + m]);
        } else if (location == DuMath.Location.LEFT) {
            DuAELayer.repositionAnchorPoint(layer, [l - m, t + h / 2]);
        } else if (location == DuMath.Location.TOP_LEFT) {
            DuAELayer.repositionAnchorPoint(layer, [l - m, t - m]);
        } else if (location == DuMath.Location.CENTER) {
            DuAELayer.repositionAnchorPoint(layer, [l + w / 2, t + h / 2]);
        }
    });

    // Reselect
    DuAEComp.selectLayers(layers);

    DuAEProject.setProgressMode(false);
    DuAE.endUndoGroup( i18n._("Move anchor points"));
}

Duik.CmdLib['Constraint']["Reset Transformation"] = "Duik.Constraint.resetPRS()";
Duik.CmdLib['Constraint']["Reset Transformation and opacity"] = "Duik.Constraint.resetPRS(undefined, true)";
/**
 * Resets the transformation of the selected layers to 0.
 * @param {Layer[]|LayerCollection|DuList.<Layer>|Layer} [layers=DuAEComp.getSelectedLayers()] The layer. If omitted, will use all selected layers in the comp
 * @param {Boolean} [opacity=false] When true, also resets the opacity to 100%
 */
Duik.Constraint.resetPRS = function(layers, opacity) {
    opacity = def(opacity, false);
    layers = def(layers, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup(i18n._("Reset transformation"), false);
    DuAEProject.setProgressMode(true);

    layers.do(function(layer) {
        var comp = layer.containingComp;
        //is it 3D?
        var threeD = layer.threeDLayer;
        //has parent ?
        var parent = layer.parent !== null;
        if (threeD) {
            var positionValue = parent ? [0, 0, 0] : [comp.width / 2, comp.height / 2, 0];
            if (layer.transform.position.dimensionsSeparated) {
                layer.transform.xPosition.setValue(positionValue[0]);
                layer.transform.yPosition.setValue(positionValue[1]);
                layer.transform.zPosition.setValue(positionValue[2]);
            } else {
                layer.transform.position.setValue(positionValue);
            }
            layer.transform.scale.setValue([100, 100, 100]);
            layer.transform.zRotation.setValue(0);
            layer.transform.xRotation.setValue(0);
            layer.transform.yRotation.setValue(0);
            layer.transform.orientation.setValue([0, 0, 0]);
        } else {
            var positionValue = parent ? [0, 0] : [comp.width / 2, comp.height / 2];
            var position = new DuAEProperty(layer.transform.position);
            position.setValue(positionValue)
            var scale = new DuAEProperty(layer.transform.scale);
            scale.setValue([100,100]);
            var rotation = new DuAEProperty(layer.transform.rotation);
            rotation.setValue(0);
        }

        if (opacity) layer.transform.opacity.setValue(100);
    });

    DuAEProject.setProgressMode(false);
    DuAE.endUndoGroup(i18n._("Reset transformation"));
}

Duik.CmdLib['Constraint']["Align layers"] = "Duik.Constraint.alignLayers()";
/**
 * Align selected Layers to the last selected one
 * @param {Boolean} [position=true] - whether to align the position.
 * @param {Boolean} [rotation=true] - whether to align the rotation.
 * @param {Boolean} [scale=true] - whether to align the scale.
 * @param {Boolean} [opacity=true] - whether to align the opacity.
 */
Duik.Constraint.alignLayers = function(position, rotation, scale, opacity) {
    position = def(position, true);
    rotation = def(rotation, true);
    scale = def(scale, true);
    opacity = def(opacity, false);


    var layers = DuAEComp.getSelectedLayers();
    if (layers.length <= 1) return;

    var target = layers.pop();

    DuAE.beginUndoGroup( i18n._("Align layers"), false);
    DuAELayer.align(
        layers,
        target,
        position,
        rotation,
        scale,
        opacity
    );
    DuAE.endUndoGroup( i18n._("Align layers"));
}

Duik.CmdLib['Constraint']["Expose Transform"] = "Duik.Constraint.exposeTransform()";
/**
 * Expose Transform
 * @param {CompItem} [comp] The composition where to create the expose transform controller. The active composition by default.
 * @param {Layer[]|DuList} [layers] The layer with the transformation to expose. The selected layers by default. Can be an empty list too, in this case the Expose Transform controller is not set to measure any layer.
 * @return {ShapeLayer[]} The list of the new Expose Transform controllers. One per given layer.
 */
Duik.Constraint.exposeTransform = function(comp, layers) {
    if (typeof comp === 'undefined') {
        if (typeof layer !== 'undefined') {
            comp = layer.containingComp;
        } else {
            comp = DuAEProject.getActiveComp();
        }
    }
    if (!comp) return;

    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Expose transform"), false);
    DuAEProject.setProgressMode(true);

    var ctrls = [];

    // ETMs must be shape layers
    var previousCtrlLayerMode = OCO.config.get('after effects/controller layer type', Duik.Controller.LayerMode.SHAPE);
    OCO.config.set('after effects/controller layer type', Duik.Controller.LayerMode.SHAPE);

    function createETM(layer) {
        var ctrl = Duik.Controller.create(comp, Duik.Controller.Type.EXPOSE_TRANSFORM, layer);

        //add pseudo effect
        var pE = Duik.PseudoEffect.EXPOSE_TRANSFORM;
        var effect = pE.apply(ctrl);

        // indices
        var guideIndex = pE.props['Display']['Guides'].index;
        var refColorIndex = pE.props['Display']['Reference'].index;
        var targetColorIndex = pE.props['Display']['Target'].index;
        var angleColorIndex = pE.props['Display']['Angle'].index;
        var distanceColorIndex = pE.props['Display']['Distance'].index;
        var pos2DAbsIndex = pE.props['2D Position (Comp projection)']['Absolute'].index;
        var dist2DIndex = pE.props['2D Position (Comp projection)']['2D Distance'].index;
        var pos3DAbsIndex = pE.props['3D Position (World)']['Absolute'].index;
        var pos2DRelIndex = pE.props['2D Position (Comp projection)']['Relative to reference'].index;
        var pos3DRelIndex = pE.props['3D Position (World)']['Relative to reference'].index;
        var dist3DIndex = pE.props['3D Position (World)']['3D Distance'].index;
        var rotRelIndex = pE.props['2D Orientation']['Relative to reference'].index;
        var rotAbsIndex = pE.props['2D Orientation']['Absolute'].index;
        var angleIndex = pE.props['Angle (Layer-This-Reference)'].index;
        var targetIndex = pE.props['Target Layer'].index;
        var refParentIndex = pE.props['Reference'].index;
        var refIndex = pE.props['Reference Layer'].index;

        //add guides
        var guidesGroup = ctrl("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        guidesGroup.name = 'Guides';

        var refGroup = guidesGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        refGroup.name = 'Reference';

        var refOrientationGroup = refGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        refOrientationGroup.name = 'Orientation';
        var refOrientation = refOrientationGroup("ADBE Vectors Group");

        var path = refOrientation.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = [0,0];',
            '	var B = [ 0 , -thisComp.height/20 ];',
            '	createPath([A,B],[],[],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        path = refOrientation.addProperty("ADBE Vector Shape - Ellipse");
        path("ADBE Vector Ellipse Size").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'var s = thisComp.height/40;',
            'if (fx(' + guideIndex + ').value) [s,s];',
            'else [0,0];'
        ].join('\n');

        var stroke = refOrientation.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + refColorIndex + ').value;';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        var refOrientationTransform = refOrientationGroup('ADBE Vector Transform Group');
        refOrientationTransform('ADBE Vector Position').expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'var P = fx(' + pos2DAbsIndex + ');',
            'var R = fx(' + pos2DAbsIndex + ') - fx(' + pos2DRelIndex + ');',
            'fromComp(R);'
        ].join('\n');
        refOrientationTransform('ADBE Vector Rotation').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\ncontent("Guides").content("Target").transform.rotation + content("Guides").content("Target").content("Reference Orientation").transform.rotation;'

        var targetGroup = guidesGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        targetGroup.name = 'Target';

        var targetOrientationGroup = targetGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        targetOrientationGroup.name = 'Orientation';
        var targetOrientation = targetOrientationGroup("ADBE Vectors Group");

        path = targetOrientation.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = [0,0];',
            '	var B = [ 0 , -thisComp.height/10 ];',
            '	createPath([A,B],[],[],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        path = targetOrientation.addProperty("ADBE Vector Shape - Ellipse");
        path("ADBE Vector Ellipse Size").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'var s = thisComp.height/20;',
            'if (fx(' + guideIndex + ').value) [s,s];',
            'else [0,0];'
        ].join('\n');

        stroke = targetOrientation.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + targetColorIndex + ');';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        refOrientationGroup = targetGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        refOrientationGroup.name = 'Reference Orientation';
        refOrientation = refOrientationGroup("ADBE Vectors Group");

        path = refOrientation.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = [0,0];',
            '	var B = [ 0 , -thisComp.height/20 ];',
            '	createPath([A,B],[],[],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        stroke = refOrientation.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + refColorIndex + ');';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        refOrientationTransform = refOrientationGroup('ADBE Vector Transform Group');

        refOrientationTransform('ADBE Vector Rotation').expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            '-fx(' + rotRelIndex + ');'
        ].join('\n');

        var targetTransform = targetGroup('ADBE Vector Transform Group');
        targetTransform('ADBE Vector Position').expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	fromComp(fx(' + pos2DAbsIndex + '));',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');
        targetTransform('ADBE Vector Rotation').expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'var result = fx(' + rotAbsIndex + ');',
            'var l = thisLayer;',
            'result -= l.rotation.value;',
            'while(l.hasParent)',
            '{',
            '	l = l.parent;',
            '	result -= l.rotation.value;',
            '}',
            'result;'
        ].join('\n');

        var angleGroup = guidesGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        angleGroup.name = 'Angle';

        var angleGroup1 = angleGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        var angle1 = angleGroup1("ADBE Vectors Group");

        path = angle1.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("Expose Transform");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = fromComp(fx(' + pos2DAbsIndex + '));',
            '	var B = fromComp( fx(' + pos2DAbsIndex + ') - fx(' + pos2DRelIndex + ') );',
            '	createPath([A,[0,0],B],[],[],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        stroke = angle1.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + angleColorIndex + ');';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        var angleGroup2 = angleGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        var angle2 = angleGroup2("ADBE Vectors Group");

        path = angle2.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = fromComp(fx(' + pos2DAbsIndex + '));',
            '	var B = fromComp( fx(' + pos2DAbsIndex + ') - fx(' + pos2DRelIndex + ') );',
            '	var M = (A+B)/2;',
            '	var tA = [0,0];',
            '	var tB = [0,0];',
            '	var lB = length(B);',
            '	var lA = length(A);',
            '	if (lA > lB)',
            '	{',
            '		var q = 1;',
            '		if (lA != 0) q = lB/lA;',
            '		A = A/3*q;',
            '		B = B/3;',
            '		tA = M/6*q;',
            '		tB = M/6;',
            '	}',
            '	else',
            '	{',
            '		var q = 1;',
            '		if (lB != 0) q = lA/lB;',
            '		A = A/3;',
            '		B = B/3*q;',
            '		tA = M/6;',
            '		tB = M/6*q;',
            '	}',
            '	createPath([A,B],[ [0,0], tB ],[ tA, [0,0] ],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        stroke = angle2.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + angleColorIndex + ');';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        var distanceGroup = guidesGroup("ADBE Vectors Group").addProperty("ADBE Vector Group");
        distanceGroup.name = 'Distance';
        var distance = distanceGroup("ADBE Vectors Group");

        path = distance.addProperty("ADBE Vector Shape - Group");
        path("ADBE Vector Shape").expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = effect("' + effect.name + '");',
            'if (fx(' + guideIndex + ').value)',
            '{',
            '	var A = fromComp(fx(' + pos2DAbsIndex + '));',
            '	var B = fromComp( fx(' + pos2DAbsIndex + ') - fx(' + pos2DRelIndex + ') );',
            '	createPath([A,B],[],[],false);',
            '}',
            'else',
            '{',
            '	value;',
            '}'
        ].join('\n');

        stroke = distance.addProperty("ADBE Vector Graphic - Stroke");
        stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\neffect("Expose Transform")(' + distanceColorIndex + ');';
        stroke("ADBE Vector Stroke Width").expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Dash 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/100;';
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
        stroke("ADBE Vector Stroke Dashes").property('ADBE Vector Stroke Gap 1').expression = DuAEExpression.Id.EXPOSE_TRANSFORM + '\nthisComp.height/500;';

        //Effect expressions

        effect(pos2DAbsIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var l = null;',
            'try { l = fx(' + targetIndex + '); } catch (e){ }',
            'if (!l) l = thisLayer;',
            'var result = l.toComp(l.anchorPoint);',
            'result;'
        ].join('\n');

        effect(pos2DRelIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var useParent = fx(' + refParentIndex + ').value;',
            'var layerPosition = fx(' + pos2DAbsIndex + ');',
            'var referencePosition = [0,0];',
            'var rL = null;',
            'if (useParent)',
            '{',
            '   var l = null;',
            '	try { l = fx(' + targetIndex + '); } catch (e){ }',
            '   if (!l) l = thisLayer;',
            '	if (l.hasParent) rL = l.parent;',
            '	else rL = l;',
            '}',
            'else',
            '{',
            '	try { rL = fx(' + refIndex + '); } catch (e){ }',
            '   if (!rL) rL = thisLayer;',
            '}',
            'referencePosition = rL.toComp(rL.anchorPoint);',
            'var result = layerPosition - referencePosition;',
            'result;'
        ].join('\n');

        effect(dist2DIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var relativePosition = fx(' + pos2DRelIndex + ');',
            'var result = length( relativePosition );',
            'result;'
        ].join('\n');

        effect(pos3DAbsIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var l = null;',
            'try { l = fx(' + targetIndex + '); } catch (e){ }',
            'if (!l) l = thisLayer;',
            'var result = l.toWorld(l.anchorPoint);',
            'result;'
        ].join('\n');

        effect(pos3DRelIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var layerPosition = fx(' + pos3DAbsIndex + ');',
            'var useParent = fx(' + refParentIndex + ').value;',
            'var rL = null;',
            'if (useParent)',
            '{',
            '   var l = null;',
            '	try { l = fx(' + targetIndex + '); } catch (e){ }',
            '   if (!l) l = thisLayer;',
            '	if (l.hasParent) rL = l.parent;',
            '	else rL = l;',
            '}',
            'else',
            '{',
            '	try { rL = fx(' + refIndex + '); } catch (e){ }',
            '   if (!rL) rL = thisLayer;',
            '}',
            'var referencePosition = rL.toWorld(rL.anchorPoint);',
            'var result = layerPosition - referencePosition;',
            'result;'
        ].join('\n');

        effect(dist3DIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var relativePosition = fx(' + pos3DRelIndex + ');',
            'var result = length( relativePosition );',
            'result;'
        ].join('\n');

        effect(rotAbsIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var l = null;',
            'try { l = fx(' + targetIndex + ') } catch (e){ }',
            'if (!l) l = thisLayer;',
            'var result = l.rotation;',
            'if (l.position.value.length == 3) result += l.orientation[2];',
            'while(l.hasParent)',
            '{',
            '	l = l.parent;',
            '	result += l.rotation;',
            '	if (l.position.value.length == 3) result += l.orientation[2];',
            '}',
            'result;'
        ].join('\n');

        effect(rotRelIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var useParent = fx(' + refParentIndex + ').value;',
            'var rot = fx(' + rotAbsIndex + ');',
            'var result = value;',
            'var rL = null;',
            'if (useParent)',
            '{',
            '   var l = null;',
            '	try { l = fx(' + targetIndex + '); } catch (e){ }',
            '   if (!l) l = thisLayer;',
            '	if (l.hasParent) rL = l.parent;',
            '	else rL = l;',
            '}',
            'else',
            '{',
            '	try { rL = fx(' + refIndex + '); } catch (e){ }',
            '   if (!rL) rL = thisLayer;',
            '}',
            'var refRot = rL.rotation.value;',
            'if (rL.position.value.length == 3) refRot += rL.orientation.value[2];',
            'while(rL.hasParent)',
            '{',
            '	rL = rL.parent;',
            '	refRot += rL.rotation.value;',
            '	if (rL.position.value.length == 3) refRot += rL.orientation.value[2];',
            '}',
            'result = rot - refRot;',
            'result;'
        ].join('\n');

        effect(angleIndex).expression = [DuAEExpression.Id.EXPOSE_TRANSFORM,
            'var fx = thisProperty.propertyGroup();',
            'var useParent = fx(' + refParentIndex + ').value;',
            'var O = thisLayer.toComp(thisLayer.anchorPoint);',
            'var l = null;',
            'var rL = null;',
            'try { l = fx(' + targetIndex + '); } catch (e){ }',
            'if (!l) l = thisLayer;',
            'if (useParent)',
            '{',
            '	if (l.hasParent) rL = l.parent;',
            '	else rL = l;',
            '}',
            'else',
            '{',
            '	try { rL = fx(' + refIndex + '); } catch (e){ }',
            '   if (!rL) rL = thisLayer;',
            '}',
            'var A = l.toComp(l.anchorPoint);',
            'var B = rL.toComp(rL.anchorPoint);',
            'var OA = O-A;',
            'var OB = O-B;',
            'var angleA = Math.atan2(OA[1], OA[0]);',
            'var angleB = Math.atan2(OB[1], OB[0]);',
            'var result = angleA + angleB;',
            'result = radiansToDegrees(angleB-angleA);',
            'if (result < -180) result += 360;',
            'result;'
        ].join('\n');

        //set the layer as target
        if (typeof layer !== 'undefined') {
            effect(targetIndex).setValue(layer.index);
        }

        //fold
        ctrl.selected = true;
        DuAE.executeCommand(DuAE.MenuCommandID.REVEAL_EXPRESSION_ERRORS);

        return ctrl;
    }

    if (layers.length() == 0) ctrls.push(createETM());
    else {
        for (var i = 0, num = layers.length(); i < num; i++) {
            var ctrl = createETM(layers.at(i));
            ctrls.push(ctrl);
        }
    }

    // Reset original controller mode
    OCO.config.set('after effects/controller layer type', previousCtrlLayerMode);

    DuAEComp.selectLayers(ctrls);
    DuAEProject.setProgressMode(false);
    DuAE.endUndoGroup( i18n._("Expose transform"));

    return ctrls;
}

Duik.CmdLib['Constraint']["Morph Keys"] = "Duik.Constraint.morphKeys()";
/**
 * Morph Keys
 */
Duik.Constraint.morphKeys = function(props) {
    props = def(props, DuAEComp.getSelectedProps());
    if (props.length == 0) return;

    // Get layer
    var layer = new DuAEProperty(props[0]).layer;

    DuAE.beginUndoGroup( i18n._("Key Morph"), false);

    // Add key morph effect
    var peKM = Duik.PseudoEffect.KEY_MORPH;
    var peKMK = Duik.PseudoEffect.KEY_MORPH_K;
    var kmEffect = peKM.apply(layer);
    var kmEffectName = kmEffect.name;
    var kmp = peKM.props;
    var kmkp = peKMK.props;

    // number of keys expression
    kmEffect(kmp['Number of keys'].index).expression = [DuAEExpression.Id.KEY_MORPH,
        'var numK = 0;',
        '',
        'function checkDuikEffect(fx, duikMatchName) {',
        '    if (fx.numProperties  < 3) return false;',
        '    if (!!$.engineName) {',
        '        if ( fx(2).name != duikMatchName ) return false;',
        '    }',
        '    else {',
        '        try { if (fx(2).name != duikMatchName) return false; }',
        '        catch (e) { return false; }',
        '    }',
        '    return true;',
        '}',
        '',
        'for (var i = 1, n = thisLayer(\'Effects\').numProperties; i <= n; i++) {',
        '	if (!checkDuikEffect( thisLayer.effect(i), "key morph k")) continue;',
        '	numK++;',
        '}',
        '',
        'numK;'
    ].join('\n');

    // Count keyframes & add expression
    var numKeys = 1;
    for (var i = 0, n = props.length; i < n; i++) {
        var p = props[i];

        var pInfo = new DuAEProperty(p);
        p = pInfo.getProperty();

        if (!pInfo.riggable()) continue;
        var np = p.numKeys;
        if (np < 2) continue;

        // count keyframes
        if (numKeys < 2) numKeys = np;
        else if (np < numKeys) numKeys = np;

        // add expression
        p.expression = [DuAEExpression.Id.KEY_MORPH,
            'var ctrlLayer = thisComp.layer("' + layer.name + '");',
            'var cumulative = !ctrlLayer.effect("' + kmEffectName + '")(' + kmp['Weights'].index + ').value;',
            '',
            'var result = zero();',
            'var weights = [];',
            'var sumWeights = 0;',
            'var nKeys = 0;',
            'var thisIsPath = isPath(thisProperty);',
            '',
            '// If path, oVal must be a path',
            'var oVal;',
            'if (thisIsPath) oVal = getPath(0);',
            'else oVal = valueAtTime(0);',
            '',
            DuAEExpression.Library.get([
                'zero',
                'isPath',
                'getPath',
                'addPath',
                'subPath',
                'multPath',
                'multPoints',
                'addPoints',
                'subPoints',
                'checkDuikEffect',
                'normalizeWeights',
            ]),
            '',
            '// Get weights and count keys to apply',
            'var k = 0;',
            'for (var i = 1, n = ctrlLayer("Effects").numProperties; i <= n; i++) {',
            '  var fx = ctrlLayer.effect(i);',
            '  if (!checkDuikEffect(fx, "key morph k")) continue;',
            '  k++;',
            '  if (k > numKeys) break;',
            '  var weight = fx(4).value / 100;',
            '  weights.push(weight);',
            '  sumWeights += weight;',
            '  if (weight > 0) nKeys++;',
            '}',
            '',
            '// Normalize weights',
            'if (!cumulative) {',
            '  weights = normalizeWeights(weights, sumWeights);',
            '  sumWeights = 1;',
            '}',
            '',
            '// Sum values',
            'for (var i = 0, n = weights.length; i < n; i++) {',
            '  if (i > numKeys) break;',
            '  // Ignore the neutral (first) one if cumulative',
            '  if (cumulative && i == 0) continue;',
            '  var w = weights[i];',
            '  // Ignore if no weight',
            '  if (w == 0) continue;',
            '  if (thisIsPath) {',
            '    var p = getPath(key(i + 1).time);',
            '    // if cumulative, add the weighted difference',
            '    if (cumulative) {',
            '      var dif = subPath(p, oVal, 1);',
            '      result = addPath(result, dif, w);',
            '    }',
            '    else result = addPath(result, p, w);',
            '  } else {',
            '    // if cumulative, add the weighted difference',
            '    if (cumulative) {',
            '      var dif = key(i + 1).value - oVal;',
            '      result += dif * w;',
            '    }',
            '    else result += key(i + 1).value * w;',
            '  }',
            '',
            '}',
            '',
            '// Weights',
            'if (nKeys > 0) {',
            '  // If not cumulative, the sum of the weights should be 1, nothing to do.',
            '  // If cumulative, we need to add the neutral',
            '  if (cumulative) {',
            '    if (thisIsPath) result = addPath(result, oVal, 1);',
            '    else result += oVal;',
            '  }',
            '} else {',
            '  if (thisIsPath) result = getPath(0);',
            '  else result = valueAtTime(0);',
            '}',
            '',
            'if (thisIsPath) createPath(result.points, result.inTangents, result.outTangents, isClosed());',
            'else result;'
        ].join('\n');

    }

    // Add Key effects
    for (var i = 0; i < numKeys; i++) {
        var kmkFX = peKMK.apply(layer);

        // Weight expression
        kmkFX(kmkp['Weight'].index).expression = [DuAEExpression.Id.KEY_MORPH,
            'var selection = effect("' + kmEffectName + '")(' + kmp["Key Selection"].index + ');',
            'var thisIndex = thisProperty.propertyGroup(1)(' + kmkp["Key Index"].index + ').value;',
            '',
            DuAEExpression.Library.get([
                'getNextKey',
                'getPrevKey'
            ]),
            '',
            'function interpolate()',
            '{',
            '  var pK = getPrevKey(time, selection);',
            '  var nK = getNextKey(time, selection);',
            '',
            '  if (!pK && !nK && Math.round(selection.value) == thisIndex) return 100;',
            '	var nValue = 0;',
            '	var pValue = 0;',
            '	if(nK) nValue = Math.round(nK.value);',
            '	if(pK) pValue = Math.round(pK.value);',
            '  if (!pK && !nK) return 0;',
            '  if (!pK && nValue == thisIndex) return 100;',
            '  if (!pK) return 0;',
            '  if (!nK && pValue == thisIndex) return 100;',
            '  if (!nK) return 0;',
            '  if (pValue != thisIndex && nValue != thisIndex) return 0;',
            '  if (pValue == nValue) return 100;',
            '  if (pValue == thisIndex && pValue < nValue)',
            '      return linear( selection.value, nValue, pValue, 100, 0 );',
            '  if (pValue == thisIndex && pValue >= nValue)',
            '       return linear( selection.value, pValue, nValue, 0, 100 );',
            '  if (pValue < nValue)',
            '      return linear( selection.value, pValue, nValue, 0, 100 );',
            '  return linear( selection.value, pValue, nValue, 100, 0 );',
            '}',
            '',
            'var result = value + interpolate();',
            '',
            'result;'
        ].join('\n');

        kmkFX(kmkp['Key Index'].index).expression = [DuAEExpression.Id.KEY_MORPH,
            'var numK = 1;',
            '',
            DuAEExpression.Library.get([
                'checkDuikEffect'
            ]),
            '',
            'for (var i = 1, n = thisProperty.propertyGroup(1).propertyIndex; i < n; i++) {',
            '	if (!checkDuikEffect( thisLayer.effect(i), "key morph k")) continue;',
            '	numK++;',
            '}',
            '',
            'numK;'
        ].join('\n');
    }

    DuAE.endUndoGroup( i18n._("Key Morph"));
}

Duik.CmdLib['Constraint']["IK"] = "Duik.Constraint.ik()";
Duik.CmdLib['Constraint']["IK (2+1-layer)"] = "Duik.Constraint.ik(Duik.Constraint.IKType.TWO_ONE)";
Duik.CmdLib['Constraint']["IK (1+2-layer)"] = "Duik.Constraint.ik(Duik.Constraint.IKType.ONE_TWO)";
Duik.CmdLib['Constraint']["B\u00e9zier IK"] = "Duik.Constraint.ik(undefined, true)";
Duik.CmdLib['Constraint']["B\u00e9zier FK"] = "Duik.Constraint.ik(undefined, true, undefined, undefined, true)";
/**
 * Creates an IK on the layers
 * @param {Duik.IKType} [type=Duik.Constraint.IKType.ONE_TWO] The type of IK to use with three layers.
 * @param {boolean} [forceBezier=false] - force the use of a bezier IK even with two or three layers
 * @param {Layer[]|LayerCollection|DuList.<Layer>|Layer} [layers=DuAEComp.getSelectedLayers()] The layer. If omitted, will use all selected layers in the comp
 * @param {Layer} [controller] - An already existing controller.
 * @param {boolean} [bezierFK=false] - If forceBezier, adds a layer for FK Control
 * @return {Layer[]} The controller(s) of the IK.
 */
Duik.Constraint.ik = function(type, forceBezier, layers, controller, bezierFK) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);
    if (layers.length() < 1) return [];

    DuAE.beginUndoGroup( i18n._("IK"), false);

    type = def(type, Duik.Constraint.IKType.ONE_TWO)
    forceBezier = def(forceBezier, false);
    controller = def(controller, null);

    //check if there is a controller in the selection
    if (controller == null) {
        if (layers.length < 2) return [];
        for (var i = 0, n = layers.length(); i < n; i++) {
            var l = layers.at(i);
            if (Duik.Layer.isType(l, Duik.Layer.Type.CONTROLLER)) {
                controller = l;
                layers.remove(i);
                break;
            }
        }
    }

    //sort layers and parent them
    layers = DuAELayer.sortByParent(layers);

    //reset rotation and scale if structures
    layers = new DuList(layers);
    layers.do(Duik.Bone.resetTransform);
    //parent
    DuAELayer.parentChain(layers);

    //check if the last one is a goal
    var withGoal = true;
    if (controller != null) {
        var l = layers.last();
        //check position
        var distance = DuAELayer.getDistance(controller, l);
        if (distance > 10) withGoal = false;
    }
    var goal = null;
    if (withGoal) goal = layers.pop();

    if (layers.length() == 1 && !forceBezier) controller = [Duik.Constraint.oneLayerIK(layers.at(0), goal, controller)];
    else if (layers.length() == 2 && !forceBezier) controller = [Duik.Constraint.twoLayerIK(layers.at(0), layers.at(1), goal, controller)];
    else if (layers.length() == 3 && !forceBezier && type == Duik.Constraint.IKType.ONE_TWO) controller = [Duik.Constraint.oneTwoLayerIK(layers.at(0), layers.at(1), layers.at(2), goal, controller)];
    else if (layers.length() == 3 && !forceBezier && type == Duik.Constraint.IKType.TWO_ONE) controller = [Duik.Constraint.twoOneLayerIK(layers.at(0), layers.at(1), layers.at(2), goal, controller)];
    else if (layers.length() == 3 && !forceBezier && type == Duik.Constraint.IKType.THREE) controller = [Duik.Constraint.threeLayerIK(layers.at(0), layers.at(1), layers.at(2), goal, controller)];
    else if (!bezierFK) controller = Duik.Constraint.bezierIK(layers, goal, controller);
    else controller = Duik.Constraint.bezierFK(layers, goal, controller);

    DuAE.endUndoGroup( i18n._("IK"));

    return controller;
}

/**
 * Creates a one-layer-ik on the layer
 * @param {Layer} layer - The layer
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|Controller|null} [controller] - The layer to use as a controller, can be automatically created.<br />
 * Must be provided if goal is undefined
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @return {Layer} The controller created
 */
Duik.Constraint.oneLayerIK = function(layer, goal, controller, showGuides) {
    goal = def(goal, null);
    controller = def(controller, null);
    if (controller == null && goal == null) throw "You must provide either a goal layer or a controller";
    var comp = layer.containingComp;

    showGuides = def(showGuides, 1);
    if (!showGuides) showGuides = 0;

    //Create controller
    if (controller == null) {
        controller = Duik.Controller.create(comp, Duik.Controller.Type.POSITION, goal);
    }

    //is right ?
    var ctrlPos = DuAELayer.getWorldPos(controller);
    var layerPos = DuAELayer.getWorldPos(layer);

    var right = (ctrlPos[0] - layerPos[0]) < 0;

    //Add Effect
    var name = Duik.Layer.name(layer);
    if (goal != null) name = Duik.Layer.name(goal);
    var pe = Duik.PseudoEffect.ONE_LAYER_IK
    var effect = pe.apply(controller, i18n._("IK") + ' | ' + name);

    //indices
    var reverseIndex = pe.props["Advanced"]["Full rotation limit"].index;
    var layerIndex = pe.props["Data"]["Layer"].index;
    var ikIndex = pe.props["IK"].index;
    var guidesIndex = pe.props["Display"]["Draw guides"].index;
    var weightIndex = pe.props["Weight"].index;
    var fkIndex = pe.props["FK"].index;
    var parentIndex = pe.props["Advanced"]["Parent rotation"].index;
    var ulIndex = pe.props["Limits"]["Upper limit"].index;
    var llIndex = pe.props["Limits"]["Lower limit"].index;
    var lsIndex = pe.props["Limits"]["Softness"].index;

    //default values
    if (right) effect(reverseIndex).setValue(1);
    effect(layerIndex).setValue(layer.index);
    effect(ulIndex).setValue(180);
    effect(llIndex).setValue(-180);
    effect(guidesIndex).setValue(showGuides);

    //guides
    if (DuAE.version.version >= 15 && controller instanceof ShapeLayer) {
        var lineGroup = controller("ADBE Root Vectors Group").property('IK Line');
        if (!lineGroup) {
            lineGroup = controller("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            lineGroup.name = 'IK Line';
        }
        var lineContent = lineGroup.property("ADBE Vectors Group");
        var shape = lineContent.addProperty("ADBE Vector Shape - Group");
        shape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       result = [l,[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');
        var stroke = lineContent.property("ADBE Vector Graphic - Stroke");
        var ctrlEffect = controller.effect(Duik.PseudoEffect.CONTROLLER.matchName);
        if (!stroke) stroke = lineContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + Duik.PseudoEffect.CONTROLLER.props['Icon']['Color'].index + ')-[0.2,0.2,0.2,0]';
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

        var limitsGroup = controller("ADBE Root Vectors Group").property('IK Limits');
        if (!limitsGroup) {
            limitsGroup = controller("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            limitsGroup.name = 'IK Limits';
        }
        limitsGroup.transform.position.expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var l = null;',
            'try{ l = fx(' + layerIndex + '); }catch(e){}',
            'var result = value;',
            'if (l != null)',
            '{',
            '	var p = l.toWorld(l.anchorPoint);',
            '	result = fromWorld(p);',
            '}',
            'result;'
        ].join('\n');
        limitsGroup.transform.rotation.expression = DuAEExpression.Id.ONE_IK + '\n-rotation;';

        var limitLinesGroup = limitsGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Group");
        limitLinesGroup.name = 'Limit Lines';
        limitLinesGroup.transform.rotation.expression = [DuAEExpression.Id.ONE_IK,
            DuAEExpression.Library.get(['getOrientation']),
            '',
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = value;',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1 != null)',
            '   {',
            '       if (layer1.hasParent) result = getOrientation(layer1.parent);',
            '   }',
            '}',
            'result;'
        ].join('\n');

        var limitLinesContent = limitLinesGroup.property("ADBE Vectors Group");
        var lLimitGroup = limitLinesContent.addProperty("ADBE Vector Group");
        lLimitGroup.name = 'Lower Limit';
        lLimitGroup.transform.rotation.expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'fx(' + llIndex + ').value-180;'
        ].join('\n');

        var lLimitContent = lLimitGroup.property("ADBE Vectors Group");
        lLimitShape = lLimitContent.addProperty("ADBE Vector Shape - Group");
        lLimitShape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       l = length(l) * .5;',
            '       if (!fx(' + reverseIndex + ').value) l = -l;',
            '       result = [[l,0],[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        stroke = lLimitContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + Duik.PseudoEffect.CONTROLLER.props['Icon']['Color'].index + ')-[0.2,0.2,0.2,0]';
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);

        var uLimitGroup = limitLinesContent.addProperty("ADBE Vector Group");
        uLimitGroup.name = 'Upper Limit';
        uLimitGroup.transform.rotation.expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'fx(' + ulIndex + ').value-180;'
        ].join('\n');

        var uLimitContent = uLimitGroup.property("ADBE Vectors Group");
        uLimitShape = uLimitContent.addProperty("ADBE Vector Shape - Group");
        uLimitShape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       l = length(l) * .5;',
            '       if (!fx(' + reverseIndex + ').value) l = -l;',
            '       result = [[l,0],[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        stroke = uLimitContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + Duik.PseudoEffect.CONTROLLER.props['Icon']['Color'].index + ')-[0.2,0.2,0.2,0]';
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);

        var lSftnssGroup = limitLinesContent.addProperty("ADBE Vector Group");
        lSftnssGroup.name = 'Lower Softness';
        lSftnssGroup.transform.rotation.expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'fx(' + llIndex + ').value-180+fx(' + lsIndex + ').value;'
        ].join('\n');

        var lSftnssContent = lSftnssGroup.property("ADBE Vectors Group");
        lSftnssShape = lSftnssContent.addProperty("ADBE Vector Shape - Group");
        lSftnssShape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       l = length(l) * .4;',
            '       if (!fx(' + reverseIndex + ').value) l = -l;',
            '       result = [[l,0],[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        stroke = lSftnssContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + Duik.PseudoEffect.CONTROLLER.props['Icon']['Color'].index + ')-[0.2,0.2,0.2,0]';
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

        var uSftnssGroup = limitLinesContent.addProperty("ADBE Vector Group");
        uSftnssGroup.name = 'Upper Softness';
        uSftnssGroup.transform.rotation.expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'fx(' + ulIndex + ').value-180-fx(' + lsIndex + ').value;'
        ].join('\n');

        var uSftnssContent = uSftnssGroup.property("ADBE Vectors Group");
        uSftnssShape = uSftnssContent.addProperty("ADBE Vector Shape - Group");
        uSftnssShape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       l = length(l) * .4;',
            '       if (!fx(' + reverseIndex + ').value) l = -l;',
            '       result = [[l,0],[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        stroke = uSftnssContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + Duik.PseudoEffect.CONTROLLER.props['Icon']['Color'].index + ')-[0.2,0.2,0.2,0]';
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

        var flGroup = limitsGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Group");
        flGroup.name = 'Flip Line';
        var flContent = flGroup.property("ADBE Vectors Group");
        flShape = flContent.addProperty("ADBE Vector Shape - Group");
        flShape('ADBE Vector Shape').expression = [DuAEExpression.Id.ONE_IK,
            'var fx = effect("' + effect.name + '");',
            'var layer1 = null;',
            'var result = [[0,0]];',
            'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
            '{',
            '   try{ layer1 = fx(' + layerIndex + '); }catch(e){}',
            '   if (layer1!=null)',
            '   {',
            '       var l = layer1.toWorld(layer1.anchorPoint);',
            '       l = fromWorld(l);',
            '       l = length(l) * .3;',
            '       if (!fx(' + reverseIndex + ').value) l = -l;',
            '       result = [[l,0],[0,0]];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        stroke = flContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\n' + DuColor.Color.RAINBOX_RED.floatRGBA().toSource();
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);

        //close controller details
        controller.selected = true;
        DuAE.executeCommand(DuAE.MenuCommandID.REVEAL_EXPRESSION_ERRORS, true);
    }

    //Add Data
    var layerData = layer('ADBE Effect Parade').addProperty('ADBE Layer Control');
    layerData.name =  DuAELayer.newUniqueEffectName( i18n._("IK"), layer );
    layerData(1).setValue(controller.index);
    //Expression
    var expr = [DuAEExpression.Id.ONE_IK,
        'var ctrl = null;',
        'var result = 0;',
        DuAEExpression.Library.get(['limit']),
        'try {',
        '	ctrl = effect("' + layerData.name + '")(1);',
        '} catch (e) {',
        '	result = value;',
        '}',
        'if (ctrl != null) {',
        '	var C = ctrl.toWorld(ctrl.anchorPoint);',
        '	var O = thisLayer.toWorld(thisLayer.anchorPoint);',
        '	var fx = ctrl.effect("' + effect.name + '");',
        '	var weight = fx(' + weightIndex + ').value / 100;',
        '	var fk = fx(' + fkIndex + ').value;',
        '	var rev = fx(' + reverseIndex + ').value;',
        '	var useIK = fx(' + ikIndex + ').value;',
        '	var parentRot = fx(' + parentIndex + ').value;',
        '	var uLimit = fx(' + ulIndex + ').value;',
        '	var lLimit = fx(' + llIndex + ').value;',
        '	var lmtSftnss = fx(' + lsIndex + ').value;',
        '	result = fk;',
        '	if (useIK) {',
        '		var vec = rev == 1 ? O - C : C - O;',
        '		var layer = thisLayer;',
        '		if (layer.hasParent && parentRot) result += layer.parent.rotation.value;',
        '		while (layer.hasParent) {',
        '			layer = layer.parent;',
        '			result = result - layer.rotation;',
        '		}',
        '		var angle = Math.atan2(vec[1], vec[0]);',
        '		angle = radiansToDegrees(angle);',
        '		angle = angle * weight;',
        '		result += angle;',
        '	}',
        '',
        '   if (result > 180) result -= 360;',
        '   else if (result < -180) result += 360;',
        '',	
        '	result = limit(result, lLimit, uLimit, lmtSftnss) + value;',
        '}',
        'result;'
    ].join('\n');

    var rotProp = new DuAEProperty(layer.transform.rotation);
    rotProp.setExpression(expr);

    if (goal != null) {
        var goalData = goal('ADBE Effect Parade').addProperty('ADBE Layer Control');
        goalData.name = i18n._("IK");
        goalData(1).setValue(controller.index);
        expr = [DuAEExpression.Id.ONE_IK,
            'var ctrl = null;',
            'var result = value;',
            'try { ctrl = effect("' + goalData.name + '")(1); } catch (e){ value };',
            'if (ctrl != null)',
            '{',
            'var goal = ctrl.effect("' + effect.name + '")(' + ikIndex + ').value;',
            'result += ctrl.rotation.value;',
            'if (goal)',
            '{',
            'var layer = thisLayer;',
            'while (layer.hasParent)',
            '{',
            'layer = layer.parent;',
            'result = result - layer.rotation;',
            '}',
            '}',
            '}',
            'result;'
        ].join('\n');

        rotProp = new DuAEProperty(goal.transform.rotation);
        rotProp.setExpression(expr);
    }

    return controller;
}

/**
 * Creates a two-layer-ik on the layer
 * @param {Layer} layer1 - The root layer
 * @param {Layer} layer2 - The end layer
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|null} [controller] - The layer to use as a controller, can be automatically created.<br />
 * Must be provided if goal is undefined
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @return {Layer} The controller created
 */
Duik.Constraint.twoLayerIK = function(layer1, layer2, goal, controller, showGuides) {
    goal = def(goal, null);
    controller = def(controller, null);
    if (controller == null && goal == null) throw "You must provide either a goal layer or a controller";
    var comp = layer1.containingComp;

    showGuides = def(showGuides, true);

    //Create controller
    if (controller == null) {
        controller = Duik.Controller.create(comp, Duik.Controller.Type.TRANSFORM, goal);
        goal.parent = null;
        controller.transform.rotation.setValue(goal.transform.rotation.value);
        goal.parent = layer2;
    }

    // We do need a goal
    var lockGoal = false;
    if (goal == null) {
        goal = DuAEComp.addNull(comp, 20, controller);
        Duik.Layer.copyAttributes( goal, controller, Duik.Layer.Type.IK );
        goal.parent = layer2;
        goal.enabled = false;
        lockGoal = true;
    }

    //Check if clockwise and lengths

    //unparent
    var rootParent = layer1.parent;
    layer1.parent = null;
    var middleParent = layer2.parent;
    layer2.parent = null;
    var endParent = controller.parent;
    controller.parent = null;

    var clockwise = false;

    var l1pos = layer1.transform.position.value;
    var l2pos = layer2.transform.position.value;
    var cpos = controller.transform.position.value;
    /// @ts-ignore
    var endPos = cpos - l1pos;
    /// @ts-ignore
    var middlePos = l2pos - l1pos;
    /// @ts-ignore
    var gpos = cpos - l2pos;
    if (endPos[0] == 0 && endPos[1] > 0 && middlePos[0] > 0) clockwise = true;
    else if (endPos[0] == 0 && endPos[1] < 0 && middlePos[0] < 0) clockwise = true;
    else {
        var coef = endPos[1] / endPos[0];
        if (middlePos[1] < middlePos[0] * coef && endPos[0] > 0) clockwise = true;
        if (middlePos[1] > middlePos[0] * coef && endPos[0] < 0) clockwise = true;
    }

    // Get l2 relative position
    /// @ts-ignore
    l2pos = l2pos - l1pos;

    //reparent
    layer1.parent = rootParent;
    layer2.parent = middleParent;
    controller.parent = endParent;

    //add effect
    var name = Duik.Layer.name(layer2);
    if (goal != null) name = Duik.Layer.name(goal);
    var pe = Duik.PseudoEffect.TWO_LAYER_IK;
    var effect = pe.apply(controller, i18n._("IK") + ' | ' + name);

    // indices
    var ikIndex = pe.props["IK / FK"].index;
    var weightIndex = pe.props["Weight"].index;
    var sideIndex = pe.props["Side"].index;

    var swingIndex = pe.props["Auto swing"]["Auto swing"].index;
    var swingSftnssIndex = pe.props["Auto swing"]["Softness"].index;
    var swingLimitIndex = pe.props["Auto swing"]["Limit angle"].index;
    var swingRevIndex = pe.props["Auto swing"]["Reverse"].index;

    var pRotationIndex = pe.props["FK"]["Parent rotation"].index;
    var lFKIndex = pe.props["FK"]["Lower"].index;
    var endFKIndex = pe.props["FK"]["End"].index;

    var overlapAnimIndex = pe.props["FK Overlap"]["Animation"].index;
    var resistanceIndex = pe.props["FK Overlap"]["Resistance"].index;
    var flexibilityIndex = pe.props["FK Overlap"]["Flexibility"].index;
    var overlapIndex = pe.props["FK Overlap"]["Overlap"].index;

    var stretchIndex = pe.props["Stretch"]["Stretch"].index;
    var upperStretchIndex = pe.props["Stretch"]["Upper Stretch"].index;
    var lowerStretchIndex = pe.props["Stretch"]["Lower Stretch"].index;
    var autoStretchIndex = pe.props["Stretch"]["Auto-Stretch"].index;

    var uLayerIndex = pe.props["Data"]["Layers"]["Upper"].index;
    var lLayerIndex = pe.props["Data"]["Layers"]["Lower"].index;
    var gLayerIndex = pe.props["Data"]["Layers"]["Goal"].index;

    var uLengthIndex = pe.props["Data"]["Base values"]["Upper"].index;
    var lLengthIndex = pe.props["Data"]["Base values"]["Lower"].index;
    var limbLengthIndex = pe.props["Data"]["Base values"]["Limb"].index;
    var uWorldPosIndex = pe.props["Data"]["Base values"]["Upper world position"].index;
    var lRelativePosIndex = pe.props["Data"]["Base values"]["Lower relative position"].index;
    var goalRelativePosIndex = pe.props["Data"]["Base values"]["Goal relative position"].index;
    var ctrlWorldPosIndex = pe.props["Data"]["Base values"]["Controller world position"].index;
    var ctrlDistanceIndex = pe.props["Data"]["Base values"]["Controller distance"].index;

    var uStretchIndex = pe.props["Data"]["Stretch data"]["Upper"].index;
    var uScaleIndex = pe.props["Data"]["Stretch data"]["Upper scale"].index;
    var lStretchIndex = pe.props["Data"]["Stretch data"]["Lower"].index;
    var lScaleIndex = pe.props["Data"]["Stretch data"]["Lower scale"].index;
    var limbStretchedIndex = pe.props["Data"]["Stretch data"]["Limb"].index;
    var lRelativeStretchedIndex = pe.props["Data"]["Stretch data"]["Lower relative position"].index;
    var ikGoalPosIndex = pe.props["Data"]["Stretch data"]["IK Goal world position"].index;
    var fkGoalPosIndex = pe.props["Data"]["Stretch data"]["FK Goal relative position"].index;
    var ikGoalDistanceIndex = pe.props["Data"]["Stretch data"]["IK Goal distance"].index;
    var straightIndex = pe.props["Data"]["Stretch data"]["Straight"].index;

    var uAngleIndex = pe.props["Data"]["Angles"]["Upper angle"].index;
    var lAngleIndex = pe.props["Data"]["Angles"]["Lower angle"].index;
    var gAngleIndex = pe.props["Data"]["Angles"]["Goal angle"].index;

    var guidesIndex = pe.props["Display"]["Draw guides"].index;

    // Default values
    /// @ts-ignore
    effect(guidesIndex).setValue(showGuides ? 1 : 0);

    /// @ts-ignore
    if (clockwise) effect(sideIndex).setValue(-100);
    /// @ts-ignore
    else effect(sideIndex).setValue(100);

    //set layers
    /// @ts-ignore
    effect(uLayerIndex).setValue(layer1.index);
    /// @ts-ignore
    effect(lLayerIndex).setValue(layer2.index);
    /// @ts-ignore
    if (goal != null) effect(gLayerIndex).setValue(goal.index);

    //set initial position
    /// @ts-ignore
    effect(lRelativePosIndex).setValue([l2pos[0],l2pos[1]]);
    /// @ts-ignore
    effect(goalRelativePosIndex).setValue([gpos[0], gpos[1]]);
    DuAEProperty.lock([effect(lRelativePosIndex),  effect(goalRelativePosIndex)]);

    //add expressions

    /// @ts-ignore
    effect(sideIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var auto = fx(' + swingIndex + ').value;',
        'var result = value;',
        'if (auto)',
        '{',
        '	var reversed = fx(' + swingRevIndex + ').value;',
        '   var sftnss = fx(' + swingSftnssIndex + ').value;',
        '   var limitAngle = fx(' + swingLimitIndex + ').value;',
        '	var ctrlPos = fx(' + ctrlWorldPosIndex + ').value;',
        '	var upperPos = fx(' + uWorldPosIndex + ').value;',
        '	',
        '	var lowerLimit = limitAngle - sftnss;',
        '	var upperLimit = limitAngle + sftnss;',
        '	',
        '	var vec = ctrlPos - upperPos;',
        '	var angle = Math.atan2(vec[1], vec[0]);',
        '	angle = radiansToDegrees(angle);',
        '	angle = linear(angle, lowerLimit, upperLimit, -100, 100);',
        '	if(reversed) angle = -angle;',
        '	result = angle;',
        '}',
        '',
        'result;'
    ].join('\n');

    /// @ts-ignore
    effect(uLengthIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var lowerPos = fx(' + lRelativePosIndex + ').value;',
        'length(lowerPos);'
	].join('\n');

    /// @ts-ignore
    effect(lLengthIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var lowerPos = fx(' + goalRelativePosIndex + ').value;',
        'length(lowerPos);'
	].join('\n');

    /// @ts-ignore
    effect(limbLengthIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var upperLength = fx(' + uLengthIndex + ').value;',
        'var lowerLength = fx(' + lLengthIndex + ').value;',
        'upperLength + lowerLength;'
	].join('\n');

    /// @ts-ignore
    effect(uWorldPosIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var upperLayer = null;',
        'var result = value;',
        'function getLayerWorldPos(t, l) {',
        '	if (typeof t === \'undefined\') t = time;',
        '	if (typeof l === \'undefined\') l = thisLayer;',
        '	if (l.hasParent) return l.parent.toWorld(l.position, t);',
        '	else return l.transform.position.valueAtTime(t);',
        '}',
        'try {upperLayer = fx(' + uLayerIndex + ') } catch(e) {}',
        'if (upperLayer) {',
        '	result = getLayerWorldPos(time, upperLayer);',
        '} ',
        'result;'
	].join('\n');

    /// @ts-ignore
    effect(ctrlWorldPosIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'function getLayerWorldPos(t, l) {',
        '	if (typeof t === \'undefined\') t = time;',
        '	if (typeof l === \'undefined\') l = thisLayer;',
        '	if (l.hasParent) return l.parent.toWorld(l.position, t);',
        '	return l.position.valueAtTime(t);',
        '}',
        'getLayerWorldPos();'
	].join('\n');

    /// @ts-ignore
    effect(ctrlDistanceIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var upperPos = fx(' + uWorldPosIndex + ').value;',
        'var ctrlPos = fx(' + ctrlWorldPosIndex + ').value;',
        'length(ctrlPos, upperPos);'
	].join('\n');

    /// @ts-ignore
    effect(uStretchIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var stretch = fx(' + stretchIndex + ').value;',
        'stretch += fx(' + upperStretchIndex + ').value;',
        'var limbStretch = stretch + fx(' + lowerStretchIndex + ').value;',
        'var auto = fx(' + autoStretchIndex + ').value;',
        'var ik = fx(' + ikIndex + ').value;',
        'ik *= fx(' + weightIndex + ').value;',
        'ik /= 100;',
        'var side = fx(' + sideIndex + ').value;',
        'side /= 100;',
        'side = 1 - Math.abs(side);',
        'var upperLength = fx(' + uLengthIndex + ').value;',
        'var limbLength = fx(' + limbLengthIndex + ').value;',
        'var ctrlDistance = fx(' + ctrlDistanceIndex + ').value;',
        'if (limbLength != 0) {',
        '	var stretchedLength = limbLength + limbStretch;',
        '	var ratio = upperLength / limbLength;',
        '	var maxShrink = stretchedLength * side;',
        '	var shrink = 0;',
        '	var boneStretch = 0;',
        '	if (ctrlDistance < stretchedLength) shrink = (1 - ctrlDistance / stretchedLength) * ik;',
        '	boneStretch = -linear( shrink, 0, maxShrink) * ratio;',
        '	if (ctrlDistance > stretchedLength && auto) boneStretch += ((ctrlDistance - limbLength) * ratio)*ik;',
        '	else boneStretch += stretch * ratio;',
        'boneStretch + upperLength;',
        '}',
        'else value;'
	].join('\n');

    /// @ts-ignore
    effect(uScaleIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var upperLength = fx(' + uLengthIndex + ').value;',
        'var boneStretch = fx(' + uStretchIndex + ').value;',
        'var c = 1;',
        'if (upperLength != 0) c = boneStretch / upperLength;',
        'c*100;'
	].join('\n');

    /// @ts-ignore
    effect(lStretchIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var stretch = fx(' + stretchIndex + ').value;',
        'stretch += fx(' + lowerStretchIndex + ').value;',
        'var limbStretch = stretch + fx(' + upperStretchIndex + ').value;',
        'var auto = fx(' + autoStretchIndex + ').value;',
        'var ik = fx(' + ikIndex + ').value;',
        'ik *= fx(' + weightIndex + ').value;',
        'ik /= 100;',
        'var side = fx(' + sideIndex + ').value;',
        'side /= 100;',
        'side = 1 - Math.abs(side);',
        'var lowerLength = fx(' + lLengthIndex + ').value;',
        'var limbLength = fx(' + limbLengthIndex + ').value;',
        'var ctrlDistance = fx(' + ctrlDistanceIndex + ').value;',
        'if (limbLength != 0) {',
        '	var stretchedLength = limbLength + limbStretch;',
        '	var ratio = lowerLength / limbLength;',
        '	var maxShrink = stretchedLength * side;',
        '	var shrink = 0;',
        '	var boneStretch = 0;',
        '	if (ctrlDistance < stretchedLength) shrink = (1 - ctrlDistance / stretchedLength) * ik;',
        '	boneStretch = -linear( shrink, 0, maxShrink) * ratio;',
        '	if (ctrlDistance > stretchedLength && auto) boneStretch += ((ctrlDistance - limbLength) * ratio)*ik;',
        '	else boneStretch += stretch * ratio;',
        '	boneStretch + lowerLength;',
        '}',
        'else value;',
        ''
	].join('\n');

    /// @ts-ignore
    effect(lScaleIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var lowerLength = fx(' + lLengthIndex + ').value;',
        'var boneStretch = fx(' + lStretchIndex + ').value;',
        'var c = 1;',
        'if (lowerLength != 0) c = boneStretch / lowerLength;',
        'c*100;'
	].join('\n');

    /// @ts-ignore
    effect(limbStretchedIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var upperStretchedLength = fx(' + uStretchIndex + ').value;',
        'var lowerStretchedLength = fx(' + lStretchIndex + ').value;',
        'upperStretchedLength + lowerStretchedLength;'
	].join('\n');

    /// @ts-ignore
    effect(lRelativeStretchedIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var lowerPos = fx(' + lRelativePosIndex + ').value;',
        'var upperScale = fx(' + uScaleIndex + ').value;',
        'upperScale /= 100;',
        'lowerPos * upperScale;'
	].join('\n');

    /// @ts-ignore
    effect(ikGoalPosIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var ctrlDistance = fx('  + ctrlDistanceIndex + ').value;',
        'var ctrlPos = fx('  + ctrlWorldPosIndex + ').value;',
        'var limbLength = fx('  + limbStretchedIndex + ').value;',
        'var upperPos = fx('  + uWorldPosIndex + ').value;',
        'var result = [0,0];',
        '',
        'var result = ctrlPos;',
        'if (limbLength < ctrlDistance) { ',
        '	var ratio = limbLength / ctrlDistance;',
        '	var vec = sub(ctrlPos, upperPos);',
        '	vec *= ratio;',
        '	result = upperPos + vec;',
        '}',
        '',
        'result;'
	].join('\n');

    /// @ts-ignore
    effect(fkGoalPosIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var lowerVec = fx(' + goalRelativePosIndex + ').value;',
        'var lowerScale = fx(' + lScaleIndex + ').value;',
        'lowerVec * lowerScale / 100;'
	].join('\n');

    /// @ts-ignore
    effect(ikGoalDistanceIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var goal = null;',
        'try { goal = fx(' + gLayerIndex + '); } catch (e) {}',
        'if (goal) {',
        '    var p = goal.toWorld(goal.anchorPoint);',
        '    var u = fx(' + uWorldPosIndex + ').value;',
        '    length(u, p);',
        '} else value;'
	].join('\n');

    /// @ts-ignore
    effect(straightIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var limbLength = fx(' + limbStretchedIndex + ').value;',
        'var ctrlDistance = fx(' + ctrlDistanceIndex + ').value;',
        'if (limbLength <= ctrlDistance) 1;',
        'else 0;'
	].join('\n');

    /// @ts-ignore
    effect(uAngleIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var ikfk = fx(' + ikIndex + ').value;',
        'ikfk *= fx(' + weightIndex + ').value / 100;',
        '',
        DuAEExpression.Library.get(['dishineritRotation']),
        '',
        'function ik() {',
        '	var side = fx(' + sideIndex + ').value;',
        '	var cw = side < 0;',
        '	var upperPos = fx(' + uWorldPosIndex + ').value;',
        '	var ctrlPos = fx(' + ctrlWorldPosIndex + ').value;',
        '	var a = fx(' + lStretchIndex + ').value;',
        '	var b = fx(' + ctrlDistanceIndex + ').value;',
        '	var c = fx(' + uStretchIndex + ').value;',
        '	var upperVec = fx(' + lRelativeStretchedIndex + ').value;',
        '	if (c == 0) return value;',
        '	var x = (b * b + c * c - a * a) / (2 * b);',
        '	var alpha = Math.acos(clamp(x / c, -1, 1));',
        '	var ctrlVec = ctrlPos - upperPos;',
        '	var delta = Math.atan2(ctrlVec[1], ctrlVec[0]);',
        '	var r = radiansToDegrees(delta - (cw ? 1 : -1) * alpha);',
        '	var adj1 = radiansToDegrees(Math.atan2(upperVec[1], upperVec[0]));',
        '	var IK = r - adj1 + value;',
        '	IK = IK % 360;',
        '	if (IK > 180) return IK - 360;',
        '	if (IK < -180) return IK + 360;',
        '	return IK;',
        '}',
        '',
        'function fk() {',
        'var follow = fx(11).value;',
        'var FK = fx(12).value + fx(18).value;',
        'var l = null;',
        'try { l = fx(30); } catch(e) {}',
        'if (l)',
        '{',
        '    var r = l.rotation.value;',
        '    if (follow) r -= dishineritRotation(l);',
        '    FK += r;',
        '}',
        'return FK;',
        '}',
        'result = ik() * ikfk + fk() * (1 - ikfk);',
        'result;'
	].join('\n');

    /// @ts-ignore
    effect(lAngleIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var ikfk = fx(' + ikIndex + ').value;',
        'ikfk *= fx(' + weightIndex + ').value / 100;',
        '',
        'function ik() {',
        '	var side = fx(3).value;',
        '	var cw = side < 0;',
        '	var a = fx(' + lStretchIndex + ').value;',
        '	var b = fx(' + ctrlDistanceIndex + ').value;',
        '	var c = fx(' + uStretchIndex + ').value;',
        '	if (c == 0) return value;',
        '	var x = (b * b + c * c - a * a) / (2 * b);',
        '	var alpha = Math.acos(clamp(x / c, -1, 1));',
        '	var y = b - x;',
        '	var gamma = Math.acos(clamp(y / a, -1, 1));',
        '	var r = (cw ? 1 : -1) * radiansToDegrees(gamma + alpha);',
        '	var IK = r % 360;',
        '	if (IK > 180) return IK - 360;',
        '	if (IK < -180) return IK + 360;',
        '	return IK;',
        '}',
        '',
        'function fk() {',
        '	var ctrlRot = fx(' + overlapAnimIndex + ');',
        '	var delay = fx(' + resistanceIndex + ').value;',
        '	var amp = fx(' + flexibilityIndex + ').value;',
        '	var follow = fx(' + pRotationIndex + ').value;',
        '	var ftEnabled = fx(' + overlapIndex + ').value;',
        '	var upperLayer = null;',
        '	try { upperLayer = fx(' + uLayerIndex + ') } catch(e) { return value };',
        '	if (!ftEnabled) {',
        '		amp = 0;',
        '		delay = 0;',
        '	} else {',
        '		delay = delay / 100;',
        '		amp = amp / 100;',
        '	}',
        '	FK = ctrlRot.valueAtTime(time - delay);',
        '	if (follow && hasParent) {',
        '		var cP = upperLayer;',
        '		while (cP.hasParent) {',
        '			cP = cP.parent;',
        '			FK -= cP.rotation.value - cP.rotation.valueAtTime(time - delay);',
        '		}',
        '	}',
        '	FK = FK - ctrlRot.value;',
        '	FK = FK * amp;',
        '	FK = FK - ctrlRot.velocity * (delay / 5);',
        '	FK += fx(' + lFKIndex + ').value;',
        '	return FK;',
        '}',
        'result = ik() * ikfk + fk() * (1 - ikfk);',
        '',
        'result;'
	].join('\n');

    /// @ts-ignore
    effect(gAngleIndex).expression = [DuAEExpression.Id.TWO_IK,
        'var fx = thisProperty.propertyGroup();',
        'var ikfk = fx(' + ikIndex + ').value;',
        'ikfk *= fx(' + weightIndex + ').value/100;',
        'var result = 0;',
        'var goalLayer = null;',
        'try { goalLayer = fx(' + gLayerIndex + '); } catch(e) {  }',
        'if (goalLayer) {',
        '	',
        '	function ik() {',
        '		var IK = thisLayer.rotation.value;',
        '		var layer = goalLayer;',
        '		while ( layer.hasParent ) {',
        '			layer = layer.parent;',
        '			IK = IK - layer.rotation;',
        '		}',
        '		return IK;',
        '	}',
        '',
        '	function fk() {',
        '		var FK = 0;',
        '		if (!goalLayer.hasParent) return 0;',
        '		var parentRot = goalLayer.parent.transform.rotation;',
        '		var delay = fx(' + resistanceIndex + ').value;',
        '		var amp = fx(' + flexibilityIndex + ').value;',
        '		var ftEnabled = fx(' + overlapIndex + ').value;',
        '',
        '		delay = delay / 100;',
        '		amp = amp / 100;',
        '',
        '		if (ftEnabled)',
        '		{',
        '			FK = parentRot.valueAtTime( time - delay );',
        '			FK = FK * amp;',
        '		}',
        '		',
        '		FK = FK + fx(' + endFKIndex + ');',
        '',
        '		if (ftEnabled)',
        '		{',
        '			FK = FK - parentRot.valueAtTime( 0 )',
        '		}',
        '		',
        '		return FK;',
        '	}',
        '	result = ik()*ikfk + fk()*(1-ikfk);',
        '}',
        '',
        'result;'
	].join('\n');

    //add controller visual feedback
    if (controller instanceof ShapeLayer) {
        // Will be null if baked / removed
        var peCtrl = Duik.PseudoEffect.CONTROLLER;
        var ctrlEffect = controller.effect(peCtrl.matchName);
        var iconColorIndex = peCtrl.props["Icon"]["Color"].index;
        var iconSizeIndex = peCtrl.props["Icon"]["Size"].index;
        var iconPosIndex = peCtrl.props["Icon"]["Position"].index;
        var iconOpacityIndex = peCtrl.props["Icon"]["Opacity"].index;

        // reusable expressions
        var colorExp = '';
        if (ctrlEffect) colorExp = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconColorIndex + ')-[0.2,0.2,0.2,0]';

        /// @ts-ignore
        var ikGroup = controller("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        ikGroup.name = 'IK';
        var ikContent = ikGroup.property("ADBE Vectors Group");
        var shape = ikContent.addProperty("ADBE Vector Shape - Group");
        var ikShape = new Shape();
        ikShape.vertices = [
            [-8, 16],
            [8, 16]
        ];
        ikShape.inTangents = [
            [0, 0],
            [0, 0]
        ];
        ikShape.outTangents = [
            [0, 0],
            [0, 0]
        ];
        ikShape.closed = false;
        shape('ADBE Vector Shape').setValue(ikShape);
        var stroke = ikContent.addProperty("ADBE Vector Graphic - Stroke");

        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = colorExp;
        else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);
        stroke("ADBE Vector Stroke Opacity").expression = [DuAEExpression.Id.TWO_IK,
            'var fx = effect("' + effect.name + '");\n' +
            'if (fx(' + guidesIndex + ').value) fx(' + straightIndex + ').value*100;',
            'else 0;'
        ].join('\n');

        if (ctrlEffect) ikGroup.transform.scale.expression = DuAEExpression.Id.CONTROLLER + '\n[ effect("' + ctrlEffect.name + '")(' + iconSizeIndex + ') * 2 ,effect("' + ctrlEffect.name + '")(' + iconSizeIndex + ') * 2 ]';
        if (ctrlEffect) ikGroup.transform.position.expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconPosIndex + ')';
        if (ctrlEffect) ikGroup.transform.opacity.expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconOpacityIndex + ') * effect("' + effect.name + '")(' + weightIndex + ').value/100;';

        if (DuAE.version.version >= 15) {
            var lineGroup = controller("ADBE Root Vectors Group").property('IK Line');
            if (!lineGroup) {
                lineGroup = controller("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                lineGroup.name = 'IK Line';
            }
            lineGroup.transform.opacity.expression = DuAEExpression.Id.TWO_IK + '\neffect("' + effect.name + '")(' + weightIndex + ').value;';
            var lineContent = lineGroup.property("ADBE Vectors Group");
            var shape = lineContent.addProperty("ADBE Vector Shape - Group");
            shape('ADBE Vector Shape').expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = [[0,0]];',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value)',
                '{',
                '   try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '   if (layer1!=null)',
                '   {',
                '       var l = layer1.toWorld(layer1.anchorPoint);',
                '       l = fromWorld(l);',
                '       result = [l,[0,0]];',
                '   }',
                '}',
                'createPath(result,[],[],false);'
            ].join('\n');

            var stroke = lineContent.property("ADBE Vector Graphic - Stroke");
            if (!stroke) stroke = lineContent.addProperty("ADBE Vector Graphic - Stroke");
            if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = colorExp;
            else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
            stroke("ADBE Vector Stroke Width").setValue(2);
            stroke("ADBE Vector Stroke Line Cap").setValue(2);
            stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
            stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

            var ikSideGroup = controller("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            ikSideGroup.name = "IK Swing";
            ikSideContent = ikSideGroup.property("ADBE Vectors Group");

            var upperLimitGroup = ikSideContent.addProperty("ADBE Vector Group");
            upperLimitGroup.name = "Upper Limit";
            var upperLimitContent = upperLimitGroup.property("ADBE Vectors Group");

            shape = upperLimitContent.addProperty("ADBE Vector Shape - Group");
            shape('ADBE Vector Shape').expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = [[0,0]];',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value)',
                '{',
                '	try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '	if ( layer1 != null)',
                '	{',
                '		var l = layer1.toWorld( layer1.anchorPoint );',
                '		l = fromWorld(l);',
                '		l = length(l) * .5;',
                '		result = [[l,0],[0,0]];',
                '	}',
                '}',
                'createPath(result,[],[],false);'
            ].join('\n');

            stroke = upperLimitContent.addProperty("ADBE Vector Graphic - Stroke");
            if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = colorExp;
            else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
            stroke("ADBE Vector Stroke Width").setValue(2);
            stroke("ADBE Vector Stroke Line Cap").setValue(2);
            stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
            stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

            upperLimitGroup.transform.rotation.expression = DuAEExpression.Id.TWO_IK + '\n-effect("' + effect.name + '")(' + swingSftnssIndex + ').value;';
            upperLimitGroup.transform.opacity.expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value) 100;',
                'else 0;'
            ].join('\n');

            var lowerLimitGroup = ikSideContent.addProperty("ADBE Vector Group");
            lowerLimitGroup.name = "Lower Limit";
            var lowerLimitContent = lowerLimitGroup.property("ADBE Vectors Group");

            shape = lowerLimitContent.addProperty("ADBE Vector Shape - Group");
            shape('ADBE Vector Shape').expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = [[0,0]];',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value)',
                '{',
                '	try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '	if ( layer1 != null)',
                '	{',
                '		var l = layer1.toWorld( layer1.anchorPoint );',
                '		l = fromWorld(l);',
                '		l = length(l) * .5;',
                '		result = [[l,0],[0,0]];',
                '	}',
                '}',
                'createPath(result,[],[],false);'
            ].join('\n');

            stroke = lowerLimitContent.addProperty("ADBE Vector Graphic - Stroke");
            if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = colorExp;
            else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
            stroke("ADBE Vector Stroke Width").setValue(2);
            stroke("ADBE Vector Stroke Line Cap").setValue(2);
            stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
            stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);

            lowerLimitGroup.transform.rotation.expression = DuAEExpression.Id.TWO_IK + '\neffect("' + effect.name + '")(' + swingSftnssIndex + ').value;';
            lowerLimitGroup.transform.opacity.expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value) 100;',
                'else 0;'
            ].join('\n');

            var angleGroup = ikSideContent.addProperty("ADBE Vector Group");
            angleGroup.name = "Lower Limit";
            var angleContent = angleGroup.property("ADBE Vectors Group");

            shape = angleContent.addProperty("ADBE Vector Shape - Group");
            shape('ADBE Vector Shape').expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = [[0,0]];',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value)',
                '{',
                '	try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '	if ( layer1 != null)',
                '	{',
                '		var l = layer1.toWorld( layer1.anchorPoint );',
                '		l = fromWorld(l);',
                '		l = length(l) * .8;',
                '		result = [[l,0],[0,0]];',
                '	}',
                '}',
                'createPath(result,[],[],false);'
            ].join('\n');

            stroke = angleContent.addProperty("ADBE Vector Graphic - Stroke");
            if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = colorExp;
            else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
            stroke("ADBE Vector Stroke Width").setValue(2);
            stroke("ADBE Vector Stroke Line Cap").setValue(2);

            angleGroup.transform.opacity.expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value) 100;',
                'else 0;'
            ].join('\n');

            ikSideGroup.transform.position.expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = value;',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value)',
                '{',
                '	try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '	if ( layer1 != null)',
                '	{',
                '		var l = layer1.toWorld( layer1.anchorPoint );',
                '		result = fromWorld( l );',
                '	}',
                '}',
                'result;'
            ].join('\n');

            ikSideGroup.transform.rotation.expression = [DuAEExpression.Id.TWO_IK,
                'var fx = effect("' + effect.name + '");',
                'var layer1 = null;',
                'var result = value;',
                '',
                DuAEExpression.Library.get(['getOrientation']),
                '',
                'if (fx(' + ikIndex + ').value && fx(' + guidesIndex + ').value && fx(' + swingIndex + ').value)',
                '{',
                '	try{ layer1 = fx(' + uLayerIndex + '); }catch (e) {}',
                '	if (layer1 != null)',
                '	{',
                '       if ( layer1.hasParent ) result = getOrientation( layer1.parent );',
                '		result += fx(' + swingLimitIndex + ').value;',
                '   }',
                '}',
                'result;'
            ].join('\n');
        }

        //close controller details
        controller.selected = true;
        DuAE.executeCommand(DuAE.MenuCommandID.REVEAL_EXPRESSION_ERRORS, true);
    }

    //setup layers
    var layer1Data = layer1('ADBE Effect Parade').addProperty('ADBE Layer Control');
    layer1Data.name = DuAELayer.newUniqueEffectName( i18n._("IK"), layer1 );
    layer1Data(1).setValue(controller.index);

    var l1rot = new DuAEProperty( layer1.transform.rotation );
    l1rot.setExpression( [DuAEExpression.Id.TWO_IK,
        '// Upper Bone',
        'var fx = null;',
        'var result = value;',
        DuAEExpression.Library.get(['dishineritRotation']),
        'try { fx = effect("' + layer1Data.name + '")(1).effect("' + effect.name + '"); } catch(e) {}',
        'if (fx && fx.active) {',
        '   result = dishineritRotation() - value;',
        '	result += fx(' + uAngleIndex + ').value;',
        '}',
        'result;'
	].join('\n') );

    var layer2Data = layer2('ADBE Effect Parade').addProperty('ADBE Layer Control');
    layer2Data.name = DuAELayer.newUniqueEffectName( i18n._("IK"), layer2 );
    layer2Data(1).setValue(controller.index);

    var l2rot = new DuAEProperty( layer2.transform.rotation );
    l2rot.setExpression( [DuAEExpression.Id.TWO_IK,
        '// Lower Bone',
        'var fx = null;',
        'var result = value;',
        'try { fx = effect("' + layer2Data.name + '")(1).effect("' + effect.name + '"); } catch(e) {}',
        'if (fx && fx.active) {',
        '	result += fx(' + lAngleIndex + ').value;',
        '}',
        'result;'
	].join('\n') );

    var l2pos = new DuAEProperty( layer2.transform.position );
    l2pos.setExpression( [DuAEExpression.Id.TWO_IK,
        '// Lower Bone',
        'var fx = null;',
        'var result = value;',
        'try { fx = effect("' + layer2Data.name + '")(1).effect("' + effect.name + '"); } catch(e) {}',
        'if (fx && fx.active) result += fx(' + lRelativeStretchedIndex + ').value;',
        'result;'
	].join('\n') );

    if (goal != null) {
        var goalData = goal('ADBE Effect Parade').addProperty('ADBE Layer Control');
        goalData.name = DuAELayer.newUniqueEffectName( i18n._("IK"), goal );
        goalData(1).setValue(controller.index);

        var rotExpr = [DuAEExpression.Id.TWO_IK,
            '// Goal',
            'var fx = null;',
            'var result = value;',
            'try { fx = effect("' + goalData.name + '")(1).effect("' + effect.name + '"); } catch(e) {}',
            'if (fx && fx.active) {',
            '	result += fx(' + gAngleIndex + ').value;',
            '}',
            'result;'
        ].join('\n');

        var rotProp = new DuAEProperty(goal.transform.rotation);
        rotProp.setExpression(rotExpr);

        var gpos = new DuAEProperty(goal.transform.position);
        gpos.setExpression( [DuAEExpression.Id.TWO_IK,
            '// Goal',
            'var fx = null;',
            'var result = value;',
            'try { fx = effect("' + goalData.name + '")(1).effect("' + effect.name + '"); } catch(e) {}',
            'if (fx && fx.active) result += fx(' + fkGoalPosIndex + ').value;',
            'result;'
	    ].join('\n') );

        if (lockGoal) goal.locked = true;
    }

    return controller;
}

/**
 * Creates a 1+2-layer-ik on the layer
 * @param {Layer} layer1 - The root layer
 * @param {Layer} layer2 - The middle layer
 * @param {Layer} layer3 - The end layer
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|null} [controller] - The layer to use as a controller, can be automatically created.<br />
 * Must be provided if goal is undefined
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @return {Layer} The controller created
 */
Duik.Constraint.oneTwoLayerIK = function(layer1, layer2, layer3, goal, controller, showGuides) {
    controller = Duik.Constraint.twoLayerIK(layer2, layer3, goal, controller, showGuides);
    Duik.Constraint.oneLayerIK(layer1, goal, controller, showGuides);
    var pe = Duik.PseudoEffect.ONE_LAYER_IK;
    controller.effect(pe.matchName)(pe.props["Weight"].index).setValue(50);
    controller.effect(pe.matchName)(pe.props["Limits"]["Softness"].index).setValue(160);
    return controller;
}

/**
 * Creates a 1+2-layer-ik on the layer
 * @param {Layer} layer1 - The root layer
 * @param {Layer} layer2 - The middle layer
 * @param {Layer} layer3 - The end layer
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|null} [controller] - The layer to use as a controller, can be automatically created.<br />
 * Must be provided if goal is undefined
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @return {Layer} The controller created
 */
Duik.Constraint.twoOneLayerIK = function(layer1, layer2, layer3, goal, controller, showGuides) {
    var comp = layer1.containingComp;
    goal = def(goal, null);
    controller = def(controller, null);
    if (controller == null && goal == null) throw "You must provide either a goal layer or a controller";
    // Null for the IK
    var n = DuAEComp.addNull(comp, 20);
    if (typeof goal !== 'undefined') Duik.Layer.copyAttributes(n, goal, Duik.Layer.Type.IK);
    else Duik.Layer.copyAttributes(n, layer3, Duik.Layer.Type.IK);
    // Move it to the third layer
    layer3.parent = null;
    n.transform.position.setValue(layer3.transform.position.value);
    n.moveBefore(layer3);
    layer3.parent = layer2;
    // Create a 2-layer IK
    Duik.Constraint.twoLayerIK(layer1, layer2, undefined, n, showGuides);
    // Create a 1-layer IK
    // Create controller
   if (controller == null) {
        controller = Duik.Controller.create(comp, Duik.Controller.Type.TRANSFORM, goal);
    }
    Duik.Constraint.oneLayerIK(layer3, goal, controller, showGuides);
    // Move the 2-layer effect to the controller
    var pe = Duik.PseudoEffect.TWO_LAYER_IK;
    var newEffect = pe.apply(controller);
    var oldEffect = n.effect(pe.matchName);
    if (oldEffect) {
        var oldEffectProp = new DuAEProperty(oldEffect);
        // Set side
        var sideIndex = pe.props["Side"].index;
        newEffect(sideIndex).setValue(oldEffect(sideIndex).value);
        oldEffectProp.linkProperties(newEffect, true);
    }
    // fix goal
    if (goal) {
        var goalAngleEffect = controller('ADBE Effect Parade').addProperty('ADBE Angle Control');
        goalAngleEffect.name = i18n._("Tip angle");
        var ikEffect = controller.effect(Duik.PseudoEffect.ONE_LAYER_IK.matchName);
        var layerEffect = DuAELayer.lastEffect(goal, 'ADBE Layer Control');

        var rotProp = new DuAEProperty(goal.transform.rotation);
        rotProp.setExpression([DuAEExpression.Id.TWO_ONE_IK,
            'var ctrl = null;',
            'var result = value;',
            'try { ctrl = effect("' + layerEffect.name + '")(1); } catch (e){ value };',
            'if (ctrl != null)',
            '{',
            '   var goal = ctrl.effect("' + ikEffect.name + '")(1).value;',
            '   if (goal)',
            '   {',
            '       result -= ctrl.rotation.value;',
            '       result += ctrl.effect("' + goalAngleEffect.name + '")(1).value;',
            '   }',
            '}',
            'result;'
        ].join('\n'));
    }
    //parent
    n.parent = controller;
    //hide & lock
    n.enabled = false;
    n.locked = true;

    return controller;
}

/**
 * Creates a bezier ik on the layers
 * @param {Layer[]|DuList} layers - The layers, ordered from root to end
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|null} [controller] - The layer to use as controller, can be automatically created.<br />
 * Must be provided if goal is undefined.
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @return {Layer[]} The controllers [curve,end,root]
 */
Duik.Constraint.bezierIK = function(layers, goal, controller, showGuides) {
    goal = def(goal, null);
    controller = def(controller, null);
    if (controller == null && goal == null)
        throw "You must provide either a goal layer or a controller";

    showGuides = def(showGuides, true);
    if (!showGuides)
        showGuides = false;

    DuAE.beginUndoGroup( i18n._("B\u00e9zier IK"), false);

    layers = new DuList(layers);

    if (layers.length() == 0) return [];
    //layers = new DuList( DuAELayer.sortByParent(layers) );
    var comp = layers.first().containingComp;

    //create controllers
    if (controller == null) {
        controller = Duik.Controller.create(comp, Duik.Controller.Type.TRANSFORM, goal);
        goal.parent = null;
        controller.transform.rotation.setValue(goal.transform.rotation.value);
    }

    // Keep the original position
    var controllerPosition = controller.transform.position.value;

    if (goal != null) goal.parent = controller;

    // Align all layers

    // Unparent children (will be reparented at the end)
    layers.do(function(layer) {
        layer.children = DuAELayer.getChildren( layer );
        // Unparent children
        for (var i = 0, ni = layer.children.length; i < ni; i++)
        {
            var child = layer.children[i];
            child.wasLocked = child.locked;
            child.locked = false;
            child.parent = null;
        }
    });

    // Parent them together to ease the alignment
    // And keep original positions and rotations to restore them later
    var originalPositions = [];
    var originalRotations = [];
    for(var i = 1, ni = layers.length(); i < ni; i++) {
        var layer = layers.at(i);
        layer.parent = null;
        originalPositions.push( layer.transform.position.value );
        originalRotations.push( layer.transform.rotation.value );
        layer.parent = layers.at(i-1);
    }
    // and the controller
    var ctrlRot = controller.transform.rotation.value;    
    controller.parent = layers.last();
    // Align
    for(var i = 1, ni = layers.length(); i < ni; i++) {
        // Get the angle
        var l = layers.at(i);
        var a = layers.at(i-1);
        var b = null;
        if (i != layers.length() -1) b = layers.at(i+1);
        else b = controller;
        var angle = 180 - DuAELayer.angleFromLayers(l, a, b);
        var currentRotation = l.transform.rotation.value;
        l.transform.rotation.setValue( currentRotation + angle );
    }
    // Unparent
    controller.parent = null;
    // Reset controller rotation
    controller.transform.rotation.setValue(ctrlRot);

    //add effect
    var name = Duik.Layer.name(layers.first());
    var pe = Duik.PseudoEffect.BEZIER_IK;
    var effect = pe.apply(controller, i18n._("IK") + ' | ' + name);

    var limbName = Duik.Layer.name(layers.first());

    //create curve controller
    // It has to be a shape
    var ctrlMode = OCO.config.get('after effects/controller layer type', Duik.Controller.LayerMode.SHAPE);
    if (ctrlMode == Duik.Controller.LayerMode.NULL || ctrlMode == Duik.Controller.LayerMode.RASTER)
        OCO.config.set('after effects/controller layer type', Duik.Controller.LayerMode.SHAPE);
    var curveController = Duik.Controller.create(comp, Duik.Controller.Type.POSITION, goal);
    OCO.config.set('after effects/controller layer type', ctrlMode);
    curveController.transform.scale.expression = '';
    curveController.name = curveController.name + "_Curve";
    Duik.Layer.setName(limbName + '_Curve', curveController);
    Duik.Controller.setSize(50, curveController);

    //create root controller
    var rootController = Duik.Controller.create(comp, Duik.Controller.Type.POSITION, layers.first());
    rootController.name = rootController.name + "_Root";
    Duik.Layer.setName(limbName + '_Root', rootController);
    Duik.Controller.setSize(50, rootController);

    //add effect
    var cPe = Duik.PseudoEffect.BEZIER_IK_CURVE;
    var curveEffect = cPe.apply(curveController);
    curveEffect(cPe.props["Controllers"]["Root"].index).setValue(rootController.index);
    curveEffect(cPe.props["Controllers"]["Curve"].index).setValue(curveController.index);
    curveEffect(cPe.props["Controllers"]["End"].index).setValue(controller.index);
    curveEffect(cPe.props["Draw guides"].index).setValue(showGuides ? 1 : 0);

    //useful positions
    var endPosition = DuAELayer.getWorldPos(controller);
    if (goal != null) endPosition = DuAELayer.getWorldPos(goal);
    var rootPosition = DuAELayer.getWorldPos(layers.first());
    curveController.transform.position.setValue((endPosition + rootPosition) / 2);
    var cOutPosition = (2 * endPosition + rootPosition) / 3;
    var cInPosition = (endPosition + 2 * rootPosition) / 3;

    //add handles
    var handleInGroup = curveController("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    handleInGroup.name = 'Handle In';
    handleInContent = handleInGroup.property("ADBE Vectors Group");
    var circle = handleInContent.addProperty("ADBE Vector Shape - Ellipse");
    circle("ADBE Vector Ellipse Size").setValue([25, 25]);
    var fill = handleInContent.addProperty("ADBE Vector Graphic - Fill");

    var ctrlPe = Duik.PseudoEffect.CONTROLLER;

    var ctrlEffect = curveController.effect(ctrlPe.matchName);
    var iconColorIndex = ctrlPe.props["Icon"]["Color"].index;
    var iconSizeIndex = ctrlPe.props["Icon"]["Size"].index;

    if (ctrlEffect) fill("ADBE Vector Fill Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconColorIndex + ')-[0.2,0.2,0.2,0]\n';
    else fill("ADBE Vector Fill Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
    if (ctrlEffect) handleInGroup.transform.scale.expression = DuAEExpression.Id.CONTROLLER + '\n[effect("' + ctrlEffect.name + '")(' + iconSizeIndex + '),effect("' + ctrlEffect.name + '")(' + iconSizeIndex + ')]';

    handleInGroup.transform.position.expression = [DuAEExpression.Id.BEZIER_IK,
        'var fx = effect("' + curveEffect.name + '");',
        'var root = null;',
        'var curve = thisLayer;',
        'var result = value;',
        'try { root = fx(' + cPe.props["Controllers"]["Root"].index + ') ;} catch(e){}',
        'if (root != null)',
        '{',
        '   var rootPos = root.toWorld(root.anchorPoint);',
        '   rootPos = fromWorld(rootPos);',
        '   result += rootPos/2;',
        '}',
        'result;'
    ].join('\n');
    //Auto handle position disabled as it messes up the order of the evaluation of the expressions
    //DuAEF.DuAE.Property.removeExpression(handleInGroup.transform.position);

    handleInGroup.transform.opacity.expression = DuAEExpression.Id.BEZIER_IK + '\nvar fx = effect("' + curveEffect.name + '");\n' +
        'fx(' + cPe.props["Show handles"].index + ').value * 100;';

    var handleOutGroup = curveController("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    handleOutGroup.name = 'Handle Out';
    handleOutContent = handleOutGroup.property("ADBE Vectors Group");
    var circle = handleOutContent.addProperty("ADBE Vector Shape - Ellipse");
    circle("ADBE Vector Ellipse Size").setValue([25, 25]);
    var fill = handleOutContent.addProperty("ADBE Vector Graphic - Fill");
    if (ctrlEffect) fill("ADBE Vector Fill Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconColorIndex + ')-[0.2,0.2,0.2,0]\n';
    else fill("ADBE Vector Fill Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
    if (ctrlEffect) handleOutGroup.transform.scale.expression = DuAEExpression.Id.CONTROLLER + '\n[effect("' + ctrlEffect.name + '")(' + iconSizeIndex + '),effect("' + ctrlEffect.name + '")(' + iconSizeIndex + ')]';

    handleOutGroup.transform.position.expression = [DuAEExpression.Id.BEZIER_IK,
        'var fx = effect("' + curveEffect.name + '");',
        'var end = null;',
        'var curve = thisLayer;',
        'var result = value;',
        'try { end = fx(' + cPe.props["Controllers"]["End"].index + '); } catch(e){}',
        'if (end != null)',
        '{',
        '   var endPos = end.toWorld(end.anchorPoint);',
        '   endPos = fromWorld(endPos);',
        '   result += endPos/2;',
        '}',
        'result;'
    ].join('\n');
    //Auto handle position disabled as it mess up the order of the evaluation of the expressions
    //DuAEF.DuAE.Property.removeExpression(handleOutGroup.transform.position);

    handleOutGroup.transform.opacity.expression = DuAEExpression.Id.BEZIER_IK + '\nvar fx = effect("' + curveEffect.name + '");\n' +
        'fx(' + cPe.props["Show handles"].index + ').value * 100;';

    //add line
    if (DuAE.version.version >= 15) {
        var lineGroup = curveController("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        lineGroup.name = 'IK Line';
        var lineContent = lineGroup.property("ADBE Vectors Group");
        var shape = lineContent.addProperty("ADBE Vector Shape - Group");
        shape('ADBE Vector Shape').expression = [DuAEExpression.Id.BEZIER_IK,
            'var fx = effect("' + curveEffect.name + '");',
            'var root = null;',
            'var curve = thisLayer;',
            'var end = null;',
            'var result = [[0,0]];',
            'if (fx(' + cPe.props["Draw guides"].index + ').value)',
            '{',
            '   try { root = fx(' + cPe.props["Controllers"]["Root"].index + '); end = fx(' + cPe.props["Controllers"]["End"].index + ') } catch(e){}',
            '   if (root != null)',
            '   {',
            '       var r = root.toWorld(root.anchorPoint);',
            '       r = fromWorld(r);',
            '       var e = end.toWorld(end.anchorPoint);',
            '       e = fromWorld(e);',
            '       var t1 = content("Handle In").transform.position;',
            '       var t2 = content("Handle Out").transform.position;',
            '       result = [r,t1,t2,e];',
            '   }',
            '}',
            'createPath(result,[],[],false);'
        ].join('\n');

        var stroke = lineContent.addProperty("ADBE Vector Graphic - Stroke");
        if (ctrlEffect) stroke("ADBE Vector Stroke Color").expression = DuAEExpression.Id.CONTROLLER + '\neffect("' + ctrlEffect.name + '")(' + iconColorIndex + ')-[0.2,0.2,0.2,0]\n';
        else stroke("ADBE Vector Stroke Color").setValue(DuColor.Color.APP_HIGHLIGHT_COLOR.darker(150).floatRGBA());
        stroke("ADBE Vector Stroke Width").setValue(2);
        stroke("ADBE Vector Stroke Line Cap").setValue(2);
        stroke("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
        stroke("ADBE Vector Stroke Dashes")("ADBE Vector Stroke Dash 1").setValue(5);
    }

    //close controller details
    curveController.selected = true;
    DuAE.executeCommand(DuAE.MenuCommandID.REVEAL_EXPRESSION_ERRORS, true);

    //setup layers
    var rootIndex = rootController.index;
    var endIndex = controller.index;
    var curveIndex = curveController.index;
    var totalLength = DuMath.length(rootPosition, cInPosition) + DuMath.length(cOutPosition, cInPosition) + DuMath.length(cOutPosition, endPosition);

    //un-parent
    for (var i = 0, n = layers.length(); i < n; i++) {
        layers.at(i).parent = null;
    }

    layers.first().parent = rootController;

    var lPe = Duik.PseudoEffect.BEZIER_IK_LAYER;

    for (var i = 0, n = layers.length(); i < n; i++) {
        var layer = layers.at(i);
        //add effect
        var layerEffect = lPe.apply(layer);
        layerEffect(lPe.props["Layers"]["Root"].index).setValue(rootIndex);
        layerEffect(lPe.props["Layers"]["Curve"].index).setValue(curveIndex);
        layerEffect(lPe.props["Layers"]["End"].index).setValue(endIndex);
        if (i < layers.length() - 1) layerEffect(lPe.props["Layers"]["Next"].index).setValue(layers.at(i + 1).index);
        else layerEffect(lPe.props["Layers"]["Next"].index).setValue(controller.index);

        //expressions

        //position
        if (i != 0) {
            var index = DuMath.length(endPosition, layer.transform.position.value);
            index = index / totalLength;
            var expression = [DuAEExpression.Id.BEZIER_IK,
                'var end = null;',
                'var root = null;',
                'var curve = null;',
                'var result = value;',
                'var thisFx = effect("' + layerEffect.name + '");',
                'try { end = thisFx(' + lPe.props["Layers"]["End"].index + '); curve = thisFx(' + lPe.props["Layers"]["Curve"].index + '); root = thisFx(' + lPe.props["Layers"]["Root"].index + '); }catch (e) {};',
                'if ( root != null && thisFx.active )',
                '{',
                '   var ind = ' + index + ';',
                '   var fx = end.effect("' + effect.name + '");',
                '   var offset = thisFx(' + lPe.props["Offset"].index + ')/100;',
                '   var generalOffset = fx(' + pe.props["Offset"].index + ')/100;',
                '   var endPosition = end.toComp(end.anchorPoint);',
                '   var rootPosition = root.toComp(root.anchorPoint);',
                '   var curvePosition1 = curve.toComp(curve.content("Handle Out").transform.position);',
                '   var curvePosition2 = curve.toComp(curve.content("Handle In").transform.position);',
                '   var t = ind + generalOffset + offset;',
                '   var c = 3*(curvePosition1 - endPosition);',
                '   var b = 3*(curvePosition2 - curvePosition1) - c;',
                '   var a = rootPosition - endPosition - c - b;',
                '   result += ((a*t +b )*t + c)*t + endPosition ;',
                '}',
                'else',
                '{',
                '   result += ' + originalPositions[i-1].toSource() + ';',
                '}',
                'result;'
            ].join('\n');

            var posProp = new DuAEProperty(layer.transform.position);
            posProp.setValue([0,0]);
            posProp.setExpression(expression, false);
        }

        //rotation
        var expr = [DuAEExpression.Id.BEZIER_IK,
            'var c = null;',
            'var result = value;',
            'var thisFx = effect("' + layerEffect.name + '");',
            'try{ c = thisFx(' + lPe.props["Layers"]["End"].index + ') }catch (e) {}',
            'if ( c != null && thisFx.active )',
            '{',
            '   var n = c;',
            '   try { n = thisFx(' + lPe.props["Layers"]["Next"].index + '); if (n.index == index) n = c; } catch (e) {}',
            '   var fx = c.effect("' + effect.name + '");',
            '   var autoOrient = fx(' + pe.props["Auto orient"].index + ').value;',
            '   var C = n.toWorld(n.anchorPoint);',
            '   var O =  thisLayer.toWorld(thisLayer.anchorPoint);',
            '   var vec = O-C;',
            '   var angle = Math.atan2(vec[1], vec[0]);',
            '   var ik = radiansToDegrees(angle);',
            '   if (autoOrient==1) result += ik;'
        ].join('\n');

        if (i == 0) {
            expr += 'var layer = thisLayer;\n' +
                'while(layer.hasParent)\n' +
                '{\n' +
                'layer = layer.parent;\n' +
                'result -= layer.transform.rotation;\n' +
                '}\n';
        }
        expr += '}\n' +
            'result;';

        var rotProp = new DuAEProperty(layer.transform.rotation);
        rotProp.setExpression(expr);
    }

    // Move back the controller to its original position
    // And adjust the curve controller
    var controllerOffset = controller.transform.position.value - controllerPosition;
    controller.transform.position.setValue(controllerPosition);
    curveController.transform.position.setValue(
        curveController.transform.position.value + controllerOffset / 3
    );

    // Restore the position and rotation
    for (var i = layers.length() - 1; i > 0; i--) {
        var layer = layers.at(i);
        var newPosition = layer.transform.position.value;
        var originalPosition = originalPositions[i-1];
        if (newPosition != originalPosition) {
            var offset = newPosition - originalPosition;
            layer.transform.position.setValue( layer.transform.position.valueAtTime(comp.time, true) - offset );
        }
        var newRotation = layer.transform.rotation.value;
        var originalRotation = originalRotations[i-1];
        if (newRotation != originalRotation) {
            var offset = newRotation - originalRotation;
            layer.transform.rotation.setValue( layer.transform.rotation.valueAtTime(comp.time, true) - offset );
        }
    }

    // Re-parent children
    layers.do(function(layer)
    {
        // Reparent children
        for (var i = 0, ni = layer.children.length; i < ni; i++)
        {
            var child = layer.children[i];
            // Only if it's not one of the bones
            var ok = true;
            for (var j = 0, nj = layers.length(); j < nj; j++)
            {
                if (child.index == layers.at(j).index )
                {
                    ok = false;
                    break;
                }
            }
            if (!ok) continue;
            layer.children[i].parent = layer;
            child.locked = child.wasLocked;
        }
    });

    curveController.selected = false;
    controller.moveBefore(curveController);

    // lock curve rotation
    DuAEProperty.lock(curveController.transform.rotation);

    DuAE.endUndoGroup( i18n._("B\u00e9zier IK"));

    return [curveController, controller, rootController];
    //*/
}

/**
 * Creates a bezier fk on the layers
 * @param {Layer[]|DuList.<Layer>} layers - The layers, ordered from root to end
 * @param {Layer|null} [goal] - The goal layer, at the end of the IK
 * @param {Layer|null} [controller] - The layer to use as controller, can be automatically created.<br />
 * Must be provided if goal is undefined.
 * @param {Boolean} [showGuides=true] - Set to false to hide guides on the controllers (and improve performance)
 * @param {Layer|null} [rootController] - The layer to use as root controller, can be automatically created.
 * @return {Layer[]} The controllers [curve,end,root,rootpos, rootrot]
 */
Duik.Constraint.bezierFK = function(layers, goal, controller, showGuides, rootController) {

    goal = def(goal, null);
    controller = def(controller, null);
    rootController = def(rootController, null);
    if (controller == null && goal == null) throw "You must provide either a goal layer or a controller";

    showGuides = def(showGuides, 1);
    if (!showGuides) showGuides = 0;

    DuAE.beginUndoGroup( i18n._("B\u00e9zier FK"), false);

    // Create the underlying bezier IK
    var ctrls = Duik.Constraint.bezierIK(layers, goal, controller, showGuides);

    layers = new DuList(layers);
    var comp = layers.first().containingComp;

    // Add null for the rotation
    var rotNull = DuAEComp.addNull(comp, 25, ctrls[2]);
    Duik.Layer.copyAttributes(rotNull, ctrls[2]);
    Duik.Layer.setName( i18n._("Spine") + '_RootRot', rotNull );
    Duik.Layer.setType( Duik.Layer.Type.NULL, rotNull );

    // Create new Root controller
    if (!rootController) rootController = Duik.Controller.create(comp, Duik.Controller.Type.TRANSFORM, ctrls[2]);

    ctrls[2].parent = rootController;
    ctrls[0].parent = rotNull;
    ctrls[1].parent = rootController;
    rotNull.parent = rootController;

    // Rig the root
    var autoCurveEffect = ctrls[1].property('ADBE Effect Parade').addProperty('ADBE Slider Control');
    autoCurveEffect.name = i18n._("Auto-curve");
    autoCurveEffect(1).setValue(100);
    rotNull.transform.rotation.expression = [DuAEExpression.Id.BEZIER_IK,
        'var ctrlLayer = thisComp.layer("' + ctrls[1].name + '");',
        'var rootLayer = thisComp.layer("' + rootController.name + '");',
        'var autoCurve = ctrlLayer.effect("' + autoCurveEffect.name + '")(1).value;',
        'autoCurve /= 100;',
        'autoCurve = autoCurve;',
        'var result = value;',
        '',
        DuAEExpression.Library.get([
            'dishineritRotation'
        ]),
        '',
        'var curve = - rootLayer.transform.rotation.value/2 - ctrlLayer.transform.rotation.value / 2;',
        'curve *= autoCurve;',
        'result += curve;',
        'result;'
    ].join('\n');

    ctrls[2].moveAfter(ctrls[0]);
    rotNull.moveAfter(ctrls[0]);
    rootController.moveAfter(ctrls[0]);

    ctrls[2].enabled = false;
    ctrls[2].locked = true;
    rotNull.enabled = false;
    rotNull.locked = true;

    DuAE.endUndoGroup( i18n._("B\u00e9zier FK"));

    return [ctrls[0], ctrls[1], rootController, ctrls[2], rotNull];
}

Duik.CmdLib['Constraint']["FK"] = "Duik.Constraint.fk()";
/**
 * Creates a FK with auto-overlapping and its controller on the layers.
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers, already parented or ordered from root (at index 0) to end
 * @param {Layer} [controller] - An already existing controller.
 * @return {Layer} The controller of the FK.
 */
Duik.Constraint.fk = function(layers, controller) {
    controller = def(controller, null);
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("FK"), false);

    var comp = layers.first().containingComp;

    //check if there is a controller in the selection
    if (controller == null) {
        for (var i = 0, num = layers.length(); i < num; i++) {
            var l = layers.at(i);
            if (Duik.Layer.isType(l, Duik.Layer.Type.CONTROLLER)) {
                controller = l;
                layers.remove(i);
                break;
            }
        }
    }

    //sort layers and parent them
    layers = DuAELayer.sortByParent(layers);
    layers = new DuList(layers);
    //reset rotation and scale if structures
    layers.do(Duik.Bone.resetTransform);
    DuAELayer.parentChain(layers);

    //Create controller
    if (controller == null) {
        controller = Duik.Controller.create(comp, Duik.Controller.Type.ROTATION, layers.first());
    }

    var pe = Duik.PseudoEffect.FK;

    var name = Duik.Layer.name(layers.first());
    var fkEffect = pe.apply(controller);
    fkEffect(pe.props["Limits"]["Lower"].index).setValue(-180);
    fkEffect(pe.props["Flexibility"].index).setValue(100);
    fkEffect(pe.props["Resistance"].index).setValue(10);
    var fkEffectName = fkEffect.name;

    //rig layers
    var prevMAName = "";
    layers.do(function(layer) {
        //add Data
        var layerData = layer('ADBE Effect Parade').addProperty('ADBE Layer Control');
        layerData.name = i18n._("FK");
        layerData(1).setValue(controller.index);
        var layerDataName = layerData.name;

        //add FK control
        var fkControl = controller('ADBE Effect Parade').addProperty('ADBE Angle Control');
        fkControl.name = DuAELayer.newUniqueEffectName( i18n._("FK") + ' | ' + Duik.Layer.name(layer), controller);

        //add expression and move away for the stretch
        if (layers.current == 0) {
            layer.transform.rotation.expression = [DuAEExpression.Id.FK,
                'var controller = null;',
                'var result = value;',
                'try { controller = effect("' + layerDataName + '")(1); } catch (e) {}',
                'if ( controller != null )',
                '{',
                '   var fx = controller.effect("' + fkEffectName + '");',
                '   result += controller.transform.rotation.value + fx(' + pe.props["Curve"].index + ').value;',
                '   var follow = fx(' + pe.props["Parent rotation"].index + ').value;',
                '   var p = thisLayer;',
                '   if (!follow)',
                '   {',
                '       while(p.hasParent)',
                '       {',
                '           p = p.parent;',
                '           result -= p.rotation.value;',
                '       }',
                '   }',
                '   var fk = controller.effect("' + fkControl.name + '")(1).value;',
                '   result += fk;',
                '}',
                'result;'
            ].join('\n');
        } else if (layers.current == 1) {
            layer.transform.rotation.expression = [DuAEExpression.Id.FK,
                'var controller = null;',
                'var result = value;',
                'try { controller=effect("' + layerDataName + '")(1); } catch (e) {}',
                'if (controller != null && hasParent)',
                '{',
                '   var fx = controller.effect("' + fkEffectName + '");',
                '   var ctrlRot = controller.transform.rotation;',
                '   var delay = fx(' + pe.props["Resistance"].index + ').value;',
                '   var amp = fx(' + pe.props["Flexibility"].index + ').value;',
                '   var uLimit = fx(' + pe.props["Limits"]["Upper"].index + ').value;',
                '   var lLimit = fx(' + pe.props["Limits"]["Lower"].index + ').value;',
                '   var manual = fx(' + pe.props["Curve"].index + ').value;',
                '   var follow = fx(' + pe.props["Parent rotation"].index + ').value;',
                '   delay = delay / 100;',
                '   amp = amp / 100 ;',
                '   result = ctrlRot.valueAtTime(time-delay) + fx(' + pe.props["Curve"].index + ').valueAtTime(time-delay);',
                '   if (follow && hasParent)',
                '   {',
                '       var cP = parent;',
                '       while(cP.hasParent)',
                '       {',
                '           cP = cP.parent;',
                '           if (cP.index = controller.index) follow = false;',
                '           result -= cP.rotation.value - cP.rotation.valueAtTime(time-delay);',
                '       }',
                '   }',
                '   result = result - ctrlRot.value ;',
                '   result = result * amp;',
                '   result = result - ctrlRot.velocityAtTime(time-delay/2)*(delay/5);',
                '   if (result > uLimit) result = uLimit;',
                '   if (result < lLimit) result = lLimit;',
                '   result = result + value + manual;',
                '   if (follow) result -= parent.transform.rotation.valueAtTime(0);',
                '   var fk = controller.effect("' + fkControl.name + '")(1).value;',
                '   result += fk;',
                '}',
                'result;'
            ].join('\n');

            Duik.Automation.moveAway(layer);
            // Get the effect and set it
            var maEffect = layer.effect( layer.property('ADBE Effect Parade').numProperties );
            prevMAName = maEffect.name;
            maEffect(1).expression = [DuAEExpression.Id.FK,
                'var controller = null;',
                'var result = value;',
                'try { controller=effect("' + layerDataName + '")(1); } catch (e) {}',
                'if (controller !=null )',
                '{',
                '   var fx = controller.effect("' + fkEffectName + '");',
                '   result += fx(' + pe.props["Stretch"].index + ').value;',
                '}',
                'result;'
            ].join('\n');
        } else {
            layer.transform.rotation.expression = [DuAEExpression.Id.FK,
                'var controller = null;',
                'var result = value;',
                'try { controller=effect("' + layerDataName + '")(1); }catch (e) {}',
                'if (controller !=null && hasParent)',
                '{',
                '   var fx = controller.effect("' + fkEffectName + '");',
                '   var ctrlRot = controller.transform.rotation;',
                '   var parentRot = parent.transform.rotation ;',
                '   var delay = fx(' + pe.props["Resistance"].index + ').value;',
                '   var amp = fx(' + pe.props["Flexibility"].index + ').value;',
                '   var uLimit = fx(' + pe.props["Limits"]["Upper"].index + ').value;',
                '   var lLimit = fx(' + pe.props["Limits"]["Lower"].index + ').value;',
                '   var manual = fx(' + pe.props["Curve"].index + ').value;',
                '   delay = delay / 100;',
                '   amp = amp / 100 ;',
                '   result = parentRot.valueAtTime(time-delay);',
                '   result = result * amp;',
                '   if (result > uLimit) result = uLimit;',
                '   if (result < lLimit) result = lLimit;',
                '   result = result + value + manual - parent.transform.rotation.valueAtTime(0);',
                '   var fk = controller.effect("' + fkControl.name + '")(1).value;',
                '   result += fk;',
                '}',
                'result;'
            ].join('\n');

            Duik.Automation.moveAway(layer);
            // Get the effect and set it
            var maEffect = layer.effect( layer.property('ADBE Effect Parade').numProperties );
            maEffect(1).expression = [DuAEExpression.Id.FK,
                'var controller = null;',
                'var result = value;',
                'try { controller=effect("' + layerDataName + '")(1); } catch (e) {}',
                'if (controller !=null && hasParent)',
                '{',
                '   var fx = controller.effect("' + fkEffectName + '");',
                '   var delay = fx(' + pe.props["Resistance"].index + ').value;',
                '   delay = delay / 100;',
                '   var maEffect = parent.effect("' + prevMAName + '");',
                '   var ma = maEffect(1);',
                '   result += ma.valueAtTime(time-delay);',
                '}',
                'result;'
            ].join('\n');
            prevMAName = maEffect.name;
        }
    });

    controller.selected = true;

    DuAE.endUndoGroup( i18n._("FK"));

    return controller;
}

Duik.CmdLib['Constraint']["Auto Parent"] = "Duik.Constraint.autoParent()";
Duik.CmdLib['Constraint']["Auto Parent Orphans"] = "Duik.Constraint.autoParent( true )";
Duik.CmdLib['Constraint']["Auto by Selection"] = "Duik.Constraint.autoParent( false, undefined, true )";
/**
 * Auto-Parent. Parent selected layers to the last selected one.
 * @param {Boolean} [orphansOnly=false] - When true, parent only the orphans to the last selected layers
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers
 * @param {Boolean} [selectionOrder=false] - When true, parent in the order of the selection, from ancestor to child
 */
Duik.Constraint.autoParent = function(orphansOnly, layers, selectionOrder) {
    orphansOnly = def(orphansOnly, false);
    selectionOrder = def(selectionOrder, false);

    layers = def(layers, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Auto-parent"), false);

    if (selectionOrder) DuAELayer.parentChain(layers);
    else DuAELayer.parent(layers, undefined, orphansOnly, undefined);

    DuAE.endUndoGroup( i18n._("Auto-parent"));
}

Duik.CmdLib['Constraint']["Parent"] = "Duik.Constraint.parent()";
/**
 * Parent Constraint
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers
 */
Duik.Constraint.parent = function(layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Parent constraint"), false);

    var pe = Duik.PseudoEffect.PARENT;
    var p = pe.props;

    layers.do(function(layer) {
        var effect = pe.apply(layer);

        var posExpr = [DuAEExpression.Id.PARENT_CONSTRAINT,
            DuAEExpression.Library.get(['translatePointWithLayer', 'checkDuikEffect', 'getNextKey']),
            'var result = thisLayer.position.valueAtTime( 0 );',
            'for ( var i = 1; i <= thisLayer( "Effects" ).numProperties; i++ ) {',
            '  ',
            '		var fx = effect( i );',
            '		if (!fx.active) continue;',
            '		if ( !checkDuikEffect(fx, "DUIK parentConstraint") ) continue;',
            '		if ( !fx(' + p['Inheritance']['Position'].index + ').value ) continue;',
            '		var parentLayer = null;',
            '		try {',
            '			parentLayer = fx(' + p['Layer'].index + ');',
            '		} catch ( e ) {',
            '			continue;',
            '		}',
            '		if ( !parentLayer ) continue;',
            '    if ( parentLayer.index == index ) continue;',
            '		',
            '		var cT = 0;',
            '		var mbPrecision = fx(10).value;',
            '		var step = framesToTime(1)/mbPrecision;',
            '		',
            '		while ( cT < time ) {',
            '        var nextT = cT + step;',
            '        ',
            '        var roundedFrame = Math.round( timeToFrames(nextT) );',
            '        var roundedTime = roundedFrame * thisComp.frameDuration;',
            '        if (nextT - roundedTime < 0.0001) nextT = roundedTime;',
            '        ',
            '        var wP = fx(' + p['Weight'].index + ');',
            '        var nK = wP.numKeys;',
            '        if (nK < 2) nextT = time;',
            '        else if (wP.key(1).time > time) nextT = time;',
            '        else if (wP.key(1).time > nextT) nextT = wP.key(1).time + .001;',
            '        else if (wP.key(nK).time < nextT) nextT = time;',
            '        // if the velocity is zero (keyframes on hold), jump to the next keyframe',
            '        else if (wP.velocityAtTime(nextT) == 0) {',
            '            var k = getNextKey(nextT, wP);',
            '            if (k && k.time > time) nextT = time;',
            '            else if (k) nextT = k.time + .001;',
            '        }',
            '',
            '        var weight = wP.valueAtTime( cT+step ) / 100;',
            '        //result = [weight, weight]*100;',
            '        if ( weight != 0 )',
            '            result += translatePointWithLayer( parentLayer, result, cT, nextT ) * weight;',
            '',
            '        if (i == 1) result += valueAtTime( nextT ) - valueAtTime( cT );',
            '',
            '        cT = nextT;',
            '    }',
            '}',
            'result;'
        ].join('\n');

        if (layer.position.dimensionsSeparated) {
            layer.transform.xPosition.expression = posExpr + '\nresult[0];';

            layer.transform.yPosition.expression = posExpr + '\nresult[1];';
            if (layer.threeDLayer) layer.transform.zPosition.expression = posExpr + '\nresult[2];';
        } else {
            layer.position.expression = posExpr;
        }

        var rotExpression = [DuAEExpression.Id.PARENT_CONSTRAINT,
            DuAEExpression.Library.get(['getOrientationAtTime', 'checkDuikEffect', 'getNextKey']),
            'var result = value;',
            'for ( var i = 1; i <= thisLayer( "Effects" ).numProperties; i++ ) {',
            '    var fx = effect( i );',
            '    if (!fx.active) continue;',
            '    if ( !checkDuikEffect(fx, "DUIK parentConstraint") ) continue;',
            '    if ( !fx(' + p['Inheritance']['Rotation'].index + ').value ) continue;',
            '    var l = null;',
            '    try {',
            '        l = fx(' + p['Layer'].index + ');',
            '    } catch ( e ) {',
            '        continue;',
            '    }',
            '    if ( !l ) continue;',
            '    if ( l.index == index ) continue;',
            '    ',
            '    var cT = 0;',
            '    var mbPrecision = fx(' + p['Motion Blur Precision'].index + ').value;',
            '    var step = framesToTime(1) / mbPrecision;',
            '	 while ( cT < time ) {',
            '        var nextT = cT + step;',
            '        ',
            '        var roundedFrame = Math.round( timeToFrames(nextT) );',
            '        var roundedTime = roundedFrame * thisComp.frameDuration;',
            '        if (nextT - roundedTime < 0.0001) nextT = roundedTime;',
            '        ',
            '        var wP = fx(' + p['Weight'].index + ');',
            '        var nK = wP.numKeys;',
            '        if (nK < 2) nextT = time;',
            '        else if (wP.key(1).time > time) nextT = time;',
            '        else if (wP.key(1).time > nextT) nextT = wP.key(1).time + .001;',
            '        else if (wP.key(nK).time < nextT) nextT = time;',
            '        // if the velocity is zero (keyframes on hold), jump to the next keyframe',
            '        else if (wP.velocityAtTime(nextT) == 0) {',
            '            var k = getNextKey(nextT, wP);',
            '            if (k && k.time > time) nextT = time;',
            '            else if (k) nextT = k.time + .001;',
            '        }',
            '',
            '        var weight = wP.valueAtTime( cT+step ) / 100;',
            '        if ( weight != 0 ) {',
            '            var P = getOrientationAtTime(l, nextT);',
            '             var oP = getOrientationAtTime(l, cT);',
            '             result += (P - oP) * weight;',
            '        }',
            '',
            '        cT = nextT;',
            '    }',
            '}',
            '',
            'result;'
        ].join('\n');

        layer.rotation.expression = rotExpression

        if (layer.parent != null) {
            var comp = layer.containingComp;
            var time = comp.time;
            comp.time = 0;
            var parent = layer.parent;
            layer.parent = null;
            effect(p['Layer'].index).setValue(parent.index);
            comp.time = time;
        }
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Parent constraint"));
}

Duik.CmdLib['Constraint']["Locator"] = "Duik.Constraint.locator()";
/**
 * Add Locator
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers
 */
Duik.Constraint.locator = function(layers) {
    layers = def(layers, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Locator"), false);

    if (layers.length() > 0) layers.do(Duik.Constraint.createLocator);
    else Duik.Constraint.createLocator();

    DuAE.endUndoGroup( i18n._("Locator"));
}

/**
 * Creates a new locator linked to the layer
 * @param {Layer|CompItem} [layerOrComp] The layer or the containing comp
 * @returns {ShapeLayer} The locator
 */
Duik.Constraint.createLocator = function(layerOrComp) {
    return DuAELayer.createLocator( layerOrComp );
}

Duik.CmdLib['Constraint']["Extract Locators"] = "Duik.Constraint.extractLocators()";
/**
 * Extract Locators
 * @param {Boolean} [useEssentialProperties] - whether to use essential properties instead of expressions to extract the controllers. True by default if Ae >= 17.0
 * @param {Layer[]|DuList.<Layer>} [precompLayers] - The layers
 */
Duik.Constraint.extractLocators = function(useEssentialProperties, precompLayers) {
    precompLayers = def(precompLayers, DuAEComp.getSelectedLayers());
    precompLayers = new DuList(precompLayers);
    if (precompLayers.length() == 0) return;

    DuAE.beginUndoGroup( i18n._("Extract locators"), false);

    precompLayers.do(function(precompLayer) {
        var preComp = precompLayer.source;
        if (!preComp instanceof CompItem) return;

        //get locators in precomp
        var preCompLocs = Duik.Layer.get(Duik.Layer.Type.LOCATOR, false, preComp);

        var it = new DuList(preCompLocs);
        it.do(function(preCompLoc) {
            Duik.Constraint.extractLocator(preCompLoc, precompLayer, useEssentialProperties);
        });
    });

    DuAE.endUndoGroup( i18n._("Extract locators"));
}

/**
 * Extracts one locator from a precomposition
 * @param {ShapeLayer} locator - The locator to extract
 * @param {AVLayer} preCompLayer - The precomposition layer
 * @param {Boolean} [useEssentialProperties=true] - true to extract using master properties instead of expressions (ignored in Ae < 15.1, false by default if 15.1 <= Ae < 17 and true by default in Ae >= 17)
 * @return {ShapeLayer} The extracted locator
 */
Duik.Constraint.extractLocator = function(locator, preCompLayer, useEssentialProperties) {
    if (DuAE.version.version < 15.1) useEssentialProperties = false;
    if (DuAE.version.version < 17.0) useEssentialProperties = def(useEssentialProperties, false);
    else useEssentialProperties = def(useEssentialProperties, true);

    var comp = preCompLayer.containingComp;
    //comp names
    DuAEComp.setUniqueCompName(comp);
    DuAEComp.setUniqueCompName(locator.containingComp);

    //apply locator values to workaround all kind of bugs
    locator.transform.anchorPoint.setValue(locator.transform.anchorPoint.valueAtTime(0, false));
    locator.transform.position.setValue(locator.transform.position.valueAtTime(0, false));
    locator.transform.scale.setValue(locator.transform.scale.valueAtTime(0, false));
    locator.transform.rotation.setValue(locator.transform.rotation.valueAtTime(0, false));
    locator.transform.opacity.setValue(locator.transform.opacity.valueAtTime(0, false));

    //create a null in the comp
    var loc = DuAEComp.addNull(comp);
    loc.moveToEnd();
    Duik.Layer.setAttributes(loc, Duik.Layer.Type.LOCATOR, i18n._("Locator"));
    loc.parent = preCompLayer;

    var trProp = new DuAEProperty(locator.transform);

    if (useEssentialProperties) {
        trProp.addToEGP();
        // get essential properties
        var mps = DuAEProperty.getProps(preCompLayer('ADBE Layer Overrides'), PropertyType.PROPERTY);
        var it = new DuList(mps);
        //links
        it.do(function(mp) {
            var newProp = null;

            //get prop name
            var nameArray = mp.name.split(' / ');
            if (nameArray.length != 2) return;
            var pLink = nameArray[1];
            var layerName = nameArray[0];
            if (layerName != locator.name) return;

            try {
                newProp = eval('loc' + pLink);
            } catch (e) {
                return;
            }

            //link
            if (newProp) {
                var p = new DuAEProperty(newProp);
                p.pickWhip(mp, true);
            }
        });
    } else {
        new DuAEProperty(loc.transform).linkProperties(locator.transform);
    }
    return loc;
}

/**
 * Sets the current values of the locators. This fixes some bugs when unparenting layers parented to the locators.
 * @param {Layer|LayerCollection|Layer[]|DuList.<Layer>} [layers=DuAEComp.getSelectedLayers()] The layer(s). If omitted, will use all selected layers in the comp
 * @param {boolean} [disable=true] - whether to disable the expressions after having applied the values
 */
Duik.Constraint.applyLocatorValues = function(layers, disable) {
    layers = def(layer, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);
    if (layers.length() == 0) return;

    disable = def(disable, true);

    for (var i = 0, n = layers.length(); i < n; i++) {
        var layer = layers.at(i);

        if (!Duik.Layer.isType(layer, Duik.Layer.Type.LOCATOR)) continue;

        var l = locator.locked;
        locator.locked = false;
        var p = new DuAEProperty(locator.transform.anchorPoint);
        p.setValue(locator.transform.anchorPoint.valueAtTime(0, false), 0);
        var p = new DuAEProperty(locator.transform.position);
        p.setValue(locator.transform.position.valueAtTime(0, false), 0);
        var p = new DuAEProperty(locator.transform.scale);
        p.setValue(locator.transform.scale.valueAtTime(0, false), 0);
        var p = new DuAEProperty(locator.transform.rotation);
        p.setValue(locator.transform.rotation.valueAtTime(0, false), 0);
        var p = new DuAEProperty(locator.transform.opacity);
        p.setValue(locator.transform.opacity.valueAtTime(0, false), 0);
        if (disable) Duik.Constraint.disableLocator(locator);
        locator.locked = l;
    }
}

/**
 * Disables the locator. Disable the transform expressions
 * @param {Layer|LayerCollection|Layer[]|DuList.<Layer>} [layers=DuAEComp.getSelectedLayers()] The layer(s). If omitted, will use all selected layers in the comp
 * @param {boolean} [disable=true]
 */
Duik.Constraint.disableLocator = function(layers, disable) {
    layers = def(layer, DuAEComp.getSelectedLayers());
    layers = new DuList(layers);
    if (layers.length() == 0) return;

    disable = def(disable, true);

    for (var i = 0, n = layers.length(); i < n; i++) {
        var layer = layers.at(i);

        if (!Duik.Layer.isType(layer, Duik.Layer.Type.LOCATOR)) continue;

        var l = locator.locked;
        locator.locked = false;
        locator.transform.anchorPoint.expressionEnabled = !disable;
        locator.transform.position.expressionEnabled = !disable;
        locator.transform.scale.expressionEnabled = !disable;
        locator.transform.rotation.expressionEnabled = !disable;
        locator.transform.opacity.expressionEnabled = !disable;
        locator.locked = l;
    }
}

/**
 * Parent the layers across compositions to the chosen layer
 * @param {Layer} parent The parent layer
 * @param {Boolean} [useEssentialProperties=true] - true to extract using master properties instead of expressions (ignored in Ae < 15.1, false by default if 15.1 <= Ae < 17 and true by default in Ae >= 17)
 * @param {Layer[]|DuList.<Layer>} [children] - The child layers
 */
Duik.Constraint.parentAcrossComp = function(parent, useEssentialProperties, children) {
    children = def(children, DuAEComp.getSelectedLayers());
    children = new DuList(children);

    DuAE.beginUndoGroup( i18n._("Parent across comps"), false);

    var parentComp = parent.containingComp;

    //create the parent locator
    var locator = Duik.Constraint.createLocator(parent);
    //the children locators
    var childLocators = [];

    new DuList(children).do(function(child) {
        var childComp = child.containingComp;

        //check if there already is a child locator
        var childLocator = null;
        for (var i = 0, num = childLocators.length; i < num; i++) {
            if (childLocators[i].containingComp.id == childComp.id) {
                childLocator = childLocators[i];
                break;
            }
        }

        //if precomp
        var precomps = DuAEComp.getPrecomps(childComp);
        var precompList = new DuList(precomps);

        if (precompList.indexOf(parentComp) >= 0) {
            //select the first precomp layer
            var precompLayer;
            for (var i = 1, num = childComp.numLayers; i <= num; i++) {
                var l = childComp.layer(i);
                if (l.source) {
                    if (l.source.id == parentComp.id) {
                        precompLayer = l;
                        break;
                    }
                }
            }

            //create the child Locator
            if (!childLocator) {
                //create a locator and extract it
                var childLocator = Duik.Constraint.extractLocator(locator, precompLayer, useEssentialProperties);
                childLocator.selected = false;
                childLocator.enabled = false;
                childLocator.shy = true;
                childLocator.locked = true;
                childLocators.push(childLocator);
            }
            var locked = child.locked;
            child.locked = false;
            child.parent = childLocator;
            child.locked = locked;
            child.selected = true;

            return;
        }

        //if parent comp
        var parentComps = DuAEComp.getParentComps(childComp);
        var parentCompList = new DuList(parentComps);
        if (parentCompList.indexOf(parentComp) >= 0) {
            //select the first precomp layer
            var precompLayer;
            for (var i = 1, num = parentComp.numLayers; i <= num; i++) {
                var l = parentComp.layer(i);
                if (l.source == childComp) {
                    precompLayer = l;
                    break;
                }
            }

            locator.parent = precompLayer;

            //create the child Locator
            if (!childLocator) {
                //create a null in the comp
                var childLocator = DuAEComp.addNull(childComp);
                childLocator.moveToEnd();
                Duik.Layer.copyAttributes(childLocator, locator, Duik.Layer.Type.LOCATOR);
                var ctr = new DuAEProperty(childLocator.transform);
                ctr.linkProperties(locator.transform, undefined, precompLayer);
                //lock and hide
                childLocator.selected = false;
                childLocator.enabled = false;
                childLocator.shy = true;
                childLocator.locked = true;
                childLocators.push(childLocator);
            }

            child.parent = childLocator;
            child.selected = true;

            return;
        }

    });

    //lock and hide
    locator.selected = false;
    locator.enabled = false;
    locator.locked = true;
    locator.shy = true;
    parent.selected = true;

    DuAE.endUndoGroup( i18n._("Parent across comps"));
}

Duik.CmdLib['Constraint']["Position"] = "Duik.Constraint.position()";
/**
 * Adds a position constraint to the layers
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The layers
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.position = function(layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Position constraint"), false);

    var pe = Duik.PseudoEffect.POSITION;
    var effects = [];

    layers.do(function(layer) {
        var effect = pe.apply(layer);
        effects.push(effect);
        var p = pe.props;
        effect(p['Weight'].index).setValue(0);

        layer.position.expression = [DuAEExpression.Id.POSITION_CONSTRAINT,
            DuAEExpression.Library.get(['checkDuikEffect']),
            'var result = value;',
            'for ( var i = 1; i <= thisLayer( "Effects" ).numProperties; i++ ) {',
            '    var fx = effect( i );',
            '    if ( !checkDuikEffect(fx, "DUIK positionConstraint") ) continue;',
            '    var l = null;',
            '    try {',
            '        l = fx( ' + p['Constraint to'].index + ' );',
            '    } catch ( e ) {}',
            '    if ( l ) {',
            '        var cp = l.toWorld( l.anchorPoint );',
            '        if ( thisLayer.hasParent ) cp = thisLayer.parent.fromWorld( cp );',
            '        cp0 = l.toWorld( l.anchorPoint, 0 );',
            '        if ( thisLayer.hasParent ) cp0 = thisLayer.parent.fromWorld( cp0 );',
            '        cp -= cp0;',
            '        result += cp * ( fx( ' + p['Weight'].index + ' ).value / 100 );',
            '    }',
            '}',
            'result;',
            ''
        ].join('\n');

    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Position constraint"));

    return effects;
}

/**
 * Builds a name for a new constraint effect which isn't taken on the layer yet,
 * numbering the duplicates the way Blender does: <code>Copy Location</code>, then
 * <code>Copy Location.001</code>, <code>Copy Location.002</code>...<br />
 * The name of the effect is what ties a constraint to its target, so it must be
 * unique on the layer and shouldn't be changed afterwards.
 * @param {Layer} layer The layer.
 * @param {string} baseName The name of the effect.
 * @return {string} The name to use.
 */
Duik.Constraint.uniqueEffectName = function(layer, baseName) {
    var taken = {};
    var effects = layer("ADBE Effect Parade");
    for (var i = 1, n = effects.numProperties; i <= n; i++) {
        taken[effects.property(i).name] = true;
    }
    if (!taken[baseName]) return baseName;

    for (var i = 1; i < 1000; i++) {
        var suffix = '' + i;
        while (suffix.length < 3) suffix = '0' + suffix;
        var name = baseName + '.' + suffix;
        if (!taken[name]) return name;
    }
    return baseName;
}

/**
 * Reads back the targets written in the expression of the constraints of a property.
 * @private
 * @param {string} expression The expression.
 * @return {Object} The targets, as <code>{ effectName: [compName, layerName] }</code>, and
 * <code>[compName, layerName, pathAddress]</code> for the point constraints.
 */
Duik.Constraint.bakedTargets = function(expression) {
    if (!expression) return {};
    var match = expression.match(/var DUIK_TARGETS = (\{.*\});/);
    if (!match) return {};
    try { return eval('(' + match[1] + ')'); }
    catch (e) { return {}; }
}

/**
 * Writes a string as a string literal, to use in an expression.
 * @private
 * @param {string} s The string.
 * @return {string} The literal, quotes included.
 */
Duik.Constraint.expressionString = function(s) {
    return '"' + DuString.replace(DuString.replace(s, '\\', '\\\\'), '"', '\\"') + '"';
}

/**
 * The expression resolving the target of a constraint from the name of its
 * composition and the name of the layer.<br />
 * An expression has no access to the project: it can't list its compositions, and
 * <code>comp()</code> only takes a name. There's no text parameter in an After
 * Effects effect either, so the target can't be stored in the effect and is written
 * in the expression itself, keyed by the name of the effect.<br />
 * The point constraints also write the address of their path in the target layer, as
 * {@link Duik.Constraint.pathAddress} gives it.
 * @private
 * @param {Object} [targets] The targets, as <code>{ effectName: [compName, layerName] }</code>, and
 * <code>[compName, layerName, pathAddress]</code> for the point constraints.
 * @return {string} The expression.
 */
Duik.Constraint.targetExpression = function(targets) {
    targets = def(targets, {});

    var quote = Duik.Constraint.expressionString;

    var entries = [];
    for (var name in targets) {
        var t = targets[name];
        if (!t) continue;
        var path = t[2] ? ',' + Duik.Constraint.pathAddressLiteral(t[2]) : '';
        entries.push(quote(name) + ':[' + quote(t[0]) + ',' + quote(t[1]) + path + ']');
    }

    return [
        '// The target of each constraint, as [ composition name, layer name ], written',
        '// here by Duik: an expression can\'t list the compositions of the project, and',
        '// an After Effects effect has no text parameter to hold a name. The key is the',
        '// name of the effect, so don\'t rename the constraints. A point constraint adds',
        '// the address of its path in the layer.',
        'var DUIK_TARGETS = {' + entries.join(',') + '};',
        '',
        'function targetOf(fx) {',
        '    var t = DUIK_TARGETS[fx.name];',
        '    if (!t) return null;',
        '    try {',
        '        var c = comp(t[0]);',
        '        var l = c.layer(t[1]);',
        '        // Constraining a layer to itself would be a circular reference.',
        '        if (t[0] == thisComp.name && l.index == thisLayer.index) return null;',
        '        return { layer: l, comp: c };',
        '    }',
        '    catch (e) { return null; }',
        '}'
    ].join('\n');
}

/**
 * The address of a Bezier path in its layer: the keys leading to it from the layer, the way an
 * expression reads them, as in <code>layer("ADBE Root Vectors Group")("Group 1")...</code>.<br />
 * A property with a fixed name is found by its match name, which doesn't change with the language
 * of After Effects. A shape group, a path or a mask is found by its name, or by its index when
 * another one of its group has the same name, since an expression only finds the first one.
 * @param {PropertyBase|DuAEProperty} path - The path property, or the shape path or mask holding it.
 * @return {Array.<string|int>|null} The address, or null if this isn't a Bezier path.
 */
Duik.Constraint.pathAddress = function(path) {
    path = new DuAEProperty(path).pathProperty();
    if (!path) return null;

    var address = [];
    var prop = path.getProperty();
    // The layer is the only property without a parent.
    while (prop.parentProperty) {
        var group = prop.parentProperty;
        var key = prop.matchName;
        if (prop.propertyDepth > 1 && group.propertyType == PropertyType.INDEXED_GROUP) {
            key = prop.name;
            for (var i = 1, n = group.numProperties; i <= n; i++) {
                if (i == prop.propertyIndex || group.property(i).name != prop.name) continue;
                key = prop.propertyIndex;
                break;
            }
        }
        address.unshift(key);
        prop = group;
    }
    return address;
}

/**
 * Writes the address of a path as an array literal, to use in an expression.
 * @private
 * @param {Array.<string|int>} address The address, as {@link Duik.Constraint.pathAddress} gives it.
 * @return {string} The literal.
 */
Duik.Constraint.pathAddressLiteral = function(address) {
    var keys = [];
    for (var i = 0, n = address.length; i < n; i++) {
        var key = address[i];
        keys.push(typeof key === 'number' ? key : Duik.Constraint.expressionString(key));
    }
    return '[' + keys.join(',') + ']';
}

/**
 * Finds a Bezier path in a layer by its address.
 * @param {Layer} layer - The layer.
 * @param {Array.<string|int>} address - The address, as {@link Duik.Constraint.pathAddress} gives it.
 * @return {Property|null} The path property, or null if the layer has no path at this address.
 */
Duik.Constraint.pathAtAddress = function(layer, address) {
    if (!layer || !address) return null;
    var prop = layer;
    for (var i = 0, n = address.length; i < n; i++) {
        try { prop = prop.property(address[i]); }
        catch (e) { return null; }
        if (!prop) return null;
    }
    if (prop.propertyType != PropertyType.PROPERTY) return null;
    if (prop.propertyValueType != PropertyValueType.SHAPE) return null;
    return prop;
}

/**
 * Lists the Bezier paths of a layer a point constraint can target: the paths of its shapes, whatever
 * group they're in, and its masks.
 * @param {Layer} layer - The layer.
 * @return {Object[]} The paths, as <code>{ name, address }</code>: where the path is, like
 * <code>Contents / Group 1 / Path 1</code> or <code>Masks / Mask 1</code>, and its address, as
 * {@link Duik.Constraint.pathAddress} gives it.
 */
Duik.Constraint.listPaths = function(layer) {
    var paths = [];

    function walk(group, name) {
        for (var i = 1, n = group.numProperties; i <= n; i++) {
            var prop = group.property(i);
            if (prop.matchName == 'ADBE Vector Shape - Group' || prop.matchName == 'ADBE Mask Atom')
                paths.push({ name: name + ' / ' + prop.name, address: Duik.Constraint.pathAddress(prop) });
            else if (prop.matchName == 'ADBE Vector Group')
                walk(prop.property('ADBE Vectors Group'), name + ' / ' + prop.name);
        }
    }

    var groups = ['ADBE Root Vectors Group', 'ADBE Mask Parade'];
    for (var i = 0, n = groups.length; i < n; i++) {
        var group = null;
        // Cameras and lights have neither contents nor masks.
        try { group = layer.property(groups[i]); }
        catch (e) {}
        if (group) walk(group, group.name);
    }

    return paths;
}

/**
 * Writes the indices of some parameters of a pseudo effect as an object literal, to use in an
 * expression reading effects which don't have their parameters in the same order.
 * @private
 * @param {DuAEPseudoEffect} pe The pseudo effect.
 * @param {Object} names The names of the parameters, by the key to use in the expression.
 * @return {string} The object literal.
 */
Duik.Constraint.paramIndices = function(pe, names) {
    var entries = [];
    for (var key in names) entries.push(key + ': ' + pe.props[names[key]].index);
    return '{ ' + entries.join(', ') + ' }';
}

/**
 * The functions the expressions of the point constraints read the vertex of a path with.
 * They need <code>DUIK_TARGETS</code>, from {@link Duik.Constraint.targetExpression}.
 * @private
 * @return {string} The functions.
 */
Duik.Constraint.pointFunctions = function() {
    return [
        '// The sides of a vertex, in the order of the drop downs of the point constraints.',
        'var HANDLE_LEFT = 2;',
        'var HANDLE_RIGHT = 3;',
        '',
        '// 2D affine transformations, as [ [a, b, x], [c, d, y] ]: the rows of a matrix',
        '// turning column vectors, and the translation added afterwards.',
        'function affine(m, v) {',
        '    return [ m[0][0] * v[0] + m[0][1] * v[1] + m[0][2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] ];',
        '}',
        '// The transformation doing b, then a.',
        'function composeAffine(a, b) {',
        '    return [',
        '        [ a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1], a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] ],',
        '        [ a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1], a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] ]',
        '    ];',
        '}',
        'function rotationAffine(angle) {',
        '    var c = Math.cos(angle);',
        '    var s = Math.sin(angle);',
        '    return [ [c, -s, 0], [s, c, 0] ];',
        '}',
        '',
        '// What a shape group does to its contents, the way After Effects does it: around the anchor',
        '// point, it scales them, skews them along the skew axis, turns them, then moves them.',
        'function groupAffine(g) {',
        '    var a = g("ADBE Vector Anchor").value;',
        '    var p = g("ADBE Vector Position").value;',
        '    var s = g("ADBE Vector Scale").value;',
        '    var skew = degreesToRadians( g("ADBE Vector Skew").value );',
        '    var skewAxis = degreesToRadians( g("ADBE Vector Skew Axis").value );',
        '    var m = [ [1, 0, -a[0]], [0, 1, -a[1]] ];',
        '    m = composeAffine( [ [s[0] / 100, 0, 0], [0, s[1] / 100, 0] ], m );',
        '    m = composeAffine( rotationAffine(skewAxis), m );',
        '    m = composeAffine( [ [1, -Math.tan(skew), 0], [0, 1, 0] ], m );',
        '    m = composeAffine( rotationAffine(-skewAxis), m );',
        '    m = composeAffine( rotationAffine( degreesToRadians( g("ADBE Vector Rotation").value ) ), m );',
        '    return composeAffine( [ [1, 0, p[0]], [0, 1, p[1]] ], m );',
        '}',
        '',
        '// The path a point constraint reads, found in the target layer by the address written after',
        '// the name of the layer in DUIK_TARGETS, and what takes its points to the space of the layer:',
        '// the shape groups holding the path. null when the layer has no path at this address.',
        'function targetPath(fx, l) {',
        '    var address = DUIK_TARGETS[fx.name][2];',
        '    if (!address) return null;',
        '    try {',
        '        var p = l;',
        '        var m = [ [1, 0, 0], [0, 1, 0] ];',
        '        for (var k = 0; k < address.length; k++) {',
        '            // The contents of a shape group come after the group itself, which moves them.',
        '            if (address[k] == "ADBE Vectors Group") m = composeAffine( m, groupAffine( p("ADBE Vector Transform Group") ) );',
        '            p = p(address[k]);',
        '        }',
        '        return { path: p, matrix: m };',
        '    }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// The vertex of a path at an index, in the space of its layer: its point, its two handles,',
        '// and the ends of the segments on each side, null at the ends of an open path. The index is',
        '// rounded, wraps around a closed path and stops at the ends of an open one.',
        '// null when the path has no vertex.',
        'function vertexAt(tp, index) {',
        '    var pts = tp.path.points();',
        '    var n = pts.length;',
        '    if (n == 0) return null;',
        '    var inT = tp.path.inTangents();',
        '    var outT = tp.path.outTangents();',
        '    var closed = tp.path.isClosed();',
        '',
        '    var i = Math.round(index);',
        '    if (closed) i = ((i % n) + n) % n;',
        '    else i = Math.min( Math.max(i, 0), n - 1 );',
        '',
        '    // The point of a vertex, or one of its handles.',
        '    function at(k, tangents) {',
        '        var v = pts[k];',
        '        if (tangents) v = [ v[0] + tangents[k][0], v[1] + tangents[k][1] ];',
        '        return affine(tp.matrix, v);',
        '    }',
        '',
        '    var vertex = { point: at(i), left: at(i, inT), right: at(i, outT), previous: null, next: null };',
        '    if (closed || i > 0) {',
        '        var j = (i + n - 1) % n;',
        '        vertex.previous = { point: at(j), right: at(j, outT) };',
        '    }',
        '    if (closed || i < n - 1) {',
        '        var k = (i + 1) % n;',
        '        vertex.next = { point: at(k), left: at(k, inT) };',
        '    }',
        '    return vertex;',
        '}',
        '',
        '// The vertex a point constraint reads on its target layer, or null.',
        'function targetVertex(fx, indexParam, l) {',
        '    var tp = targetPath(fx, l);',
        '    if (!tp) return null;',
        '    return vertexAt(tp, fx(indexParam).value);',
        '}',
        '',
        '// The first of some vectors which has a length, at unit length, or null.',
        'function firstDirection(vectors) {',
        '    for (var k = 0; k < vectors.length; k++) {',
        '        var d = vectors[k];',
        '        var l = Math.sqrt(d[0] * d[0] + d[1] * d[1]);',
        '        if (l > 1e-6) return [ d[0] / l, d[1] / l ];',
        '    }',
        '    return null;',
        '}',
        'function towards(a, b) {',
        '    return [ b[0] - a[0], b[1] - a[1] ];',
        '}',
        '',
        '// The tangent of the path at a vertex, the way the path goes, at unit length, in the space of',
        '// its layer: on the side of the left handle, of the right handle, or the average of both.',
        '// A retracted handle gives no direction, and the segment then leaves the vertex toward',
        '// the next control point. null when the path goes nowhere from the vertex.',
        'function vertexTangent(v, side) {',
        '    // The path comes from the previous vertex through the left handle...',
        '    var incoming = null;',
        '    if (v.previous) incoming = firstDirection([ towards(v.left, v.point), towards(v.previous.right, v.point), towards(v.previous.point, v.point) ]);',
        '    // ...and leaves to the next one through the right handle.',
        '    var outgoing = null;',
        '    if (v.next) outgoing = firstDirection([ towards(v.point, v.right), towards(v.point, v.next.left), towards(v.point, v.next.point) ]);',
        '',
        '    if (side == HANDLE_LEFT) return incoming || outgoing;',
        '    if (side == HANDLE_RIGHT) return outgoing || incoming;',
        '    if (!incoming) return outgoing;',
        '    if (!outgoing) return incoming;',
        '    // Where the path turns back on itself, the two sides cancel out: keep the way out.',
        '    return firstDirection([ [ incoming[0] + outgoing[0], incoming[1] + outgoing[1] ] ]) || outgoing;',
        '}'
    ].join('\n');
}

/**
 * Writes the target of the constraints of a layer whose target is set in Duik: the copy location,
 * copy rotation, copy point location, copy point rotation and armature constraints.
 * @private
 * @param {Layer} layer - The constrained layer.
 * @param {string} compName - The name of the composition holding the target.
 * @param {string} layerName - The name of the target layer.
 * @param {string[]} [only] - The names of the effects to retarget; all of them if omitted.
 * @param {Array.<string|int>|null} [path] - The address of the path the point constraints target, as
 * {@link Duik.Constraint.pathAddress} gives it. Ignored by the other constraints. When omitted, the point
 * constraints keep the address they had, and find the path at the same place in the new target layer.
 */
Duik.Constraint.writeTarget = function(layer, compName, layerName, only, path) {
    // The names of the effects to retarget, by kind of constraint.
    var kinds = {};

    var effects = layer("ADBE Effect Parade");
    for (var i = 1, n = effects.numProperties; i <= n; i++) {
        var effect = effects.property(i);
        if (isdef(only) && new DuList(only).indexOf(effect.name) < 0) continue;
        var kind = Duik.Constraint.constraintKind(effect);
        if (!kind || !kind.expression) continue;
        if (!kinds[kind.matchName]) kinds[kind.matchName] = { kind: kind, names: [] };
        kinds[kind.matchName].names.push(effect.name);
    }

    // The kinds sharing their expressions, like copy location and copy point location, each read the
    // targets the previous one has just written.
    for (var matchName in kinds) {
        var kind = kinds[matchName].kind;
        var names = kinds[matchName].names;
        var targets = Duik.Constraint.constraintTargets(layer, kind);
        for (var j = 0, m = names.length; j < m; j++) {
            var target = [compName, layerName];
            if (kind.path) {
                var address = path;
                if (!isdef(address) && targets[names[j]]) address = targets[names[j]][2];
                if (address) target.push(address);
            }
            targets[names[j]] = target;
        }
        Duik.Constraint.writeExpressions(layer, kind, targets);
    }
}

/**
 * Reads back the targets of the constraints of a kind on a layer, from the expressions they're written in.
 * @private
 * @param {Layer} layer - The constrained layer.
 * @param {Object} kind - The kind of constraint, as returned by {@link Duik.Constraint.constraintKind}.
 * @return {Object} The targets, as <code>{ effectName: [compName, layerName] }</code>, and
 * <code>[compName, layerName, pathAddress]</code> for the point constraints.<br />
 * The kinds sharing their expressions, like copy location and copy point location, read the targets of each other too.
 */
Duik.Constraint.constraintTargets = function(layer, kind) {
    var targets = {};
    for (var i = 0, n = kind.properties.length; i < n; i++) {
        if (Duik.Constraint.isHiddenProperty(layer, kind.properties[i])) continue;
        var prop = layer.transform.property(kind.properties[i]);
        if (!prop || prop.expression.indexOf(kind.id) < 0) continue;
        var baked = Duik.Constraint.bakedTargets(prop.expression);
        for (var name in baked) targets[name] = baked[name];
    }
    return targets;
}

/**
 * Writes the expressions of the constraints of a kind whose target is set in Duik on a layer.
 * Each property driven by the constraints holds the targets in its own expression.
 * @private
 * @param {Layer} layer - The constrained layer.
 * @param {Object} kind - The kind of constraint, as returned by {@link Duik.Constraint.constraintKind}.
 * @param {Object} targets - The targets, as <code>{ effectName: [compName, layerName] }</code>.
 */
Duik.Constraint.writeExpressions = function(layer, kind, targets) {
    for (var i = 0, n = kind.properties.length; i < n; i++) {
        var matchName = kind.properties[i];
        var prop = layer.transform.property(matchName);
        if (!prop) continue;
        // A hidden property is written all the same, so that the constraint is there if the layer
        // turns 3D: After Effects may refuse, and the expression is then written the next time.
        if (Duik.Constraint.isHiddenProperty(layer, matchName)) {
            try { prop.expression = kind.expression(targets, matchName); }
            catch (e) {}
            continue;
        }
        prop.expression = kind.expression(targets, matchName);
    }
}

/**
 * Tells whether a transform property is hidden on a layer: the X and Y rotations and the orientation
 * only show on 3D layers, which are the only ones to turn around anything else than Z.
 * @private
 * @param {Layer} layer - The layer.
 * @param {string} matchName - The match name of the transform property.
 * @return {Boolean} true if the property is hidden.
 */
Duik.Constraint.isHiddenProperty = function(layer, matchName) {
    if (layer.threeDLayer) return false;
    return matchName == 'ADBE Rotate X' || matchName == 'ADBE Rotate Y' || matchName == 'ADBE Orientation';
}

/**
 * Tells what a copy location, copy rotation, copy point location, copy point rotation or armature
 * constraint currently points at. The target can't be shown in the effect itself: an After Effects
 * effect has no parameter able to display a name, and effect parameters can't be renamed.
 * @param {PropertyBase|DuAEProperty} [effect] - The constraint effect, or any of its parameters.
 * The selected one in the active composition if omitted.
 * @return {Object|null} <code>{ effect, comp, layer, path, usesPath, restPose }</code>: the name of the
 * effect, the names of the composition and the layer it points at, which are empty strings when no
 * target has been set yet, the address of the path it points at, as {@link Duik.Constraint.pathAddress}
 * gives it, or null, whether the constraint targets a path, which the point constraints do, and whether
 * it has a rest pose, set with {@link Duik.Constraint.setRestPose}.<br />
 * <code>null</code> if there's no constraint.
 */
Duik.Constraint.getTarget = function(effect) {
    var constraint = Duik.Constraint.getTargetConstraints(effect)[0];
    if (!constraint) return null;

    var t = Duik.Constraint.constraintTargets(constraint.layer, constraint.kind)[constraint.name];
    return {
        effect: constraint.name,
        comp: t ? t[0] : '',
        layer: t ? t[1] : '',
        path: t && t[2] ? t[2] : null,
        usesPath: constraint.kind.path,
        restPose: constraint.kind.restPose
    };
}

/**
 * Runs a function which changes the selection, and puts the selection back as it was:
 * writing an expression or adding a layer changes the selection in After Effects.
 * @private
 * @param {CompItem} comp - The composition.
 * @param {Function} callback - The function.
 * @return {*} What the function returns.
 */
Duik.Constraint.keepSelection = function(comp, callback) {
    var selectedLayers = comp.selectedLayers;
    var selectedProps = comp.selectedProperties;

    var result = callback();

    DuAEComp.unselectLayers(comp);
    DuAEComp.selectLayers(selectedLayers);
    for (var i = 0, n = selectedProps.length; i < n; i++) selectedProps[i].selected = true;

    return result;
}

Duik.CmdLib['Constraint']["Set constraint target"] = "Duik.Constraint.setTarget()";
/**
 * Points a copy location, copy rotation, copy point location, copy point rotation or armature constraint
 * at a layer, which can live in any composition of the project, and a point constraint at a path of this
 * layer. The other constraints of its layer keep their target.<br />
 * An armature constraint takes the current pose of its new target as its rest pose, so that its
 * layer doesn't move: see {@link Duik.Constraint.setRestPose}.<br />
 * The target is looked up by name, so run this again after renaming the composition,
 * the target layer, or the path and the groups holding it.
 * @param {CompItem} comp - The composition holding the target.
 * @param {Layer} target - The target layer.
 * @param {PropertyBase|DuAEProperty} [effect] - The constraint effect, or any of its parameters.
 * The selected one in the active composition if omitted.
 * @param {PropertyBase|DuAEProperty|Array.<string|int>|null} [path] - The path a point constraint targets:
 * a path property of the target layer, the shape path or mask holding it, or its address, as
 * {@link Duik.Constraint.pathAddress} gives it. Ignored by the other constraints. When omitted, a point
 * constraint keeps the address it had, and finds the path at the same place in the new target layer.
 */
Duik.Constraint.setTarget = function(comp, target, effect, path) {
    if (!comp || !target) return;
    var constraint = Duik.Constraint.getTargetConstraints(effect)[0];
    if (!constraint) return;
    if (path && !(path instanceof Array)) path = Duik.Constraint.pathAddress(path);

    DuAE.beginUndoGroup( i18n._("Set constraint target"), false);

    Duik.Constraint.keepSelection(constraint.layer.containingComp, function() {
        Duik.Constraint.writeTarget(constraint.layer, comp.name, target.name, [constraint.name], path);
        if (constraint.kind.restPose) Duik.Constraint.captureRestPose(constraint);
    });

    DuAE.endUndoGroup( i18n._("Set constraint target"));
}

/**
 * Builds the expression of the copy location and copy point location constraints: they share it, so
 * that they're evaluated together, in the order of the effects, like the constraint stack of Blender.
 * @private
 * @param {Object} [targets] The targets, as <code>{ effectName: [compName, layerName] }</code>, and
 * <code>[compName, layerName, pathAddress]</code> for the copy point location constraints.
 * @return {string} The expression.
 */
Duik.Constraint.copyLocationExpression = function(targets) {
    var params = {
        units: 'Transform units',
        ratio: 'Custom ratio',
        x: 'X',
        invertX: 'Invert X',
        y: 'Y',
        invertY: 'Invert Y',
        z: 'Z',
        invertZ: 'Invert Z',
        offset: 'Offset',
        targetSpace: 'Target space',
        ownerSpace: 'Owner space',
        customSpace: 'Custom space',
        influence: 'Influence'
    };
    var pointParams = { index: 'Point Index', component: 'Target Component' };
    for (var key in params) pointParams[key] = params[key];

    return [DuAEExpression.Id.COPY_LOCATION_CONSTRAINT,
        DuAEExpression.Library.get(['checkDuikEffect']),
        Duik.Constraint.targetExpression(targets),
        '',
        '// The indices of the parameters of the two constraints this expression reads.',
        'var COPY_LOCATION = ' + Duik.Constraint.paramIndices(Duik.PseudoEffect.COPY_LOCATION, params) + ';',
        'var COPY_POINT_LOCATION = ' + Duik.Constraint.paramIndices(Duik.PseudoEffect.COPY_POINT_LOCATION, pointParams) + ';',
        '',
        '// The parameters of a constraint this expression reads, or null for any other effect.',
        'function paramsOf(fx) {',
        '    if ( checkDuikEffect(fx, "DUIK copyLocation") ) return COPY_LOCATION;',
        '    if ( checkDuikEffect(fx, "DUIK copyPointLocation") ) return COPY_POINT_LOCATION;',
        '    return null;',
        '}',
        '',
        Duik.Constraint.pointFunctions(),
        '',
        '// The transform units, in the order of the drop down of the effect.',
        'var PIXELS = 1;',
        'var PERCENTAGE = 2;',
        'var CUSTOM_RATIO = 3;',
        '',
        '// The spaces, in the order of the drop downs of the effect.',
        'var WORLD_SPACE = 1;',
        'var CUSTOM_SPACE = 2;',
        'var LOCAL_SPACE = 3;',
        '',
        '// Everything is computed with three components,',
        '// whatever the dimensions of the layers.',
        'function d3(p) {',
        '    if (p.length > 2) return [ p[0], p[1], p[2] ];',
        '    return [ p[0], p[1], 0 ];',
        '}',
        '',
        '// The location of the anchor point of a layer, in the space of its own comp.',
        'function worldLocation(l) {',
        '    return d3( l.toWorld( l.anchorPoint ) );',
        '}',
        '',
        '// Comp space <-> the space the position of a layer is expressed in.',
        '// A layer without a parent is already in comp space.',
        'function toLocal(l, p) {',
        '    if (!l.hasParent) return d3(p);',
        '    return d3( l.parent.fromWorld(p) );',
        '}',
        'function fromLocal(l, p) {',
        '    if (!l.hasParent) return d3(p);',
        '    return d3( l.parent.toWorld(p) );',
        '}',
        '',
        '// How the coordinates of the target composition are read into this one.',
        'function unitFactor(fx, P, targetComp) {',
        '    var units = fx(P.units).value;',
        '    if (units == PERCENTAGE) {',
        '        // The same relative spot, whatever the resolution of the comps.',
        '        var sx = thisComp.width / targetComp.width;',
        '        var sy = thisComp.height / targetComp.height;',
        '        return [sx, sy, sx];',
        '    }',
        '    if (units == CUSTOM_RATIO) {',
        '        var r = fx(P.ratio).value;',
        '        return [r, r, r];',
        '    }',
        '    return [1, 1, 1];',
        '}',
        '',
        '// The location of this layer in comp space, before any constraint.',
        'var ownerLocation = fromLocal( thisLayer, d3(value) );',
        'var constrained = false;',
        '',
        'for ( var i = 1, n = thisLayer("Effects").numProperties; i <= n; i++ ) {',
        '    var fx = thisLayer.effect(i);',
        '    var P = paramsOf(fx);',
        '    if ( !P ) continue;',
        '    if ( !fx.active ) continue;',
        '',
        '    var t = targetOf(fx);',
        '    if (!t) continue;',
        '    var target = t.layer;',
        '',
        '    // The location of the target: its anchor point, or a vertex of its path.',
        '    var targetLocation;',
        '    if (P == COPY_POINT_LOCATION) {',
        '        var vertex = targetVertex(fx, P.index, target);',
        '        if (!vertex) continue;',
        '        var component = fx(P.component).value;',
        '        var point = vertex.point;',
        '        if (component == HANDLE_LEFT) point = vertex.left;',
        '        else if (component == HANDLE_RIGHT) point = vertex.right;',
        '        targetLocation = d3( target.toWorld([ point[0], point[1], 0 ]) );',
        '    }',
        '    else targetLocation = worldLocation(target);',
        '',
        '    var customSpace = null;',
        '    try { customSpace = fx(P.customSpace); }',
        '    catch (e) {}',
        '',
        '    var targetSpace = fx(P.targetSpace).value;',
        '    var ownerSpace = fx(P.ownerSpace).value;',
        '',
        '    // The location of the target, read in the target space.',
        '    if (targetSpace == CUSTOM_SPACE && customSpace)',
        '        targetLocation = d3( customSpace.fromWorld(targetLocation) );',
        '    else if (targetSpace == LOCAL_SPACE)',
        '        targetLocation = toLocal(target, targetLocation);',
        '',
        '    // Scale the coordinates of the target composition into this one.',
        '    var factor = unitFactor(fx, P, t.comp);',
        '    targetLocation = [ targetLocation[0] * factor[0],',
        '                       targetLocation[1] * factor[1],',
        '                       targetLocation[2] * factor[2] ];',
        '',
        '    // The location of this layer, in the owner space.',
        '    var ownerSpaceLocation = d3(ownerLocation);',
        '    if (ownerSpace == CUSTOM_SPACE && customSpace)',
        '        ownerSpaceLocation = d3( customSpace.fromWorld(ownerSpaceLocation) );',
        '    else if (ownerSpace == LOCAL_SPACE)',
        '        ownerSpaceLocation = toLocal(thisLayer, ownerSpaceLocation);',
        '',
        '    var axis = [ fx(P.x).value, fx(P.y).value, fx(P.z).value ];',
        '    var invert = [ fx(P.invertX).value, fx(P.invertY).value, fx(P.invertZ).value ];',
        '    var offset = fx(P.offset).value;',
        '',
        '    // Copy the enabled axis, keep the others.',
        '    var location = d3(ownerSpaceLocation);',
        '    for (var a = 0; a < 3; a++) {',
        '        if (!axis[a]) continue;',
        '        var v = targetLocation[a];',
        '        if (invert[a]) v = -v;',
        '        if (offset) v += ownerSpaceLocation[a];',
        '        location[a] = v;',
        '    }',
        '',
        '    // Back to comp space.',
        '    if (ownerSpace == CUSTOM_SPACE && customSpace)',
        '        location = d3( customSpace.toWorld(location) );',
        '    else if (ownerSpace == LOCAL_SPACE)',
        '        location = fromLocal(thisLayer, location);',
        '',
        '    // Blend with the influence in comp space, like Blender does, so that',
        '    // several of these effects can be stacked on the same layer.',
        '    var influence = fx(P.influence).value / 100;',
        '    for (var b = 0; b < 3; b++) {',
        '        ownerLocation[b] += (location[b] - ownerLocation[b]) * influence;',
        '    }',
        '    constrained = true;',
        '}',
        '',
        'var result = value;',
        'if (constrained) {',
        '    var loc = toLocal( thisLayer, ownerLocation );',
        '    result = value.length > 2 ? loc : [ loc[0], loc[1] ];',
        '}',
        'result;',
        ''
    ].join('\n');
}

Duik.CmdLib['Constraint']["Copy Location"] = "Duik.Constraint.copyLocation()";
/**
 * Adds a <i>copy location</i> constraint to the layers.<br />
 * This is an After Effects recreation of Blender's <i>Copy Location</i> constraint:
 * the location of the layer is replaced by the location of a target layer, one axis
 * at a time, with optional inversion and offset, in a choice of spaces, and blended
 * back with an influence.<br />
 * The target is a layer of any composition of the project, picked in the Duik panel
 * and looked up by name; it can be changed later with {@link Duik.Constraint.setTarget}.<br />
 * Several of these effects can be added on the same layer; they're evaluated in
 * order, the same way Blender stacks constraints.<br />
 * The constraint is computed live by an expression and never needs a keyframe.
 * @param {CompItem} comp - The composition holding the target.
 * @param {Layer} target - The target layer.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.copyLocation = function(comp, target, layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Copy Location"), false);

    var pe = Duik.PseudoEffect.COPY_LOCATION;
    var effects = [];

    layers.do(function(layer) {
        // The name of the effect is the key of its target, so it has to be unique.
        var name = Duik.Constraint.uniqueEffectName(layer, pe.name);
        var effect = pe.apply(layer, name);
        effects.push(effect);

        var targets = Duik.Constraint.bakedTargets(layer.position.expression);
        if (comp && target) targets[name] = [comp.name, target.name];
        layer.position.expression = Duik.Constraint.copyLocationExpression(targets);
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Copy Location"));

    return effects;
}

/**
 * Adds a point constraint to layers: its effect, and the expressions it shares with its companion.
 * @private
 * @param {DuAEPseudoEffect} pe - The pseudo effect of the constraint.
 * @param {string} undoName - The name of the undo group.
 * @param {CompItem} [comp] - The composition holding the target.
 * @param {Layer} [target] - The target layer.
 * @param {PropertyBase|DuAEProperty|Array.<string|int>} [path] - The path of the target layer.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.addPointConstraint = function(pe, undoName, comp, target, path, layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    // A path property brings its layer and composition along.
    var address = null;
    if (path instanceof Array) address = path;
    else if (path) {
        address = Duik.Constraint.pathAddress(path);
        if (address && !target) {
            path = new DuAEProperty(path);
            target = path.layer;
            comp = target.containingComp;
        }
    }

    DuAE.beginUndoGroup( undoName, false);

    var effects = [];

    layers.do(function(layer) {
        // The name of the effect is the key of its target, so it has to be unique.
        var name = Duik.Constraint.uniqueEffectName(layer, pe.name);
        var effect = pe.apply(layer, name);
        effects.push(effect);

        var kind = Duik.Constraint.constraintKind(effect);
        var targets = Duik.Constraint.constraintTargets(layer, kind);
        if (comp && target) {
            targets[name] = [comp.name, target.name];
            if (address) targets[name].push(address);
        }
        Duik.Constraint.writeExpressions(layer, kind, targets);
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( undoName );

    return effects;
}

Duik.CmdLib['Constraint']["Copy Point Location"] = "Duik.Constraint.copyPointLocation()";
/**
 * Adds a <i>copy point location</i> constraint to the layers: a copy location constraint whose target is
 * a vertex of a Bezier path, or one of its two handles, picked by its index.<br />
 * It has all the options of the copy location constraint, see {@link Duik.Constraint.copyLocation}, and
 * shares its expression, so that both kinds are stacked on the same layer and evaluated in order.<br />
 * The target is a path of a layer of any composition of the project, a shape path or a mask, picked in
 * the Duik panel and looked up by name; it can be changed later with {@link Duik.Constraint.setTarget}.<br />
 * The constraint is computed live by an expression and never needs a keyframe.
 * @param {CompItem} [comp] - The composition holding the target.
 * @param {Layer} [target] - The target layer.
 * @param {PropertyBase|DuAEProperty|Array.<string|int>} [path] - The path of the target layer: a path
 * property, the shape path or mask holding it, or its address, as {@link Duik.Constraint.pathAddress}
 * gives it. A property is enough: its layer and its composition are the target when they're omitted.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.copyPointLocation = function(comp, target, path, layers) {
    return Duik.Constraint.addPointConstraint(
        Duik.PseudoEffect.COPY_POINT_LOCATION,
        i18n._("Copy Point Location"),
        comp, target, path, layers
    );
}

/**
 * Builds the expressions of the copy rotation and copy point rotation constraints: one for each rotation
 * property they drive. They share them, so that they're evaluated together, in the order of the effects,
 * like the constraint stack of Blender.<br />
 * A 2D layer only turns around Z, and the constraint drives its <i>Rotation</i>, which also holds the
 * rotation of the layer itself: an expression reads the value its own property has before it.<br />
 * A 3D layer turns around three axis, which After Effects holds in its <i>X</i>, <i>Y</i> and
 * <i>Z Rotation</i>. The constraint drives the three of them, and the rotation of the layer itself is
 * its <i>Orientation</i>: an expression can't read what another property held before its own
 * expression, so a driven rotation can't be read back, while the orientation, which the constraint
 * leaves alone, can. Each of the three expressions computes the whole rotation and returns its own
 * angle; they always agree, as they read the same properties and take the same Euler angles.<br />
 * A copy point rotation constraint reads the rotation of a point of a path as the rotation of a child of
 * the layer of the path, placed at the point and turned along the tangent there.
 * @private
 * @param {Object} [targets] The targets, as <code>{ effectName: [compName, layerName] }</code>, and
 * <code>[compName, layerName, pathAddress]</code> for the copy point rotation constraints.
 * @param {string} [property='ADBE Rotate Z'] The match name of the property: <code>'ADBE Rotate X'</code>,
 * <code>'ADBE Rotate Y'</code> or <code>'ADBE Rotate Z'</code>.
 * @return {string} The expression.
 */
Duik.Constraint.copyRotationExpression = function(targets, property) {
    property = def(property, 'ADBE Rotate Z');

    var params = {
        eulerOrder: 'Euler order',
        x: 'X',
        invertX: 'Invert X',
        y: 'Y',
        invertY: 'Invert Y',
        z: 'Z',
        invertZ: 'Invert Z',
        mixMode: 'Mix mode',
        targetSpace: 'Target space',
        ownerSpace: 'Owner space',
        customSpace: 'Custom space',
        influence: 'Influence'
    };
    var pointParams = { index: 'Point Index', tangent: 'Tangent' };
    for (var key in params) pointParams[key] = params[key];

    // The axis this expression drives.
    var axis = 2;
    if (property == 'ADBE Rotate X') axis = 0;
    else if (property == 'ADBE Rotate Y') axis = 1;

    // The rotation of a 3D layer, around its three axis.
    var threeD = [
        '// 3x3 matrices are arrays of rows, and turn column vectors.',
        'function identity() {',
        '    return [ [1, 0, 0], [0, 1, 0], [0, 0, 1] ];',
        '}',
        'function multiply(a, b) {',
        '    var m = [];',
        '    for (var r = 0; r < 3; r++) {',
        '        m.push([]);',
        '        for (var c = 0; c < 3; c++) m[r].push(a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c]);',
        '    }',
        '    return m;',
        '}',
        'function transposed(a) {',
        '    return [ [a[0][0], a[1][0], a[2][0]], [a[0][1], a[1][1], a[2][1]], [a[0][2], a[1][2], a[2][2]] ];',
        '}',
        'function determinant(a) {',
        '    return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -',
        '        a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +',
        '        a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);',
        '}',
        '',
        '// The rotation by an angle in radians around an axis: 0 for X, 1 for Y, 2 for Z.',
        'function axisRotation(axis, angle) {',
        '    var c = Math.cos(angle);',
        '    var s = Math.sin(angle);',
        '    if (axis == 0) return [ [1, 0, 0], [0, c, -s], [0, s, c] ];',
        '    if (axis == 1) return [ [c, 0, s], [0, 1, 0], [-s, 0, c] ];',
        '    return [ [c, -s, 0], [s, c, 0], [0, 0, 1] ];',
        '}',
        '',
        'function d3(v) {',
        '    if (v.length > 2) return [ v[0], v[1], v[2] ];',
        '    return [ v[0], v[1], 0 ];',
        '}',
        'function dot(a, b) {',
        '    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];',
        '}',
        'function cross(a, b) {',
        '    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];',
        '}',
        '// The vector at unit length, or null if it has no length.',
        'function unit(v) {',
        '    var l = Math.sqrt(dot(v, v));',
        '    if (l < 1e-9) return null;',
        '    return [ v[0] / l, v[1] / l, v[2] / l ];',
        '}',
        '',
        '// The axis of a layer in the space of its own comp, as the columns of a matrix of unit vectors:',
        '// the space its children live in, mirrored when the layer or its parents are negatively scaled.',
        '// The skew of a parent scaled unevenly is left out: X is kept, and Y made square to it.',
        'function axisOf(l) {',
        '    return axisFrom( d3(l.toWorldVec([1, 0, 0])), d3(l.toWorldVec([0, 1, 0])), d3(l.toWorldVec([0, 0, 1])) );',
        '}',
        '',
        '// The rotation of a point of a path in the space of the comp: the axis of a child of the layer',
        '// of the path, placed at the point and turned along the tangent there, in the space of the layer.',
        '// Its X axis goes the way the path goes, and its Y axis is the normal of the path.',
        'function pointFrame(l, tangent) {',
        '    var t = tangent;',
        '    return axisFrom( d3(l.toWorldVec([t[0], t[1], 0])), d3(l.toWorldVec([-t[1], t[0], 0])), d3(l.toWorldVec([0, 0, 1])) );',
        '}',
        '',
        '// The axis, as the columns of a matrix of unit vectors, from the vectors X, Y and Z of a space.',
        'function axisFrom(x, y, z) {',
        '    // A 2D layer has no depth.',
        '    z = unit(z) || [0, 0, 1];',
        '    var mirrored = dot(cross(x, y), z) < 0;',
        '    x = unit(x) || [1, 0, 0];',
        '    var d = dot(x, y);',
        '    y = unit([ y[0] - x[0] * d, y[1] - x[1] * d, y[2] - x[2] * d ]) || unit(cross(z, x)) || [0, 1, 0];',
        '    z = cross(x, y);',
        '    if (mirrored) z = [ -z[0], -z[1], -z[2] ];',
        '    return [ [x[0], y[0], z[0]], [x[1], y[1], z[1]], [x[2], y[2], z[2]] ];',
        '}',
        '',
        '// The axis of the parent of a layer: the space its rotation is expressed in.',
        'function parentAxisOf(l) {',
        '    if (!l.hasParent) return identity();',
        '    return axisOf(l.parent);',
        '}',
        '',
        '// The rotation of a layer in the space of its own comp: its axis, as the columns of a matrix,',
        '// but its own negative scale doesn\'t turn it, as with a 2D layer.',
        'function frameOf(l) {',
        '    var a = axisOf(l);',
        '    // Cameras and lights have no scale.',
        '    var s = [];',
        '    try { s = l.scale.value; }',
        '    catch (e) {}',
        '    for (var c = 0; c < s.length && c < 3; c++) {',
        '        if (s[c] >= 0) continue;',
        '        for (var r = 0; r < 3; r++) a[r][c] = -a[r][c];',
        '    }',
        '    return a;',
        '}',
        '',
        '// A mirrored frame isn\'t a rotation. Flipping its X axis back makes one, the way the rotation',
        '// of a 2D layer under a mirrored parent is read: it keeps the Y axis seen on screen.',
        'var FLIP_X = [ [-1, 0, 0], [0, 1, 0], [0, 0, 1] ];',
        'function rotationOf(frame) {',
        '    if (determinant(frame) < 0) return multiply(frame, FLIP_X);',
        '    return frame;',
        '}',
        'function frameFrom(rotation, mirrored) {',
        '    if (mirrored) return multiply(rotation, FLIP_X);',
        '    return rotation;',
        '}',
        '',
        '// The Euler orders, in the order of the drop down of the effect after "Default": the axis',
        '// in the order they are applied, and whether they are an odd permutation of X, Y, Z.',
        'var EULER_ORDERS = [',
        '    { axis: [0, 1, 2], odd: false },',
        '    { axis: [0, 2, 1], odd: true },',
        '    { axis: [1, 0, 2], odd: true },',
        '    { axis: [1, 2, 0], odd: false },',
        '    { axis: [2, 0, 1], odd: false },',
        '    { axis: [2, 1, 0], odd: true }',
        '];',
        '// After Effects turns a layer around Z, then Y, then X: its own order is ZYX.',
        'var AFTER_EFFECTS_ORDER = EULER_ORDERS[5];',
        'function eulerOrder(v) {',
        '    if (v < 2) return AFTER_EFFECTS_ORDER;',
        '    return EULER_ORDERS[v - 2];',
        '}',
        '',
        '// Euler angles in radians -> rotation: the axis are applied in order.',
        'function eulerToMatrix(e, order) {',
        '    var a = order.axis;',
        '    return multiply( axisRotation(a[2], e[a[2]]), multiply( axisRotation(a[1], e[a[1]]), axisRotation(a[0], e[a[0]]) ) );',
        '}',
        '',
        '// Rotation -> the two sets of Euler angles giving it, computed the way Blender does.',
        'function eulersOf(m, order) {',
        '    var i = order.axis[0], j = order.axis[1], k = order.axis[2];',
        '    var cy = Math.sqrt(m[i][i] * m[i][i] + m[j][i] * m[j][i]);',
        '    var e1 = [0, 0, 0];',
        '    var e2 = [0, 0, 0];',
        '    if (cy > 0.0000375) {',
        '        e1[i] = Math.atan2(m[k][j], m[k][k]);',
        '        e1[j] = Math.atan2(-m[k][i], cy);',
        '        e1[k] = Math.atan2(m[j][i], m[i][i]);',
        '        e2[i] = Math.atan2(-m[k][j], -m[k][k]);',
        '        e2[j] = Math.atan2(-m[k][i], -cy);',
        '        e2[k] = Math.atan2(-m[j][i], -m[i][i]);',
        '    }',
        '    else {',
        '        // Gimbal lock: the first and the last axis turn around the same one.',
        '        e1[i] = Math.atan2(-m[j][k], m[j][j]);',
        '        e1[j] = Math.atan2(-m[k][i], cy);',
        '        e2 = [ e1[0], e1[1], e1[2] ];',
        '    }',
        '    if (order.odd) return [ [-e1[0], -e1[1], -e1[2]], [-e2[0], -e2[1], -e2[2]] ];',
        '    return [e1, e2];',
        '}',
        '',
        '// The sum of the differences between two sets of angles.',
        'function distance(a, b) {',
        '    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);',
        '}',
        '',
        '// Rotation -> Euler angles: the set with the smallest angles.',
        'function eulerOf(m, order) {',
        '    var e = eulersOf(m, order);',
        '    if (distance(e[0], [0, 0, 0]) > distance(e[1], [0, 0, 0])) return e[1];',
        '    return e[0];',
        '}',
        '',
        '// Winds the angles by full turns, to be as close as possible to old ones.',
        'function compatibleEuler(e, old) {',
        '    var c = [];',
        '    for (var a = 0; a < 3; a++) {',
        '        var d = e[a] - old[a];',
        '        var turns = 0;',
        '        if (d > Math.PI) turns = Math.floor(d / (2 * Math.PI) + 0.5);',
        '        else if (d < -Math.PI) turns = -Math.floor(-d / (2 * Math.PI) + 0.5);',
        '        c.push(e[a] - turns * 2 * Math.PI);',
        '    }',
        '    return c;',
        '}',
        '',
        '// Rotation -> Euler angles: the set closest to old angles, wound to be as close as possible.',
        'function compatibleEulerOf(m, old, order) {',
        '    var e = eulersOf(m, order);',
        '    var e1 = compatibleEuler(e[0], old);',
        '    var e2 = compatibleEuler(e[1], old);',
        '    if (distance(e1, old) > distance(e2, old)) return e2;',
        '    return e1;',
        '}',
        '',
        '// Turns Euler angles by an angle around one of the axis of the rotation they make.',
        'function rotateEuler(e, order, axis, angle) {',
        '    var turn = [0, 0, 0];',
        '    turn[axis] = angle;',
        '    return eulerOf( multiply( eulerToMatrix(e, order), eulerToMatrix(turn, order) ), order );',
        '}',
        '',
        '// Rotation <-> quaternion, as [w, x, y, z].',
        'function quaternionOf(m) {',
        '    var t = m[0][0] + m[1][1] + m[2][2];',
        '    var s;',
        '    if (t > 0) {',
        '        s = 2 * Math.sqrt(1 + t);',
        '        return [ s / 4, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s ];',
        '    }',
        '    if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {',
        '        s = 2 * Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]);',
        '        return [ (m[2][1] - m[1][2]) / s, s / 4, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s ];',
        '    }',
        '    if (m[1][1] > m[2][2]) {',
        '        s = 2 * Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]);',
        '        return [ (m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, s / 4, (m[1][2] + m[2][1]) / s ];',
        '    }',
        '    s = 2 * Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]);',
        '    return [ (m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, s / 4 ];',
        '}',
        'function quaternionToMatrix(q) {',
        '    var w = q[0], x = q[1], y = q[2], z = q[3];',
        '    return [',
        '        [ 1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w) ],',
        '        [ 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w) ],',
        '        [ 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y) ]',
        '    ];',
        '}',
        '',
        '// Blends two rotations the shortest way round, as Blender blends the influence.',
        'function blend(a, b, t) {',
        '    var qa = quaternionOf(a);',
        '    var qb = quaternionOf(b);',
        '    var d = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];',
        '    if (d < 0) {',
        '        d = -d;',
        '        qa = [ -qa[0], -qa[1], -qa[2], -qa[3] ];',
        '    }',
        '    var wa = 1 - t;',
        '    var wb = t;',
        '    if (1 - d > 0.0001) {',
        '        var angle = Math.acos(d);',
        '        wa = Math.sin((1 - t) * angle) / Math.sin(angle);',
        '        wb = Math.sin(t * angle) / Math.sin(angle);',
        '    }',
        '    var q = [];',
        '    for (var c = 0; c < 4; c++) q.push(qa[c] * wa + qb[c] * wb);',
        '    var l = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);',
        '    return quaternionToMatrix([ q[0] / l, q[1] / l, q[2] / l, q[3] / l ]);',
        '}',
        '',
        '// Blender\'s copy rotation: the rotation of the target is copied through Euler angles,',
        '// axis by axis, and mixed with the rotation of this layer.',
        'function copiedRotation(fx, P, own, target) {',
        '    var order = eulerOrder( fx(P.eulerOrder).value );',
        '    var axis = [ fx(P.x).value, fx(P.y).value, fx(P.z).value ];',
        '    var invert = [ fx(P.invertX).value, fx(P.invertY).value, fx(P.invertZ).value ];',
        '    var mixMode = fx(P.mixMode).value;',
        '',
        '    var ownEuler = eulerOf(own, order);',
        '    var euler = compatibleEulerOf(target, ownEuler, order);',
        '',
        '    // The angles the axis which aren\'t copied keep.',
        '    var kept = [0, 0, 0];',
        '    if (mixMode == REPLACE || mixMode == OFFSET_LEGACY) kept = ownEuler;',
        '',
        '    for (var a = 0; a < 3; a++) {',
        '        if (!axis[a]) {',
        '            euler[a] = kept[a];',
        '            continue;',
        '        }',
        '        if (mixMode == OFFSET_LEGACY) euler = rotateEuler(euler, order, a, ownEuler[a]);',
        '        if (invert[a]) euler[a] = -euler[a];',
        '    }',
        '',
        '    if (mixMode == ADD) euler = [ euler[0] + ownEuler[0], euler[1] + ownEuler[1], euler[2] + ownEuler[2] ];',
        '',
        '    var rotation = eulerToMatrix( compatibleEuler(euler, ownEuler), order );',
        '    if (mixMode == BEFORE_ORIGINAL) return multiply(rotation, own);',
        '    if (mixMode == AFTER_ORIGINAL) return multiply(own, rotation);',
        '    return rotation;',
        '}',
        '',
        '// Degrees around X, Y and Z, in the order After Effects turns a layer, -> rotation.',
        'function degreesToMatrix(d) {',
        '    return eulerToMatrix([ degreesToRadians(d[0]), degreesToRadians(d[1]), degreesToRadians(d[2]) ], AFTER_EFFECTS_ORDER);',
        '}',
        '',
        '// The rotation of this layer around its three axis, constrained, in degrees, or null when',
        '// no constraint applies to it. After Effects turns a layer by its orientation, then by its',
        '// X, Y and Z rotations: the orientation is the rotation of the layer itself, and these',
        '// three properties hold the result of the constraint.',
        'function constrainedRotations() {',
        '    var parentAxis = parentAxisOf(thisLayer);',
        '    var orientation = degreesToMatrix(thisLayer.transform.orientation.value);',
        '',
        '    // The rotation of this layer in comp space, before any constraint.',
        '    var ownerFrame = multiply(parentAxis, orientation);',
        '    var constrained = false;',
        '',
        '    for ( var i = 1, n = thisLayer("Effects").numProperties; i <= n; i++ ) {',
        '        var fx = thisLayer.effect(i);',
        '        var P = paramsOf(fx);',
        '        if ( !P ) continue;',
        '        if ( !fx.active ) continue;',
        '',
        '        var t = targetOf(fx);',
        '        if (!t) continue;',
        '',
        '        // Like Blender, skip the constraints without influence.',
        '        var influence = fx(P.influence).value / 100;',
        '        if (influence <= 0) continue;',
        '',
        '        // The rotation of the target: the one of the layer, or the one of a point of its path.',
        '        var targetFrame;',
        '        if (P == COPY_POINT_ROTATION) {',
        '            var tangent = targetTangent(fx, t.layer);',
        '            if (!tangent) continue;',
        '            targetFrame = pointFrame(t.layer, tangent);',
        '        }',
        '        else targetFrame = frameOf(t.layer);',
        '',
        '        var customSpace = null;',
        '        try { customSpace = fx(P.customSpace); }',
        '        catch (e) {}',
        '        // The custom space turns the rotations only, whether its layer is mirrored or not, as on 2D layers.',
        '        var customRotation = identity();',
        '        if (customSpace) customRotation = rotationOf(frameOf(customSpace));',
        '',
        '        var targetSpace = fx(P.targetSpace).value;',
        '        var ownerSpace = fx(P.ownerSpace).value;',
        '',
        '        // The rotation of the target, read in the target space.',
        '        if (targetSpace == CUSTOM_SPACE && customSpace)',
        '            targetFrame = multiply( transposed(customRotation), targetFrame );',
        '        else if (targetSpace == LOCAL_SPACE)',
        '            targetFrame = multiply( transposed(parentAxisOf(t.layer)), targetFrame );',
        '',
        '        // The rotation of this layer, in the owner space.',
        '        var space = identity();',
        '        if (ownerSpace == CUSTOM_SPACE && customSpace) space = customRotation;',
        '        else if (ownerSpace == LOCAL_SPACE) space = parentAxis;',
        '        var ownFrame = multiply( transposed(space), ownerFrame );',
        '',
        '        var rotation = copiedRotation( fx, P, rotationOf(ownFrame), rotationOf(targetFrame) );',
        '',
        '        // Back to comp space, as mirrored as this layer is.',
        '        var frame = multiply( space, frameFrom(rotation, determinant(ownFrame) < 0) );',
        '',
        '        // Blend with the influence in comp space, like Blender does, so that',
        '        // several of these effects can be stacked on the same layer.',
        '        if (influence < 1) {',
        '            var mirrored = determinant(ownerFrame) < 0;',
        '            frame = frameFrom( blend(rotationOf(ownerFrame), rotationOf(frame), influence), mirrored );',
        '        }',
        '        ownerFrame = frame;',
        '        constrained = true;',
        '    }',
        '',
        '    if (!constrained) return null;',
        '',
        '    // What is left for the X, Y and Z rotations, once the parents and the orientation are',
        '    // taken out. The smallest angles are taken, so that the three expressions, which each',
        '    // compute this whole rotation, always return angles from the same set.',
        '    var rotations = multiply( transposed(orientation), multiply( transposed(parentAxis), ownerFrame ) );',
        '    var e = eulerOf(rotations, AFTER_EFFECTS_ORDER);',
        '    return [ radiansToDegrees(e[0]), radiansToDegrees(e[1]), radiansToDegrees(e[2]) ];',
        '}'
    ];

    // The rotation of a 2D layer, around Z.
    var twoD = [
        '// The rotation of a layer around Z, relative to its parent.',
        '// The orientation of 3D layers is a part of it.',
        'function localRotation(l) {',
        '    var r = l.rotation.value;',
        '    if (l.position.value.length == 3) r += l.orientation.value[2];',
        '    return r;',
        '}',
        '',
        '// A negatively scaled parent mirrors the rotation of its children,',
        '// and a vertical flip turns them upside down.',
        'function scaleMirror(l) {',
        '    var m = 1;',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        var s = l.scale.value;',
        '        m *= Math.sign(s[0] * s[1]);',
        '    }',
        '    return m;',
        '}',
        'function scaleUTurn(l) {',
        '    var u = 1;',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        u = u * l.scale.value[1];',
        '    }',
        '    if (u < 0) return 180;',
        '    return 0;',
        '}',
        '',
        '// The rotation of a point of a path around Z, in the space of the comp, or relative to the parent',
        '// of the layer of the path when local: the rotation of a child of that layer, placed at the point',
        '// and turned along the tangent there. The layer and its parents pass their turns on, and the',
        '// tangent is read as seen on screen, so that it\'s followed even when the layer is scaled unevenly.',
        'function pointRotation(l, tangent, local) {',
        '    // A vector of the layer, in the space the rotation is read in.',
        '    function vector(v) {',
        '        var w = l.toWorldVec([ v[0], v[1], 0 ]);',
        '        if (local && l.hasParent) w = l.parent.fromWorldVec(w);',
        '        return w;',
        '    }',
        '    var x = vector([1, 0]);',
        '    var y = vector([0, 1]);',
        '    var t = vector(tangent);',
        '',
        '    // As for a layer, a mirrored rotation is read with its X axis flipped.',
        '    var flip = x[0] * y[1] - x[1] * y[0] < 0 ? -1 : 1;',
        '    var turn = radiansToDegrees( Math.atan2(flip * t[1], flip * t[0]) - Math.atan2(flip * x[1], flip * x[0]) );',
        '    // The angle between the X axis of the layer and the tangent, between -180 and 180 degrees.',
        '    turn = (turn + 540) % 360 - 180;',
        '',
        '    // What the layer passes on to its children, read the way worldRotation reads it.',
        '    var r = 0;',
        '    var u = 1;',
        '    var p = l;',
        '    while (true) {',
        '        u *= p.scale.value[1];',
        '        if (local || !p.hasParent) {',
        '            r += localRotation(p);',
        '            break;',
        '        }',
        '        var s = p.parent.scale.value;',
        '        r += localRotation(p) * Math.sign(s[0] * s[1]);',
        '        p = p.parent;',
        '    }',
        '    if (u < 0) r += 180;',
        '    return r + turn;',
        '}',
        '',
        '// The rotation of a layer in the space of its own comp, every parent applied.',
        'function worldRotation(l) {',
        '    var r = localRotation(l) * scaleMirror(l) + scaleUTurn(l);',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        var lr = localRotation(l);',
        '        if (l.hasParent) {',
        '            var s = l.parent.scale.value;',
        '            lr *= Math.sign(s[0] * s[1]);',
        '        }',
        '        r += lr;',
        '    }',
        '    return r;',
        '}',
        '',
        'function constrainedRotation() {',
        '    // Comp space <-> the space the rotation of this layer is expressed in.',
        '    // The contribution of the parents is constant, so it can be taken out',
        '    // once and used to convert both ways without reading our own rotation.',
        '    var orientation = 0;',
        '    if (thisLayer.position.value.length == 3) orientation = thisLayer.orientation.value[2];',
        '    var mirror = scaleMirror(thisLayer);',
        '    var uTurn = scaleUTurn(thisLayer);',
        '    var parents = worldRotation(thisLayer) - localRotation(thisLayer) * mirror - uTurn;',
        '    function toWorldRotation(r) { return r * mirror + uTurn + parents; }',
        '    function toLocalRotation(r) { return (r - uTurn - parents) * mirror; }',
        '',
        '    // The rotation of this layer in comp space, before any constraint.',
        '    var ownerRotation = toWorldRotation( value + orientation );',
        '    var constrained = false;',
        '',
        '    for ( var i = 1, n = thisLayer("Effects").numProperties; i <= n; i++ ) {',
        '        var fx = thisLayer.effect(i);',
        '        var P = paramsOf(fx);',
        '        if ( !P ) continue;',
        '        if ( !fx.active ) continue;',
        '',
        '        var t = targetOf(fx);',
        '        if (!t) continue;',
        '        var target = t.layer;',
        '',
        '        // This rotation is around Z only: without it, there\'s nothing to copy.',
        '        if ( !fx(P.z).value ) continue;',
        '',
        '        var tangent = null;',
        '        if (P == COPY_POINT_ROTATION) {',
        '            tangent = targetTangent(fx, target);',
        '            if (!tangent) continue;',
        '        }',
        '',
        '        var customSpace = null;',
        '        try { customSpace = fx(P.customSpace); }',
        '        catch (e) {}',
        '        var customRotation = 0;',
        '        if (customSpace) customRotation = worldRotation(customSpace);',
        '',
        '        var targetSpace = fx(P.targetSpace).value;',
        '        var ownerSpace = fx(P.ownerSpace).value;',
        '',
        '        // The rotation of the target, read in the target space: the one of the layer,',
        '        // or the one of a point of its path.',
        '        var targetRotation;',
        '        if (tangent) targetRotation = pointRotation(target, tangent, targetSpace == LOCAL_SPACE);',
        '        else if (targetSpace == LOCAL_SPACE) targetRotation = localRotation(target);',
        '        else targetRotation = worldRotation(target);',
        '        if (targetSpace == CUSTOM_SPACE && customSpace) targetRotation -= customRotation;',
        '',
        '        // The rotation of this layer, in the owner space.',
        '        var ownRotation = ownerRotation;',
        '        if (ownerSpace == CUSTOM_SPACE && customSpace) ownRotation -= customRotation;',
        '        else if (ownerSpace == LOCAL_SPACE) ownRotation = toLocalRotation(ownerRotation);',
        '',
        '        var invert = fx(P.invertZ).value;',
        '        var mixMode = fx(P.mixMode).value;',
        '',
        '        // Around a single axis, rotations commute and combine by adding their',
        '        // angles, so "Add", "Before Original" and "After Original" coincide.',
        '        // "Offset (Legacy)" differs: it inverts the sum instead of the copy.',
        '        var rotation;',
        '        if (mixMode == OFFSET_LEGACY) {',
        '            rotation = targetRotation + ownRotation;',
        '            if (invert) rotation = -rotation;',
        '        }',
        '        else {',
        '            rotation = invert ? -targetRotation : targetRotation;',
        '            if (mixMode != REPLACE) rotation += ownRotation;',
        '        }',
        '',
        '        // Back to comp space.',
        '        if (ownerSpace == CUSTOM_SPACE && customSpace) rotation += customRotation;',
        '        else if (ownerSpace == LOCAL_SPACE) rotation = toWorldRotation(rotation);',
        '',
        '        // Blend with the influence in comp space, like Blender does, so that',
        '        // several of these effects can be stacked on the same layer.',
        '        var influence = fx(P.influence).value / 100;',
        '        ownerRotation += (rotation - ownerRotation) * influence;',
        '        constrained = true;',
        '    }',
        '',
        '    if (!constrained) return value;',
        '    return toLocalRotation(ownerRotation) - orientation;',
        '}',
    ];

    var main;
    if (axis == 2) main = threeD.concat(['']).concat(twoD).concat([
        '',
        'var result;',
        'if (is3D(thisLayer)) {',
        '    result = value;',
        '    var rotations = constrainedRotations();',
        '    if (rotations) result = rotations[2];',
        '}',
        'else result = constrainedRotation();',
        'result;'
    ]);
    else main = threeD.concat([
        '',
        '// Only a 3D layer turns around this axis.',
        'var result = value;',
        'if (is3D(thisLayer)) {',
        '    var rotations = constrainedRotations();',
        '    if (rotations) result = rotations[' + axis + '];',
        '}',
        'result;'
    ]);

    return [DuAEExpression.Id.COPY_ROTATION_CONSTRAINT,
        DuAEExpression.Library.get(['checkDuikEffect', 'sign']),
        Duik.Constraint.targetExpression(targets),
        '',
        '// The indices of the parameters of the two constraints this expression reads.',
        'var COPY_ROTATION = ' + Duik.Constraint.paramIndices(Duik.PseudoEffect.COPY_ROTATION, params) + ';',
        'var COPY_POINT_ROTATION = ' + Duik.Constraint.paramIndices(Duik.PseudoEffect.COPY_POINT_ROTATION, pointParams) + ';',
        '',
        '// The parameters of a constraint this expression reads, or null for any other effect.',
        'function paramsOf(fx) {',
        '    if ( checkDuikEffect(fx, "DUIK copyRotation") ) return COPY_ROTATION;',
        '    if ( checkDuikEffect(fx, "DUIK copyPointRotation") ) return COPY_POINT_ROTATION;',
        '    return null;',
        '}',
        '',
        Duik.Constraint.pointFunctions(),
        '',
        '// The tangent of the path a copy point rotation constraint reads, or null.',
        'function targetTangent(fx, l) {',
        '    var vertex = targetVertex(fx, COPY_POINT_ROTATION.index, l);',
        '    if (!vertex) return null;',
        '    return vertexTangent(vertex, fx(COPY_POINT_ROTATION.tangent).value);',
        '}',
        '',
        '// The mix modes, in the order of the drop down of the effect.',
        'var REPLACE = 1;',
        'var ADD = 2;',
        'var BEFORE_ORIGINAL = 3;',
        'var AFTER_ORIGINAL = 4;',
        'var OFFSET_LEGACY = 5;',
        '',
        '// The spaces, in the order of the drop downs of the effect.',
        'var WORLD_SPACE = 1;',
        'var CUSTOM_SPACE = 2;',
        'var LOCAL_SPACE = 3;',
        '',
        '// Only 3D layers turn around X and Y.',
        'function is3D(l) {',
        '    return l.anchorPoint.value.length == 3;',
        '}',
        '',
        main.join('\n'),
        ''
    ].join('\n');
}

Duik.CmdLib['Constraint']["Copy Rotation"] = "Duik.Constraint.copyRotation()";
/**
 * Adds a <i>copy rotation</i> constraint to the layers.<br />
 * This is an After Effects recreation of Blender's <i>Copy Rotation</i> constraint:
 * the rotation of the layer is combined with the rotation of a target layer, axis by axis
 * in a choice of Euler orders, with a choice of mix modes and spaces, and blended back
 * with an influence.<br />
 * On a 2D layer, the constraint drives the <i>Rotation</i>, around Z, which is also the rotation
 * of the layer itself. On a 3D layer, it drives the <i>X</i>, <i>Y</i> and <i>Z Rotation</i>, and
 * the rotation of the layer itself is its <i>Orientation</i>, which the constraint leaves alone:
 * a driven property can't be read back by the expressions driving the other two.<br />
 * The target is a layer of any composition of the project, picked in the Duik panel
 * and looked up by name; it can be changed later with {@link Duik.Constraint.setTarget}.<br />
 * Several of these effects can be added on the same layer; they're evaluated in
 * order, the same way Blender stacks constraints.<br />
 * The constraint is computed live by an expression and never needs a keyframe.
 * @param {CompItem} comp - The composition holding the target.
 * @param {Layer} target - The target layer.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.copyRotation = function(comp, target, layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Copy Rotation"), false);

    var pe = Duik.PseudoEffect.COPY_ROTATION;
    var effects = [];

    layers.do(function(layer) {
        // The name of the effect is the key of its target, so it has to be unique.
        var name = Duik.Constraint.uniqueEffectName(layer, pe.name);
        var effect = pe.apply(layer, name);
        effects.push(effect);

        var kind = Duik.Constraint.constraintKind(effect);
        var targets = Duik.Constraint.constraintTargets(layer, kind);
        if (comp && target) targets[name] = [comp.name, target.name];
        Duik.Constraint.writeExpressions(layer, kind, targets);
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Copy Rotation"));

    return effects;
}

Duik.CmdLib['Constraint']["Copy Point Rotation"] = "Duik.Constraint.copyPointRotation()";
/**
 * Adds a <i>copy point rotation</i> constraint to the layers: a copy rotation constraint whose target
 * is a point of a Bezier path, turned along the path, so that the layer follows its curvature.<br />
 * The point is a vertex of the path, picked by its index. It turns like a child of the layer of the path
 * would, placed on the vertex, with its X axis along the tangent there, the way the path goes, and its
 * Y axis along the normal. At a corner, the tangent can be taken on either side of the vertex, or halfway.<br />
 * It has all the options of the copy rotation constraint, see {@link Duik.Constraint.copyRotation}, and
 * shares its expressions, so that both kinds are stacked on the same layer and evaluated in order.<br />
 * The target is a path of a layer of any composition of the project, a shape path or a mask, picked in
 * the Duik panel and looked up by name; it can be changed later with {@link Duik.Constraint.setTarget}.<br />
 * The constraint is computed live by expressions and never needs a keyframe.
 * @param {CompItem} [comp] - The composition holding the target.
 * @param {Layer} [target] - The target layer.
 * @param {PropertyBase|DuAEProperty|Array.<string|int>} [path] - The path of the target layer: a path
 * property, the shape path or mask holding it, or its address, as {@link Duik.Constraint.pathAddress}
 * gives it. A property is enough: its layer and its composition are the target when they're omitted.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.copyPointRotation = function(comp, target, path, layers) {
    return Duik.Constraint.addPointConstraint(
        Duik.PseudoEffect.COPY_POINT_ROTATION,
        i18n._("Copy Point Rotation"),
        comp, target, path, layers
    );
}

/**
 * The functions the expressions of the armature constraint are made of. They also read the
 * rest pose, so that the constraint doesn't move its layer while its target is in that pose.
 * @private
 * @return {string} The functions.
 */
Duik.Constraint.armatureFunctions = function() {
    return [
        '// The rotation of a layer around Z, relative to its parent.',
        '// The orientation of 3D layers is a part of it.',
        'function localRotation(l) {',
        '    var r = l.rotation.value;',
        '    if (l.anchorPoint.value.length == 3) r += l.orientation.value[2];',
        '    return r;',
        '}',
        '',
        '// A negatively scaled parent mirrors the rotation of its children,',
        '// and a vertical flip turns them upside down.',
        'function scaleMirror(l) {',
        '    var m = 1;',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        var s = l.scale.value;',
        '        m *= Math.sign(s[0] * s[1]);',
        '    }',
        '    return m;',
        '}',
        'function scaleUTurn(l) {',
        '    var u = 1;',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        u = u * l.scale.value[1];',
        '    }',
        '    if (u < 0) return 180;',
        '    return 0;',
        '}',
        '',
        '// The rotation the parents of a layer add to its own.',
        'function parentsRotation(l) {',
        '    var r = 0;',
        '    while (l.hasParent) {',
        '        l = l.parent;',
        '        var lr = localRotation(l);',
        '        if (l.hasParent) {',
        '            var s = l.parent.scale.value;',
        '            lr *= Math.sign(s[0] * s[1]);',
        '        }',
        '        r += lr;',
        '    }',
        '    return r;',
        '}',
        '',
        '// The rotation of a layer in the space of its own comp, every parent applied.',
        'function worldRotation(l) {',
        '    return localRotation(l) * scaleMirror(l) + scaleUTurn(l) + parentsRotation(l);',
        '}',
        '',
        '// Comp space -> the space the rotation of a layer is expressed in. It only reads the',
        '// parents of the layer, so that the position and scale of the layer can use it too.',
        'function toLocalRotation(l, r) {',
        '    return (r - scaleUTurn(l) - parentsRotation(l)) * scaleMirror(l);',
        '}',
        '',
        '// Comp space -> the space the position of a layer is expressed in.',
        '// A layer without a parent is already in comp space.',
        'function toParentSpace(l, p) {',
        '    if (!l.hasParent) return p;',
        '    return l.parent.fromWorld(p);',
        '}',
        '',
        'function offsetPoint(p, x, y) {',
        '    var q = [ p[0] + x, p[1] + y ];',
        '    if (p.length > 2) q.push(p[2]);',
        '    return q;',
        '}',
        '',
        '// The pose of a bone, in the space the position of a layer is expressed in: the location',
        '// of its anchor point, and the vectors one pixel along its X and Y axis become, holding its',
        '// rotation, scale and skew. They are measured over a hundred pixels, for precision.',
        'function bonePose(l, bone) {',
        '    var a = bone.anchorPoint.value;',
        '    var o = toParentSpace(l, bone.toWorld(a));',
        '    var x = toParentSpace(l, bone.toWorld(offsetPoint(a, 100, 0)));',
        '    var y = toParentSpace(l, bone.toWorld(offsetPoint(a, 0, 100)));',
        '    return {',
        '        location: [ o[0], o[1], o.length > 2 ? o[2] : 0 ],',
        '        x: [ (x[0] - o[0]) / 100, (x[1] - o[1]) / 100 ],',
        '        y: [ (y[0] - o[0]) / 100, (y[1] - o[1]) / 100 ]',
        '    };',
        '}'
    ].join('\n');
}

/**
 * Builds the expressions of the armature constraint: one for each of the properties it drives.
 * @private
 * @param {Object} [targets] The targets, as <code>{ effectName: [compName, layerName] }</code>.
 * @param {string} [property='ADBE Position'] The match name of the property: <code>'ADBE Position'</code>,
 * <code>'ADBE Rotate Z'</code> or <code>'ADBE Scale'</code>.
 * @return {string} The expression.
 */
Duik.Constraint.armatureExpression = function(targets, property) {
    property = def(property, 'ADBE Position');
    var p = Duik.PseudoEffect.ARMATURE.props;
    var rest = p['DUIK Data'];

    function param(name) {
        return 'fx(' + rest[name].index + ').value';
    }

    var main;
    if (property == 'ADBE Rotate Z') main = [
        'var orientation = 0;',
        'if (thisLayer.anchorPoint.value.length == 3) orientation = thisLayer.orientation.value[2];',
        '',
        '// This layer turns as much as its X axis does.',
        'var constraints = armatureConstraints(true);',
        'var result = value;',
        'for (var i = 0, n = constraints.length; i < n; i++) {',
        '    var c = constraints[i];',
        '    result += turnOf(c.transform, result + orientation, c.turns) * c.influence;',
        '}',
        'result;'
    ];
    else if (property == 'ADBE Scale') main = [
        'var orientation = 0;',
        'if (thisLayer.anchorPoint.value.length == 3) orientation = thisLayer.orientation.value[2];',
        '',
        'var constraints = armatureConstraints(true);',
        '',
        '// How much the scale changes depends on the rotation of this layer before the',
        '// constraints, but its rotation holds the one after them: take their turns out.',
        '// That is exact, unless a bone is scaled unevenly.',
        'var rotation = thisLayer.rotation.value + orientation;',
        'for (var i = 0, n = constraints.length; i < n; i++)',
        '    rotation -= constraints[i].turns * constraints[i].influence;',
        '',
        'var result = copyOf(value);',
        'for (var i = 0, n = constraints.length; i < n; i++) {',
        '    var c = constraints[i];',
        '    var scaled = scaleOf(c.transform, rotation, result);',
        '    result[0] += (scaled[0] - result[0]) * c.influence;',
        '    result[1] += (scaled[1] - result[1]) * c.influence;',
        '    rotation += turnOf(c.transform, rotation, c.turns) * c.influence;',
        '}',
        'result;'
    ];
    else main = [
        'var constraints = armatureConstraints(false);',
        'var result = copyOf(value);',
        'for (var i = 0, n = constraints.length; i < n; i++) {',
        '    var c = constraints[i];',
        '    var moved = transformPoint(c.transform, result);',
        '    for (var k = 0; k < result.length; k++) result[k] += (moved[k] - result[k]) * c.influence;',
        '}',
        'result;'
    ];

    return [DuAEExpression.Id.ARMATURE_CONSTRAINT,
        DuAEExpression.Library.get(['checkDuikEffect', 'sign']),
        Duik.Constraint.targetExpression(targets),
        '',
        Duik.Constraint.armatureFunctions(),
        '',
        '// The pose of the target in which the constraint does nothing,',
        '// taken by Duik and stored in the effect.',
        'function restPose(fx) {',
        '    return {',
        '        location: [ ' + param('Rest location X') + ', ' + param('Rest location Y') + ', ' + param('Rest location Z') + ' ],',
        '        x: [ ' + param('Rest X axis X') + ', ' + param('Rest X axis Y') + ' ],',
        '        y: [ ' + param('Rest Y axis X') + ', ' + param('Rest Y axis Y') + ' ],',
        '        rotation: ' + param('Rest rotation'),
        '    };',
        '}',
        '',
        '// The transformation taking a bone from its rest pose to its current pose: the pose',
        '// times the inverse of the rest pose, like the deformation matrix of a Blender bone.',
        '// null when the rest pose is flat, as it is before being set.',
        'function restToPose(rest, pose) {',
        '    var det = rest.x[0] * rest.y[1] - rest.y[0] * rest.x[1];',
        '    if (Math.abs(det) < 1e-9) return null;',
        '    var ia = rest.y[1] / det;',
        '    var ib = -rest.x[1] / det;',
        '    var ic = -rest.y[0] / det;',
        '    var id = rest.x[0] / det;',
        '    return {',
        '        a: pose.x[0] * ia + pose.y[0] * ib,',
        '        b: pose.x[1] * ia + pose.y[1] * ib,',
        '        c: pose.x[0] * ic + pose.y[0] * id,',
        '        d: pose.x[1] * ic + pose.y[1] * id,',
        '        from: rest.location,',
        '        to: pose.location',
        '    };',
        '}',
        '',
        '// Moves a point with the bone. The depth only follows the bone.',
        'function transformPoint(m, p) {',
        '    var x = p[0] - m.from[0];',
        '    var y = p[1] - m.from[1];',
        '    var q = [ m.a * x + m.c * y + m.to[0], m.b * x + m.d * y + m.to[1] ];',
        '    if (p.length > 2) q.push(p[2] + m.to[2] - m.from[2]);',
        '    return q;',
        '}',
        '',
        '// The vector the X axis of a layer turned by r degrees becomes.',
        'function axisOf(m, r) {',
        '    var a = degreesToRadians(r);',
        '    return [ m.a * Math.cos(a) + m.c * Math.sin(a), m.b * Math.cos(a) + m.d * Math.sin(a) ];',
        '}',
        '',
        '// How many degrees a layer turned by r degrees turns: as much as its X axis, with',
        '// as many full turns as the bone made since its rest pose.',
        'function turnOf(m, r, turns) {',
        '    var v = axisOf(m, r);',
        '    var angle = radiansToDegrees(Math.atan2(v[1], v[0])) - r - turns;',
        '    return turns + angle - 360 * Math.round(angle / 360);',
        '}',
        '',
        '// The scale of a layer turned by r degrees, once transformed: stretched as much as its',
        '// X axis, with its area scaled as much as any area. A layer can\'t show the skew.',
        'function scaleOf(m, r, s) {',
        '    var v = axisOf(m, r);',
        '    var k = Math.sqrt(v[0] * v[0] + v[1] * v[1]);',
        '    if (k == 0) return s;',
        '    var q = [ s[0] * k, s[1] * (m.a * m.d - m.b * m.c) / k ];',
        '    if (s.length > 2) q.push(s[2]);',
        '    return q;',
        '}',
        '',
        'function copyOf(v) {',
        '    var c = [];',
        '    for (var i = 0; i < v.length; i++) c.push(v[i]);',
        '    return c;',
        '}',
        '',
        '// The armature constraints of this layer, from top to bottom: the transformation of their',
        '// bone since the rest pose, how many degrees the bone turned, and the influence.',
        'function armatureConstraints(withTurns) {',
        '    var list = [];',
        '    for ( var i = 1, n = thisLayer("Effects").numProperties; i <= n; i++ ) {',
        '        var fx = thisLayer.effect(i);',
        '        if ( !checkDuikEffect(fx, "DUIK armature") ) continue;',
        '        if ( !fx.active ) continue;',
        '',
        '        var t = targetOf(fx);',
        '        if (!t) continue;',
        '',
        '        // Blender divides the transformation by the total weight of the targets: with a',
        '        // single target, any weight applies all of it. Its dual quaternion blending, when',
        '        // "Preserve Volume" is checked, gives back that same transformation too.',
        '        if (fx(' + p['Weight'].index + ').value <= 0) continue;',
        '',
        '        var rest = restPose(fx);',
        '        var m = restToPose(rest, bonePose(thisLayer, t.layer));',
        '        if (!m) continue;',
        '',
        '        var turns = 0;',
        '        if (withTurns) turns = toLocalRotation(thisLayer, worldRotation(t.layer)) - rest.rotation;',
        '',
        '        // Blended with the influence, like Blender does, so that several',
        '        // of these effects can be stacked on the same layer.',
        '        list.push({ transform: m, turns: turns, influence: fx(' + p['Influence'].index + ').value / 100 });',
        '    }',
        '    return list;',
        '}',
        '',
        main.join('\n'),
        ''
    ].join('\n');
}

Duik.CmdLib['Constraint']["Armature"] = "Duik.Constraint.armature()";
/**
 * Adds an <i>armature</i> constraint to the layers.<br />
 * This is an After Effects recreation of Blender's <i>Armature</i> constraint, with a single target:
 * everything the target layer did since its rest pose, moving, turning and scaling, is done to the
 * layer too, the way an armature moves what's bound to its bones.<br />
 * The rest pose is the pose of the target in which the constraint doesn't move the layer. It's taken
 * when the target is set, and stored relative to the parent of the layer, which plays the part of
 * Blender's armature object; see {@link Duik.Constraint.setRestPose}.<br />
 * The target is a layer of any composition of the project, picked in the Duik panel
 * and looked up by name; it can be changed later with {@link Duik.Constraint.setTarget}.<br />
 * Several of these effects can be added on the same layer; they're evaluated in
 * order, the same way Blender stacks constraints.<br />
 * The constraint is computed live by expressions on the position, rotation and scale of the layer,
 * and never needs a keyframe.
 * @param {CompItem} comp - The composition holding the target.
 * @param {Layer} target - The target layer.
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The constrained layers.
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.armature = function(comp, target, layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Armature"), false);

    var pe = Duik.PseudoEffect.ARMATURE;
    var effects = [];

    layers.do(function(layer) {
        // The name of the effect is the key of its target, so it has to be unique.
        var name = Duik.Constraint.uniqueEffectName(layer, pe.name);
        var effect = pe.apply(layer, name);
        effects.push(effect);

        var kind = Duik.Constraint.constraintKind(effect);
        for (var i = 0, n = kind.properties.length; i < n; i++) {
            var prop = layer.transform.property(kind.properties[i]);
            if (!prop) continue;
            var targets = Duik.Constraint.bakedTargets(prop.expression);
            if (comp && target) targets[name] = [comp.name, target.name];
            prop.expression = Duik.Constraint.armatureExpression(targets, kind.properties[i]);
        }

        if (comp && target) Duik.Constraint.captureRestPose({ layer: layer, name: name, kind: kind });
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Armature"));

    return effects;
}

/**
 * Takes the current pose of the target of an armature constraint as its rest pose.
 * @private
 * @param {Object} constraint - The constraint, as returned by {@link Duik.Constraint.getConstraints}.
 * @return {Boolean} false if the constraint has no target.
 */
Duik.Constraint.captureRestPose = function(constraint) {
    var layer = constraint.layer;
    var prop = layer.transform.property(constraint.kind.properties[0]);
    var t = Duik.Constraint.bakedTargets(prop.expression)[constraint.name];
    if (!t) return false;

    var comp = layer.containingComp;
    var time = comp.time;
    var quote = Duik.Constraint.expressionString;

    // Scripts can't tell where a layer is, expressions can: a temporary null layer reads the pose,
    // with the very functions the constraint is built with, so that they match exactly.
    var probe = comp.layers.addNull();
    probe.threeDLayer = true;
    var pose = [DuAEExpression.Library.get(['sign']),
        Duik.Constraint.armatureFunctions(),
        'var owner = thisComp.layer(' + layer.index + ');',
        'var bone = comp(' + quote(t[0]) + ').layer(' + quote(t[1]) + ');',
        'var pose = bonePose(owner, bone);',
        ''
    ].join('\n');

    var transform = probe.transform;
    transform.position.expression = pose + 'var result = pose.location;\nresult;';
    transform.anchorPoint.expression = pose +
        'var result = [ pose.x[0], pose.x[1], toLocalRotation(owner, worldRotation(bone)) ];\nresult;';
    transform.scale.expression = pose + 'var result = [ pose.y[0], pose.y[1], 0 ];\nresult;';
    var location = transform.position.valueAtTime(time, false);
    var x = transform.anchorPoint.valueAtTime(time, false);
    var y = transform.scale.valueAtTime(time, false);

    var source = probe.source;
    probe.remove();
    source.remove();

    var rest = Duik.PseudoEffect.ARMATURE.props['DUIK Data'];
    var effect = layer("ADBE Effect Parade").property(constraint.name);
    effect(rest['Rest location X'].index).setValue(location[0]);
    effect(rest['Rest location Y'].index).setValue(location[1]);
    effect(rest['Rest location Z'].index).setValue(location[2]);
    effect(rest['Rest X axis X'].index).setValue(x[0]);
    effect(rest['Rest X axis Y'].index).setValue(x[1]);
    effect(rest['Rest rotation'].index).setValue(x[2]);
    effect(rest['Rest Y axis X'].index).setValue(y[0]);
    effect(rest['Rest Y axis Y'].index).setValue(y[1]);

    return true;
}

Duik.CmdLib['Constraint']["Set rest pose"] = "Duik.Constraint.setRestPose()";
/**
 * Takes the current pose of the target of an armature constraint as its rest pose: the pose in which
 * the constraint doesn't move the layer, which goes back to its own transformation.<br />
 * Duik takes it when the target is set. Take it again to bind the layer to another pose of the target,
 * like editing the rest pose of a Blender armature, or after re-parenting the layer.
 * @param {PropertyBase|DuAEProperty} [effect] - The constraint effect, or any of its parameters.
 * The selected one in the active composition if omitted.
 * @return {Boolean} true if the rest pose has been set; false if there's no armature constraint with a target.
 */
Duik.Constraint.setRestPose = function(effect) {
    var constraint = Duik.Constraint.getTargetConstraints(effect)[0];
    if (!constraint || !constraint.kind.restPose) return false;

    DuAE.beginUndoGroup( i18n._("Set rest pose"), false);

    var done = Duik.Constraint.keepSelection(constraint.layer.containingComp, function() {
        return Duik.Constraint.captureRestPose(constraint);
    });

    DuAE.endUndoGroup( i18n._("Set rest pose"));

    return done;
}

/**
 * Tells what a constraint effect drives, and how to apply it.
 * @private
 * @param {PropertyGroup} effect The effect.
 * @return {Object|null} <code>{ matchName, properties, id, expression, named, path, restPose }</code>: the
 * match name of the effect, the match names of the transform properties its expressions can drive, and
 * the id of these expressions. Kinds with the same id share their expressions.<br />
 * <code>expression</code> is the function building the expressions of a constraint whose target is set
 * in Duik — copy location, copy rotation, copy point location, copy point rotation or armature — from
 * its targets and the match name of the property, <code>null</code> for the other constraints.<br />
 * <code>path</code> is true when the target of the constraint is a path of its target layer.<br />
 * <code>named</code> is true when the expressions read the effect by its name, instead of going
 * through all the effects of its kind.<br />
 * <code>restPose</code> is true when the constraint has a rest pose, set by {@link Duik.Constraint.setRestPose}.<br />
 * <code>null</code> if the effect isn't a constraint which can be applied.
 */
Duik.Constraint.constraintKind = function(effect) {
    var kinds = [{
        pe: Duik.PseudoEffect.COPY_LOCATION,
        properties: ['ADBE Position'],
        id: DuAEExpression.Id.COPY_LOCATION_CONSTRAINT,
        expression: Duik.Constraint.copyLocationExpression
    }, {
        // A 3D layer is constrained around its three axis, a 2D one around Z only.
        pe: Duik.PseudoEffect.COPY_ROTATION,
        properties: ['ADBE Rotate X', 'ADBE Rotate Y', 'ADBE Rotate Z'],
        id: DuAEExpression.Id.COPY_ROTATION_CONSTRAINT,
        expression: Duik.Constraint.copyRotationExpression
    }, {
        // The point constraints share the expressions of their companion, to be stacked with it.
        pe: Duik.PseudoEffect.COPY_POINT_LOCATION,
        properties: ['ADBE Position'],
        id: DuAEExpression.Id.COPY_LOCATION_CONSTRAINT,
        expression: Duik.Constraint.copyLocationExpression,
        path: true
    }, {
        pe: Duik.PseudoEffect.COPY_POINT_ROTATION,
        properties: ['ADBE Rotate X', 'ADBE Rotate Y', 'ADBE Rotate Z'],
        id: DuAEExpression.Id.COPY_ROTATION_CONSTRAINT,
        expression: Duik.Constraint.copyRotationExpression,
        path: true
    }, {
        pe: Duik.PseudoEffect.ARMATURE,
        properties: ['ADBE Position', 'ADBE Rotate Z', 'ADBE Scale'],
        id: DuAEExpression.Id.ARMATURE_CONSTRAINT,
        expression: Duik.Constraint.armatureExpression,
        restPose: true
    }, {
        pe: Duik.PseudoEffect.POSITION,
        properties: ['ADBE Position'],
        id: DuAEExpression.Id.POSITION_CONSTRAINT
    }, {
        pe: Duik.PseudoEffect.ORIENTATION,
        properties: ['ADBE Rotate Z'],
        id: DuAEExpression.Id.ORIENTATION_CONSTRAINT
    }, {
        // Each dimension gets the expression when the position is separated.
        pe: Duik.PseudoEffect.PARENT,
        properties: ['ADBE Position', 'ADBE Position_0', 'ADBE Position_1', 'ADBE Position_2', 'ADBE Rotate Z'],
        id: DuAEExpression.Id.PARENT_CONSTRAINT
    }, {
        // Only the last path constraint added to a layer drives it: its expressions read it by name.
        pe: Duik.PseudoEffect.PATH,
        properties: ['ADBE Position', 'ADBE Rotate Z'],
        id: DuAEExpression.Id.PATH_CONSTRAINT,
        named: true
    }];

    for (var i = 0, n = kinds.length; i < n; i++) {
        var kind = kinds[i];
        if (effect.matchName.indexOf(kind.pe.matchName) != 0) continue;
        return {
            matchName: kind.pe.matchName,
            properties: kind.properties,
            id: kind.id,
            expression: def(kind.expression, null),
            named: def(kind.named, false),
            path: def(kind.path, false),
            restPose: def(kind.restPose, false)
        };
    }

    return null;
}

/**
 * Applies a single constraint.
 * @private
 * @param {Layer} layer - The constrained layer.
 * @param {string} name - The name of the constraint effect.
 */
Duik.Constraint.applyConstraint = function(layer, name) {
    var effects = layer("ADBE Effect Parade");
    var effect = effects.property(name);
    if (!effect) return;
    var kind = Duik.Constraint.constraintKind(effect);
    if (!kind) return;

    var time = layer.containingComp.time;

    // The expressions are still needed as long as other constraints sharing them remain,
    // unless they read this effect by its name.
    var count = 0;
    for (var i = 1, n = effects.numProperties; i <= n; i++) {
        var other = Duik.Constraint.constraintKind(effects.property(i));
        if (other && other.id == kind.id) count++;
    }
    var keep = count > 1 && !kind.named;

    // Only the expressions written by Duik can be rebuilt: any other one is left alone.
    // When one is disabled, the constraint doesn't drive its property.
    var driven = [];
    for (var i = 0, n = kind.properties.length; i < n; i++) {
        var prop = layer.transform.property(kind.properties[i]);
        if (!prop) continue;
        // A hidden property doesn't turn the layer: a 2D layer only turns around Z.
        if (Duik.Constraint.isHiddenProperty(layer, kind.properties[i])) continue;
        // Separating the dimensions hides the position, and the other way round.
        if (prop.isSeparationLeader && prop.dimensionsSeparated) continue;
        if (prop.isSeparationFollower && !prop.separationLeader.dimensionsSeparated) continue;

        var expression = prop.expression;
        if (expression.indexOf(kind.id) < 0) continue;
        if (kind.named && expression.indexOf('effect("' + name + '")') < 0) continue;
        driven.push({
            property: kind.properties[i],
            prop: prop,
            expression: expression,
            enabled: prop.expressionEnabled,
            value: null
        });
    }

    // Like Blender, evaluate this constraint alone, on the unconstrained value: the other constraints
    // have no target in these expressions, so they're skipped. The expressions of a constraint can
    // read each other, so they're all set before any value is read.
    if (kind.expression) {
        for (var i = 0, n = driven.length; i < n; i++) {
            var d = driven[i];
            if (!d.enabled) continue;
            var only = {};
            only[name] = Duik.Constraint.bakedTargets(d.expression)[name];
            d.prop.expression = kind.expression(only, d.property);
        }
    }
    for (var i = 0, n = driven.length; i < n; i++) {
        if (driven[i].enabled) driven[i].value = driven[i].prop.valueAtTime(time, false);
    }

    for (var i = 0, n = driven.length; i < n; i++) {
        var d = driven[i];
        if (kind.expression) {
            var targets = Duik.Constraint.bakedTargets(d.expression);
            delete targets[name];
            if (keep) {
                d.prop.expression = kind.expression(targets, d.property);
                d.prop.expressionEnabled = d.enabled;
            }
            else d.prop.expression = '';
        }
        // The other expressions go through the effects by themselves: there's nothing to rebuild.
        else if (!keep) d.prop.expression = '';
    }

    // Removed before setting the values, so that the expressions left in place don't read it anymore.
    effect.remove();

    for (var i = 0, n = driven.length; i < n; i++) {
        var value = driven[i].value;
        if (value === null) continue;
        // Removing an effect can invalidate the references to the properties of the layer.
        var prop = layer.transform.property(driven[i].property);
        var current = prop.valueAtTime(time, true);

        // The position, orientation and parent constraints left on the layer each add their own
        // share on top of its value, whatever it is: take it out, so that the layer stays where it is.
        if (keep && !kind.expression) {
            var remaining = prop.valueAtTime(time, false);
            if (value instanceof Array) {
                for (var j = 0, m = value.length; j < m; j++) value[j] += current[j] - remaining[j];
            }
            else value += current - remaining;
        }

        // Don't add a keyframe to an animated property if the constraint changed nothing.
        if (!DuMath.equals(value, current, 4)) new DuAEProperty(prop).setValue(value, time);
    }
}

/**
 * Finds the constraints among properties.
 * @private
 * @param {PropertyBase|DuAEProperty|PropertyBase[]|DuAEProperty[]|DuList.<PropertyBase>} [props] - The constraint effects,
 * or any of their parameters. The selected ones in the active composition if omitted.
 * @param {Boolean} [targetOnly=false] - Set to true to keep only the constraints whose target is set in Duik:
 * copy location, copy rotation, copy point location, copy point rotation and armature.
 * @return {Object[]} One <code>{ layer, name, index, kind }</code> per constraint: the constrained
 * layer, the name and index of the effect, and what it drives, as returned by
 * {@link Duik.Constraint.constraintKind}.<br />
 * Constraints are kept by layer and name, as removing an effect invalidates
 * the references to the other effects of the layer.
 */
Duik.Constraint.getConstraints = function(props, targetOnly) {
    targetOnly = def(targetOnly, false);
    if (!isdef(props)) {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return [];
        props = comp.selectedProperties;
    }
    props = new DuList(props);

    var constraints = [];
    var found = {};
    for (var i = 0, n = props.length(); i < n; i++) {
        var prop = props.at(i);
        if (prop instanceof DuAEProperty) prop = prop.getProperty();
        if (prop.propertyDepth < 2) continue;

        // A selected parameter stands for its effect.
        var effect = prop;
        if (prop.propertyDepth > 2) effect = prop.propertyGroup(prop.propertyDepth - 2);
        if (effect.parentProperty.matchName != 'ADBE Effect Parade') continue;
        var kind = Duik.Constraint.constraintKind(effect);
        if (!kind || (targetOnly && !kind.expression)) continue;

        var layer = effect.propertyGroup(2);
        var key = layer.containingComp.id + '/' + layer.index + '/' + effect.propertyIndex;
        if (found[key]) continue;
        found[key] = true;

        constraints.push({ layer: layer, name: effect.name, index: effect.propertyIndex, kind: kind });
    }

    return constraints;
}

/**
 * Finds the constraints whose target is set in Duik among properties: the copy location,
 * copy rotation, copy point location, copy point rotation and armature constraints.
 * @private
 * @param {PropertyBase|DuAEProperty|PropertyBase[]|DuAEProperty[]|DuList.<PropertyBase>} [props] - The constraint effects,
 * or any of their parameters. The selected ones in the active composition if omitted.
 * @return {Object[]} The constraints, as returned by {@link Duik.Constraint.getConstraints}.
 */
Duik.Constraint.getTargetConstraints = function(props) {
    return Duik.Constraint.getConstraints(props, true);
}

Duik.CmdLib['Constraint']["Apply Constraint"] = "Duik.Constraint.apply()";
/**
 * Applies constraints, the way Blender's <i>Apply</i> does: the result of the constraint at the
 * current time becomes the value of the properties it drives, and its effect is removed.<br />
 * This works with the position, copy location, orientation, copy rotation, copy point location, copy point
 * rotation, path, parent and armature constraints.<br />
 * A copy location, copy rotation, copy point location, copy point rotation or armature constraint is
 * evaluated alone, on the unconstrained value of
 * the layer, and the other constraints are left in place: as in Blender, applying a constraint which isn't
 * the first of its stack may move the layer. The constraints are applied from top to bottom, so applying
 * a whole stack at once keeps the layer where it is.<br />
 * The position, orientation and parent constraints don't stack: each one adds its own share to the
 * layer, so applying any of them keeps the layer where it is.<br />
 * If a property is animated, the value is set with a keyframe at the current time.
 * @param {PropertyBase[]|DuAEProperty[]|DuList.<PropertyBase>} [effects] - The constraint effects,
 * or any of their parameters. The selected ones in the active composition if omitted.
 * @return {int} The number of constraints applied.
 */
Duik.Constraint.apply = function(effects) {
    var constraints = Duik.Constraint.getConstraints(effects);
    if (constraints.length == 0) return 0;

    // Top to bottom, as the stack is evaluated. The order between layers doesn't matter:
    // an applied constraint leaves its layer where it is at the current time.
    constraints.sort(function(a, b) { return a.index - b.index; });

    // Removing an effect deselects its layer: keep the selection to restore it afterwards.
    var selectedLayers = [];
    var comps = {};
    for (var i = 0, n = constraints.length; i < n; i++) {
        var comp = constraints[i].layer.containingComp;
        if (comps[comp.id]) continue;
        comps[comp.id] = true;
        selectedLayers = selectedLayers.concat(comp.selectedLayers);
    }

    DuAE.beginUndoGroup( i18n._("Apply Constraint"), false);

    for (var i = 0, n = constraints.length; i < n; i++) {
        Duik.Constraint.applyConstraint(constraints[i].layer, constraints[i].name);
    }

    DuAEComp.selectLayers(selectedLayers);

    DuAE.endUndoGroup( i18n._("Apply Constraint"));

    return constraints.length;
}

Duik.CmdLib['Constraint']["Orientation"] = "Duik.Constraint.orientation()";
/**
 * Adds an orientation constraint to the layers
 * @param {Layer|Layer[]|DuList.<Layer>} [layers] - The layers
 * @return {Property[]} The effects added on the layers to control the constraint.
 */
Duik.Constraint.orientation = function(layers) {
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    DuAE.beginUndoGroup( i18n._("Orientation constraint"), false);

    var pe = Duik.PseudoEffect.ORIENTATION;
    
    var effects = [];

    layers.do(function(layer) {
        var effect = pe.apply(layer);
        effects.push(effect);
        var p = pe.props;

        layer.rotation.expression = [DuAEExpression.Id.ORIENTATION_CONSTRAINT,
            DuAEExpression.Library.get(['sign', 'getOrientation', 'dishineritRotation', 'checkDuikEffect']),
            'var result = dishineritRotation( thisLayer );',
            'for ( var i = 1; i <= thisLayer( "Effects" ).numProperties; i++ ) {',
            '    var fx = effect( i );',
            '    if ( !checkDuikEffect(fx, "DUIK orientationConstraint") ) continue;',
            '    var l = null;',
            '    try {',
            '        l = fx(' + p['Constraint to'].index + ');',
            '    } catch ( e ) {}',
            '    if ( l ) result += getOrientation( l ) * ( fx(' + p['Weight'].index + ').value / 100 );',
            '}',
            'result;',
            ''
        ].join('\n');

    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Orientation constraint"));

    return effects;
}

Duik.CmdLib['Constraint']["Constraint"] = "Duik.Constraint.constraint()";
/**
 * Description
 * @param {PropertyBase|DuAEProperty} [path] - The path, taken from the layer selection if omitted
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers
 * @param {boolean} [moveToPath=false] - Set to true to move the layer to the first point on the path
 * @returns {Boolean} true if a constraint could be created
 */
Duik.Constraint.path = function(path, layers, moveToPath) {

    moveToPath = def(moveToPath, false);
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);

    if (typeof path === 'undefined' && layers.length() < 2) return false;

    if (typeof path === 'undefined') {
        var pathLayer = layers.pop();
        var pathProps = DuAELayer.getSelectedProps(pathLayer, PropertyValueType.SHAPE)
        if (pathProps.length == 0) return false;
        path = pathProps.pop();
    }

    // Prepare the path
    path = new DuAEProperty(path);
    path = path.pathProperty();
    if (!path) return;

    DuAE.beginUndoGroup( i18n._("Path constraint"), false);

    var l = path.layer;
    var pathExpr = path.expressionLink(true);

    var pe = Duik.PseudoEffect.PATH;
    var p = pe.props;

    // Get the position of the path (let's take the first group into account)
    var pathPosition = [0,0,0];
    if (path.matchName == 'ADBE Vector Shape') {
        // Get the containing group
        var matrix = DuAEShapeLayer.getTransformMatrix(path, false);
        pathPosition = matrix.applyToPoint(pathPosition);
    }

    layers.do(function(layer) {

        var effect = pe.apply(layer);
        
        var expr = [DuAEExpression.Id.PATH_CONSTRAINT,
            'var fx = effect("' + effect.name + '");',
            'var l = thisComp.layer("' + l.name + '");',
            'var p = ' + pathExpr + ';',
            'var percent = fx(' + p['Percent along path'].index + ').value % 100 / 100;',
            'if (percent == 0) percent = 0.0001;',
            'var pathOffset = fx(' + p['Path Offset'].index + ').value;',
            '// path value',
            'var result = l.toWorld( p.pointOnPath(percent, time ) +  p.normalOnPath(percent, time) * pathOffset );',
            'if (hasParent) result = parent.fromWorld(result);',
            '//layer position',
            'result += value;'
        ].join('\n');

        var posProp = new DuAEProperty(layer.position);
        posProp.setExpression(expr);

        expr = [DuAEExpression.Id.PATH_CONSTRAINT,
            'var fx = effect("' + effect.name + '");\n' +
            'var autoOrient = fx(' + p['Orientation'].index + ').value;\n' +
            'var result = value;\n' +
            'if (autoOrient)\n' +
            '{',
            'var l = thisComp.layer("' + l.name + '");',
            'var p = ' + pathExpr + ';\n' +
            'var percent = fx(' + p['Percent along path'].index + ').value % 100 / 100;\n' +
            'var C = p.tangentOnPath(percent, time);',
            'var angle = Math.atan2(C[1], C[0]);',
            'angle = radiansToDegrees(angle);',
            'angle += l.rotation.value;',
            'result += angle;',
            '}',
            'result;'
        ].join('\n');

        var rotProp = new DuAEProperty(layer.rotation);
        rotProp.setExpression(expr);

        if (moveToPath) {
            DuAELayer.setPosition( layer, pathPosition);
            layer.transform.rotation.setValue(0);
        }
    });

    DuAEComp.selectLayers(layers);

    DuAE.endUndoGroup( i18n._("Path constraint"));
    return true;
}

Duik.CmdLib['Constraint']["Pin"] = "Duik.Constraint.pin()";
Duik.CmdLib['Constraint']["Pin without tangent"] = "Duik.Constraint.pin( false )";
/**
 * Add pins on the properties
 * @param {Boolean} [tangents=true] Set to false to ignore Bézier path tangents
 * @param {PropertyBase[]} [props] The properties to pin
 * @returns {ShapeLayer[]} The pins
 */
Duik.Constraint.pin = function(tangents, props) {
    tangents = def(tangents, true);

    var props = DuAEComp.getSelectedProps();

    DuAE.beginUndoGroup( i18n._("Add Pins"), false);

    //just create a single bone without any prop
    if (props.length == 0) {
        var pin = Duik.Pin.create();
        if (!pin) return;
        pin.selected = true;

        DuAE.endUndoGroup( i18n._("Add Pins"));
        return [pin];
    }

    DuAEProject.setProgressMode(true);

    var pins = [];
    props = new DuList(props);
    props.do(function(prop) {
        pins = pins.concat(Duik.Pin.add(prop, tangents));
    });

    //if nothing was created
    if (pins.length == 0) {
        var layers = DuAEComp.getSelectedLayers();
        layers = new DuList(layers);

        //Try to find puppet pins
        layers.do(function(layer) {
            var ps = DuAELayer.getPuppetPins(layer);
            ps = new DuList(ps);
            ps.do(function(pin) {
                pins.push(Duik.Pin.add(pin, tangents));
            });

        });
    }

    //Try any spatial property
    if (pins.length == 0) {
        props.do(function(prop) {
            pins = pins.concat(Duik.Pin.addPins(prop, tangents));
        });
    }

    DuAEComp.selectLayers(pins);

    DuAEProject.setProgressMode(false);
    DuAE.endUndoGroup( i18n._("Add Pins"));

    return pins;
}

/**
 * A very simple FK control
 * @param {Layer[]|DuList.<Layer>} [layers] - The layers, already parented or ordered from root (at index 0) to end
 * @param {Layer} [controller] - An already existing controller.
 * @return {Layer} The controller of the FK.
 */
Duik.Constraint.simpleFK = function(layers, controller) {
    controller = def(controller, null);
    layers = def(layers, DuAEComp.unselectLayers());
    layers = new DuList(layers);
    layers = DuAELayer.sortByParent(layers);
    var numLayers = layers.length;

    // create controller
    if (controller == null) {
        var l = layers[0];
        controller = Duik.Controller.create(l.containingComp, Duik.Controller.Type.ROTATION, l);
    }

    //add checkbox and data
    var effect = controller.effect.addProperty("ADBE Checkbox Control");
    effect.name = layers[0].name + " Follow";
    var effectName = effect.name;

    for (var i = 0; i < numLayers; i++) {
        var goalData = layers[i].effect.addProperty("ADBE Layer Control");
        goalData.name = "FK Controller";
        var dataName = goalData.name;
        goalData(1).setValue(controller.index);

        var exp = DuAEExpression.Id.SIMPLE_FK + "\n" +
            "var ctrl = null;\n" +
            "var result = value;\n" +
            "try { ctrl = effect(\"" + dataName + "\")(1); } catch (e){};\n" +
            "if (ctrl != null)\n" +
            "{\n" +
            "var goal = ctrl.effect(\"" + effectName + "\")(1).value;\n" +
            "result += ctrl.rotation.value/" + (numLayers / (i + 1)) + ";\n" +
            "if (!goal)\n" +
            "{\n" +
            "var layer = thisLayer;\n" +
            "while (layer.hasParent)\n" +
            "{\n" +
            "layer = layer.parent;\n" +
            "result = result - layer.rotation/" + (numLayers / (i + 1)) + ";\n" +
            "}\n" +
            "}\n" +
            "}\n" +
            "result;";

        var rotProp = new DuAEProperty(layers[i].transform.rotation);
        rotProp.setExpression(exp);
    }
}

Duik.CmdLib['Constraint']["Remove thisComp"] = "Duik.Constraint.removeThisCompInExpressions()";
/**
 * Replace all <code>thisComp</code> occurences by <code>comp("name")</code>.
 * @param {Duik.SelectionMode} [selectionMode=DuAE.SelectionMode.ACTIVE_COMPOSITION] The items where to modify the expressions.
 */
Duik.Constraint.removeThisCompInExpressions = function(selectionMode) {
    selectionMode = def(selectionMode, DuAE.SelectionMode.ACTIVE_COMPOSITION);
    DuAE.beginUndoGroup( i18n._("Remove 'thisComp'"));

    DuAEComp.removeThisCompInExpressions(selectionMode);

    DuAE.endUndoGroup();
}

Duik.CmdLib['Constraint']["Use thisComp"] = "Duik.Constraint.removeCompInExpressions()";
/**
 * Replace all <code>comp("name")</code> occurences by <code>thisComp</code>.
 * @param {Duik.SelectionMode} [selectionMode=DuAE.SelectionMode.ACTIVE_COMPOSITION] The items where to modify the expressions.
 */
Duik.Constraint.removeCompInExpressions = function(selectionMode) {
    selectionMode = def(selectionMode, DuAE.SelectionMode.ACTIVE_COMPOSITION);
    DuAE.beginUndoGroup( i18n._("Use 'thisComp'"));

    DuAEComp.removeCompInExpressions(selectionMode);

    DuAE.endUndoGroup();
}

Duik.CmdLib['Constraint']["Remove thisLayer"] = "Duik.Constraint.removeThisLayerInExpressions()";
/**
 * Replace all <code>thisLayer</code> occurences by <code>layer("name")</code>.
 * @param {Duik.SelectionMode} [selectionMode=DuAE.SelectionMode.ACTIVE_COMPOSITION] The items where to modify the expressions.
 */
Duik.Constraint.removeThisLayerInExpressions = function(selectionMode) {
    selectionMode = def(selectionMode, DuAE.SelectionMode.ACTIVE_COMPOSITION);
    DuAE.beginUndoGroup( i18n._("Remove 'thisComp'"));

    DuAEComp.removeThisLayerInExpressions(selectionMode);

    DuAE.endUndoGroup();
}

Duik.CmdLib['Constraint']["Use thisComp"] = "Duik.Constraint.removeLayerInExpressions()";
/**
 * Replace all <code>layer("name")</code> occurences by <code>thisLayer</code>.
 * @param {Duik.SelectionMode} [selectionMode=DuAE.SelectionMode.ACTIVE_COMPOSITION] The items where to modify the expressions.
 */
Duik.Constraint.removeLayerInExpressions = function(selectionMode) {
    selectionMode = def(selectionMode, DuAE.SelectionMode.ACTIVE_COMPOSITION);
    DuAE.beginUndoGroup( i18n._("Use 'thisComp'"));

    DuAEComp.removeLayerInExpressions(selectionMode);

    DuAE.endUndoGroup();
}

/**
 * Connects the properties to a master property.
 * @param {DuAEProperty[]|DuList.<DuAEProperty>} props - The child properties
 * @param {Property|DuAEProperty} masterProp - The parent property
 * @param {float} [min=0] - The minimum value
 * @param {float} [max=100] - The maximum value
 * @param {DuAE.Axis} [axis=DuAE.Axis.X] - The axis or channel to connect
 * @param {DuAE.Type} [type=DuAE.Type.VALUE] - The type
 * @param {boolean} [toKeyMorph] By default, the connector will detect Key Morphs to adjust the connection on the weight of the selected keys.<br/>
 * When set to true, it will just connect the weight of the selected key morphs (or all of them if not selected).<br/>
 * When false, it does a standard connection even if some key morphs are selected.
 * @return {PropertyGroup} The controlling effect created
 */
Duik.Constraint.connector = function(props, masterProp, min, max, axis, type, toKeyMorph) {
    min = def(min, 0);
    max = def(max, 100);
    axis = def(axis, DuAE.Axis.X);
    type = def(type, DuAE.Type.VALUE);

    var doKeyMorph = -1;
    if (typeof toKeyMorph !== 'undefined') {
        if (toKeyMorph) doKeyMorph = 1;
        else doKeyMorph = 0;
    }

    masterProp = new DuAEProperty(masterProp);

    // Adjust values
    if (isNaN(min)) min = 0;
    if (isNaN(max)) min = 100;

    var dim = masterProp.dimensions();
    if (dim == 4) {
        var bpc = app.project.bitsPerChannel;
        if (bpc == 8) {
            min /= 255;
            max /= 255;
        } else if (bpc == 16) {
            min /= 32768;
            max /= 32768;
        } else if (bpc == 32) {
            if (min < 0) min = 0;
            else if (min > 1) min = 1;
            if (max < 0) max = 0;
            else if (max > 1) max = 1;
        }
    }

    DuAEComp.setUniqueLayerNames(undefined, masterProp.comp);

    // Get layer
    var masterLayer = masterProp.layer;

    // Try to find an already existing effect
    var effect = null;
    var pe = Duik.PseudoEffect.ONED_CONNECTOR;
    if (dim == 2) pe = Duik.PseudoEffect.TWOD_CONNECTOR;
    else if (dim == 3) pe = Duik.PseudoEffect.THREED_CONNECTOR;
    else if (dim == 4) pe = Duik.PseudoEffect.COLOR_CONNECTOR;

    var modeId = pe.props['Connection mode'].index;
    var minId = pe.props['Minimum'].index
    var maxId = pe.props['Maximum'].index;
    var axisId = 4;
    if (dim > 1 && dim < 4) axisId = pe.props['Axis'].index;
    else if (dim == 4) axisId = pe.props['Channel'].index;

    var connectorEffects = DuAEProperty.getProps(masterLayer.property('ADBE Effect Parade'), pe.matchName, true);

    // Check if there is one with the same settings
    for (var i = 0, num = connectorEffects.length; i < num; i++) {
        var e = connectorEffects[i];
        if (e.prop(minId).value() != min) continue;
        if (e.prop(maxId).value() != max) continue;
        if (e.prop(modeId).value() != type) continue;
        if (dim > 1 && dim < 4) {
            if (e.prop(axisId).value() != axis) continue;
        }
        if (dim == 4) {
            if (e.prop(axisId).value() != axis - 3) continue;
        }
        //if all tests passed, this is the one!
        effect = e;
        break;
    }

    // If not found, create and set values
    if (!effect) {
        effect = pe.apply(masterLayer, i18n._("Connector") + ' ' + masterProp.name);
        effect(minId).setValue(min);
        effect(maxId).setValue(max);
        effect(modeId).setValue(type);
        if (dim == 4) effect(axisId).setValue(axis - 3);
        else if (dim > 1) effect(axisId).setValue(axis);
    }

    var peKeyMorph = Duik.PseudoEffect.KEY_MORPH_K;
    function keyMorphProp( prop ) {
        if (prop.matchName == peKeyMorph.matchName) return new DuAEProperty(prop.getProperty().property(4));
        var p = prop.getProperty().parentProperty;
        if (p.matchName == peKeyMorph.matchName) return prop;
        return null;
    }

    // Prepare the expression

    var colorValFn = 	[ 'function getColorVal(col, axis) {',
        '	if (axis == 1) return col[0];',
        '	if (axis == 2) return col[1];',
        '	if (axis == 3) return col[2];',
        '	if (axis == 4) return col[3];',
        '	var c = rgbToHsl(col);',
        '	if (axis == 5) return c[0];',
        '	if (axis == 6) return c[1];',
        '	if (axis == 4) return c[2];',
        '}',
        ''
    ].join('\n');

    var exp = [
        'var ctrlValue = ctrlLayer' + masterProp.expressionLink(false, false) + ';',
        'var ctrlEffect = ctrlLayer.effect("' + effect.name + '");',
        'var ctrlMin = ctrlEffect(' + minId + ').value;',
        'var ctrlMax = ctrlEffect(' + maxId + ').value;',
        'var ctrlType = ctrlEffect(' + modeId + ').value;',
        'var result = value;',
        'if (numKeys >= 2 && ctrlEffect.active)',
        '{',
        'if (ctrlType == 2) ctrlValue = ctrlValue.speed;',
        'else if (ctrlType == 3) ctrlValue = ctrlValue.velocity;',
        'else ctrlValue = ctrlValue.value;'
    ].join('\n');

    if (masterProp.isAngle()) {
        exp += '\nif (ctrlType == 1) ctrlValue = ctrlValue % 360;\n';
    } else if (dim == 2 || dim == 3) {
        exp += '\nif (ctrlType == 1 || ctrlType == 3) {\nvar axis = ctrlEffect(' + axisId + ').value-1;\nctrlValue = ctrlValue[axis];\n}\n'
    } else if (dim == 4) {
        exp += colorValFn +
            'var axis = ctrlEffect(' + axisId + ').value;\n' +
            'ctrlValue = getColorVal(ctrlValue, axis);\n';
    }
    exp += 'var t = 0;\n' +
        'var beginTime = key(1).time;\n' +
        'var endTime = key(numKeys).time;\n' +
        'if (ctrlMin > ctrlMax)\n' +
        '{\n' +
        't = linear(ctrlValue, ctrlMin, ctrlMax, endTime, beginTime);\n' +
        '}\n' +
        'else\n' +
        '{\n' +
        't = linear(ctrlValue, ctrlMin, ctrlMax, beginTime, endTime);\n' +
        '}\n' +
        'result = valueAtTime(t);\n' +
        '}\n' +
    'result;';

    var kmExp1 = [
        '// Connector effect',
        'var ctrlValue = ctrlLayer' + masterProp.expressionLink(false, false) + ';',
        'var ctrlEffect = ctrlLayer.effect("' + effect.name + '");',
        'var ctrlMin = ctrlEffect(' + minId + ').value;',
        'var ctrlMax = ctrlEffect(' + maxId + ').value;',
        '// Key morph values'
    ].join('\n');

    if (masterProp.isDropdown()) kmExp1 += '\nvar isMenu = true;';
    else kmExp1 += '\nvar isMenu = false;';

    var kmExp2 = [
        DuAEExpression.Library.get([
            'getNextKey',
            'getPrevKey'
        ]),
        'function interpolate()',
        '{',
        '  if (!ctrlEffect.active) return 0;',
        '  if (numMorphs == 0) return 0;',
        '',
        '  numMorphs--;',
        '  var pK = getPrevKey(time, ctrlValue);',
        '  var nK = getNextKey(time, ctrlValue);',
        '',
    ].join('\n');

    if (masterProp.isAngle()) {
        kmExp2 += '\nvar cValue = linear(ctrlValue.value % 360, ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 2 || dim == 3) {
        kmExp2 += '\nvar axis = ctrlEffect(' + axisId + ').value-1;\nvar cValue = linear(ctrlValue.value[axis], ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 4) {
        kmExp2 += colorValFn +
            '\nvar axis = ctrlEffect(' + axisId + ').value;\n' +
            'var cValue = getColorVal(ctrlValue.value, axis);\n' +
            'cValue = linear(cValue, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }
    else {
        kmExp2 += '\nvar cValue = linear(ctrlValue.value, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }

    kmExp2 += '  if (!pK || !nK) {\n' +
        '    if (Math.round(cValue) == thisIndex) return 100;\n' +
        '    else return 0;\n' +
        '  }\n' +
        '	var nValue = 0;\n' +
        '	var pValue = 0;\n' +
    '	if(nK) {';

    if (masterProp.isAngle()) {
        kmExp2 += '  nValue = linear(nK.value % 360, ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 2 || dim == 3) {
        kmExp2 += 'nValue = linear(nK.value[axis], ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 4) {
        kmExp2 += colorValFn +
            'nValue = getColorVal(nK.value, axis);\n' +
            'nValue = linear(nValue, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }
    else {
        kmExp2 += '  nValue = linear(nK.value, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }
    
    kmExp2 += '    nValue = Math.round(nValue);\n' +
        '  }\n' +
    '	if(pK) {';

    if (masterProp.isAngle()) {
        kmExp2 += '  pValue = linear(pK.value % 360, ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 2 || dim == 3) {
        kmExp2 += 'pValue = linear(pK.value[axis], ctrlMin, ctrlMax, 0, numMorphs);\n';
    } else if (dim == 4) {
        kmExp2 += colorValFn +
            'pValue = getColorVal(pK.value, axis);\n' +
            'pValue = linear(pValue, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }
    else {
        kmExp2 += '  pValue = linear(pK.value, ctrlMin, ctrlMax, 0, numMorphs);\n';
    }

    kmExp2 += '    pValue = Math.round(pValue);\n' +
        '  }\n' +
        '\n' +
        'if (isMenu) {\n' +
        '    cValue = easeOut(time, pK.time, nK.time, pValue, nValue);\n' +
        '}\n' +
        '\n' +
        '  if (pValue != thisIndex && nValue != thisIndex) return 0;\n' +
        '  if (pValue == nValue) return 100;\n' +
        '\n' +
        '  if (pValue == thisIndex && pValue < nValue)\n' +
        '      return linear( cValue, nValue, pValue, 100, 0 );\n' +
        '  if (pValue == thisIndex && pValue >= nValue)\n' +
        '       return linear( cValue, pValue, nValue, 0, 100 );\n' +
        '  if (pValue < nValue)\n' +
        '      return linear( cValue, pValue, nValue, 0, 100 );\n' +
        '  return linear( cValue, pValue, nValue, 100, 0 );\n' +
        '}\n' +
        '\n' +
        'var result = value + interpolate();\n' +
        '\n' +
    'result;';

    // Count key morphs
    props = new DuList(props);
    var kmProps = new DuList();
    if (doKeyMorph != 0)
        for (var i = props.length()-1; i >= 0; i--)
        {
            var kmP = keyMorphProp(new DuAEProperty(props.at(i)));
            if (kmP) {
                kmProps.pushUnique(undefined, kmP);
                props.remove(i);
            }
        }
    // Try to find key morphs on the layers
    if (doKeyMorph == 1 && kmProps.length() == 0) {
        var kmLayers = new DuList();
        for (var i = props.length()-1; i >= 0; i--)
        {
            var p = new DuAEProperty(props.at(i));
            var l = p.layer;
            if ( kmLayers.contains(l), function(a, b) { return a.index == b.index; } ) continue;
            for (var f = 1, nf = l.property("ADBE Effect Parade").numProperties; f <= nf; f++) {
                var fx = l.property("ADBE Effect Parade").property(f);
                var kmP = keyMorphProp(new DuAEProperty(fx));
                if (kmP) {
                    kmProps.pushUnique(undefined, kmP);
                }
            }
        }
    }

    kmProps.sort(function(a, b) {
        return a.getProperty().parentProperty.propertyIndex - b.getProperty().parentProperty.propertyIndex;
    });

    // Set to the props
    var masterComp = masterLayer.containingComp;
    var comp = 'thisComp.';

    if (doKeyMorph != 1) props.do(function(prop) {
        prop = new DuAEProperty(prop);
        if (!prop.riggable()) return;
        // check if the current comp is the same than the comp containing the masterProperty
        var childComp = prop.comp;
        if (masterComp !== childComp) comp = 'comp("' + masterComp.name + '").';
        else comp = 'thisComp.';
        prop.setExpression(
            DuAEExpression.Id.CONNECTOR + '\n' +
            'var ctrlLayer = ' + comp + 'layer("' + masterLayer.name + '");\n' +
            exp,
            false
        );
        if (prop.matchName == "ADBE Opacity") prop.layer.enabled = true;//*/
    });

    if (doKeyMorph != 0) kmProps.do(function(prop) {
        // check if the current comp is the same than the comp containing the masterProperty
        var childComp = prop.comp;
        if (masterComp !== childComp) comp = 'comp("' + masterComp.name + '").';
        else comp = 'thisComp.';

        prop.setExpression(
            DuAEExpression.Id.CONNECTOR + '\n' +
            'var ctrlLayer = ' + comp + 'layer("' + masterLayer.name + '");\n' +
            kmExp1 +
            '\nvar numMorphs = ' + kmProps.length() + ';\n' + 
            'var thisIndex = ' + kmProps.current + ';\n' + 
            kmExp2,
            false
        );
    });

    return effect;
}

Duik.CmdLib['Constraint']["Connector"] = "Duik.Constraint.quickConnector()";
/**
 * Connects the properties together to a % slider
 * @param {Property[]|DuAEProperty[]} [props] - The properties to connect. The selected properties by default.
 */
Duik.Constraint.quickConnector = function(props) {
    props = def(props, DuAEComp.getSelectedProps());
    if (props.length == 0) return;
    props = new DuList(props);

    DuAE.beginUndoGroup(i18n._("Connector"), false);

    // Create the slider
    var ctrlLayer = props.first().layer;
    var comp = props.first().comp;
    var effect = Duik.PseudoEffect.QUICK_CONNECTOR.apply(ctrlLayer);

    DuAEComp.setUniqueLayerNames(undefined, comp);

    var exp = [ DuAEExpression.Id.CONNECTOR,
        'var ctrlLayer = thisComp.layer("' + ctrlLayer.name + '");',
        'var ctrlEffect = ctrlLayer.effect("' + effect.name + '");',
        'var ctrlValue = ctrlEffect(1);',
        'var ctrlMin = 0;',
        'var ctrlMax = 100;',
        'var result = value;',
        'if (numKeys >= 2 && ctrlEffect.enabled)',
        '{',
        'ctrlValue = ctrlValue.value;',
        'var t = 0;',
        'var beginTime = key(1).time;',
        'var endTime = key(numKeys).time;',
        'if (ctrlMin > ctrlMax)',
        '{',
        't = linear(ctrlValue, ctrlMin, ctrlMax, endTime, beginTime);',
        '}',
        'else',
        '{',
        't = linear(ctrlValue, ctrlMin, ctrlMax, beginTime, endTime);',
        '}',
        'result = valueAtTime(t);',
        '}',
        'result;'
    ].join('\n');

    var firstTime = comp.duration;
    var lastTime = 0;

    props.do(function(prop) {
        prop = new DuAEProperty(prop);
        if (!prop.riggable()) return;
        // Set the expression
        prop.setExpression(exp, false);
        // Get first/last time
        var f = prop.firstKeyTime();
        if (f != null) if (f < firstTime) firstTime = f;
        var l = prop.lastKeyTime();
        if (l != null) if (l > lastTime) lastTime = l;
    });

    // Set default keyframes
    effect(1).setValuesAtTimes([firstTime, lastTime], [0,100]);

    DuAE.endUndoGroup(i18n._("Connector"));
}

/**
 * Connects a dropdown menu effect to a list of layers, using their opacities.<br />
 * Note: On After Effects < 17.0.1, the list is not updated to reflect the list of layers.
 * @param {DuAEProperty|Property} dropdown The dropdown menu property.
 * @param {Layer[]|DuList.<Layer>} [layers] The layers to control. The selected layers by default.
 */
Duik.Constraint.linkLayersToDropdown = function(dropdown, layers) {
    layers = def(layers, DuAEComp.getSelectedLayers());

    dropdown = new DuAEProperty(dropdown);
    var effect = dropdown.parentProperty();

    var masterComp = dropdown.comp;
    var masterLayer = dropdown.layer;

    var updateDropdown = DuAE.version.atLeast('17.0.1');

    layers = new DuList(layers);
    var layerNames = [];
    layers.do(function(layer) {
        // check if the current comp is the same than the comp containing the masterProperty
        var childComp = layer.containingComp;
        var comp;
        if (masterComp !== childComp) comp = 'comp("' + masterComp.name + '").';
        else comp = 'thisComp.';

        var id = layers.current + 1;

        layer.transform.opacity.expression = [DuAEExpression.Id.CONNECTOR,
            'var ctrlLayer = ' + comp + 'layer("' + masterLayer.name + '");\n' +
            'var fx = ctrlLayer.effect("' + effect.name + '");',
            'var result = 0;',
            'if (fx(1).value == ' + id + ') result = value;',
            'result;'
        ].join('\n');

        if (updateDropdown) layerNames.push(layer.name);
    });

    if (updateDropdown) dropdown.setPropertyParameters(layerNames);
}

/**
 * Prepares a visual audio controller to connect to properties
 * @param {AVLayer} [audioLayer] The layer with the audio to setup. The selected layer by default.
 * @return {DuAEProperty} The value to use with the connector
 */
Duik.Constraint.setupAudioController = function(audioLayer) {
    audioLayer = def(audioLayer, DuAEComp.getActiveLayer());
    if (!audioLayer) return;
    if (!audioLayer.hasAudio) return;

    DuAE.beginUndoGroup(i18n._("Audio connector"), false);

    // Duplicate the layer
    audioLayer.duplicate();
    // Precompose
    var comp = audioLayer.containingComp;
    var index = audioLayer.index;
    var acCompName = DuAEProject.newUniqueCompName('AC.' + i18n._("Settings") + '::' + audioLayer.name);
    var acComp = comp.layers.precompose([index], acCompName);
    // Lock and hide the precomp
    var acCompLayer = comp.layer(index);
    acCompLayer.moveToEnd();
    acCompLayer.enabled = false;
    acCompLayer.audioEnabled = false;
    acCompLayer.guideLayer = true;
    acCompLayer.shy = true;

    // Setup the controllers
    audioLayer = acComp.layer(1);

    // Add the spectrum layer
    var spectrumLayer = acComp.layers.addShape();
    Duik.Layer.setAttributes(
        spectrumLayer,
        Duik.Layer.Type.AUDIO,
        i18n._("Audio spectrum"),
        undefined,
        undefined,
        i18n._("Audio spectrum")
        );
    var solidGroup = spectrumLayer("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    solidGroup.name = 'Solid';
    var solidContent = solidGroup.property("ADBE Vectors Group");
    var solid = solidContent.addProperty("ADBE Vector Shape - Rect");
    solid('ADBE Vector Rect Size').expression = '[thisComp.width, thisComp.height*3];';
    var fill = solidContent.addProperty("ADBE Vector Graphic - Fill");
    fill("ADBE Vector Fill Color").setValue([0,0,0,1]);

    // Add an Ear layer
    var earLayer = Duik.Controller.create(acComp, Duik.Controller.Type.EAR);
    earLayer.transform.position.setValue([acComp.width / 4, acComp.height / 2]);

    // Add the settings layer
    var settingsLayer = Duik.Controller.create(acComp, Duik.Controller.Type.AUDIO);
    Duik.Layer.setGroupName( i18n._("Audio Effector"), settingsLayer);
    // Add effect
    var pe = Duik.PseudoEffect.AUDIO_CONNECTOR;
    var ampId = pe.props['Amplitude'].index;
    var minId = pe.props['Minimum frequency (Hz)'].index;
    var maxId = pe.props['Maximum frequency (Hz)'].index;
    var easeId = pe.props['Ease'].index;
    var timeEaseId = pe.props['Time settings']['Ease (seconds)'].index;
    var offsetId = pe.props['Time settings']['Offset (seconds)'].index;
    var settingsEffect = pe.apply(settingsLayer);

    // Setup the spectrum
    var spectrumEffect = spectrumLayer.property('ADBE Effect Parade').addProperty('ADBE AudSpect');
    spectrumEffect(1).setValue(4); // Audio Layer
    spectrumEffect(2).expression = '[0,thisComp.height]'; // start point
    spectrumEffect(3).expression = '[thisComp.width,thisComp.height]'; // end point
    spectrumEffect(6).expression = 'thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + minId + ')'; // start freq
    spectrumEffect(7).expression = 'thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + maxId + ')'; // end freq
    spectrumEffect(9).expression = 'thisComp.height * thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + ampId + ') / 100;'; // max height
    spectrumEffect(10).expression = '1000*( thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + timeEaseId + ') + thisComp.frameDuration);'; // audio duration
    spectrumEffect(11).expression = '1000*thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + offsetId + ');'; // audio offset
    spectrumEffect(12).expression = 'thisComp.width/thisProperty.propertyGroup()(8)+10;'; // thickness
    spectrumEffect(13).setValue(0); // softness
    spectrumEffect(14).setValue([1,1,1,1]); // inside color
    spectrumEffect(15).expression = 'thisProperty.propertyGroup()(14);'; // outside color
    spectrumEffect(23).setValue(1); // composite on original
    var blurEffect = spectrumLayer.property('ADBE Effect Parade').addProperty('ADBE Motion Blur');
    blurEffect(2).expression = 'thisComp.height*thisComp.layer("' + settingsLayer.name + '").effect("' + settingsEffect.name + '")(' + easeId + ')/100'; // blur length
    spectrumLayer.locked = true;

    // Setup the ear
    var earEffect = earLayer.property('ADBE Effect Parade').addProperty('ADBE Slider Control');
    earEffect.name = i18n._("Audio Effector");
    earEffect(1).expression = [ DuAEExpression.Id.AUDIO_EFFECTOR,
        'var spectrumLayer = thisComp.layer("' + spectrumLayer.name + '");',
        'var smpl = spectrumLayer.sampleImage(thisLayer.position);',
        'smpl[0]*100;'
    ].join('\n');

    DuAE.endUndoGroup(i18n._("Audio connector"));

    // OK!
    return new DuAEProperty( earEffect(1) );
}