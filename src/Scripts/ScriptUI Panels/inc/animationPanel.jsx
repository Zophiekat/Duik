function buildAnimationPanelUI(tab, standAlone) {
    standAlone = def(standAlone, false);

    // Utils

    function hideAllGroups() {
        animationGroup.visible = false;
        animationLibGroup.visible = false;
        moveAnchorPointGroup.visible = false;
        celAnimationGroup.visible = false;
        sequenceGroup.visible = false;
    }

    // The drop down lists of the properties and the layers to work on, which many tools share.
    function addPropsSelector( container ) {
        return addNativeDropdown( container, [
            [i18n._("Animated properties"), w16_animated_prop],
            [i18n._("Selected properties"), w16_selected_props]
        ], 0);
    }

    function addLayersSelector( container, index ) {
        return addNativeDropdown( container, [
            [i18n._("Selected layers"), w16_selected_layers],
            [i18n._("All layers"), w16_layers]
        ], def(index, 0));
    }

    // A small icon button, and a popup of options shown when it's clicked.
    function addOptionsButton( container, helpTip, title ) {
        var button = addNativeButton( container, '', DuScriptUI.Icon.OPTIONS, helpTip );
        button.alignment = ['left', 'center'];
        button.popup = addNativePopup( title );
        button.popup.tieTo( button );
        return button;
    }

    // An icon button of a row.
    function addIconButton( container, image, helpTip ) {
        var button = addNativeButton( container, '', image, helpTip );
        button.alignment = ['left', 'center'];
        return button;
    }

    if (!standAlone) {
        // A Spacer
        var spacer = tab.add('group');
        spacer.margins = 0;
        spacer.spacing = 0;
        spacer.size = [-1, 3];

        // A title
        tab.add('statictext', undefined, i18n._("Animation")).alignment = ['center', 'top'];
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

    var selectButton = toolsGroup.addButton(
        i18n._("Select Keyframes"),
        w12_select,
        i18n._("Select keyframes."),
        true
    );
    selectButton.optionsPopup.build = function() {
        var optionsPanel = selectButton.optionsPanel;

        var selectMethodSelector = addNativeDropdown( optionsPanel, [
            [
                i18n._("Time"),
                w16_time,
                i18n._("Select at a precise time.")
            ],
            [
                i18n._("Range"),
                w16_range,
                i18n._("Select from a given range.")
            ]
        ], 1);
        selectMethodSelector.onChange = function() {
            if (!selectMethodSelector.selection) return;
            outEdit.enabled = selectMethodSelector.selection.index == 1;
        };

        var currentTimeButton = addNativeCheckBox( optionsPanel, i18n._("Current time"), null, '', true );
        currentTimeButton.onClick = function() {
            rangeGroup.visible = !currentTimeButton.value;
        };

        var rangeGroup = addNativeGroup(optionsPanel, 'row');
        rangeGroup.alignment = ['fill', 'top'];

        var inEdit = addNativeEditText(
            rangeGroup,
            '',
            undefined,
            '00:00:00:00',
            i18n._p("time", "In") /// TRANSLATORS: In time (incoming)
        );
        inEdit.characters = 8;

        var outEdit = addNativeEditText(
            rangeGroup,
            '',
            undefined,
            '00:00:00:00',
            i18n._p("time", "Out") /// TRANSLATORS: Out time (outgoing)
        );
        outEdit.characters = 8;

        rangeGroup.visible = false;

        var pickRangeButton = addIconButton(rangeGroup, DuScriptUI.Icon.EYE_DROPPER, '');
        pickRangeButton.alignment = ['right', 'center'];

        pickRangeButton.onClick = function() {
            var comp = DuAEProject.getActiveComp();
            if (!comp) return;

            if (selectMethodSelector.selection.index == 0) {
                inEdit.text = timeToCurrentFormat(comp.time + comp.displayStartTime, 1 / comp.frameDuration);
            } else {
                inEdit.text = timeToCurrentFormat(comp.workAreaStart + comp.displayStartTime, 1 / comp.frameDuration);
                outEdit.text = timeToCurrentFormat(comp.workAreaStart + comp.workAreaDuration + comp.displayStartTime, 1 / comp.frameDuration);
            }
        }

        var layerSelectionSelector = addLayersSelector( optionsPanel, 1 );

        var layerTypeSelector = addNativeDropdown( optionsPanel, [
            [i18n._("Controllers"), w16_controller],
            [i18n._("All layers"), w16_layers]
        ], 0);

        // The properties, as a row of checkboxes named by their image.
        var propsGroup = addNativeGroup(optionsPanel, 'row');
        propsGroup.alignment = ['center', 'top'];

        var posButton = addNativeCheckBox( propsGroup, '', w16_move, i18n._("Position"), true );
        var rotButton = addNativeCheckBox( propsGroup, '', w16_rotate, i18n._("Rotation"), true );
        var scaButton = addNativeCheckBox( propsGroup, '', w16_scale, i18n._("Scale"), true );
        var opaButton = addNativeCheckBox( propsGroup, '', w16_opacity, i18n._("Opacity"), true );
        var masksButton = addNativeCheckBox( propsGroup, '', w16_mask, i18n._("Masks"), true );
        var fxButton = addNativeCheckBox( propsGroup, '', w16_fx, i18n._("Effects"), true );
        var allPropsButton = addNativeCheckBox( propsGroup, '', w16_props, i18n._("All properties") );

        allPropsButton.onClick = function() {
            var checked = allPropsButton.value;
            posButton.value = checked;
            rotButton.value = checked;
            scaButton.value = checked;
            opaButton.value = checked;
            masksButton.value = checked;
            fxButton.value = checked;
        };

        selectButton.onClick = function() {
            var comp = DuAEProject.getActiveComp();
            if (!comp) return;
            var range = selectMethodSelector.selection.index == 1;
            // Get range
            var inTime = comp.time;
            var outTime = comp.time;
            if (currentTimeButton.value) {
                if (range) {
                    inTime = comp.workAreaStart;
                    outTime = comp.workAreaStart + comp.workAreaDuration;
                }
            } else {
                inTime = currentFormatToTime(inEdit.text, 1 / comp.frameDuration) - comp.displayStartTime;
                if (range) outTime = currentFormatToTime(outEdit.text, 1 / comp.frameDuration) - comp.displayStartTime;
                else outTime = inTime;
            }

            // Get property types
            var props = [];
            if (!allPropsButton.value) {
                if (posButton.value) {
                    props.push('ADBE Position');
                    props.push('ADBE Vector Position');
                    props.push('ADBE Position_0');
                    props.push('ADBE Position_1');
                    props.push('ADBE Position_2');
                }
                if (rotButton.value) {
                    props.push('ADBE Rotate Z');
                    props.push('ADBE Rotate Y');
                    props.push('ADBE Rotate X');
                    props.push('ADBE Orientation');
                    props.push('ADBE Vector Rotation');
                }
                if (scaButton.value) {
                    props.push('ADBE Scale');
                    props.push('ADBE Vector Scale');
                }
                if (opaButton.value) {
                    props.push('ADBE Opacity');
                    props.push('ADBE Vector Group Opacity');
                }
                if (masksButton.value) {
                    props.push('ADBE Mask Parade');
                }
                if (fxButton.value) {
                    props.push('ADBE Effect Parade');
                }
            }

            Duik.Animation.selectKeyframes(
                comp,
                layerSelectionSelector.selection.index == 0,
                layerTypeSelector.selection.index == 0,
                [inTime, outTime],
                props);
        };
    };

    var copyButton = toolsGroup.addButton(
        i18n._("Copy animation"),
        w12_copy,
        i18n._("Copies selected keyframes.\n\n[Alt]: Cuts the selected keyframes.")
    );
    copyButton.onClick = Duik.Animation.copy;
    copyButton.onAltClick = Duik.Animation.cut;

    var pasteButton = toolsGroup.addButton(
        i18n._("Paste animation"),
        w12_paste,
        i18n._("Paste keyframes.\n\n[Ctrl]: Offset from current values.\n[Alt]: Reverses the keyframes in time."),
        true
    );
    pasteButton.optionsPopup.build = function() {

        var offsetSelector = addNativeDropdown( pasteButton.optionsPanel, [
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
        ], 1);

        var reverseButton = addNativeCheckBox(
            pasteButton.optionsPanel,
            i18n._("Reverse keyframes"),
            undefined,
            i18n._("Reverses the animation in time.")
        );

        var replaceButton = addNativeCheckBox(
            pasteButton.optionsPanel,
            i18n._("Replace existing keyframes")
        );

        pasteButton.onClick = function() {
            DuAE.beginUndoGroup(i18n._("Paste animation"));
            Duik.Animation.paste(
                undefined,
                replaceButton.value,
                offsetSelector.selection.index == 0,
                reverseButton.value
            );
            DuAE.endUndoGroup();
        };
        pasteButton.onCtrlClick = function() {
            DuAE.beginUndoGroup(i18n._("Paste animation"));
            Duik.Animation.paste(undefined, false, true);
            DuAE.endUndoGroup();
        };
        pasteButton.onAltClick = function() {
            DuAE.beginUndoGroup(i18n._("Paste animation"));
            Duik.Animation.paste(undefined, false, false, true);
            DuAE.endUndoGroup();
        };
        pasteButton.onCtrlAltClick = function() {
            DuAE.beginUndoGroup(i18n._("Paste animation"));
            Duik.Animation.paste(undefined, false, true, true);
            DuAE.endUndoGroup();
        };
    };

    var interpolatorButton = toolsGroup.addButton(
        i18n._("Interpolator"),
        w12_interpolator,
        i18n._("Control the selected keyframes with advanced but easy-to-use keyframe interpolation driven by an effect.")
    );
    interpolatorButton.onClick = Duik.Animation.interpolator;

    var moveAnchorPointButton = createMoveAnchorPointButton(toolsGroup, mainGroup, hideAllGroups);
    moveAnchorPointButton.onClick = function() {

        if (!moveAnchorPointGroup.built) {
            buildNativeMoveAnchorPointGroup(moveAnchorPointGroup, animationGroup);
        }

        hideAllGroups();
        moveAnchorPointGroup.visible = true;
    };

    addNativeAlignButton(toolsGroup);

    var snapButton = toolsGroup.addButton(
        i18n._("Snap keys"),
        w12_snap,
        i18n._("Snaps selected (or all) keyframes to the closest frames if they're in between.")
    );
    snapButton.onClick = Duik.Animation.snapKeys;

    var motionTrailButton = toolsGroup.addButton(
        i18n._("Motion trail"),
        w12_motion_trail,
        i18n._("Draws a trail following the selected layers.\n\n[Alt]: Creates a new shape layer for each trail.")
    );
    motionTrailButton.onClick = Duik.Automation.motionTrail;
    motionTrailButton.onAltClick = function() { Duik.Automation.motionTrail(true) };

    var ikFkButton = toolsGroup.addButton(
        i18n._("IK/FK Switch"),
        w16_ik_fk_switch,
        i18n._("Switches the selected controller between IK and FK.\nAutomatically adds the needed keyframes at current time."),
        true
    );
    ikFkButton.optionsPopup.build = function() {
        var snapIKButton = addNativeButton(
            ikFkButton.optionsPanel,
            i18n._("Snap IK"),
            w16_snap_ik,
            i18n._("Snaps the IK to the FK values")
        );
        snapIKButton.onClick = Duik.Animation.snapIK;
        var snapFKButton = addNativeButton(
            ikFkButton.optionsPanel,
            i18n._("Snap FK"),
            w16_snap_fk,
            i18n._("Snaps the FK to the IK values")
        );
        snapFKButton.onClick = Duik.Animation.snapFK;
        ikFkButton.onClick = Duik.Animation.switchIKFK;
    }

    // Between the tool bar and the buttons.
    addNativeSeparator(contentGroup, 'vertical');

    var mainGroup = addNativeGroup(contentGroup, 'stack');
    mainGroup.alignment = ['fill', 'fill'];

    var animationGroup = addNativeGroup(mainGroup, 'column');

    // Tweening

    var tweeningSection = addNativeSection( animationGroup, i18n._("Tweening") );

    var tweenTools = addNativeToolBar(tweeningSection, 4, undefined, undefined, true);

    var splitKeyButton = tweenTools.addButton(
        i18n._("Split"),
        w16_split_keyframe,
        i18n._("Split the selected keyframes into couples of keyframes with the same value."),
        true
    );
    splitKeyButton.optionsPopup.build = function() {
        var splitKeyDurationEdit = addNativeEditText(
            splitKeyButton.optionsPanel,
            '2',
            i18n._p("video image", "Frames"), /// TRANSLATORS: as in video frames/images
            i18n._("Set the duration between two split keys."),
            i18n._("Duration") + ':'
        );

        var splitKeyAlignmentSelector = addNativeDropdown( splitKeyButton.optionsPanel, [
            [
                i18n._("Center"),
                w16_align_center,
                i18n._("Align around the current time.")
            ],
            [
                i18n._("After"),
                w16_align_in,
                i18n._("Add the new key after the current one.")
            ],
            [
                i18n._("Before"),
                w16_align_out,
                i18n._("Add the new key before the current one.")
            ]
        ], 0);

        splitKeyButton.onClick = function() {
            var alignment = DuAE.TimeAlignment.CENTER;
            var index = splitKeyAlignmentSelector.selection.index;
            if (index == 1) alignment = DuAE.TimeAlignment.IN_POINT;
            else if (index == 2) alignment = DuAE.TimeAlignment.OUT_POINT;

            var duration = parseInt(splitKeyDurationEdit.text);

            Duik.Animation.splitKeys(duration, alignment);
        };
    };

    var freezePoseButton = tweenTools.addButton(
        i18n._("Freeze"),
        w16_freeze_pose,
        i18n._("Freezes the pose; copies the previous keyframe to the current time.\n\n[Alt]: Freezes the next pose (copies the next keyframe to the current time)."),
        true
    );
    freezePoseButton.optionsPopup.build = function() {
        var propsSelector = addPropsSelector( freezePoseButton.optionsPanel );
        var layersSelector = addLayersSelector( freezePoseButton.optionsPanel );

        freezePoseButton.onClick = function() {
            var animatedProps = propsSelector.selection.index == 0;
            var selectedLayers = layersSelector.selection.index == 0;
            Duik.Animation.freezePose(animatedProps, selectedLayers);
        };
        freezePoseButton.onAltClick = function() {
            var animatedProps = propsSelector.selection.index == 0;
            var selectedLayers = layersSelector.selection.index == 0;
            Duik.Animation.freezePose(animatedProps, selectedLayers, true);
        };
    };

    var syncKeysButton = tweenTools.addButton(
        i18n._("Sync"),
        w16_sync_keys,
        i18n._("Synchronize the selected keyframes; moves them to the current time.\nIf multiple keyframes are selected for the same property, they're offset to the current time, keeping the animation.\n\n[Alt]: Syncs using the last keyframe instead of the first.")
    );
    syncKeysButton.onClick = Duik.Animation.syncKeys;
    syncKeysButton.onAltClick = function () { Duik.Animation.syncKeys(true); };

    var cleanKeysButton = tweenTools.addButton(
        i18n._("Clean"),
        w16_kleaner,
        i18n._("Remove unneeded keyframes.")
    );
    cleanKeysButton.onClick = Duik.Animation.cleanKeyframes;

    var tweenGroup = addNativeGroup( tweeningSection, 'row' );
    tweenGroup.alignment = ['fill', 'top'];

    var tweenSettingsButton = addOptionsButton( tweenGroup, i18n._("Tweening options"), i18n._("Tweening options") );
    var tweenPropsSelector = addPropsSelector( tweenSettingsButton.popup.content );
    var tweenLayersSelector = addLayersSelector( tweenSettingsButton.popup.content );

    var tweenSlider = addNativeSlider(tweenGroup, 50, 0, 100, '', '%', {
        textAlignment: 'left',
        valueButtons: [0,25,33,50,66,75,100]
    });
    tweenSlider.onChange = function() {
        var animatedProps = tweenPropsSelector.selection.index == 0;
        var selectedLayers = tweenLayersSelector.selection.index == 0;
        Duik.Animation.tween( tweenSlider.value / 100, animatedProps, selectedLayers);
    };

    // Temporal interpolation

    var temporalSection = addNativeSection( animationGroup, i18n._("Temporal interpolation") );

    var keyEditGroup = addNativeGroup( temporalSection, 'row' );
    keyEditGroup.alignment = ['fill', 'top'];

    var ksettingsButton = addOptionsButton( keyEditGroup, i18n._("Set key options"), i18n._("Keyframe options") );
    var keyEditOptions = ksettingsButton.popup.content;

    var keyEditModeSelector = addNativeDropdown( keyEditOptions, [
        [i18n._("Add keyframes"), w12_add],
        [i18n._("Edit selected keyframes"), w12_edit]
    ], 1);
    keyEditModeSelector.onChange = function() {
        if (!keyEditModeSelector.selection) return;
        var i = keyEditModeSelector.selection.index == 0;
        keyEditPropsSelector.enabled = i;
        keyEditLayersSelector.enabled = i;
    }
    var keyEditPropsSelector = addPropsSelector( keyEditOptions );
    keyEditPropsSelector.enabled = false;

    var keyEditLayersSelector = addLayersSelector( keyEditOptions );
    keyEditLayersSelector.enabled = false;

    // Adds keyframes when the options say so, or edits the selected ones.
    function addingKeys() {
        return keyEditModeSelector.selection.index == 0;
    }

    function animatedProps() {
        return keyEditPropsSelector.selection.index == 0;
    }

    function selectedLayers() {
        return keyEditLayersSelector.selection.index == 0;
    }

    var krovingButton = addIconButton( keyEditGroup, w12_kroving, i18n._("Roving") );
    krovingButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addRovingKey(animatedProps(), selectedLayers());
        else Duik.Animation.setRoving();
    };
    var klinButton = addIconButton( keyEditGroup, w12_klin, i18n._("Linear") );
    klinButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addLinearKey(animatedProps(), selectedLayers());
        else Duik.Animation.setLinear();
    };
    var kinbezButton = addIconButton( keyEditGroup, w12_kinbez, i18n._("Ease In") );
    kinbezButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addEaseInKey(animatedProps(), selectedLayers(), easeInSlider.value);
        else Duik.Animation.setEaseIn(easeInSlider.value);
    };
    var koutbezButton = addIconButton( keyEditGroup, w12_koutbez, i18n._("Ease Out") );
    koutbezButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addEaseOutKey(animatedProps(), selectedLayers(), easeOutSlider.value);
        else Duik.Animation.setEaseOut(easeOutSlider.value);
    };
    var kbezButton = addIconButton( keyEditGroup, w12_kbez, i18n._("Easy Ease") );
    kbezButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addEasyEaseKey(animatedProps(), selectedLayers(), easeInSlider.value, easeOutSlider.value);
        else Duik.Animation.setEasyEase(easeInSlider.value, easeOutSlider.value);
    };
    var kautoButton = addIconButton( keyEditGroup, w12_kauto, i18n._("Continuous") );
    kautoButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addContinuousKey(animatedProps(), selectedLayers());
        else Duik.Animation.setContinuous();
    };
    var kholdButton = addIconButton( keyEditGroup, w12_khold, i18n._("Hold") );
    kholdButton.onClick = function() {
        if (addingKeys()) Duik.Animation.addHoldKey(animatedProps(), selectedLayers());
        else Duik.Animation.setHold();
    };

    var easePresetsGroup = addNativeGroup( temporalSection, 'row' );
    easePresetsGroup.alignment = ['fill', 'top'];

    var easePresetSettingsButton = addOptionsButton( easePresetsGroup, i18n._("Set key options"), i18n._("Ease options") );
    var easeOptionsPopup = easePresetSettingsButton.popup;
    var easeResetListButton = addNativeButton(
        easeOptionsPopup.content,
        i18n._("Reset preset list"),
        w16_reset,
        i18n._("Resets the preset list to the default values.")
    );
    easeResetListButton.onClick = function() {
        easePresetList.removeAll();
        for(var i = 0; i < defaultEasePresets.length; i++) {
            easePresetList.add('item', defaultEasePresets[i]);
        };
        easePresetList.selection = 0;
        DuESF.scriptSettings.set("easePresets", defaultEasePresets);
        DuESF.scriptSettings.save();
        easeOptionsPopup.hide();
    };
    var defaultEasePresets = [ i18n._("Ease presets"),
        "25/75 | 0/0", "33/33 | 0/0", "33/33 | 100/100", "33/66 | 0/0", "50/50 | 0/0", "50/50 | 100/100", "66/33 | 0/0", "75/25 | 0/0", "80/80 | 0/0"
    ];
    var presets = DuESF.scriptSettings.get("easePresets", defaultEasePresets);
    var easePresetList = easePresetsGroup.add('dropdownlist',undefined,presets);
    easePresetList.alignment = ['fill', 'center'];
    easePresetList.selection = 0;
    easePresetList.onChange = function() {
        if (!easePresetList.selection) return;
        if (easePresetList.selection.index == 0) return;
        var preset = easePresetList.selection.text;
        var rePreset = /(\d+)\/(\d+) \| (-?\d+)\/(-?\d+)/i;
        var vals = preset.match(rePreset);
        if (vals == null) return;
        if (vals.length != 5) return;
        easeInSlider.setValue( parseInt(vals[1]) );
        easeOutSlider.setValue( parseInt(vals[2]) );
        velocityInSlider.setValue( vals[3] );
        velocityOutSlider.setValue( vals[4] );
        easeLinkButton.setChecked(vals[1] != vals[2]);
        velocityLinkButton.setChecked(vals[3] != vals[4]);
        easeApplyAllButton.onClick();
    }
    var easePresetAddButton = addIconButton( easePresetsGroup, w12_add, i18n._("Add new ease preset") );
    easePresetAddButton.alignment = ['right', 'center'];
    easePresetAddButton.onClick = function() {
        var presets = [];
        for (var i = 1 ; i < easePresetList.items.length ; i++)
        {
            presets.push(easePresetList.items[i].text);
        }
        presets.push(easeInSlider.value + '/' + easeOutSlider.value + ' | ' + velocityInSlider.value + '/' + velocityOutSlider.value);
        presets.sort();
        presets.unshift('Ease presets');
        easePresetList.removeAll();
        for (var i=0;i<presets.length;i++)
        {
            easePresetList.add('item',presets[i]);
        }
        DuESF.scriptSettings.set("easePresets", presets);
        DuESF.scriptSettings.save();
        easePresetList.selection = 0;
    };
    var easePresetRemoveButton = addIconButton( easePresetsGroup, w12_remove, i18n._("Remove selected ease preset") );
    easePresetRemoveButton.alignment = ['right', 'center'];
    easePresetRemoveButton.onClick = function() {
        if (!easePresetList.selection) return;
        if (easePresetList.selection.index == 0) return;
        easePresetList.remove(easePresetList.selection);
        var presets = [];
        for (var i = 0 ; i < easePresetList.items.length ; i++)
        {
            presets.push(easePresetList.items[i].text);
        }
        DuESF.scriptSettings.set("easePresets", presets);
        DuESF.scriptSettings.save();
        easePresetList.selection = 0;
    };
    var easePickButton = addIconButton( easePresetsGroup, DuScriptUI.Icon.EYE_DROPPER, i18n._("Pick ease and velocity from selected key.") );
    easePickButton.alignment = ['right', 'center'];
    easePickButton.onClick = function() {
        var props = DuAEComp.getSelectedProps();
        var propList = new DuList(props);
        if (props.length == 0) return;

        var propInfo;
        while(propInfo = propList.next()) {
            if (propInfo.isGroup()) continue;
            var prop = propInfo.getProperty();
			if (prop.selectedKeys.length == 0) continue;
			var speed = propInfo.velocityToPercent(prop.selectedKeys[0]);
			var speedIn = speed[0];
			var speedOut = speed[1];
			var easeIn = prop.keyInTemporalEase(prop.selectedKeys[0])[0].influence;
			var easeOut = prop.keyOutTemporalEase(prop.selectedKeys[0])[0].influence;
			easeInSlider.setValue(easeIn);
			easeOutSlider.setValue(easeOut);
			velocityInSlider.setValue(speedIn);
			velocityOutSlider.setValue(speedOut);
			easeLinkButton.setChecked(easeIn != easeOut);
			velocityLinkButton.setChecked(speedIn != speedOut);
			break;
        }
    };
    var easeApplyAllButton = addIconButton( easePresetsGroup, DuScriptUI.Icon.CHECK, i18n._("Apply ease and velocity to selected keyframes.") );
    easeApplyAllButton.alignment = ['right', 'center'];
    easeApplyAllButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Set ease"));
        easeApplyButton.onClick();
        velocityApplyButton.onClick();
        DuAE.endUndoGroup();
    };

    // A row of two sliders, for the in and out values, with the buttons switching and linking them between them.
    // The link button is checked when the values are unlinked.
    function addInOutRow( container ) {
        var row = addNativeGroup(container, 'row');
        row.alignment = ['fill', 'top'];
        row.alignChildren = ['fill', 'top'];
        return row;
    }

    function addSwitchLinkButtons( row, switchTip ) {
        var buttons = addNativeGroup( row, 'column' );
        buttons.alignment = ['center', 'top'];
        buttons.switchButton = addIconButton( buttons, w12_switch, switchTip );
        buttons.linkButton = addNativeToggleButton( buttons, w12_constraints, w12_unlink_chain );
        return buttons;
    }

    var easeGroup = addInOutRow(temporalSection);
    var easeInSlider = addNativeSlider(easeGroup, 33, 1, 100, '', '%', {
        inverted: true,
        textAlignment: 'right',
        valueButtons: [75,50,33]
    });
    easeInSlider.onChange = function() {
        easeInSlider.lastModified = true;
		easeOutSlider.lastModified = false;

		if (!easeLinkButton.checked) {
            easeOutSlider.setValue(easeInSlider.value);
            Duik.Animation.setEase( easeInSlider.value, easeOutSlider.value );
        }
        else {
            Duik.Animation.setEase( easeInSlider.value );
        }
    };
    easeInSlider.onChanging = function() {
        if (!easeLinkButton.checked) easeOutSlider.setValue(easeInSlider.value);
    };
    var easeButtonGroup = addSwitchLinkButtons( easeGroup, i18n._("Switches in and out eases.") );
    var easeSwitchButton = easeButtonGroup.switchButton;
    easeSwitchButton.onClick = function() {
        var inVal = easeInSlider.value;
		easeInSlider.setValue(easeOutSlider.value);
		easeOutSlider.setValue(inVal);
		easeApplyButton.onClick();
    };
    var easeLinkButton = easeButtonGroup.linkButton;
    easeLinkButton.onClick = function() {
        if (easeInSlider.lastModified)
		{
			easeOutSlider.setValue(easeInSlider.value);
		}
		else
		{
			easeInSlider.setValue(easeOutSlider.value);
		}
    };
    var easeOutSlider = addNativeSlider(easeGroup, 33, 1, 100, '', '%', {
        textAlignment: 'left',
        valueButtons: [33,50,75]
    });
    easeOutSlider.onChange = function() {
        easeInSlider.lastModified = false;
		easeOutSlider.lastModified = true;

		if (!easeLinkButton.checked) {
            easeInSlider.setValue(easeOutSlider.value);
            Duik.Animation.setEase( easeInSlider.value, easeOutSlider.value );
        }
        else {
            Duik.Animation.setEase( undefined, easeOutSlider.value );
        }
    };
    easeOutSlider.onChanging = function() {
        if (!easeLinkButton.checked) easeInSlider.setValue(easeOutSlider.value);
    };
    var easeApplyButton = addIconButton( easeGroup, DuScriptUI.Icon.CHECK, i18n._("Apply ease to selected keyframes.") );
    easeApplyButton.alignment = ['right', 'top'];
    easeApplyButton.onClick =  function() {
        Duik.Animation.setEase( easeInSlider.value, easeOutSlider.value );
    };

    var velocityGroup = addInOutRow(temporalSection);
    var velocityInSlider = addNativeSlider(velocityGroup, 0, -400, 400, '', '%', {
        inverted: true,
        textAlignment: 'right',
        valueButtons: [200,100,0]
    });
    velocityInSlider.onChange = function() {
        velocityInSlider.lastModified = true;
		velocityOutSlider.lastModified = false;

        if (!velocityLinkButton.checked) {
            velocityOutSlider.setValue(velocityInSlider.value);
            Duik.Animation.setVelocity( velocityInSlider.value, velocityOutSlider.value );
        }
        else {
            Duik.Animation.setVelocity( velocityInSlider.value );
        }
    };
    velocityInSlider.onChanging = function() {
        if (!velocityLinkButton.checked) velocityOutSlider.setValue(velocityInSlider.value);
    };
    var velocityButtonGroup = addSwitchLinkButtons( velocityGroup, i18n._("Switches in and out velocities.") );
    var velocitySwitchButton = velocityButtonGroup.switchButton;
    velocitySwitchButton.onClick = function() {
        var inVal = velocityInSlider.value;
		velocityInSlider.setValue(velocityOutSlider.value);
		velocityOutSlider.setValue(inVal);
		velocityApplyButton.onClick();
    }
    var velocityLinkButton = velocityButtonGroup.linkButton;
    velocityLinkButton.onClick = function() {
        if (velocityInSlider.lastModified)
		{
			velocityOutSlider.setValue(velocityInSlider.value);
		}
		else
		{
			velocityInSlider.setValue(velocityOutSlider.value);
		}
    };
    var velocityOutSlider = addNativeSlider(velocityGroup, 0, -400, 400, '', '%', {
        textAlignment: 'left',
        valueButtons: [0, 100, 200]
    });
    velocityOutSlider.onChange = function() {
        velocityInSlider.lastModified = false;
		velocityOutSlider.lastModified = true;

        if (!velocityLinkButton.checked) {
            velocityInSlider.setValue(velocityOutSlider.value);
            Duik.Animation.setVelocity( velocityInSlider.value, velocityOutSlider.value );
        }
        else {
            Duik.Animation.setVelocity( undefined, velocityOutSlider.value );
        }
    };
    velocityOutSlider.onChanging = function() {
        if (!velocityLinkButton.checked) velocityInSlider.setValue(velocityOutSlider.value);
    };
    var velocityApplyButton = addIconButton( velocityGroup, DuScriptUI.Icon.CHECK, i18n._("Apply velocity to selected keyframes.") );
    velocityApplyButton.alignment = ['right', 'top'];
    velocityApplyButton.onClick = function() {
        Duik.Animation.setVelocity( velocityInSlider.value, velocityOutSlider.value );
    };

    // Spatial interpolation

    var spatialSection = addNativeSection( animationGroup, i18n._("Spatial interpolation") );

    var spatialInterpolationGroup = addNativeGroup( spatialSection, 'row' );
    spatialInterpolationGroup.alignment = ['fill', 'top'];

    var spatialLinButton = addIconButton(
        spatialInterpolationGroup,
        w16_linear,
        i18n._("Set the spatial interpolation to linear for selected keyframes.")
    );
    spatialLinButton.onClick = Duik.Animation.setSpatialLinear;
    var spatialBezierInOutButton = addIconButton(
        spatialInterpolationGroup,
        w16_bezier_in_out,
        i18n._("Set the spatial interpolation to Bézier for selected keyframes.")
    );
    spatialBezierInOutButton.onClick = Duik.Animation.setSpatialBezier;
    var spatialBezierOutButton = addIconButton(
        spatialInterpolationGroup,
        w16_bezier_out,
        i18n._("Set the spatial interpolation to Bézier Out for selected keyframes.")
    );
    spatialBezierOutButton.onClick = Duik.Animation.setSpatialBezierOut;
    var spatialBezierInButton = addIconButton(
        spatialInterpolationGroup,
        w16_bezier_in,
        i18n._("Set the spatial interpolation to Bézier In for selected keyframes.")
    );
    spatialBezierInButton.onClick = Duik.Animation.setSpatialBezierIn;
    var spatialAutoButton = addNativeButton(
        spatialInterpolationGroup,
        i18n._("Fix"),
        w16_autorig,
        i18n._("Automatically fix spatial interpolation for selected keyframes.")
    );
    spatialAutoButton.onClick = Duik.Animation.fixSpatialInterpolation;

    // A grid with a row per button, like the Links and constraints panel: its options and image, then the button.
    var line1 = addNativeButtonGrid(animationGroup);
    line1.buttonHeight = 24;

    var animationLibButton = addNativeButton(
        line1,
        i18n._("Animation library") + '...',
        w16_library,
        i18n._("Quickly save, export, import and apply animations from predefined folders.")
    );
    animationLibButton.onClick = function() {
        var folderURI = DuESF.scriptSettings.get("animationLibFolder", DuESF.scriptSettings.file.parent.absoluteURI + '/' + i18n._("Animation library"));
        var libFolder = new Folder(folderURI);
        if (!libFolder.exists) libFolder.create();

        if (!animationLibGroup.built) {
            addNativeSubPanel(
                animationLibGroup,
                i18n._("Animation library"),
                animationGroup,
                false
            );

            #include "animationLibPanel.jsx"
            buildAnimationLibPanel( animationLibGroup );

            nativeLayout(animationLibGroup);
        }

        hideAllGroups();
        animationLibGroup.visible = true;
    }

    addNativeKleanerButton( line1 );

    var sequenceButton = addNativeButton(
        line1,
        i18n._("Sequence"),
        w16_sequencer,
        i18n._("Sequence layers or keyframes.\n\n[Ctrl]: Sequence keyframes instead of layers\n[Alt]: Reverse"),
        {
            options: true,
            optionsWithoutPanel: true
        }
    );
    sequenceButton.onOptions = function(showUI) {
        showUI = def(showUI, true);

        if (!sequenceGroup.built){
            addNativeSubPanel(
                sequenceGroup,
                i18n._("Sequence"),
                animationGroup,
                false
            );

            var layerKeySelector = addNativeDropdown( sequenceGroup, [
                [i18n._("Layers"), w16_layers],
                [i18n._("Keyframes"), w16_keyframe]
            ], 0);
            layerKeySelector.onChange = function() {
                if (!layerKeySelector.selection) return;
                layerModeSelector.visible = layerKeySelector.selection.index == 0;
            };

            var layerModeSelector = addNativeDropdown( sequenceGroup, [
                [i18n._("Times"), w16_sequencer_times],
                [i18n._("In points"), w16_sequencer],
                [i18n._("Out points"), w16_sequencer_out]
            ], 0);

            var shapeSelector = addNativeDropdown( sequenceGroup, [
                [i18n._("Linear"), w16_linear_interpolation],
                [i18n._("Ease - Sigmoid (logistic)"), w16_interpolator],
                [i18n._("Natural - Bell (gaussian)"), w16_gaussian_interpolation],
                [i18n._("Ease In (logarithmic)"), w16_logarithmic_interpolation],
                [i18n._("Ease Out (exponential)"), w16_exponential_interpolation]
            ], 2);

            var durationEdit = addNativeEditText(
                sequenceGroup,
                '24',
                i18n._p("video image", "Frames"), /// TRANSLATORS: as in video frames/images
                '',
                i18n._("Duration") + ':'
            );

            var rateSlider = addNativeSlider(
                sequenceGroup,
                30,
                0,
                100,
                i18n._p("interpolation", "Rate"), /// TRANSLATORS: a rate used in an interpolation, how fast/slow is the interpolation
                '',
                { orientation: 'row' }
            );

            var okButton = addNativeValidButton(
                sequenceGroup,
                i18n._("Sequence"),
                i18n._("Sequence layers or keyframes.\n\n[Ctrl]: Sequence keyframes instead of layers\n[Alt]: Reverse")
            );

            // The options of the sequence, read when it's run.
            function getDuration() {
                var duration = parseInt(durationEdit.text);
                if (isNaN(duration)) duration = 24;
                return duration;
            }

            function moveLayers() {
                return layerModeSelector.selection.index == 0;
            }

            function inPoints() {
                return layerModeSelector.selection.index == 1;
            }

            function sequenceKeys() {
                return layerKeySelector.selection.index == 1;
            }

            okButton.onClick = function() {
                if (!sequenceKeys()) Duik.Animation.sequenceLayers(getDuration(), moveLayers(), inPoints(), false, getInterpolation());
                else Duik.Animation.sequenceKeys(getDuration(), false, getInterpolation());
            };
            sequenceButton.onClick = function() {
                Duik.Animation.sequenceLayers(getDuration(), moveLayers(), inPoints(), false, getInterpolation());
            };
            okButton.onAltClick = function() {
                if (!sequenceKeys()) Duik.Animation.sequenceLayers(getDuration(), moveLayers(), inPoints(), true, getInterpolation());
                else Duik.Animation.sequenceKeys(getDuration(), true, getInterpolation());
            };
            sequenceButton.onAltClick = function() {
                Duik.Animation.sequenceLayers(getDuration(), moveLayers(), inPoints(), true, getInterpolation());
            };

            sequenceButton.onCtrlClick = okButton.onCtrlClick = function() {
                Duik.Animation.sequenceKeys(getDuration(), false, getInterpolation());
            };
            sequenceButton.onCtrlAltClick = okButton.onCtrlAltClick = function() {
                Duik.Animation.sequenceKeys(getDuration(), true, getInterpolation());
            };

            function getInterpolation() {

                // For now, approximate with a Bezier function
                var rate = rateSlider.value / 100;
                var s = shapeSelector.selection.index;
                if (s == 0) return DuInterpolation.linear;

                if (s == 1) { // S
                    return function(t, tm, tM, vm, vM) {
                        return DuInterpolation.bezier(t, tm, tM, vm, vM, [0, rate, 1, 1-rate]);
                    };
                }
                if (s == 2) { // B
                    return function(t, tm, tM, vm, vM) {
                        return DuInterpolation.bezier(t, tm, tM, vm, vM, [0, rate, 1, rate]);
                    };
                }
                if (s == 3) { // Log
                    return function(t, tm, tM, vm, vM) {
                        return DuInterpolation.bezier(t, tm, tM, vm, vM, [0, 0, 1, 1-rate]);
                    };
                }
                if (s == 4) { // exp
                    return function(t, tm, tM, vm, vM) {
                        return DuInterpolation.bezier(t, tm, tM, vm, vM, [0, rate, 1, 1]);
                    };
                }

                /*
                if (s == 1) {
                    rate = DuInterpolation.linear(rate, 0, 20, 0, 1);
                    return function(t, tm, tM, vm, vM) { return DuInterpolation.logistic(t, tm, tM, vm, vM, rate); };
                }
                if (s == 2) return DuInterpolation.inverseGaussian;
                if (s == 3) return DuInterpolation.logarithmic;
                if (s == 4) return DuInterpolation.exponential;
                return DuInterpolation.gaussian;*/
            }

            nativeLayout(sequenceGroup);
        }
        if (showUI) {
            hideAllGroups();
            sequenceGroup.visible = true;
        }
    }

    addNativeXSheetButton( line1 );

    var nlaButton = addNativeButton(
        line1,
        i18n._("Non-linear animation"),
        w16_nla,
        i18n._("Edit animations together."),
        {
            options: true,
            optionsWithoutButton: true
        }
    );
    nlaButton.onClick = Duik.Automation.setupNLA;
    nlaButton.optionsPopup.build = function() {
        var clipButton = addNativeButton(
            nlaButton.optionsPanel,
            i18n._("Add new clip"),
            w12_add,
            i18n._("Create a new clip from the original comp and adds it to the 'NLA.Edit' comp.")
        );
        clipButton.onClick = Duik.Automation.addNLAClip;
    }

    var celAnimationButton = addNativeButton(
        line1,
        i18n._("Cel animation..."), /// TRANSLATORS: i.e. traditional animation
        w16_cel_animation,
        i18n._("Tools to help traditionnal animation using After Effects' paint effect with the brush tool.")
    );
    celAnimationButton.onClick = function() {
        if (!celAnimationGroup.built) {
            addNativeSubPanel(
                celAnimationGroup,
                i18n._("Cel animation"), /// TRANSLATORS: i.e. traditional animation
                animationGroup,
                false
            );

            var newCelButton = addNativeButton(
                celAnimationGroup,
                i18n._("New Cel."), /// TRANSLATORS: a (transparent) layer/celluloid in a traditional animation
                w16_new_cel,
                i18n._("Create a new animation cel.\n\n[Alt]: Creates on the selected layer instead of adding a new layer.") /// TRANSLATORS: Cel. is a (transparent) layer/celluloid in a traditional animation
            );
            newCelButton.onClick = Duik.Animation.newCel;
            newCelButton.onAltClick = function() { Duik.Animation.newCel(true) };

            addNativeSeparator(celAnimationGroup);

            var onionSkinGroup = addNativeGroup( celAnimationGroup, 'row');
            onionSkinGroup.alignment = ['fill', 'top'];

            var onionSkinButton = addNativeCheckBox(
                onionSkinGroup,
                i18n._("Onion skin"),
                w16_onion_skin,
                i18n._("Shows the previous and next frames with a reduced opacity."),
                true
            );
            onionSkinButton.onClick = function() {
                var enabled = onionSkinButton.value;
                onionInGroup.enabled = enabled;
                onionOutGroup.enabled = enabled;
                onionSkinEdit.group.enabled = enabled;

                var i = onionInSlider.value;
                var o = onionOutSlider.value;
                if (!onionInButton.value) i = 0;
                if (!onionOutButton.value) o = 0;

                var f = parseInt( onionSkinEdit.text );
                var e = parseInt( frameEditButton.text );

                Duik.Animation.celOnionSkin( onionSkinButton.value, f, e, i, o);
            };

            var onionSkinEdit = addNativeEditText(
                onionSkinGroup,
                '5',
                i18n._p("video image", "Frames") /// TRANSLATORS: as in video frames/images
            );
            onionSkinEdit.onChange = onionSkinButton.onClick;

            var onionInGroup = addNativeGroup( celAnimationGroup, 'row');
            onionInGroup.alignment = ['fill', 'top'];

            var onionInButton = addNativeCheckBox( onionInGroup, i18n._p("time", "In"), null, '', true );
            onionInButton.parent.alignment = ['left', 'center'];
            onionInButton.onClick = function() {
                onionInSlider.enabled = onionInButton.value;
                onionSkinButton.onClick();
            };

            var onionInSlider = addNativeSlider( onionInGroup, 50, 0, 100, '', '%', { orientation: 'row' } );
            onionInSlider.onChange = onionSkinButton.onClick;

            var onionOutGroup = addNativeGroup( celAnimationGroup, 'row');
            onionOutGroup.alignment = ['fill', 'top'];

            var onionOutButton = addNativeCheckBox( onionOutGroup, i18n._p("time", "Out"), null, '', true );
            onionOutButton.parent.alignment = ['left', 'center'];
            onionOutButton.onClick = function() {
                onionOutSlider.enabled = onionOutButton.value;
                onionSkinButton.onClick();
            };

            var onionOutSlider = addNativeSlider( onionOutGroup, 50, 0, 100, '', '%', { orientation: 'row' } );
            onionOutSlider.onChange = onionSkinButton.onClick;

            addNativeSeparator(celAnimationGroup);

            var celFrameGroup = addNativeGroup( celAnimationGroup, 'row');
            celFrameGroup.alignment = ['fill', 'top'];

            var prevFrameButton = addIconButton(
                celFrameGroup,
                w16_previous_frame,
                i18n._("Go to the previous frame")
            );
            prevFrameButton.onClick = function() {
                var e = parseInt( frameEditButton.text );
                Duik.Animation.previousCel(e);
            };

            var frameEditButton = addNativeEditText(
                celFrameGroup,
                '2',
                i18n._p("video image", "Frames"),
                i18n._("Changes the exposure of the animation (the frames per second)."),
                i18n._p("animation", "Exposure:") /// TRANSLATORS: animation exposure (the duration of each frame)
            );

            var nextFrameButton = addIconButton(
                celFrameGroup,
                w16_next_frame,
                i18n._("Go to the next frame.")
            );
            nextFrameButton.alignment = ['right', 'center'];
            nextFrameButton.onClick = function() {
                var e = parseInt( frameEditButton.text );
                Duik.Animation.nextCel(e);
            };

            nativeLayout(celAnimationGroup);
        }

        hideAllGroups();
        celAnimationGroup.visible = true;
    };

    var animationLibGroup = addNativeGroup(mainGroup, 'column');
    animationLibGroup.visible = false;
    animationLibGroup.built = false;

    var moveAnchorPointGroup = addNativeGroup(mainGroup, 'column');
    moveAnchorPointGroup.visible = false;
    moveAnchorPointGroup.built = false;

    var celAnimationGroup = addNativeGroup(mainGroup, 'column');
    celAnimationGroup.visible = false;
    celAnimationGroup.built = false;

    var sequenceGroup = addNativeGroup(mainGroup, 'column');
    sequenceGroup.visible = false;
    sequenceGroup.built = false;
    //*/
}
