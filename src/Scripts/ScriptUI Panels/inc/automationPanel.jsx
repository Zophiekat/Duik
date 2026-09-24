function buildAutomationPanelUI(tab, standAlone ) {
    standAlone = def(standAlone, false);

    // Some strings
    var precisionFactorTip = i18n._("A higher factor → a higher precision.\n\n• Smart mode: lower the factor to keep keyframes only for extreme values. Increasing the factor helps to get a more precise curve with inflexion keyframes.\n\n• Precise mode: A factor higher than 1.0 increases the precision to sub-frame sampling (2 → two samples per frame).\nA factor lower than 1.0 decreases the precision so that less frames are sampled (0.5 → half of the frames are sampled).\nDecrease the precision to make the process faster, increase it if you need a more precise motion-blur, for example.");

    // Useful methods
    function hideAllGroups() {
        automationGroup.visible = false;
        expressionToolsGroup.visible = false;
        effectorMapGroup.visible = false;
        randomizeGroup.visible  = false;
        walkCycleGroup.visible = false;
    }

    // The two drop down lists of the options of the wiggle and random motion:
    // how the dimensions and the properties are controlled.
    function addDimensionSelectors( container ) {
        var dimSelector = addNativeDropdown( container, [
            [
                i18n._("Collapse dimensions"),
                w16_collapse_dimensions,
                i18n._("Control all dimensions or channels with a single value.")
            ],
            [
                i18n._("Split values"),
                w16_separate_dimensions,
                i18n._("Separate all dimensions or channels to control them individually.")
            ]
        ], 0);

        var controlSelector = addNativeDropdown( container, [
            [
                i18n._("Individual controls"),
                w16_individual_control,
                i18n._("Create one individual control for each property.")
            ],
            [
                i18n._("Unified control"),
                w16_unified_control,
                i18n._("Create a single control for all properties.\na.k.a. The One Duik To Rule Them All.")
            ]
        ], 1);

        return { dimSelector: dimSelector, controlSelector: controlSelector };
    }

    // The two drop down lists of the options baking expressions: the method, and the precision factor.
    function addBakeOptions( container ) {
        var bakeMethodSelector = addNativeDropdown( container, [
            [
                i18n._("Smart mode"),
                w16_autorig,
                i18n._("Use a smarter algorithm which produces less keyframes.\nThe result may be easier to edit afterwards but a bit less precise than other modes")
            ],
            [
                i18n._("Precise mode"),
                w16_quick,
                i18n._("Add new keyframes for all frames.\nThis mode produces more keyframes but the result may be closer to the original animation.")
            ]
        ], 0);

        var stepEdit = addNativeEditText(
            container,
            '1',
            undefined,
            precisionFactorTip,
            i18n._("Precision factor") + ':'
        );

        return { bakeMethodSelector: bakeMethodSelector, stepEdit: stepEdit };
    }

    if (!standAlone) {
        // A Spacer
        var spacer = tab.add('group');
        spacer.margins = 0;
        spacer.spacing = 0;
        spacer.size = [-1, 3];

        // A title
        tab.add('statictext', undefined, i18n._("Automation and expressions")).alignment = ['center', 'top'];
    }

    // The panel is a row, like the Links and constraints panel: the tool bar on the left,
    // then the buttons and the groups they open.
    var contentGroup = addNativeGroup(tab, 'row');
    contentGroup.alignment = ['fill', 'fill'];
    contentGroup.alignChildren = ['fill', 'fill'];
    // Room on each side of the separator, so the tool bar and the buttons don't hug it.
    contentGroup.spacing = 8;

    // tools: two per row, down the left of the panel
    var toolsGroup = addNativeToolBar(contentGroup, 2, 32, 32);
    toolsGroup.alignment = ['left', 'top'];

    createListButton( toolsGroup );

    var separateButton = toolsGroup.addButton(
        i18n._("Split values"),
        w12_separate_dimensions,
        i18n._("Separate the dimensions of the selected properties.\nAlso works with colors, separated to RGB or HSL.")
    );
    separateButton.onClick = Duik.Constraint.separateDimensions;

    var removeExpButton = toolsGroup.addButton(
        i18n._("Toggle expressions"),
        w12_disable_expression,
        i18n._("Toggle expressions, or remove them keeping the post-expression value on all selected properties.\n\n[Ctrl]: Remove expressions instead of just disabling.\n[Alt]: Remove expressions but keep the pre-expression value (After Effects default).")
    );
    removeExpButton.onClick = Duik.Automation.toggleExpressions;
    removeExpButton.onAltClick = function() {
        Duik.Automation.removeExpressions(false);
    };
    removeExpButton.onCtrlClick = Duik.Automation.removeExpressions

    var expressionToolsButton = toolsGroup.addButton(
        i18n._("Expression tools"),
        w12_expression,
        i18n._("Various tools to fix and work with expressions")
    );
    expressionToolsButton.onClick = function() {
        if (!expressionToolsGroup.built) {
            var titleBar = addNativeSubPanel(
                expressionToolsGroup,
                i18n._("Expression tools"),
                automationGroup,
                false
            );

            var layerSelector = addNativeSelectionModeSelector(
                expressionToolsGroup,
                DuAE.SelectionMode.SELECTED_PROPERTIES,
                DuAE.SelectionMode.ACTIVE_COMPOSITION
            );

            var compSection = addNativeSection( expressionToolsGroup, "thisComp" );

            var compGroup = addNativeGroup(compSection, 'row');
            compGroup.alignment = ['fill', 'top'];
            compGroup.alignChildren = ['fill', 'center'];

            var removeThisCompButton = addNativeButton(
                compGroup,
                i18n._("Remove"),
                DuScriptUI.Icon.CLOSE,
                i18n._("Replace all occurences of %1 by %2.", "'thisComp'", "'comp(\"name\")'" )
            );
            removeThisCompButton.onClick = function() {
                Duik.Constraint.removeThisCompInExpressions(layerSelector.getValue());
            }

            var useThisCompButton = addNativeButton(
                compGroup,
                i18n._("Use"),
                DuScriptUI.Icon.CHECK,
                i18n._("Replace all occurences of %1 by %2.", "'comp(\"name\")'", "'thisComp'")
            );
            useThisCompButton.onClick = function() {
                Duik.Constraint.removeCompInExpressions(layerSelector.getValue());
            }

            var layerSection = addNativeSection( expressionToolsGroup, "thisLayer" );

            var layerGroup = addNativeGroup(layerSection, 'row');
            layerGroup.alignment = ['fill', 'top'];
            layerGroup.alignChildren = ['fill', 'center'];

            var removeThisLayerButton = addNativeButton(
                layerGroup,
                i18n._("Remove"),
                DuScriptUI.Icon.CLOSE,
                i18n._("Replace all occurences of %1 by %2.", "'thisLayer'", "'layer(\"name\")'")
            );
            removeThisLayerButton.onClick = function() {
                Duik.Constraint.removeThisLayerInExpressions(layerSelector.getValue());
            }

            var useThisLayerButton = addNativeButton(
                layerGroup,
                i18n._("Use"),
                DuScriptUI.Icon.CHECK,
                i18n._("Replace all occurences of %1 by %2.", "'layer(\"name\")'", "'thisLayer'")
            );
            useThisLayerButton.onClick = function() {
                Duik.Constraint.removeLayerInExpressions(layerSelector.getValue());
            }

            expressionToolsGroup.built = true;

            nativeLayout(expressionToolsGroup);
        }

        hideAllGroups();
        expressionToolsGroup.visible = true;
    }

    var copyExpButton = toolsGroup.addButton(
        i18n._("Copy expression"),
        w12_copy_expression,
        i18n._("Copy the expression from the selected property.")
    );
    copyExpButton.onClick = Duik.Automation.copyExpression;

    var pasteExpButton = toolsGroup.addButton(
        i18n._("Paste expression"),
        w12_paste_expression,
        i18n._("Paste the expression in all selected properties.")
    );
    pasteExpButton.onClick = Duik.Automation.pasteExpression;

    var editExpressionButton = toolsGroup.addButton(
        i18n._("Edit expression"),
        w12_expression_file,
        i18n._("Use an external editor to edit the selected expression.\n\n[Ctrl]: Reloads the expressions from the external editor."),
        true
    );
    editExpressionButton.optionsPopup.build = function() {

        var editorSelector = addNativeFileSelector(
            editExpressionButton.optionsPanel,
            i18n._("Open expressions with..."),
            true,
            i18n._("Select an application to open the expressions.\nLeave the field empty to use the system default for '.jsxinc' files."), /// TRANSLATORS: "System" stands for Operating System here.
            undefined,
            'open',
            undefined,
            'column'
        );
        editorSelector.onChange = function() {
            var f = editorSelector.getFile();
            if (!f && editorSelector.editText.text != "") return;
            if (f) DuESF.scriptSettings.set("expression/expressionEditor", f.absoluteURI);
            else DuESF.scriptSettings.set("expression/expressionEditor", "" );
            DuESF.scriptSettings.save();
        };

        editorSelector.setPath( DuESF.scriptSettings.get("expression/expressionEditor", "" ) );
        editorSelector.setPlaceholder( i18n._("System default") );

        editExpressionButton.onClick = function() {
            Duik.Tool.editExpression();
        };

        editExpressionButton.onCtrlClick = function() {
            Duik.Tool.reloadExpressions();
        };
    };

    var randomizeButton = toolsGroup.addButton(
        i18n._("Randomize") + "...",
        w12_randomize,
        i18n._("Set a random value to the selected properties, keyframes or layers.")
    );
    randomizeButton.onClick = function() {
        if (!randomizeGroup.built) {

            // A row of the values to randomize: its label, then the minimum and maximum fields.
            // Native fields have no place holder, so the fields have labels instead.
            function addRangeRow( container, label ) {
                var row = addNativeGroup( container, 'row' );
                row.alignment = ['fill', 'top'];
                row.alignChildren = ['fill', 'center'];
                row.label = row.add('statictext', undefined, label);
                row.label.alignment = ['left', 'center'];
                row.label.characters = 4;
                row.minEdit = addNativeEditText( row, '', undefined, i18n._('Min'), i18n._('Min') ); /// TRANSLATORS: short for Minimum
                row.maxEdit = addNativeEditText( row, '', undefined, i18n._('Max'), i18n._('Max') ); /// TRANSLATORS: short for Maximum
                return row;
            }

            addNativeSubPanel(
                randomizeGroup,
                i18n._("Randomize"),
                automationGroup,
                false
            );

            var attrSelector = addNativeDropdown( randomizeGroup, [
                [
                    i18n._("Current values"),
                    w16_values,
                    i18n._("Values of the properties at the current time")
                ],
                [
                    i18n._("Layer attributes"),
                    w16_layers,
                    i18n._("Attributes of the layers.")
                ],
                [
                    i18n._("Keyframes"),
                    w16_keyframe,
                    i18n._("Keyframes (value and time).")
                ]
            ], 0);
            attrSelector.onChange = function() {
                if (!attrSelector.selection) return;
                var i = attrSelector.selection.index;
                valuesGroup.visible = i == 0;
                layersGroup.visible = i == 1;
                keysGroup.visible = i == 2;
            }

            var modeSelector = addNativeDropdown( randomizeGroup, [
                [
                    i18n._("Natural (gaussian)"),
                    w16_gaussian,
                    i18n._("Uses an algorithm with a natural result (using the Gaussian bell-shaped function).\nA few values may be out of range.")
                ],
                [
                    i18n._("Strict"),
                    w16_strict,
                    i18n._("Uses strict values.")
                ]
            ], 0);

            var offsetSelector = addNativeDropdown( randomizeGroup, [
                [
                    i18n._("Offset values"),
                    w16_offset,
                    i18n._("Offset current values.")
                ],
                [
                    i18n._("Absolute"),
                    w16_locator,
                    i18n._("Absolute values (replaces current values).")
                ]
            ], 0);
            offsetSelector.onChange = function() {
                var sign = !offsetSelector.selection || offsetSelector.selection.index == 0 ? " + " : " = ";
                var valuesCollapsed = valuesSeparateSelector.selection.index == 0;
                var keysCollapsed = keysSeparateSelector.selection.index == 0 || keysSelector.selection.index == 0;
                valuesXGroup.label.text = (valuesCollapsed ? "V" : "X") + sign;
                valuesYGroup.label.text = "Y" + sign;
                valuesZGroup.label.text = "Z" + sign;
                layersVGroup.label.text = "V" + sign;
                keysXGroup.label.text = (keysCollapsed ? "V" : "X") + sign;
                keysYGroup.label.text = "Y" + sign;
                keysZGroup.label.text = "Z" + sign;
            }

            var stack = addNativeGroup( randomizeGroup, 'stack');
            stack.alignment = ['fill', 'top'];

            var valuesGroup = addNativeGroup(stack, 'column');

            var valuesSeparateSelector = addNativeDropdown( valuesGroup, [
                [
                    i18n._("Collapse dimensions"),
                    w16_collapse_dimensions,
                    i18n._("Controls all dimensions or channels with a single value.")
                ],
                [
                    i18n._("Split values"),
                    w16_separate_dimensions,
                    i18n._("Separate all dimensions or channels to control them individually.")
                ]
            ], 1);
            valuesSeparateSelector.onChange = function() {
                if (!valuesSeparateSelector.selection) return;
                var separate = valuesSeparateSelector.selection.index == 1;
                valuesYGroup.visible = separate;
                valuesZGroup.visible = separate;
                offsetSelector.onChange();
            };

            var valuesXGroup = addRangeRow( valuesGroup, "X + " );
            var valuesYGroup = addRangeRow( valuesGroup, "Y + " );
            var valuesZGroup = addRangeRow( valuesGroup, "Z + " );

            var layersGroup = addNativeGroup(stack, 'column');
            layersGroup.visible = false;

            var layersIndicesButton = addNativeCheckBox( layersGroup, i18n._("Indices"), w16_indices_random );
            var layersTimeButton = addNativeCheckBox( layersGroup, i18n._("Times"), w16_times_random, '', true );
            var layersInButton = addNativeCheckBox( layersGroup, i18n._("In points"), w16_in_points_random );
            var layersOutButton = addNativeCheckBox( layersGroup, i18n._("Out points"), w16_out_points_random );

            var layersVGroup = addRangeRow( layersGroup, "V + " );

            var keysGroup = addNativeGroup(stack, 'column');
            keysGroup.visible = false;

            var keysSelector = addNativeDropdown( keysGroup, [
                [ i18n._("Times"), w16_keyframe_times_random ],
                [ i18n._("Values"), w16_random ]
            ], 1);
            keysSelector.onChange = function () {
                if (!keysSelector.selection) return;
                if (keysSelector.selection.index == 0) {
                    keysYGroup.visible = false;
                    keysZGroup.visible = false;
                    keysSeparateSelector.visible = false;
                } else {
                    var i = keysSeparateSelector.selection.index == 1;
                    keysYGroup.visible = i;
                    keysZGroup.visible = i;
                    keysSeparateSelector.visible = true;
                }
                offsetSelector.onChange();
            };

            var keysSeparateSelector = addNativeDropdown( keysGroup, [
                [
                    i18n._("Collapse dimensions"),
                    w16_collapse_dimensions,
                    i18n._("Control all dimensions or channels with a single value.")
                ],
                [
                    i18n._("Split values"),
                    w16_separate_dimensions,
                    i18n._("Separate all dimensions or channels to control them individually.")
                ]
            ], 1);
            keysSeparateSelector.onChange = function() {
                if (!keysSeparateSelector.selection) return;
                var separate = keysSeparateSelector.selection.index == 1;
                keysYGroup.visible = separate;
                keysZGroup.visible = separate;
                offsetSelector.onChange();
            };

            var keysXGroup = addRangeRow( keysGroup, "X + " );
            var keysYGroup = addRangeRow( keysGroup, "Y + " );
            var keysZGroup = addRangeRow( keysGroup, "Z + " );

            var okButton = addNativeValidButton(
                randomizeGroup,
                i18n._("Randomize"),
                i18n._("Set a random value to the selected properties, keyframes or layers.")
            );
            okButton.onClick = function() {

                var offset = offsetSelector.selection.index == 0;
                var gaussian = modeSelector.selection.index == 0;
                var attr = attrSelector.selection.index;

                if (attr == 0) { // values
                    var xMin = parseFloat( valuesXGroup.minEdit.text );
                    var xMax = parseFloat( valuesXGroup.maxEdit.text );
                    var yMin = parseFloat( valuesYGroup.minEdit.text );
                    var yMax = parseFloat( valuesYGroup.maxEdit.text );
                    var zMin = parseFloat( valuesZGroup.minEdit.text );
                    var zMax = parseFloat( valuesZGroup.maxEdit.text );
                    var separate = valuesSeparateSelector.selection.index == 1;

                    Duik.Automation.randomizeValues(xMin, xMax, yMin, yMax, zMin, zMax, offset, separate, gaussian);

                } else if (attr == 1) { // Layers
                    var min = parseFloat( layersVGroup.minEdit.text );
                    var max = parseFloat( layersVGroup.maxEdit.text );

                    if (isNaN(min)) return;
                    if (isNaN(max)) return;

                    if (layersTimeButton.value) Duik.Automation.randomizeLayerTimes(min, max, offset, gaussian);
                    if (layersIndicesButton.value) Duik.Automation.randomizeLayerIndices(min, max, offset, gaussian);
                    if (layersInButton.value) Duik.Automation.randomizeLayerInPoints(min, max, offset, gaussian);
                    if (layersOutButton.value) Duik.Automation.randomizeLayerOutPoints(min, max, offset, gaussian);
                }
                else { // keyframes
                    if (keysSelector.selection.index == 0) { // times
                        var min = parseFloat( keysXGroup.minEdit.text );
                        var max = parseFloat( keysXGroup.maxEdit.text );

                        if (isNaN(min)) return;
                        if (isNaN(max)) return;

                        Duik.Automation.randomizeKeyTimes(min, max, offset, gaussian);
                    }
                    else { //values
                        var xMin = parseFloat( keysXGroup.minEdit.text );
                        var xMax = parseFloat( keysXGroup.maxEdit.text );
                        var yMin = parseFloat( keysYGroup.minEdit.text );
                        var yMax = parseFloat( keysYGroup.maxEdit.text );
                        var zMin = parseFloat( keysZGroup.minEdit.text );
                        var zMax = parseFloat( keysZGroup.maxEdit.text );
                        var separate = keysSeparateSelector.selection.index == 1;

                        Duik.Automation.randomizeKeyValues(xMin, xMax, yMin, yMax, zMin, zMax, offset, separate, gaussian);
                    }
                }
            };

            randomizeGroup.built = true;
            nativeLayout(randomizeGroup);
        }

        hideAllGroups();
        randomizeGroup.visible = true;
    };

    var bakeExpButton = toolsGroup.addButton(
        i18n._("Bake expressions"),
        w12_expression_baker,
        i18n._("Replace expressions by keyframes.\nUse a smart algorithm to have as less keyframes as possible, and keep them easy to edit afterwards."),
        true
    );
    bakeExpButton.optionsPopup.build = function() {
        var selectionModeSelector = addNativeSelectionModeSelector(bakeExpButton.optionsPanel);
        var bakeOptions = addBakeOptions(bakeExpButton.optionsPanel);

        bakeExpButton.onClick = function() {
            var step = parseFloat(bakeOptions.stepEdit.text);
            if (isNaN(step)) step = 1;
            step = 1 / step;
            Duik.Automation.bakeExpressions(bakeOptions.bakeMethodSelector.selection.index, step, selectionModeSelector.getValue());
        };
    }

    var bakeCompButton = toolsGroup.addButton(
        i18n._("Bake composition"),
        w12_comp_baker,
        i18n._("Replaces all expressions of the composition by keyframes,\nand removes all non-renderable layers.\n\nUses a smart algorithm to have as less keyframes as possible, and keep them easy to edit afterwards."),
        true
    );
    bakeCompButton.optionsPopup.build = function() {
        var selectionModeSelector = addNativeSelectionModeSelector(
            bakeCompButton.optionsPanel,
            DuAE.SelectionMode.SELECTED_LAYERS,
            DuAE.SelectionMode.ACTIVE_COMPOSITION
        );
        var bakeOptions = addBakeOptions(bakeCompButton.optionsPanel);

        bakeCompButton.onClick = function() {
            var step = parseFloat(bakeOptions.stepEdit.text);
            if (isNaN(step)) step = 1;
            step = 1 / step;
            Duik.Automation.bakeComposition(bakeOptions.bakeMethodSelector.selection.index, step, selectionModeSelector.getValue());
        };
    }

    var timeRemapButton = toolsGroup.addButton(
        i18n._("Time remap"),
        w12_time_remap,
        i18n._("Activate the time remapping on the selected layers, adjusts the keyframes and adds a loop effect.")
    );
    timeRemapButton.onClick = Duik.Automation.timeRemap;

    // Between the tool bar and the buttons.
    addNativeSeparator(contentGroup, 'vertical');

    var mainGroup = addNativeGroup(contentGroup, 'stack');
    mainGroup.alignment = ['fill', 'fill'];

    var automationGroup = addNativeGroup(mainGroup, 'column');

    // A grid with a row per button, like the Links and constraints panel: its options and image, then the button.
    var line1 = addNativeButtonGrid(automationGroup);
    line1.buttonHeight = 24;

    addNativeKleanerButton( line1 );

    var effectorButton = addNativeButton(
        line1,
        i18n._("Effector"),
        w16_effector,
        i18n._("Creates a spatial effector to control properties.\n\nSelect the properties to control first, then click on this button.")
    );
    effectorButton.onClick = Duik.Automation.effector;

    var effectorMapButton = addNativeButton(
        line1,
        i18n._("Effector map") + '...',
        w16_effector_map,
        i18n._("Control properties using a map (texture) layer.")
    );
    effectorMapButton.onClick = function() {
        if (!effectorMapGroup.built) {
            buildNativeEffectorMapGroup(effectorMapGroup, automationGroup);
        }

        // Set the layer
        effectorMapGroup.listLayers(DuAEComp.getActiveLayer());

        hideAllGroups();
        effectorMapGroup.visible = true;
    };

    var wiggleButton = addNativeButton(
        line1,
        i18n._("Wiggle"),
        w16_wiggle,
        i18n._("Add a random but smooth animation to the selected properties."),
        { options: true }
    );
    wiggleButton.optionsPopup.build = function() {
        var selectors = addDimensionSelectors( wiggleButton.optionsPanel );

        wiggleButton.onClick = function() {
        Duik.Automation.wiggle(
            selectors.dimSelector.selection.index == 1,
            selectors.controlSelector.selection.index == 0
            );
        };
    };

    var randomButton = addNativeButton(
        line1,
        i18n._("Random motion"),
        w16_random,
        i18n._("Add a control effect to randomize (and animate) the selected properties."),
        { options: true }
    );
    randomButton.optionsPopup.build = function() {
        var selectors = addDimensionSelectors( randomButton.optionsPanel );

        randomButton.onClick = function() {
        Duik.Automation.random(
            selectors.dimSelector.selection.index == 1,
            selectors.controlSelector.selection.index == 0
            );
        };
    };

    // The same grid as the buttons above, so that the columns line up.
    var line2 = line1;

    var swinkButton = addNativeMenuButton(
            line2,
            i18n._("Swink"), /// TRANSLATORS: contraction of "Swing" and "Blink". Feel free to find something fun in your language!
            w16_swink,
            i18n._("Swing or blink.\nAlternate between two values, going back and forth,\nwith advanced interpolation options.")
        );
    swinkButton.build = function() {
        var swingButton = this.addButton(
            i18n._("Swing"),
            undefined,
            i18n._("Smoothly go back and forth between two values.")
        );

        var blinkButton = this.addButton(
            i18n._("Blink"),
            undefined,
            i18n._("Switch between two values, without interpolation.")
        );

        swingButton.onClick = function() {
            Duik.Automation.swink();
        };

        blinkButton.onClick = function() {
            DuAE.beginUndoGroup( i18n._("Blink"));

            var effects = Duik.Automation.swink(undefined, true);

            DuAE.endUndoGroup();
        };
    };

    var wheelButton = addNativeButton(
            line2,
            i18n._("Wheel"),
            w16_wheel,
            i18n._("Automates the rotation of the selected layers as wheels.")
        );
    wheelButton.onClick = Duik.Automation.wheel;

    var moveAwayButton = addNativeButton(
            line2,
            i18n._("Move away"),
            w16_move_away,
            i18n._("Adds a control effect to move the selected layers away from their parents.")
        );
    moveAwayButton.onClick = Duik.Automation.moveAway;

    var looperButton = addNativeButton(
        line2,
        i18n._("Looper"),
        w16_looper,
        i18n._("Add cycles to the animated properties,\n(with more features than the 'loopOut' and 'loopIn' expressions).")
    );
    looperButton.onClick = Duik.Automation.looper;

    var motionTrailButton = addNativeButton(
        line2,
        i18n._("Motion trail"),
        w16_motion_trail,
        i18n._("Draws a trail following the selected layers.\n\n[Alt]: Creates a new shape layer for each trail.")
    );
    motionTrailButton.onClick = Duik.Automation.motionTrail;
    motionTrailButton.onAltClick = function() { Duik.Automation.motionTrail(true) };

    var line3 = line1;

    var walkButton = addNativeButton(
        line3,
        i18n._("Walk/Run cycle"),
        w16_walk_cycle,
        i18n._("Animate the selected character using a procedural walk or run cycle."),
        {
            options: true,
            optionsWithoutPanel: true
        }
    );
    walkButton.onClick = Duik.Automation.walk;
    walkButton.onOptions = function( show ) {
        if (!walkCycleGroup.built) {
            addNativeSubPanel(
                walkCycleGroup,
                i18n._("Walk/Run cycle"),
                automationGroup,
                false
            );

            // The layer of each controller, in a form: its label, then its list.
            var controlsSection = addNativeSection( walkCycleGroup, i18n._("Controllers") );
            // The same height as the lists of the constraint settings, which are slimmer by default.
            controlsSection.buttonHeight = 20;
            var form = addNativeForm( controlsSection );

            function addSelector( label ) {
                var labelText = form.labels.add('statictext', undefined, label + ':');
                labelText.minimumSize.height = labelText.maximumSize.height = 20;
                return addNativeLayerSelector( form.buttons );
            }

            walkCycleGroup.headSelector = addSelector( i18n._("Head"));
            walkCycleGroup.neckSelector = addSelector( i18n._("Neck"));
            walkCycleGroup.torsoSelector = addSelector( i18n._("Torso"));
            walkCycleGroup.spineSelector = addSelector( i18n._("Spine"));
            walkCycleGroup.hipsSelector = addSelector( i18n._("Hips"));
            walkCycleGroup.bodySelector = addSelector( i18n._("Body"));
            walkCycleGroup.rHandSelector = addSelector( i18n._("Right hand"));
            walkCycleGroup.lHandSelector = addSelector( i18n._("Left hand"));
            walkCycleGroup.rFootSelector = addSelector( i18n._("Right foot"));
            walkCycleGroup.lFootSelector = addSelector( i18n._("Left foot"));

            walkCycleGroup.selectors = [
                walkCycleGroup.headSelector,
                walkCycleGroup.neckSelector,
                walkCycleGroup.torsoSelector,
                walkCycleGroup.spineSelector,
                walkCycleGroup.hipsSelector,
                walkCycleGroup.bodySelector,
                walkCycleGroup.rHandSelector,
                walkCycleGroup.lHandSelector,
                walkCycleGroup.rFootSelector,
                walkCycleGroup.lFootSelector
            ];

            // Apply button
            var okButton = addNativeValidButton(
                walkCycleGroup,
                i18n._("Walk/Run cycle"),
                i18n._("Animate the selected character using a procedural walk or run cycle.")
            );
            okButton.onClick = function() {
                // Get controls
                var ctrls = {};
                var comp = DuAEProject.getActiveComp();
                if (!comp) return;
                if (walkCycleGroup.headSelector.getLayer()) ctrls.head = walkCycleGroup.headSelector.getLayer();
                if (walkCycleGroup.neckSelector.getLayer()) ctrls.neck = walkCycleGroup.neckSelector.getLayer();
                if (walkCycleGroup.torsoSelector.getLayer()) ctrls.torso = walkCycleGroup.torsoSelector.getLayer();
                if (walkCycleGroup.spineSelector.getLayer()) ctrls.spine = walkCycleGroup.spineSelector.getLayer();
                if (walkCycleGroup.hipsSelector.getLayer()) ctrls.hips = walkCycleGroup.hipsSelector.getLayer();
                if (walkCycleGroup.bodySelector.getLayer()) ctrls.body = walkCycleGroup.bodySelector.getLayer();
                if (walkCycleGroup.rHandSelector.getLayer()) ctrls.rHand = walkCycleGroup.rHandSelector.getLayer();
                if (walkCycleGroup.lHandSelector.getLayer()) ctrls.lHand = walkCycleGroup.lHandSelector.getLayer();
                if (walkCycleGroup.rFootSelector.getLayer()) ctrls.rFoot = walkCycleGroup.rFootSelector.getLayer();
                if (walkCycleGroup.lFootSelector.getLayer()) ctrls.lFoot = walkCycleGroup.lFootSelector.getLayer();

                Duik.Automation.rigWalk( ctrls );
            };

            nativeLayout(walkCycleGroup);
        }

        // Lists the layers of the active composition again, and shows the controllers found.
        for (var i = 0; i < walkCycleGroup.selectors.length; i++) walkCycleGroup.selectors[i].listLayers();
        var ctrls = Duik.Automation.getWalkCtrls();
        if (ctrls.head) walkCycleGroup.headSelector.listLayers( ctrls.head );
        if (ctrls.neck)  walkCycleGroup.neckSelector.listLayers( ctrls.neck );
        if (ctrls.torso)  walkCycleGroup.torsoSelector.listLayers( ctrls.torso );
        if (ctrls.spine)  walkCycleGroup.spineSelector.listLayers( ctrls.spine );
        if (ctrls.body)  walkCycleGroup.bodySelector.listLayers( ctrls.body );
        if (ctrls.hips)  walkCycleGroup.hipsSelector.listLayers( ctrls.hips );
        if (ctrls.rHand)  walkCycleGroup.rHandSelector.listLayers( ctrls.rHand );
        if (ctrls.lHand)  walkCycleGroup.lHandSelector.listLayers( ctrls.lHand );
        if (ctrls.rFoot)  walkCycleGroup.rFootSelector.listLayers( ctrls.rFoot );
        if (ctrls.lFoot)  walkCycleGroup.lFootSelector.listLayers( ctrls.lFoot );

        if (show) {
            hideAllGroups();
            walkCycleGroup.visible = true;
        }
    };

    addNativeXSheetButton( line3 );

    var paintRigButton = addNativeButton(
        line3,
        i18n._("Paint Rig"),
        w16_paint,
        i18n._("Rig paint effects and brush strokes to animate them more easily.")
    );
    paintRigButton.onClick = Duik.Automation.paintRig;

    var expressionToolsGroup = addNativeGroup(mainGroup, 'column');
    expressionToolsGroup.visible = false;
    expressionToolsGroup.built = false;

    var effectorMapGroup = addNativeGroup(mainGroup, 'column');
    effectorMapGroup.visible = false;
    effectorMapGroup.built = false;

    var randomizeGroup = addNativeGroup(mainGroup, 'column');
    randomizeGroup.visible = false;
    randomizeGroup.built = false;

    var walkCycleGroup = addNativeGroup(mainGroup, 'column');
    walkCycleGroup.visible = false;
    walkCycleGroup.built = false;//*/
}
