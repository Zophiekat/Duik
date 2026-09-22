function buildConstraintsUI(tab, standAlone) {
    standAlone = def(standAlone, false);

    if (!standAlone) {
        // A Spacer
        var spacer = tab.add('group');
        spacer.margins = 0;
        spacer.spacing = 0;
        spacer.size = [-1, 3];

        // A title
        tab.add('statictext', undefined, i18n._("Links and constraints")).alignment = ['center', 'top'];
    }

    // Useful methods
    function hideAllGroups() {
        parentAcrossCompGroup.visible = false;
        constraintSettingsGroup.visible = false;
        armatureDeformGroup.visible = false;
        pathConstraintGroup.visible = false;
        constraintsGroup.visible = false;
        propInfoGroup.visible = false;
        measureGroup.visible = false;
        moveAnchorPointGroup.visible = false;
        connectorGroup.visible = false;
        effectorMapGroup.visible = false;
    }

    // The panel is a row: the tool bar on the left, then the buttons and the groups they open.
    var contentGroup = addNativeGroup(tab, 'row');
    contentGroup.alignment = ['fill', 'fill'];
    contentGroup.alignChildren = ['fill', 'fill'];
    // Room on each side of the separator, so the tool bar and the buttons don't hug it.
    contentGroup.spacing = 8;

    // tools: two per row, down the left of the panel
    var toolsGroup = addNativeToolBar(contentGroup, 2, 32, 32);
    //toolsGroup.buttonWidth = 28;
    toolsGroup.alignment = ['left', 'top'];

    createListButton( toolsGroup );

    var separateButton = toolsGroup.addButton(
        i18n._("Split values"),
        w12_separate_dimensions,
        i18n._("Separate the dimensions of the selected properties.\nAlso works with colors, separated to RGB or HSL.")
    );
    separateButton.onClick = Duik.Constraint.separateDimensions;

    var unlinkButton = toolsGroup.addButton(
        i18n._("Edit mode"),
        w12_unlink,
        i18n._("Toggle edit mode")
    );
    unlinkButton.onClick = Duik.Layer.unlink;

    var lockButton = toolsGroup.addButton(
        i18n._("Lock prop."),
        w12_lock,
        i18n._("Lock the value of the selected properties."),
    );
    lockButton.onClick = Duik.Constraint.lock;

    var zeroButton = toolsGroup.addButton(
        i18n._("Add zero"),
        w12_zero,
        i18n._("Zero out the selected layers transformation.\n[Alt]: Reset the transformation of the selected layers to 0.\n[Ctrl] + [Alt]: Also reset the opacity to 100 %.")
    );
    zeroButton.onClick = function() {
        Duik.Constraint.zero(undefined, true);
    };
    zeroButton.onAltClick = Duik.Constraint.resetPRS;
    zeroButton.onCtrlAltClick = function() {
        Duik.Constraint.resetPRS(undefined, true);
    };

    var constraintSettingsButton = toolsGroup.addButton(
        i18n._("Constraint settings"),
        w12_blender_icon_constraint,
        i18n._("Set the target of the selected copy location, copy rotation or armature constraint.") + "\n\n" +
            i18n._("[Alt]: Launches the corresponding ScriptUI Stand-Alone panel if it is installed.")
    );
    constraintSettingsButton.onClick = function() { showConstraintSettings(); };
    constraintSettingsButton.onAltClick = openConstraintSettingsPanel;

    var applyConstraintButton = toolsGroup.addButton(
        i18n._("Apply Constraint"),
        w12_bake,
        i18n._("Apply the selected constraints, like in Blender: " +
                "their result at the current time becomes the value of the layer, and the effects are removed.\n\n" +
                "Works with the position, copy location, orientation, copy rotation, path, parent and armature constraints.")
    );
    applyConstraintButton.onClick = function() {
        if (Duik.Constraint.apply() == 0)
            alert(i18n._("Select the constraint effects to apply first."));
    };

    var moveAnchorPointButton = createMoveAnchorPointButton(toolsGroup, mainGroup, hideAllGroups);
    moveAnchorPointButton.onClick = function() {

        if (!moveAnchorPointGroup.built) {
            buildNativeMoveAnchorPointGroup(moveAnchorPointGroup, constraintsGroup);
        }

        hideAllGroups();
        moveAnchorPointGroup.visible = true;
    };

    var etmButton = toolsGroup.addButton(
        i18n._("Expose transform"),
        w12_expose_transform,
        i18n._("Expose the transformation of layers using a nice controller.")
    );
    etmButton.onClick = Duik.Constraint.exposeTransform;

    var locatorButton = toolsGroup.addButton(
        i18n._("Locator"),
        w12_locator,
        i18n._("Create locator.")
    );
    locatorButton.onClick = Duik.Constraint.locator;

    var locatorModeSelector;
    var extractLocatorButton = toolsGroup.addButton(
        i18n._("Extract locators"),
        w12_extract_locator,
        i18n._("Extract locators."),
        true
    );
    extractLocatorButton.optionsPopup.build = function() {
        locatorModeSelector = addNativeDropdown(extractLocatorButton.optionsPanel, [
            [i18n._("Use expressions"), w16_expression],
            [i18n._("Use essential properties"), w16_essential_property]
        ], 1);

        extractLocatorButton.onClick = function() {
            var useEssentialProperties = locatorModeSelector.selection.index == 1;
            Duik.Constraint.extractLocators(useEssentialProperties);
        }
    }

    var alignButton = toolsGroup.addButton(
        i18n._("Align layers"),
        w12_h_align,
        i18n._("Align layers.") + '\n' +
            i18n._("All selected layers will be aligned\nto the last selected one."),
        true
    );
    alignButton.optionsPopup.build = function() {
        var posButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Position"), w16_move, '', true);
        var rotButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Rotation"), w16_rotate, '', true);
        var scaButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Scale"), w16_scale, '', true);
        var opaButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Opacity"), w16_opacity);

        alignButton.optionsPanel.add(
            'statictext',
            undefined,
            i18n._("All selected layers will be aligned\nto the last selected one."),
            { multiline: true }
        );

        alignButton.onClick = function() {
            Duik.Constraint.alignLayers(
                posButton.value,
                rotButton.value,
                scaButton.value,
                opaButton.value
            )
        }
    }

    var measureButton = toolsGroup.addButton(
        i18n._("Measure distance"),
        w12_measure,
        i18n._("Measure the distance between two layers.")
    );
    measureButton.onClick = function() {

        // Build panel
        if (!measureGroup.built) {
            addNativeSubPanel(
                measureGroup,
                i18n._("Measure distance"),
                constraintsGroup,
                false
            );

            measureText = measureGroup.add('statictext', undefined, '');
            measureText.alignment = ['fill', 'top'];

            measureValidButton = addNativeValidButton (
                measureGroup,
                i18n._("Measure distance"),
                i18n._("Measure the distance between two layers.")
            );

            measureValidButton.onClick = function() {
                var dist = DuAELayer.getDistance();
                dist = Math.round(dist);
                if (dist < 0) measureText.text = i18n._("Select two layers to measure the distance between them.");
                else measureText.text = i18n._("The distance is %1 px", dist);
            };

            nativeLayout(measureGroup);
        }

        measureValidButton.onClick();

        hideAllGroups()
        measureGroup.visible = true;
    };

    var propInfoButton = toolsGroup.addButton(
        i18n._("Prop. info"),
        DuScriptUI.Icon.HELP,
        i18n._("Get property detailed information.")
    );
    propInfoButton.onClick = function() {
        function update() {
            var props = DuAEComp.getSelectedProps();
            if (props.length == 0) return;
            var prop = props[props.length - 1];
            var comp = prop.comp;

            propInfoGroup.prop = prop;
            propInfoGroup.propInfoIndex.text = prop.index;
            propInfoGroup.name.text = prop.name;
            propInfoGroup.matchName.text = prop.matchName;
            propInfoGroup.dimensions.text = prop.dimensions();
            propInfoGroup.link.text = prop.expressionLink(prop, true, true);
            var preExpression = propInfoGroup.preExp.value;
            var fastMode = !propInfoGroup.precision.value;

            //Min and max val per axis
            var minVal = "";
            var maxVal = "";
            if (prop.dimensions() == 1) {
                var range = prop.range(0, preExpression, fastMode);
                minVal = Math.round(range[0] * 100) / 100;
                maxVal = Math.round(range[1] * 100) / 100;
            } else {
                for (var i = 0; i < prop.dimensions(); i++) {
                    var range = prop.range(i, preExpression);
                    if (i == 0) {
                        minVal += "[ ";
                        maxVal += "[ ";
                    }

                    minVal += Math.round(range[0] * 100) / 100;
                    maxVal += Math.round(range[1] * 100) / 100;

                    if (i == prop.dimensions() - 1) {
                        minVal += " ]";
                        maxVal += " ]";
                    } else {
                        minVal += " , ";
                        maxVal += " , ";
                    }
                }
            }
            propInfoGroup.minVal.text = minVal;
            propInfoGroup.maxVal.text = maxVal;
            var maxSpeed = Math.round(prop.maxSpeed(preExpression, fastMode) * 100) / 100;
            propInfoGroup.velocity.text = maxSpeed;
            if (maxSpeed == 0) propInfoGroup.averageVelocity.text = 0;
            else propInfoGroup.averageVelocity.text = Math.round(prop.averageSpeed(preExpression, fastMode) * 100) / 100;

            // Keyframes
            var numKeys = prop.numKeys(false); // the actual prop
            propInfoGroup.numKeyframes.text = prop.numKeys(true); // recursive
            if (numKeys > 0) {
                var duration = prop.keyTime( numKeys ) - prop.keyTime(1)
                propInfoGroup.keysDuration.text = (Math.round(duration*100)/100) + 's (' + Math.round(duration * comp.frameRate) + ' frames)';
            }
            else propInfoGroup.keysDuration.text = '0';
            selectedKeys = prop.selectedKeys();
            if (selectedKeys.length > 0) {
                var duration = prop.keyTime( selectedKeys[selectedKeys.length - 1] ) - prop.keyTime( selectedKeys[0] );
                propInfoGroup.selectedKeyDuration.text = (Math.round(duration*100)/100) + 's (' + Math.round(duration * comp.frameRate) + ' frames)';
            }
            else propInfoGroup.selectedKeyDuration.text = '0';
        }

        // Build panel
        if (!propInfoGroup.built) {
            var titleBar = addNativeSubPanel(
                propInfoGroup,
                i18n._("Prop. info"),
                constraintsGroup,
                false
            );

            var propInfoForm = addNativeForm(propInfoGroup);
            propInfoGroup.propInfoIndex = propInfoForm.addField("Index", "statictext", "0", "The index of the property")[1];
            propInfoGroup.name = propInfoForm.addField("Name", "edittext", "", "The name of the property")[1];
            propInfoGroup.matchName = propInfoForm.addField("Match Name", "edittext", "", "The matchName of the property")[1];
            propInfoGroup.dimensions = propInfoForm.addField("Num Dimensions", "statictext", "0", "The number of dimensions of the property")[1];
            propInfoGroup.link = propInfoForm.addField("Expression link", "edittext", "", "The expression link to the property (from the layer)")[1];
            propInfoGroup.minVal = propInfoForm.addField("Minimum value", "edittext", "", "The minimum value during the animation.")[1];
            propInfoGroup.maxVal = propInfoForm.addField("Maximum value", "edittext", "", "The maximum value during the animation.")[1];
            propInfoGroup.velocity = propInfoForm.addField("Maximum velocity", "edittext", "", "The maximum velocity during the animation.")[1];
            propInfoGroup.averageVelocity = propInfoForm.addField("Average velocity", "edittext", "", "The average velocity during the animation.")[1];
            propInfoGroup.numKeyframes = propInfoForm.addField("Number of keyframes", "statictext", "", "The keyframe count.")[1];
            propInfoGroup.selectedKeyDuration = propInfoForm.addField("Selected keys duration", "edittext", "", "The duration between the selected keyframes.")[1];
            propInfoGroup.keysDuration = propInfoForm.addField("Keyframes duration", "edittext", "", "The duration between the first and the last keyframe.")[1];
            propInfoGroup.preExp = propInfoForm.addField("Pre-expression val.", "checkbox", "", "Display pre-expression values.")[1];
            propInfoGroup.precision = propInfoForm.addField("Hi-precision", "checkbox", "", "Samples the values and velocity with a higher precision.\nWarning: this can be quite slong if the composition is very long.")[1];


            var validButton = addNativeValidButton(
                propInfoGroup,
                i18n._("Get property info"),
                i18n._("Get property detailed information.")
            );
            validButton.onClick = update;

            nativeLayout(propInfoGroup);
        }

        //values
        update();

        hideAllGroups()
        propInfoGroup.visible = true;
    };

    // Between the tool bar and the buttons.
    addNativeSeparator(contentGroup, 'vertical');

    var mainGroup = addNativeGroup(contentGroup, 'stack');
    //mainGroup.margins = 3;
    mainGroup.alignment = ['fill', 'fill'];

    var constraintsGroup = addNativeGroup(mainGroup, 'column');

    // A grid with a row per button: its options and image, then the button.
    var line1 = addNativeButtonGrid(constraintsGroup);
    line1.buttonHeight = 24;

    addAutorigButton(line1);

    var connectorButton = addNativeButton(
        line1,
        i18n._("Connector"),
        w16_connector,
        i18n._("Connect slave properties to a master property."),
        {
            options: true,
            optionsWithoutPanel: true
        }
    );
    connectorButton.onClick = Duik.Constraint.quickConnector;
    connectorButton.onOptions = function(showUI) {
        if (!connectorGroup.built) {
            // Utils
            // Connector variables
            var connector = {};
            connector.master = null;
            connector.type = 'prop';

            function createConnectOpacitiesButtonn( group ) {
                var connectToOpacitiesButton = addNativeButton(
                    group,
                    i18n._("Layer opacities"),
                    w16_layers,
                    i18n._("Connects the selected layers to the control you've just set, using their opacity properties to switch their visibility."),
                    { cell: true }
                );
                connectToOpacitiesButton.onClick = function() {
                    // Get layer selection
                    var layers = DuAEComp.getSelectedLayers();
                    if (layers.length == 0) return;

                    // Prepare settings
                    var min = parseFloat(minEdit.text);
                    var max = parseFloat(maxEdit.text);
                    var type = typeList.selection.index + 1;
                    var axis = DuAE.Axis.X;
                    var dim = connector.master.dimensions();
                    if (dim == 2 || dim == 3) {
                        if (axisList.selection.index == 1) axis = DuAE.Axis.Y;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.Z;
                    } else if (dim == 4) {
                        if (axisList.selection.index == 0) axis = DuAE.Axis.RED;
                        else if (axisList.selection.index == 1) axis = DuAE.Axis.GREEN;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.BLUE;
                        else if (axisList.selection.index == 3) axis = DuAE.Axis.ALPHA;
                        else if (axisList.selection.index == 4) axis = DuAE.Axis.HUE;
                        else if (axisList.selection.index == 5) axis = DuAE.Axis.SATURATION;
                        else if (axisList.selection.index == 6) axis = DuAE.Axis.VALUE;
                    }

                    DuAE.beginUndoGroup(i18n._("Connector"))

                    DuAELayer.sequence(layers);
                    // List layer opacities
                    var props = [];
                    for (var i = 0, n = layers.length; i < n; i++) {
                        var o = new DuAEProperty(layers[i].transform.opacity);
                        props.push(o);
                    }
                    Duik.Constraint.connector(props, connector.master, min, max, axis, type);

                    DuAE.endUndoGroup();
                };
            }

            function createConnectPropButton( group ) {
                var connectToPropsButton = addNativeButton(
                    group,
                    i18n._("Properties"),
                    w16_props,
                    i18n._("Connects the selected properties to the control you've just set."),
                    { cell: true }
                );
                connectToPropsButton.onClick = function() {
                    var props = DuAEComp.getSelectedProps();
                    if (props.length == 0) return;

                    // Prepare settings
                    var min = parseFloat(minEdit.text);
                    var max = parseFloat(maxEdit.text);
                    var typeIndex = 0;
                    if (typeList.selection) typeIndex = typeList.selection.index;
                    var type = typeIndex + 1;
                    var axis = DuAE.Axis.X;
                    var dim = connector.master.dimensions();
                    if (dim == 2 || dim == 3) {
                        if (axisList.selection.index == 1) axis = DuAE.Axis.Y;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.Z;
                    } else if (dim == 4) {
                        if (axisList.selection.index == 0) axis = DuAE.Axis.RED;
                        else if (axisList.selection.index == 1) axis = DuAE.Axis.GREEN;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.BLUE;
                        else if (axisList.selection.index == 3) axis = DuAE.Axis.ALPHA;
                        else if (axisList.selection.index == 4) axis = DuAE.Axis.HUE;
                        else if (axisList.selection.index == 5) axis = DuAE.Axis.SATURATION;
                        else if (axisList.selection.index == 6) axis = DuAE.Axis.VALUE;
                    }

                    DuAE.beginUndoGroup(i18n._("Connector"));

                    Duik.Constraint.connector(props, connector.master, min, max, axis, type, false);

                    DuAE.endUndoGroup();
                };
            }

            function createConnectKeyMorphButton( group ) {
                var connectToKeyMorphButton = addNativeButton(
                    group,
                    i18n._("Key Morph"),
                    w16_shape_keys,
                    i18n._("Connects the selected keys to the control you've just set."),
                    { cell: true }
                );
                connectToKeyMorphButton.onClick = function() {
                    var props = DuAEComp.getSelectedProps();
                    if (props.length == 0) return;

                    // Prepare settings
                    var min = parseFloat(minEdit.text);
                    var max = parseFloat(maxEdit.text);
                    var typeIndex = 0;
                    if (typeList.selection) typeIndex = typeList.selection.index;
                    var type = typeIndex + 1;
                    var axis = DuAE.Axis.X;
                    var dim = connector.master.dimensions();
                    if (dim == 2 || dim == 3) {
                        if (axisList.selection.index == 1) axis = DuAE.Axis.Y;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.Z;
                    } else if (dim == 4) {
                        if (axisList.selection.index == 0) axis = DuAE.Axis.RED;
                        else if (axisList.selection.index == 1) axis = DuAE.Axis.GREEN;
                        else if (axisList.selection.index == 2) axis = DuAE.Axis.BLUE;
                        else if (axisList.selection.index == 3) axis = DuAE.Axis.ALPHA;
                        else if (axisList.selection.index == 4) axis = DuAE.Axis.HUE;
                        else if (axisList.selection.index == 5) axis = DuAE.Axis.SATURATION;
                        else if (axisList.selection.index == 6) axis = DuAE.Axis.VALUE;
                    }

                    DuAE.beginUndoGroup(i18n._("Connector"));

                    Duik.Constraint.connector(props, connector.master, min, max, axis, type, true);

                    DuAE.endUndoGroup();
                };
            }

            // Picks the selected property / layer / control...
            function connectorPick() {
                connector.master = null;

                // First, get the selected layer
                var layer = DuAEComp.getActiveLayer();
                if (!layer) return;

                // Disable prop selection by default
                propList.removeAll();
                propListLabel.enabled = false;
                propList.enabled = false;

                // If there's a selected property, let's use it
                var prop = DuAELayer.getActiveProperty(layer);
                if (prop) {
                    if (prop.isProperty()) {
                        // Title
                        propLabel.text = prop.layer.index + ' - ' + prop.layer.name + ' # ' + prop.name;
                        connectorLoadMasterProperty(prop, 'prop');
                        return;
                    }
                }

                // If it's just a layer, check if there's something we know how to connect

                // Is it a slider?
                var pe = Duik.PseudoEffect.CONTROLLER_SLIDER;
                var effect = layer.effect(pe.matchName);
                if (effect) {
                    // Title
                    propLabel.text = layer.index + ' - ' + layer.name + ' # ' + i18n._("Slider");
                    var p = new DuAEProperty(effect(pe.props['Value'].index));
                    connectorLoadMasterProperty(p, 'prop');
                    // Default values
                    minEdit.text = '-100';
                    maxEdit.text = '100';
                    return;
                }

                // Is it a 2D Slider?
                pe = Duik.PseudoEffect.CONTROLLER_2DSLIDER;
                effect = layer.effect(pe.matchName);
                if (effect) {
                    // Title
                    propLabel.text = layer.index + ' - ' + layer.name + ' # ' + i18n._("2D Slider");
                    var p = new DuAEProperty(effect(pe.props['2D Value'].index));
                    connectorLoadMasterProperty(p, 'prop');
                    // Default values
                    minEdit.text = '-100';
                    maxEdit.text = '100';
                    return;
                }

                // Is it an angle?
                pe = Duik.PseudoEffect.CONTROLLER_ANGLE;
                effect = layer.effect(pe.matchName);
                if (effect) {
                    // Title
                    propLabel.text = layer.index + ' - ' + layer.name + ' # ' + i18n._("Angle");
                    var p = new DuAEProperty(effect(pe.props['Angle'].index));
                    connectorLoadMasterProperty(p, 'prop');
                    // Default values
                    minEdit.text = '0';
                    maxEdit.text = '360';
                    return;
                }

                // Is it an expose transform?
                pe = Duik.PseudoEffect.EXPOSE_TRANSFORM;
                effect = layer.effect(pe.matchName);
                if (effect) {
                    propLabel.text = layer.index + ' - ' + layer.name + ' # ' + i18n._("Expose transform");
                    // Set the prop list
                    propList.removeAll();
                    propList.add( 'item', "Absolute position (2D)" );
                    propList.add( 'item', "Relative position (2D)" );
                    propList.add( 'item', "Distance (2D)" );
                    propList.add( 'item', "Absolute position (3D)" );
                    propList.add( 'item', "Relative position (3D)" );
                    propList.add( 'item', "Distance (3D)" );
                    propList.add( 'item', "Absolute orientation" );
                    propList.add( 'item', "Relative orientation" );
                    propList.add( 'item', "Angle" );
                    propList.selection = 2;
                    propListLabel.enabled = true;
                    propList.enabled = true;
                    var p = new DuAEProperty(effect(pe.props['2D Position (Comp projection)']['2D Distance'].index));
                    connectorLoadMasterProperty(p, 'etm');
                    return;
                }

                // Is it an IK?
                pe = Duik.PseudoEffect.TWO_LAYER_IK;
                effect = layer.effect(pe.matchName);
                if (effect) {
                    // Title
                    propLabel.text = layer.index + ' - ' + layer.name + ' # ' + i18n._("IK");
                    // Set the prop list
                    propList.removeAll();
                    propList.add( 'item', "IK Length" );
                    propList.add( 'item', "Upper Stretch" );
                    propList.add( 'item', "Lower Stretch" );
                    propList.selection = 0;
                    propListLabel.enabled = true;
                    propList.enabled = true;
                    var p = new DuAEProperty(effect(pe.props['Data']['Stretch data']['IK Goal distance'].index));
                    connectorLoadMasterProperty(p, 'ik');
                    return;
                }

                // Is it an Audio effector?
                var effects = layer.property('ADBE Effect Parade');
                for(var i = 1; i <= effects.numProperties; i++) {
                    var effect = effects.property(i);
                    if (effect.matchName == 'ADBE Slider Control' && effect.name == i18n._("Audio Effector") && effect(1).expression != '') {
                        connectorLoadMasterProperty( new DuAEProperty(effect(1)), 'prop');
                        return;
                    }
                }
            };

            function connectorLoadMasterProperty(prop, type) {
                connector.type = type;

                if (type == 'prop' || type == 'ik' || type == 'etm') {
                    connector.master = prop;

                    // Prepare UI according to the number of dimensions
                    var dim = prop.dimensions();

                    if (dim == 0) {
                        alert("This property cannot be used as a master property with the connector.");
                        return;
                    } else if (dim == 1) {
                        axisList.removeAll();
                        axisList.enabled = false;
                        axisLabel.enabled = false;
                        axisLabel.text = i18n._("Axis");
                        typeList.selection = 0;
                    } else if (dim == 2) {
                        axisList.removeAll();
                        axisList.enabled = true;
                        axisList.add('item', 'X');
                        axisList.add('item', 'Y');
                        axisList.selection = 0;
                        axisLabel.text = i18n._("Axis");
                        axisLabel.enabled = true;
                    } else if (dim == 3) {
                        axisList.removeAll();
                        axisList.enabled = true;
                        axisList.add('item', 'X');
                        axisList.add('item', 'Y');
                        axisList.add('item', 'Z');
                        axisList.selection = 0;
                        axisLabel.text = i18n._("Axis");
                        axisLabel.enabled = true;
                    } else if (dim == 4) {
                        axisList.removeAll();
                        axisList.enabled = true;
                        axisList.add('item', "Red");
                        axisList.add('item', "Green");
                        axisList.add('item', "Blue");
                        axisList.add('item', "Alpha");
                        axisList.add('item', "Hue");
                        axisList.add('item', "Saturation");
                        axisList.add('item', "Value");
                        axisList.selection = 4;
                        axisLabel.text = i18n._("Channel");
                        axisLabel.enabled = true;
                        minEdit.text = '0';
                        if (app.project.bitsPerChannel == 8) maxEdit.text = '255';
                        else if (app.project.bitsPerChannel == 16) maxEdit.text = '65536';
                        else if (app.project.bitsPerChannel == 32) maxEdit.text = '1.0';
                    }

                    minEdit.suffixText.text = prop.unit();
                    maxEdit.suffixText.text = prop.unit();

                    //use a percent if this is a 2D Slider
                    if (prop.matchName.indexOf(Duik.PseudoEffect.CONTROLLER_2DSLIDER.matchName) == 0) {
                        minEdit.suffixText.text = "%";
                        maxEdit.suffixText.text = "%";
                    }

                    // Update range
                    connectorUpdateRange();

                    createGroup.visible = false;
                    settingsGroup.visible = true;
                    return;
                }

                if (type == 'layerList') {
                    // Check if it's a dropdown
                    if (prop.isDropdown()) {
                        connector.master = prop;
                        // Show the dropdown panel
                        createGroup.visible = false;
                        dropdownGroup.visible = true;
                    }
                    else
                    {
                        connectorLoadMasterProperty(prop, 'prop');
                    }
                    return;
                }

                if (type == 'audio') {
                    connector.master = prop;
                    axisList.removeAll();
                    axisList.enabled = false;
                    axisLabel.enabled = false;
                    axisLabel.text = i18n._("Axis");
                    typeList.selection = 0;

                    minEdit.suffixText.text = '%';
                    maxEdit.suffixText.text = '%';

                    minEdit.text = '0';
                    maxEdit.text = '100';

                    createGroup.visible = false;
                    connectGroup.visible = true;
                    return;
                }
            }

            function connectorUpdateRange() {
                if (!connector.master) return;

                var axis = 0;

                if (axisList.selection) axis = axisList.selection.index;

                var preExpression = false;
                //if (connector.master.numKeys() < 2) preExpression = false;

                var range = [0, 100];
                if (typeList.selection.index == 0) range = connector.master.range(axis, preExpression, true);
                else if (typeList.selection.index == 1) { // Speed
                    var speed = connector.master.maxSpeed(preExpression, true);
                    range = [0, Math.floor(speed * 100) / 100];
                }
                else { // Velocity
                    var velocityMax = connector.master.maxVelocity(axis, preExpression, true);
                    var velocityMin = connector.master.minVelocity(axis, preExpression, true);
                    range = [ Math.floor(velocityMin * 100) / 100, Math.floor(velocityMax * 100) / 100];
                }

                if (range.length != 2) return;

                var min = Math.floor(range[0]);
                var max = Math.floor(range[1]);

                if (connector.master.matchName.indexOf(Duik.PseudoEffect.CONTROLLER_2DSLIDER.matchName) == 0) {
                    if (min == 0 && max == 0) {
                        min = -100;
                        max = 100;
                    }
                }

                minEdit.text = min;
                maxEdit.text = max;
            }

            var titleBar = addNativeSubPanel(
                connectorGroup,
                i18n._("Connector"),
                constraintsGroup
            );

            var connectorStack = addNativeGroup(connectorGroup, 'stack');

            var createGroup = addNativeGroup(connectorStack, 'column');
            createGroup.margins = 3;

            var createLabel = createGroup.add(
                'statictext',
                undefined,
                i18n._("Choose or create control")
            );
            createLabel.alignment = ['center', 'top'];

            var createGrid = addNativeGroup(createGroup, 'row');
            createGrid.alignment = ['fill', 'top'];
            var createLine1 = addNativeGroup(createGrid, 'column');
            createLine1.alignment = ['fill', 'fill'];
            var createLine2 = addNativeGroup(createGrid, 'column');
            createLine2.alignment = ['fill', 'fill'];
            var createLine3 = addNativeGroup(createGrid, 'column');
            createLine3.alignment = ['fill', 'fill'];

            var sliderButton = addNativeButton(
                createLine1,
                i18n._("Slider"),
                w16_slider,
                i18n._("Create a slider controller."),
                { cell: true }
            );
            sliderButton.onClick = function() {
                DuAE.beginUndoGroup( i18n._("Controller"));

                // Create a slider
                var ctrl = Duik.Controller.create(undefined, Duik.Controller.Type.SLIDER);
                if (!ctrl) return;

                connectorPick();
                DuAE.endUndoGroup();
            };

            var slider2DButton = addNativeButton(
                createLine2,
                i18n._("2D Slider"),
                w16_2d_slider,
                i18n._("Create a 2D slider controller."),
                { cell: true }
            );
            slider2DButton.onClick = function() {
                DuAE.beginUndoGroup( i18n._("Controller"));

                // Create a slider
                var ctrl = Duik.Controller.create(undefined, Duik.Controller.Type.DOUBLE_SLIDER);
                if (!ctrl) return;

                connectorPick();
                DuAE.endUndoGroup();
            };

            var angleButton = addNativeButton(
                createLine3,
                i18n._("Angle"),
                w16_angle,
                i18n._("Create an angle controller."),
                { cell: true }
            );
            angleButton.onClick = function() {
                DuAE.beginUndoGroup( i18n._("Controller"));

                // Create an angle
                var ctrl = Duik.Controller.create(undefined, Duik.Controller.Type.ANGLE);
                if (!ctrl) return;

                connectorPick();
                DuAE.endUndoGroup();
            };

            var etmButton = addNativeButton(
                createLine1,
                i18n._("Expose transform"),
                w16_expose_transform,
                i18n._("Create a controller to measure lengths, angles and other coordinates between layers."),
                { cell: true }
            );
            etmButton.onClick = function() {
                DuAE.beginUndoGroup( i18n._("Expose transform"));

                // Create a single expose transform
                var layer = DuAEComp.getActiveLayer();
                var ctrls;
                if (layer) { // for the layer
                    ctrls = Duik.Constraint.exposeTransform(undefined, [layer]);
                }
                else { // just one in the comp
                    ctrls = Duik.Constraint.exposeTransform( DuAEProject.getActiveComp() );
                }
                if (ctrls.length == 0) return;

                connectorPick();

                DuAE.endUndoGroup();
            };

            var layerListButton = addNativeButton(
                createLine2,
                i18n._("Layer list"),
                w16_layers,
                i18n._("Creates a dropdown control to control the visibility of a list of layers.\n\nFirst, select the layer where to create the controlling effect, then click the button to get to the next step."),
                { cell: true }
            );
            layerListButton.onClick = function () {
                DuAE.beginUndoGroup(i18n._("Connector"));

                // Check if there's a layer selected
                var layer = DuAEComp.getActiveLayer();
                if (!layer) {
                    alert( i18n._("Nothing selected. Please select some layers first."));
                    return;
                }

                // Create a dropdown
                var p = layer.property('ADBE Effect Parade').addProperty('ADBE Dropdown Control');
                p.name = i18n._("Layer list");
                p = new DuAEProperty(p.property(1));
                connectorLoadMasterProperty(p, 'layerList');

                DuAE.endUndoGroup();
            };
            if (!DuAE.version.atLeast('17.0.1')) {
                layerListButton.enabled = false;
            }

            var effectorButton = addNativeButton(
                createLine3,
                i18n._("Effector"),
                w16_effector,
                i18n._("Create a spatial effector to control properties.\n\nSelect the properties to control first, then click on this button."),
                { cell: true }
            );
            effectorButton.onClick = Duik.Automation.effector;

            var mapButton = addNativeButton(
                createLine1,
                i18n._("Pick texture"),
                w16_pick_texture,
                i18n._("Choose a layer to use as a texture map to control the properties."),
                { cell: true }
            );
            mapButton.onClick = function () {
                if (!effectorMapGroup.built) {
                    buildNativeEffectorMapGroup(effectorMapGroup, constraintsGroup);
                }

                // Set the layer
                effectorMapGroup.listLayers(DuAEComp.getActiveLayer());

                hideAllGroups();
                effectorMapGroup.visible = true;
            };

            var audioButton = addNativeButton(
                createLine2,
                i18n._("Pick audio"),
                w16_pick_audio,
                i18n._("Controls properties using an audio layer."),
                { cell: true }
            );
            audioButton.onClick = function () {
                var prop = Duik.Constraint.setupAudioController();
                if (!prop) return;
                // Disable prop selection by default
                propList.removeAll();
                propListLabel.enabled = false;
                propList.enabled = false;

                // Title
                propLabel.text = i18n._("Audio Effector");
                connectorLoadMasterProperty(prop, 'audio');
            };

            var propButton = addNativeButton(
                createLine3,
                i18n._("Pick control"),
                w16_pick_prop,
                i18n._("Uses the selected property, layer or already existing control."),
                { cell: true }
            );
            propButton.onClick = connectorPick;

            var settingsGroup = addNativeGroup(connectorStack, 'column');
            settingsGroup.margins = 3;
            settingsGroup.visible = false;

            var settingsForm = addNativeForm(settingsGroup);

            var settingsTitleLabel = settingsForm.labels.add('statictext', undefined, i18n._("Connecting"));
            settingsTitleLabel.enabled = false;
            var propListLabel = settingsForm.labels.add('statictext', undefined, i18n._p("After Effects Property", "Property"));
            var typeLabel = settingsForm.labels.add('statictext', undefined, i18n._p("After Effects Property", "Type")); /// TRANSLATORS: A type (A Kind) of property
            var axisLabel = settingsForm.labels.add('statictext', undefined, i18n._p("After Effects Property", "Axis"));
            var minLabel = settingsForm.labels.add('statictext', undefined, i18n._p("After Effects Property Value", "Minimum")); /// TRANSLATORS: For the value of a property
            var maxLabel = settingsForm.labels.add('statictext', undefined, i18n._p("After Effects Property Value", "Maximum")); /// TRANSLATORS: For the value of a property
            var propLabel = settingsForm.buttons.add('statictext', undefined, i18n._(""));
            propLabel.characters = 20;
            var propList = settingsForm.buttons.add('dropdownlist', undefined, ['                      ']);
            var typeList = settingsForm.buttons.add('dropdownlist', undefined, [
                i18n._("Value"),
                i18n._("Speed"),
                i18n._("Velocity")]);
            var axisList = settingsForm.buttons.add('dropdownlist', undefined, ['                      ']);
            var minEdit = addNativeEditText(settingsForm.buttons, '0', '');
            var maxEdit = addNativeEditText(settingsForm.buttons, '10000', '');
            propListLabel.minimumSize.height = propListLabel.maximumSize.height = propList.preferredSize[1];
            axisLabel.minimumSize.height = axisLabel.maximumSize.height = axisList.preferredSize[1];
            typeLabel.minimumSize.height = typeLabel.maximumSize.height = typeList.preferredSize[1];
            minLabel.minimumSize.height = minLabel.maximumSize.height = minEdit.preferredSize[1];
            maxLabel.minimumSize.height = maxLabel.maximumSize.height = maxEdit.preferredSize[1];

            axisList.onChange = connectorUpdateRange;

            typeList.onChange = function() {
                if (!connector.master) return;
                if (typeList.selection.index == 0) { // Value
                    if (connector.master.dimensions() > 1) {
                        axisList.enabled = true;
                        axisLabel.enabled = true;
                    }
                    else {
                        axisList.enabled = false;
                        axisLabel.enabled = false;
                    }
                    axisList.onChange();
                    return;
                }
                if (typeList.selection.index == 1) { // Speed
                    axisList.enabled = false;
                    axisLabel.enabled = false;
                    axisList.onChange();
                    return;
                }
                if (typeList.selection.index == 2) { // Velocity
                    if (connector.master.dimensions() > 1) {
                        axisList.enabled = true;
                        axisLabel.enabled = true;
                    }
                    else {
                        axisList.enabled = false;
                        axisLabel.enabled = false;
                    }
                    axisList.onChange();
                    return;
                }
            };

            propList.onChange = function() {
                // Get the property
                if (connector.type == 'ik') {
                    var ikEffect = connector.master.parentProperty();
                    var id = propList.selection.index;
                    var pe = Duik.PseudoEffect.TWO_LAYER_IK;
                    if (id == 0)  connectorLoadMasterProperty(ikEffect.prop(pe.props['Data']['Stretch data']['IK Goal distance'].index), 'ik');
                    else if (id == 1)  connectorLoadMasterProperty(ikEffect.prop(pe.props['Data']['Stretch data']['Upper'].index), 'ik');
                    else if (id == 2)  connectorLoadMasterProperty(ikEffect.prop(pe.props['Data']['Stretch data']['Lower'].index), 'ik');
                }
                else if (connector.type == 'etm') {
                    var etmEffect = connector.master.parentProperty();
                    var id = propList.selection.index;
                    var p = Duik.PseudoEffect.EXPOSE_TRANSFORM.props;
                    var pid = 0;
                    if (id == 0) pid = p['2D Position (Comp projection)']['Absolute'].index;
                    else if (id == 1) pid = p['2D Position (Comp projection)']['Relative to reference'].index;
                    else if (id == 2) pid = p['2D Position (Comp projection)']['2D Distance'].index;
                    else if (id == 3) pid = p['3D Position (World)']['Absolute'].index;
                    else if (id == 4) pid = p['3D Position (World)']['Relative to reference'].index;
                    else if (id == 5) pid = p['3D Position (World)']['3D Distance'].index;
                    else if (id == 6) pid = p['2D Orientation']['Absolute'].index;
                    else if (id == 7) pid = p['2D Orientation']['Relative to reference'].index;
                    else if (id == 7) pid = p['Angle (Layer-This-Reference'].index;
                    connectorLoadMasterProperty(etmEffect.prop(pid), 'etm');
                }
            };

            addNativeSeparator(settingsGroup);

            // Add help
            settingsGroup.add('statictext', undefined, i18n._("Select the child properties or layers,\nand connect them."), {
                multiline: true
            });

            // The create buttons
            var connectButtonsGroup = addNativeGroup(settingsGroup, 'row');
            connectButtonsGroup.alignment = ['fill', 'top'];
            createConnectOpacitiesButtonn( connectButtonsGroup );
            createConnectPropButton( connectButtonsGroup );
            createConnectKeyMorphButton( connectButtonsGroup );

            addNativeSeparator(settingsGroup);
            var settingsNavButtons = addNativeGroup(settingsGroup, 'row');
            settingsNavButtons.alignment = ['fill', 'top'];

            var settingsBackButton = addNativeButton(
                settingsNavButtons,
                i18n._("Back"),
                DuScriptUI.Icon.BACK,
                i18n._("Back")
            );
            settingsBackButton.onClick = function() {
                settingsGroup.visible = false;
                createGroup.visible = true;
            };

            var connectGroup = addNativeGroup(connectorStack, 'column');
            connectGroup.visible = false;

            var connectLabel = connectGroup.add('statictext', undefined, i18n._("Select the child properties or layers,\nand connect them."), {
                multiline: true
            });

            connectButtonsGroup = addNativeGroup(connectGroup, 'row');
            connectButtonsGroup.alignment = ['fill', 'top'];

            createConnectOpacitiesButtonn( connectButtonsGroup );
            createConnectPropButton( connectButtonsGroup );
            createConnectKeyMorphButton( connectButtonsGroup );

            var dropdownGroup = addNativeGroup(connectorStack, 'column');
            dropdownGroup.visible = false;

            var dropdownTitleLabel = dropdownGroup.add(
                'statictext',
                undefined,
                i18n._("Connecting dropdown menu to layers:\n\nSelect the child layers then connect."),
                {  multiline: true }
                );

            var dropdownConnectButton = addNativeButton(
                dropdownGroup,
                i18n._("Connect layer opacities"),
                w16_layers,
                i18n._("Connect the selected layers to the control you've just set, using their opacity properties to switch their visibility."),
                { cell: true }
            );
            dropdownConnectButton.onClick = function() {
                // Get layer selection
                var layers = DuAEComp.getSelectedLayers();
                if (layers.length == 0) return;

                // Prepare settings
                var min = 1;
                var max = layers.length;
                var type = 1;
                var axis = DuAE.Axis.X;

                DuAE.beginUndoGroup(i18n._("Connector"));

                Duik.Constraint.linkLayersToDropdown(connector.master, layers);

                DuAE.endUndoGroup();

                if(!titleBar.pinned) titleBar.onClose();
            };

            connectorGroup.reInit = function() {
                connector = {};
                connector.master = null;
                connector.type = 'prop';
                createGroup.visible = true;
                settingsGroup.visible = false;
                connectGroup.visible = false;
                dropdownGroup.visible = false;
                typeList.selection = 0;
            };

            connectorGroup.built = true;
            nativeLayout(connectorGroup);
        }
        if (showUI) {
            hideAllGroups();
            connectorGroup.visible = true;
            connectorGroup.reInit();
        }
    };

    var keyMorphButton = addNativeButton(
        line1,
        i18n._("Key Morph"),
        w16_shape_keys,
        i18n._("Morph selected properties between arbitrary keyframes.")
    );
    keyMorphButton.onClick = Duik.Constraint.morphKeys;

    var pinsButton = addNativeButton(
        line1,
        i18n._("Add Pins"),
        w16_pin,
        i18n._("Add pin layers to control spatial properties and Bézier paths.\n[Alt]: Also create tangents for Bézier path properties."),
        {
            options: true,
            optionsWithoutButton: true // The options have their own apply button
        }
    );
    pinsButton.optionsPopup.build = function() {
        var sides = [OCO.Side.NONE, OCO.Side.LEFT, OCO.Side.RIGHT];
        var locations = [
            OCO.Location.NONE,
            OCO.Location.FRONT,
            OCO.Location.BACK,
            OCO.Location.MIDDLE,
            OCO.Location.ABOVE,
            OCO.Location.UNDER,
            OCO.Location.TAIL
        ];

        // Utils
        // Selects the item of a list matching a value, if any.
        function selectValue(list, values, value) {
            for (var i = 0, n = values.length; i < n; i++) {
                if (values[i] != value) continue;
                list.selection = i;
                return;
            }
        }

        function updateEditPanel() {
            selectValue(sideEditSelector, sides, Duik.Layer.side());

            selectValue(locationEditSelector, locations, Duik.Layer.location());

            colorEditSelector.setColor(Duik.Pin.color());

            sizeEdit.text = Duik.Pin.size();

            opacityEdit.text = Duik.Pin.opacity();

            characterEdit.text = Duik.Layer.groupName();

            limbEdit.text = Duik.Layer.name();
        }

        function setSide() {
            Duik.Pin.setSide(sides[sideEditSelector.selection.index]);
        }

        function setLocation() {
            Duik.Pin.setLocation(locations[locationEditSelector.selection.index]);
        }

        function setColor() {
            var color = colorEditSelector.color;
            Duik.Pin.setColor(color);
        }

        function setSize() {
            var size = parseInt(sizeEdit.text);
            if (isNaN(size)) return;
            Duik.Pin.setSize(size);
        }

        function setOpacity() {
            var opa = parseInt(opacityEdit.text);
            if (isNaN(opa)) return;
            Duik.Pin.setOpacity(opa);
        }

        function setCharacterName() {
            Duik.Pin.setCharacterName(characterEdit.text);
        }

        function setLimbName() {
            Duik.Pin.setLimbName(limbEdit.text);
        }

        var sideEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Side"));
        var sideEditSelector = addNativeDropdown(sideEditGroup, [
            [i18n._("None"), w16_no_side],
            [i18n._("Left"), w16_left_hand],
            [i18n._("Right"), w16_right_hand]
        ]);

        var locationEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Location"));
        var locationEditSelector = addNativeDropdown(locationEditGroup, [
            [i18n._("None"), w16_no_loc],
            [i18n._("Front"), w16_front],
            [i18n._("Back"), w16_back],
            [i18n._("Middle"), w16_middle],
            [i18n._("Above"), w16_above],
            [i18n._("Under"), w16_under],
            [i18n._("Tail"), w16_tail_loc]
        ]);

        var colorEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Color"));
        var colorEditSelector = addNativeColorSelector(colorEditGroup, i18n._("Set the color of the selected layers."));

        var sizeEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Size"));
        var sizeEdit = addNativeEditText(
            sizeEditGroup,
            "100",
            " %",
            i18n._("Change the size of the layer.")
        );

        var opacityEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Opacity"));
        var opacityEdit = addNativeEditText(
            opacityEditGroup,
            "75",
            " %",
            i18n._("Change the opacity of the pins.")
        );

        var characterEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Group name"));
        var characterEdit = addNativeEditText(
            characterEditGroup,
            '',
            undefined,
            i18n._("Choose the name of the character.")
        );

        var limbEditGroup = addNativeSetting(pinsButton.optionsPanel, i18n._("Name"));
        var limbEdit = addNativeEditText(
            limbEditGroup,
            '',
            undefined,
            i18n._("Change the name of the limb this layer belongs to.")
        );

        addNativeSeparator(pinsButton.optionsPanel);

        // Valid button
        var applyGroup = addNativeGroup( pinsButton.optionsPanel, 'row' );
        applyGroup.alignment = ['fill', 'top'];

        var pickButton = addNativeButton(
            applyGroup,
            i18n._("Pick selected layer"),
            DuScriptUI.Icon.EYE_DROPPER
        );
        pickButton.onClick = updateEditPanel;


        var applyEditButton = addNativeButton(
            applyGroup,
            i18n._("Apply"),
            DuScriptUI.Icon.CHECK,
            i18n._("Apply")
        )
        applyEditButton.onClick = function() {
            DuAE.beginUndoGroup(i18n._("Edit pins"));
            if (sideEditGroup.checked) setSide();
            if (locationEditGroup.checked) setLocation();
            if (colorEditGroup.checked) setColor();
            if (sizeEditGroup.checked) setSize();
            if (opacityEditGroup.checked) setOpacity();
            if (characterEditGroup.checked) setCharacterName();
            if (limbEditGroup.checked) setLimbName();
            pinsButton.optionsPopup.hide();
            DuAE.endUndoGroup();
        }

    }
    pinsButton.onClick = function() {
        if (!DuAEProject.setProgressMode(true, true, true, [pinsButton.screenX, pinsButton.screenY] )) return;
        Duik.Constraint.pin(false);
        DuAEProject.setProgressMode(false);
    };
    pinsButton.onAltClick = function() {
        if (!DuAEProject.setProgressMode(true, true, true, [pinsButton.screenX, pinsButton.screenY] )) return;
        Duik.Constraint.pin();
        DuAEProject.setProgressMode(false);
    };

    // The same grid as the buttons above, so that the columns line up.
    var line2 = line1;

    var ikGroup = addNativeMenuButton(
        line2,
        i18n._("Kinematics"),
        w16_ik_fk,
        i18n._("Create Inverse and Forward Kinematics.")
    );
    ikGroup.build = function() {
        var ikButton = this.addButton(
            i18n._("IK"),
            w16_ik,
            i18n._("Standard Inverse Kinematics."),
            true
        );
        var ikSelector;
        ikButton.optionsPopup.build = function() {
            ikSelector = addNativeDropdown(ikButton.optionsPanel, [
                [
                    i18n._("1+2-layer IK"),
                    w16_one_two_ik,
                    i18n._("Create a one-layer IK combined with a two-layer IK\nto handle Z-shape limbs.")
                ],
                [
                    i18n._("2+1-layer IK"),
                    w16_two_one_ik,
                    i18n._("Create a two-layer IK combined with a one-layer IK\nto handle Z-shape limbs.")
                ]
            ], 1);
        }

        var bezierIKButton = this.addButton(
            i18n._("Bézier IK"),
            w16_bezier_ik,
            i18n._("Bézier Inverse Kinematics.")
        );

        var fkButton = this.addButton(
            i18n._("FK"),
            w16_fk,
            i18n._("Forward Kinematics\nwith automatic overlap and follow-through.")
        );

        var bezierFKButton = this.addButton(
            i18n._("Bézier FK"),
            w16_bezier_fk,
            i18n._("Bézier FK")
        );

        ikButton.onClick = function() {
            Duik.Constraint.ik(ikSelector.selection.index + 1);
        };

        bezierIKButton.onClick = function() {
            Duik.Constraint.ik(undefined, true);
        };

        fkButton.onClick = Duik.Constraint.fk;

        bezierFKButton.onClick = function() {
            Duik.Constraint.ik(undefined, true, undefined, undefined, true);
        };
    }

    var parentGroup = addNativeMenuButton(
        line2,
        i18n._("Parent"),
        w16_parent,
        i18n._("Create parent constraints.")
    );
    parentGroup.build = function() {
        var autoParentButton = this.addButton(
            i18n._("Auto-parent"),
            w16_auto_parent,
            i18n._("Parent all the selected layers to the last selected one.\n\n[Alt]: Parent only the orphans.\nOr:\n[Ctrl]: Parent layers as a chain, from ancestor to child, in the order of the selection.")
        );
        autoParentButton.onClick = Duik.Constraint.autoParent;
        autoParentButton.onAltClick = function() {
            Duik.Constraint.autoParent(true);
        };
        autoParentButton.onCtrlClick = function() {
            Duik.Constraint.autoParent(false, undefined, true);
        }

        var parentConstraintButton = this.addButton(
            i18n._("Parent constraint"),
            w16_parent,
            i18n._("Animatable parent.")
        );
        parentConstraintButton.onClick = Duik.Constraint.parent;

        var parentAcrossCompButton = this.addButton(
            i18n._("Parent across comps..."),
            w16_parent_across_comp,
            i18n._("Parent layers across compositions.")
        );
        parentAcrossCompButton.onClick = function() {
            // build panel
            if (!parentAcrossCompGroup.built) {

                var titleBar = addNativeSubPanel(
                    parentAcrossCompGroup,
                    i18n._("Parent across comps"),
                    constraintsGroup
                );

                parentAcrossCompGroup.add('statictext', undefined, i18n._("Parent comp") + ':');

                var parentCompList = addSearchList(
                    parentAcrossCompGroup,
                    w12_comp,
                    i18n._("Pick the active composition.")
                );

                parentAcrossCompGroup.add('statictext', undefined, i18n._("Parent layer") + ':');

                var parentLayerList = addSearchList(
                    parentAcrossCompGroup,
                    w12_layers,
                    i18n._("Pick the selected layer of the active composition.")
                );

                var parentCompValidButton = addNativeValidButton (
                    parentAcrossCompGroup,
                    i18n._("Parent across comps"),
                    i18n._("Parent layers across compositions.")
                );
                parentCompValidButton.enabled = false;

                var parentComp = function() {
                    if (!parentCompList.key) return null;
                    return DuAEProject.getItemById(parentCompList.key);
                };

                // Lists the layers of the parent comp, and selects the one at the index.
                var listParentLayers = function(index) {
                    var comp = parentComp();
                    var items = [];
                    if (comp) {
                        for (var i = 1, n = comp.numLayers; i <= n; i++)
                            items.push({ name: i + ' | ' + comp.layer(i).name, key: i });
                    }
                    parentLayerList.setItems(items, index);
                    parentCompValidButton.enabled = parentLayerList.key > 0;
                };

                // Lists the compositions related to the active one, and the layers of the parent comp.
                // The parent comp stays listed while it exists, even when it's not related to the active comp.
                parentAcrossCompGroup.listComps = function(comp, layerIndex) {
                    if (!isdef(comp)) comp = parentComp();
                    if (!isdef(layerIndex)) layerIndex = parentLayerList.key;

                    var items = [];
                    var listed = false;
                    new DuList(DuAEComp.getRelatives()).do(function(relative) {
                        items.push({ name: relative.name, key: relative.id });
                        if (comp && relative.id == comp.id) listed = true;
                    });
                    if (comp && !listed) items.push({ name: comp.name, key: comp.id });

                    parentCompList.setItems(items, comp ? comp.id : 0);
                    listParentLayers(layerIndex);
                };

                // Like the constraint settings, the lists are filled when the panel is shown, and by the refresh button.
                var refreshButton = titleBar.add(
                    'iconbutton',
                    undefined,
                    nativeImage(w12_blender_icon_file_refresh),
                    { style: 'button' }
                );
                refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
                    i18n._("Update the lists of compositions and layers.");
                refreshButton.alignment = ['left', 'center'];
                refreshButton.onClick = function() {
                    parentAcrossCompGroup.listComps();
                };

                parentCompList.onChange = function() {
                    listParentLayers(0);
                };
                parentCompList.pickButton.onClick = function() {
                    var comp = DuAEProject.getActiveComp();
                    if (!comp) return;
                    parentAcrossCompGroup.listComps(comp, comp.id == parentCompList.key ? parentLayerList.key : 0);
                };

                parentLayerList.onChange = function() {
                    parentCompValidButton.enabled = parentLayerList.key > 0;
                };
                parentLayerList.pickButton.onClick = function() {
                    // The layer is picked in the active composition, which becomes the parent comp.
                    var comp = DuAEProject.getActiveComp();
                    if (!comp) return;
                    var layers = DuAEComp.getSelectedLayers();
                    if (layers.length == 0) return;
                    parentAcrossCompGroup.listComps(comp, layers[0].index);
                };

                parentCompValidButton.onClick = function() {
                    //get comp and layer
                    var comp = parentComp();
                    if (!comp) return;
                    var index = parentLayerList.key;
                    if (!index || index > comp.numLayers) return;
                    var layer = comp.layer(index);

                    // We need the options of the extract locator button
                    extractLocatorButton.optionsPopup.ensureBuilt();

                    var useEssentialProperties = locatorModeSelector.selection.index == 1;

                    Duik.Constraint.parentAcrossComp(layer, useEssentialProperties);

                    if (!titleBar.pinned) titleBar.onClose();
                }

                nativeLayout(parentAcrossCompGroup);
            }

            parentAcrossCompGroup.listComps();

            hideAllGroups();
            parentAcrossCompGroup.visible = true;
        };
    }

    var transformGroup = addNativeMenuButton(
        line2,
        i18n._("Transform"),
        w16_constraint,
        i18n._("Create transform constraints (position, orientation, path...).")
    );
    transformGroup.build = function() {
        var positionConstraintButton = this.addButton(
            i18n._("Position constraint"),
            w16_move,
            i18n._("Constraint the location of a layer to the position of other layers.")
        );
        positionConstraintButton.onClick = Duik.Constraint.position;

        var orientationConstraintButton = this.addButton(
            i18n._("Orientation constraint"),
            w16_rotate,
            i18n._("Constraint the orientation of a layer to the orientation of other layers.")
        );
        orientationConstraintButton.onClick = Duik.Constraint.orientation;

        var pathConstraintButton = this.addButton(
            i18n._("Path constraint") + '...',
            w16_bezier,
            i18n._("Constraint the location and orientation of a layer to a Bézier path.\n\n" +
                    "[ALT]: Move the layer onto the path.")
        );
        pathConstraintButton.onClick = function() {
            var pathProp = null;
            // Get path prop
            function pickPath() {
                pathProp = null;
                pathConstraintValidButton.enabled = false;
                pathConstraintLabel.text = i18n._("Pick path...");
                var props = DuAEComp.getSelectedProps(PropertyValueType.SHAPE);
                if (props.length == 0) return false;

                pathProp = props.pop();
                var parentProp = pathProp.getProperty().parentProperty;
                pathConstraintLabel.text = pathProp.layer.index + " - " + pathProp.layer.name + " # " + parentProp.name;
                pathConstraintValidButton.enabled = true;
            }

            // build panel
            if (!pathConstraintGroup.built) {

                var titleBar = addNativeSubPanel(
                    pathConstraintGroup,
                    i18n._("Path constraint"),
                    constraintsGroup
                );

                var pathGroup = addNativeGroup(pathConstraintGroup, 'row');
                pathGroup.alignment = ['fill', 'top'];

                pathConstraintLabel = pathGroup.add('statictext', undefined, i18n._("Pick path..."));
                pathConstraintLabel.alignment = ['fill', 'center'];

                var pickPathButton = pathGroup.add(
                    'iconbutton',
                    undefined,
                    nativeImage(DuScriptUI.Icon.EYE_DROPPER_BIG),
                    { style: 'button' }
                );
                pickPathButton.helpTip = i18n._("Pick path...");
                pickPathButton.alignment = ['right', 'center'];
                pickPathButton.onClick = pickPath;

                pathConstraintValidButton = addNativeValidButton (
                    pathConstraintGroup,
                    i18n._("Path constraint"),
                    i18n._("Constraint the location and orientation of a layer to a Bézier path.\n\n" +
                            "[ALT]: Move the layer onto the path.")
                );
                pathConstraintValidButton.enabled = false;
                pathConstraintValidButton.onClick = function() {
                    Duik.Constraint.path(pathProp);
                    if (!titleBar.pinned) titleBar.onClose();
                }
                pathConstraintValidButton.onAltClick = function() {
                    Duik.Constraint.path(pathProp, undefined, true);
                    if (!titleBar.pinned) titleBar.onClose();
                }

                nativeLayout(pathConstraintGroup);
            }

            // we can create
            if (Duik.Constraint.path()) return;

            // ask for the path
            hideAllGroups();
            pathConstraintGroup.visible = true;
            pickPath();
        };
    }

    var customGroup = addNativeMenuButton(
        line2,
        i18n._("Custom Constraints"),
        w16_blender_icon_constraint,
        i18n._("Create custom constraints, recreated from Blender (copy location, copy rotation, armature...).")
    );
    customGroup.build = function() {
        var copyLocationConstraintButton = this.addButton(
            i18n._("Copy Location"),
            w16_blender_icon_con_loclike,
            i18n._("Replace the location of a layer with the location of another one.\n\n" +
                    "An After Effects version of Blender's \"Copy Location\" constraint: " +
                    "each axis can be copied, inverted or offset separately, in a choice of spaces.")
        );
        copyLocationConstraintButton.onClick = function() { Duik.Constraint.copyLocation(); };

        var copyRotationConstraintButton = this.addButton(
            i18n._("Copy Rotation"),
            w16_blender_icon_con_rotlike,
            i18n._("Combine the rotation of a layer with the rotation of another one.\n\n" +
                    "An After Effects version of Blender's \"Copy Rotation\" constraint, " +
                    "with its axis, Euler orders, mix modes and spaces. It turns 3D layers around their three axis.")
        );
        copyRotationConstraintButton.onClick = function() { Duik.Constraint.copyRotation(); };

        var armatureConstraintButton = this.addButton(
            i18n._("Armature"),
            w16_blender_icon_con_armature,
            i18n._("Make a layer follow everything a target layer does since its rest pose, like what's bound to a bone.\n\n" +
                    "An After Effects version of Blender's \"Armature\" constraint, with a single target.")
        );
        armatureConstraintButton.onClick = function() { Duik.Constraint.armature(); };
    }

    // A modifier, not a constraint: it deforms the geometry of a layer instead of its transformation,
    // so it gets its own button rather than a place in the custom constraints menu.
    var armatureDeformButton = addNativeButton(
        line2,
        i18n._("Armature Deform") + '...',
        w16_blender_icon_mod_armature,
        i18n._("Deform Bézier paths with an armature: each vertex follows a trio of bones, " +
                "one for the point and one for each of its handles.\n\n" +
                "An After Effects version of Blender's \"Armature\" deform modifier, " +
                "matching the bones to the vertices by index instead of by skin weight.")
    );
    armatureDeformButton.onClick = function() { showArmatureDeform(); };

    // The native versions of the auto-rig button and of the move anchor points and texture map
    // sub-panels, which other Duik panels build from utils.jsx.

    function addAutorigButton( container ) {
        var autorigButton = addNativeButton(
            container,
            i18n._("Auto-rig"),
            w16_autorig,
            i18n._("Automatically rig armatures (use the Links & constraints tab for more options)."),
            { options: true }
        );
        autorigButton.optionsPopup.build = function() {
            var optionsPanel = autorigButton.optionsPanel;

            // A checkbox saving its setting.
            function addSettingCheckBox( text, setting, defaultValue ) {
                var checkbox = addNativeCheckBox(optionsPanel, text, null, '', DuESF.scriptSettings.get(setting, defaultValue));
                checkbox.onClick = function() {
                    DuESF.scriptSettings.set(setting, checkbox.value);
                    DuESF.scriptSettings.save();
                };
                return checkbox;
            }

            optionsPanel.add('statictext', undefined, i18n._("3-Layer rig:"));
            var threeLayerSelector = addNativeDropdown(optionsPanel, [
                [
                    i18n._("1+2-layer IK"),
                    w16_one_two_ik,
                    i18n._("Create a one-layer IK combined with a two-layer IK\nto handle Z-shape limbs.")
                ],
                [
                    i18n._("2+1-layer IK"),
                    w16_two_one_ik,
                    i18n._("Create a two-layer IK combined with a one-layer IK\nto handle Z-shape limbs.")
                ],
                [
                    i18n._("FK"),
                    w16_fk,
                    i18n._("Forward Kinematics\nwith automatic overlap and follow-through.")
                ],
                [
                    i18n._("Bézier IK"),
                    w16_bezier_ik,
                    i18n._("Bézier Inverse Kinematics.")
                ],
                [
                    i18n._("Bézier FK"),
                    w16_bezier_fk,
                    i18n._("Bézier FK")
                ]
            ], DuESF.scriptSettings.get("autorig/threeLayerMode" , 0));
            threeLayerSelector.onChange = function() {
                DuESF.scriptSettings.set("autorig/threeLayerMode", threeLayerSelector.selection.index);
                DuESF.scriptSettings.save();
            };

            optionsPanel.add('statictext', undefined, i18n._("Long chain rig:"));
            var longSelector = addNativeDropdown(optionsPanel, [
                [
                    i18n._("FK"),
                    w16_fk,
                    i18n._("Forward Kinematics\nwith automatic overlap and follow-through.")
                ],
                [
                    i18n._("Bézier IK"),
                    w16_bezier_ik,
                    i18n._("Bézier Inverse Kinematics.")
                ],
                [
                    i18n._("Bézier FK"),
                    w16_bezier_fk,
                    i18n._("Bézier FK")
                ]
            ], DuESF.scriptSettings.get("autorig/longMode" , 0));
            longSelector.onChange = function() {
                DuESF.scriptSettings.set("autorig/longMode", longSelector.selection.index);
                DuESF.scriptSettings.save();
            };

            var createMasterButton = addSettingCheckBox(i18n._("Create a root controller"), "autorig/createMaster", false);
            optionsPanel.add('statictext', undefined, i18n._("Baking:"));
            var bakeBonesButton = addSettingCheckBox(i18n._("Bake bones"), "autorig/bakeBones", true);
            var bakeEnvelopsButton = addSettingCheckBox(i18n._("Bake envelops"), "autorig/bakeEnvelops", true);
            var bakeNoodlesButton = addSettingCheckBox(i18n._("Remove deactivated noodles."), "autorig/removeNoodles", true);

            autorigButton.onClick = function() {
                var threeMode = threeLayerSelector.selection.index + 1;
                var longMode = longSelector.selection.index + 3;

                if (!DuAEProject.setProgressMode(true, true, true, [autorigButton.screenX, autorigButton.screenY] )) return;
                DuAE.beginUndoGroup( i18n._("Auto-rig") );

                Duik.Rig.auto(bakeBonesButton.value, bakeEnvelopsButton.value, bakeNoodlesButton.value, longMode, threeMode, undefined, createMasterButton.value);

                DuAE.endUndoGroup( i18n._("Auto-rig") );
                DuAEProject.setProgressMode(false);
            };
        }

        return autorigButton;
    }

    function buildNativeMoveAnchorPointGroup( moveAnchorPointGroup, mainGroup ) {
        addNativeSubPanel(
            moveAnchorPointGroup,
            i18n._("Move anchor points"),
            mainGroup,
            false
        );

        var maskButton = addNativeCheckBox(
            moveAnchorPointGroup,
            i18n._("Include masks"),
            w16_mask,
            i18n._("Use the masks too to compute the bounds of the layers when repositionning the anchor point.")
        );

        var gridGroup = addNativeGroup(moveAnchorPointGroup, 'row');
        gridGroup.alignment = ['center', 'top'];
        var columns = [
            addNativeGroup(gridGroup, 'column'),
            addNativeGroup(gridGroup, 'column'),
            addNativeGroup(gridGroup, 'column')
        ];

        var marginsSlider;

        // Adds a button moving the anchor points to a location, in a column of the grid.
        function addAnchorButton( column, image, location ) {
            var button = columns[column].add('iconbutton', undefined, nativeImage(image), { style: 'button' });
            button.onClick = function() {
                Duik.Constraint.moveAnchorPoint(location, marginsSlider.value, maskButton.value);
            };
        }

        addAnchorButton(0, w12_move_tl, DuMath.Location.TOP_LEFT);
        addAnchorButton(0, w12_move_l, DuMath.Location.LEFT);
        addAnchorButton(0, w12_move_bl, DuMath.Location.BOTTOM_LEFT);
        addAnchorButton(1, w12_move_t, DuMath.Location.TOP);
        addAnchorButton(1, w12_center, DuMath.Location.CENTER);
        addAnchorButton(1, w12_move_b, DuMath.Location.BOTTOM);
        addAnchorButton(2, w12_move_tr, DuMath.Location.TOP_RIGHT);
        addAnchorButton(2, w12_move_r, DuMath.Location.RIGHT);
        addAnchorButton(2, w12_move_br, DuMath.Location.BOTTOM_RIGHT);

        marginsSlider = addNativeSlider(
            moveAnchorPointGroup,
            0,
            -500,
            500,
            i18n._("Margin"),
            DuAE.UnitText.PIXELS
        );

        moveAnchorPointGroup.built = true;
        nativeLayout(moveAnchorPointGroup);
    }

    function buildNativeEffectorMapGroup( effectorMapGroup, mainGroup ) {
        var titleBar = addNativeSubPanel(
            effectorMapGroup,
            i18n._("Pick texture"),
            mainGroup,
            false
        );

        var mapLabel = effectorMapGroup.add('statictext', undefined, i18n._("Select the layer (texture/map)") + ':');
        mapLabel.enabled = false;

        var layerList = addSearchList(
            effectorMapGroup,
            w12_layers,
            i18n._("Pick the selected layer of the active composition."),
            i18n._("Select the layer (texture) to use as an effector.")
        );

        // Lists the layers of the active composition, and selects the layer, or keeps the selected index.
        effectorMapGroup.listLayers = function( layer ) {
            var comp = DuAEProject.getActiveComp();
            var items = [];
            if (comp) {
                for (var i = 1, n = comp.numLayers; i <= n; i++)
                    items.push({ name: i + ' | ' + comp.layer(i).name, key: i });
            }
            layerList.setItems(items, layer ? layer.index : layerList.key);
        };

        layerList.pickButton.onClick = function() {
            var layers = DuAEComp.getSelectedLayers();
            if (layers.length > 0) effectorMapGroup.listLayers(layers[0]);
        };

        // Like the constraint settings, the list is filled when the panel is shown, and by the refresh button.
        var refreshButton = titleBar.add(
            'iconbutton',
            undefined,
            nativeImage(w12_blender_icon_file_refresh),
            { style: 'button' }
        );
        refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
            i18n._("Update the list of layers.");
        refreshButton.alignment = ['left', 'center'];
        refreshButton.onClick = function() {
            effectorMapGroup.listLayers();
        };

        var connectButton = addNativeButton(
            effectorMapGroup,
            i18n._("Connect properties"),
            w16_props,
            i18n._("Connects the selected properties to the control you've just set.")
        );
        connectButton.onClick = function() {
            var comp = DuAEProject.getActiveComp();
            if (!comp) return;

            var layerIndex = layerList.key;
            if (layerIndex < 1 || layerIndex > comp.numLayers) return;

            DuAE.beginUndoGroup( i18n._("Effector map"));

            var props = DuAEComp.getSelectedProps();

            Duik.Automation.effectorMap( comp.layer(layerIndex), props);

            DuAE.endUndoGroup();
        }

        effectorMapGroup.built = true;
        nativeLayout(effectorMapGroup);
    }

    var parentAcrossCompGroup = addNativeGroup(mainGroup, 'column');
    parentAcrossCompGroup.visible = false;
    parentAcrossCompGroup.built = false;

    // The settings are shared with their own dockable panel, Duik Constraint Settings.jsx.
    #include "constraintSettingsPanel.jsx"
    var constraintSettingsGroup = addNativeGroup(mainGroup, 'column');
    constraintSettingsGroup.visible = false;
    constraintSettingsGroup.built = false;
    var constraintSettings;

    function openConstraintSettingsPanel() {
        DuAE.openScriptUIPanel( "Duik Constraint Settings.jsx" );
    }

    function showConstraintSettings() {
        if (!constraintSettingsGroup.built) {
            var titleBar = addNativeSubPanel(
                constraintSettingsGroup,
                i18n._("Constraint settings"),
                constraintsGroup
            );

            constraintSettings = buildConstraintSettingsUI(constraintSettingsGroup, titleBar);

            nativeLayout(constraintSettingsGroup);
        }

        hideAllGroups();
        constraintSettingsGroup.visible = true;
        constraintSettings.refresh();
    }

    // The armature deform modifier: it reads the bones of an armature by name, so like the
    // constraints it needs a composition to be picked, and the name of the bones to be typed.
    var armatureDeformGroup = addNativeGroup(mainGroup, 'column');
    armatureDeformGroup.visible = false;
    armatureDeformGroup.built = false;

    function buildNativeArmatureDeformGroup( armatureDeformGroup, mainGroup ) {
        var titleBar = addNativeSubPanel(
            armatureDeformGroup,
            i18n._("Armature deform"),
            mainGroup
        );

        var compList;
        var prefixField;
        var boneField;
        var sideField;

        function armatureComp() {
            if (!compList.key) return null;
            return DuAEProject.getItemById(compList.key);
        }

        // Lists the compositions of the project, and selects one of them.
        function listComps( comp ) {
            var comps = DuAEProject.getComps();
            var items = [];
            for (var i = 0, n = comps.length; i < n; i++)
                items.push({ name: comps[i].name, key: comps[i].id });
            compList.setItems(items, comp ? comp.id : compList.key);
        }

        // Lists the compositions again, and shows what the modifier of the selected path reads,
        // the way the constraint settings show what a constraint points at.
        armatureDeformGroup.refresh = function() {
            var settings = Duik.Modifier.getArmatureDeform();
            if (!settings) {
                listComps();
                return;
            }

            // Looked up by name, like the expression of the modifier does. The list is set to
            // None when the composition can't be found anymore.
            var comp = null;
            var comps = DuAEProject.getComps();
            for (var i = 0, n = comps.length; i < n; i++) {
                if (comps[i].name == settings.comp) {
                    comp = comps[i];
                    break;
                }
            }

            listComps(comp);
            if (!comp) compList.select(0);
            prefixField.text = settings.prefix;
            boneField.text = settings.bone;
            sideField.text = settings.side;
        }

        var refreshButton = titleBar.add(
            'iconbutton',
            undefined,
            nativeImage(w12_blender_icon_file_refresh),
            { style: 'button' }
        );
        refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
            i18n._("Show what the armature deform modifier of the selected path reads, and update the list of compositions.");
        refreshButton.alignment = ['left', 'center'];
        refreshButton.onClick = function() { armatureDeformGroup.refresh(); };

        var armatureSection = addNativeSection( armatureDeformGroup, i18n._("Armature") );
        // The same height as the lists of the constraint settings, which are slimmer by default.
        armatureSection.buttonHeight = 20;

        armatureSection.add('statictext', undefined, i18n._("Composition") + ':');

        compList = addSearchList(
            armatureSection,
            w12_comp,
            i18n._("Pick the active composition."),
            i18n._("The composition holding the bones of the armature.")
        );
        compList.pickButton.onClick = function() {
            var comp = DuAEProject.getActiveComp();
            if (comp) listComps(comp);
        }

        var bonesSection = addNativeSection( armatureDeformGroup, i18n._("Bones") );

        bonesSection.add('statictext', undefined, i18n._("Prefix") + ':');
        prefixField = addNativeEditText(
            bonesSection,
            Duik.Modifier.BONE_PREFIX,
            undefined,
            i18n._("What the name of the bones starts with, spaces included.") + "\n\n" +
                i18n._("The bones Duik creates are named \"B < Name > [L]\", so this is \"B < \".")
        );

        bonesSection.add('statictext', undefined, i18n._("Name") + ':');
        boneField = addNativeEditText(
            bonesSection,
            '',
            undefined,
            i18n._("The name of the bones, without their index and their side.") + "\n\n" +
                i18n._("Each vertex of the path is deformed by the three bones named " +
                    "\"<Prefix><Name> <Index> Point (Head) >\", \"... Handle Left (Tail) >\" and " +
                    "\"... Handle Right (Tail) >\", numbered like the vertices of the path.")
        );

        bonesSection.add('statictext', undefined, i18n._("Side") + ':');
        sideField = addNativeEditText(
            bonesSection,
            '',
            undefined,
            i18n._("The side of the bones, as it's written between brackets at the end of their name.") + "\n\n" +
                i18n._("\"L\" for the bones named \"B < Name > [L]\". Leave it empty for bones with no side.")
        );

        var validButton = addNativeValidButton(
            armatureDeformGroup,
            i18n._("Armature deform"),
            i18n._("Deform the selected paths with this armature.\n\n" +
                    "A path which already has the modifier is set to read this armature instead.")
        );
        validButton.onClick = function() {
            var comp = armatureComp();
            if (!comp) {
                alert(i18n._("Select the composition holding the armature first."));
                return;
            }

            var bone = DuString.trim(boneField.text);
            if (bone == '') {
                alert(i18n._("Type the name of the bones first."));
                return;
            }

            // The paths are the selected ones, the way the path constraint takes its path.
            var paths = DuAEComp.getSelectedProps(PropertyValueType.SHAPE);
            if (paths.length == 0) {
                alert(i18n._("Select the paths to deform first."));
                return;
            }

            // The prefix is used as it's typed: the space before the name of the bones is part of it.
            Duik.Modifier.armatureDeform(comp, bone, DuString.trim(sideField.text), prefixField.text, paths);

            if (!titleBar.pinned) titleBar.onClose();
        }

        listComps();

        armatureDeformGroup.built = true;
        nativeLayout(armatureDeformGroup);
    }

    function showArmatureDeform() {
        if (!armatureDeformGroup.built) {
            buildNativeArmatureDeformGroup(armatureDeformGroup, constraintsGroup);
        }

        hideAllGroups();
        armatureDeformGroup.visible = true;
        armatureDeformGroup.refresh();
    }

    var pathConstraintValidButton;
    var pathConstraintLabel;
    var pathConstraintGroup = addNativeGroup(mainGroup, 'column');
    pathConstraintGroup.visible = false;
    pathConstraintGroup.built = false;

    var measureText;
    var measureValidButton;
    var measureGroup = addNativeGroup(mainGroup, 'column');
    measureGroup.visible = false;
    measureGroup.built = false;

    var propInfoGroup = addNativeGroup(mainGroup, 'column');
    propInfoGroup.visible = false;
    propInfoGroup.built = false;

    var moveAnchorPointGroup = addNativeGroup(mainGroup, 'column');
    moveAnchorPointGroup.visible = false;
    moveAnchorPointGroup.built = false;

    var connectorGroup = addNativeGroup(mainGroup, 'column');
    connectorGroup.visible = false;
    connectorGroup.built = false;

    var effectorMapGroup = addNativeGroup(mainGroup, 'column');
    effectorMapGroup.visible = false;
    effectorMapGroup.built = false;
}
