function buildBonesUI( tab, standAlone )
{
    standAlone = def(standAlone, false);

    if (!standAlone) {
        // A Spacer
        var spacer = tab.add('group');
        spacer.margins = 0;
        spacer.spacing = 0;
        spacer.size = [-1,3];

        // A title
        tab.add('statictext', undefined, i18n._("Bones")).alignment = ['center', 'top'];
    }

    // The panel is a row, like the Links and constraints panel: the tool bar on the left,
    // then the buttons and the bone settings they open.
    var contentGroup = addNativeGroup(tab, 'row');
    contentGroup.alignment = ['fill', 'fill'];
    contentGroup.alignChildren = ['fill', 'fill'];
    // Room on each side of the separator, so the tool bar and the buttons don't hug it.
    contentGroup.spacing = 8;

    // tools: two per row, down the left of the panel
    var toolsGroup = addNativeToolBar(contentGroup, 2, 32, 32);
    toolsGroup.alignment = ['left', 'top'];

    var selectButton = toolsGroup.addButton(
        i18n._("Select bones"),
        w12_select,
        i18n._("Select all bones")
    );
    selectButton.onClick = Duik.Bone.select;

    var showButton = toolsGroup.addButton(
        i18n._("Show/hide bones"),
        w12_show,
        i18n._("Show/Hide all the bones.\n\n[Alt]: Only the unselected bones.")
    );
    showButton.onClick = Duik.Bone.toggleVisibility;
    showButton.onAltClick = function( ) { Duik.Bone.toggleVisibility(undefined, true); };

    var duplicateButton = toolsGroup.addButton(
        i18n._("Duplicate bones"),
        w12_duplicate,
        i18n._("Duplicate the selected bones"),
    );
    duplicateButton.onClick = Duik.Bone.duplicate;

    var linkArtButton = toolsGroup.addButton(
        i18n._("Link art"),
        w12_link_to_bone,
        i18n._("Automatically (try to) link the artwork layers to their corresponding bones.") + "\n\n" +
        i18n._("By default, bones and artworks are matched using the layer names.") + "\n\n" +
        i18n._("[Alt]: Use the distance between the layers (using the anchor points of the layers) instead of their names.")
    );
    linkArtButton.onClick = function() {
        DuScriptUI.progressBar.reset();
        DuScriptUI.progressBar.show();
        Duik.Bone.autoParent(undefined, undefined, true);

        DuScriptUI.progressBar.close();
    };
    linkArtButton.onAltClick = function() {
        DuScriptUI.progressBar.reset();
        DuScriptUI.progressBar.show();
        Duik.Bone.autoParent();
        DuScriptUI.progressBar.close();
    };

    var unlinkButton = toolsGroup.addButton(
        i18n._("Edit mode"),
        w12_unlink,
        i18n._("Toggle edit mode")
    );
    unlinkButton.onClick = Duik.Bone.unlink;

    var bakeButton = toolsGroup.addButton(
        i18n._("Bake bones"),
        w12_bake,
        i18n._("Bake bone appearances.\n\n[Alt]: Keep envelops.\n[Ctrl]: Keep deactivated noodles."),
    );
    bakeButton.onClick = function() {
        if (!DuAEProject.setProgressMode(true, true, true, [bakeButton.screenX, bakeButton.screenY] )) return;
        Duik.Bone.bake();
        DuAEProject.setProgressMode(false);
    }
    bakeButton.onAltClick = function () {
        if (!DuAEProject.setProgressMode(true, true, true, [bakeButton.screenX, bakeButton.screenY] )) return;
        Duik.Bone.bake(true, false);
        DuAEProject.setProgressMode(false);
    };
    bakeButton.onCtrlClick = function () {
        if (!DuAEProject.setProgressMode(true, true, true, [bakeButton.screenX, bakeButton.screenY] )) return;
        Duik.Bone.bake(true, true, false);
        DuAEProject.setProgressMode(false);
    };
    bakeButton.onCtrlAltClick = function () {
        if (!DuAEProject.setProgressMode(true, true, true, [bakeButton.screenX, bakeButton.screenY] )) return;
        Duik.Bone.bake(true, false, false);
        DuAEProject.setProgressMode(false);
    };

    var editButton = toolsGroup.addButton(
        i18n._("Bone settings"),
        DuScriptUI.Icon.SETTINGS,
        i18n._("Edit selected bones")
    );
    editButton.onClick = function() { showBoneSettings(); };

    // Between the tool bar and the buttons.
    addNativeSeparator(contentGroup, 'vertical');

    var mainGroup = addNativeGroup(contentGroup, 'stack');
    mainGroup.alignment = ['fill', 'fill'];

    var bonesGroup = addNativeGroup(mainGroup, 'column');

    // Character name
    // Native fields have no place holder, so the name has a label instead.
    var nameGroup = addNativeGroup(bonesGroup, 'row');
    nameGroup.alignment = ['fill', 'top'];
    var nameLabel = nameGroup.add('statictext', undefined, i18n._("Character Name") + ':');
    nameLabel.helpTip = i18n._("Choose the name of the character.");
    var nameEdit = nameGroup.add('edittext', undefined, '');
    nameEdit.alignment = ['fill', 'center'];
    nameEdit.helpTip = nameLabel.helpTip;

    addNativeSeparator(bonesGroup);

    // Limbs

    // A checkbox for a part of a limb, colored like the part in the illustration.
    function addLimbCheckBox( container, text, color, checked )
    {
        var checkbox = addNativeCheckBox(container, text, null, '', checked);
        nativeTextColor(checkbox, color);
        return checkbox;
    }

    // A field for a number of layers, between its label and its unit, like "Spine: 3 layers".
    // Duik's fields showed the default number while they were empty; these ones start with it.
    function addLayerCountField( container, label, suffix, count, color )
    {
        var row = addNativeGroup(container, 'row');
        row.alignment = ['fill', 'top'];

        var labelText = row.add('statictext', undefined, label);
        if (color) nativeTextColor(labelText, color);

        var edit = row.add('edittext', undefined, '' + count);
        edit.alignment = ['fill', 'center'];
        edit.characters = 4;

        if (suffix) row.add('statictext', undefined, suffix);

        return edit;
    }

    // An illustration of the limb, at the top of its options.
    function addIllustration( container, image )
    {
        var illustration = container.add('image', undefined, nativeImage(image));
        illustration.alignment = ['center', 'top'];
        return illustration;
    }

    function createArmButton( group, type )
    {
        var buttonName = i18n._("Front leg");
        if (type == 'hominoid') buttonName = i18n._("Arm");
        else if (type == 'arthropod') buttonName = i18n._("Leg");
        var armButton = group.addButton(
            buttonName,
            w16_arm,
            i18n._("Add an armature for an arm") + '\n\n' +
                i18n._("[Ctrl]: Auto-parent the selection to the new bones.\n[Alt]: Assign a random color to the new limb."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        armButton.optionsPopup.build = function ()
        {
            function createArm(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create arm"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;
                var  t = OCO.LimbType.HOMINOID;
                if (type == 'digitigrade') t = OCO.LimbType.DIGITIGRADE;
                else if (type == 'plantigrade') t = OCO.LimbType.PLANTIGRADE;
                else if (type == 'ungulate') t = OCO.LimbType.UNGULATE;
                else if (type == 'arthropod') t = OCO.LimbType.ARTHROPOD;

                var side = armSideSelector.getValue();
                var location = armLocationSelector.getValue();

                var bones = Duik.Bone.arm(
                    characterName,
                    t,
                    side,
                    armShoulderButton.value,
                    armArmButton.value,
                    armForearmButton.value,
                    armHandButton.value,
                    armClawsButton ? armClawsButton.value : false,
                    location,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                // Set the side to the other for the next limb
                if (side == OCO.Side.LEFT) armSideSelector.setValue( OCO.Side.RIGHT );
                else if (side == OCO.Side.RIGHT) armSideSelector.setValue( OCO.Side.LEFT );

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            };

            var optionsPanel = armButton.optionsPanel;

            if (type == 'hominoid') addIllustration( optionsPanel, w128_human_arm );
            else if (type == 'plantigrade') addIllustration( optionsPanel, w128_bear_arm );
            else if (type == 'digitigrade') addIllustration( optionsPanel, w128_digitigrade_arm );
            else if (type == 'ungulate') addIllustration( optionsPanel, w128_ungulate_arm );
            else if (type == 'arthropod') addIllustration( optionsPanel, w128_arthropod_arm );

            var armLocationSelector = addNativeLocationSelector( optionsPanel, OCO.Location.FRONT );
            var armSideSelector = addNativeSideSelector( optionsPanel, OCO.Side.LEFT );

            var armShoulderButton = addLimbCheckBox( optionsPanel, i18n._("Shoulder"), DuColor.Color.RAINBOX_RED, false );
            var armArmButton = addLimbCheckBox( optionsPanel, i18n._("Arm"), DuColor.Color.ORANGE, true );
            var armForearmButton = addLimbCheckBox( optionsPanel, i18n._("Forearm"), DuColor.Color.YELLOW, true );
            var armHandButton = addLimbCheckBox( optionsPanel, i18n._("Hand"), DuColor.Color.LIGHT_BLUE, true );

            // Hominoids have no claws: there's no checkbox for them rather than a hidden one taking room.
            var armClawsButton = null;
            if (type != 'hominoid') {
                var clawsName = i18n._("Claws");
                if (type == 'ungulate') clawsName = i18n._("Hoof");
                armClawsButton = addLimbCheckBox( optionsPanel, clawsName, DuColor.Color.LIGHT_PURPLE, false );
            }

            armButton.onClick = createArm;
            armButton.onAltClick = function() { createArm(false, true); };
            armButton.onCtrlClick = function() { createArm(true, false); };
            armButton.onCtrlAltClick = function() { createArm(true, true); };
        }
    }

    function createLegButton( group, type)
    {
        var legButton = group.addButton(
            i18n._("Leg"),
            w16_leg,
            i18n._("Add an armature for a leg") + '\n\n' +
                i18n._("[Ctrl]: Auto-parent the selection to the new bones.\n[Alt]: Assign a random color to the new limb."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        legButton.optionsPopup.build = function ()
        {
            function createLeg(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create leg"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;
                var t = OCO.LimbType.HOMINOID;
                if (type == 'plantigrade') t = OCO.LimbType.PLANTIGRADE;
                if (type == 'digitigrade') t = OCO.LimbType.DIGITIGRADE;
                else if (type == 'ungulate') t = OCO.LimbType.UNGULATE;
                var side = legSideSelector.getValue();
                var location = legLocationSelector.getValue();

                var bones = Duik.Bone.leg(
                    characterName,
                    t,
                    side,
                    legThighButton.value,
                    legCalfButton.value,
                    legFootButton.value,
                    legClawsButton.value,
                    location,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                // Set the side to the other for the next limb
                if (side == OCO.Side.LEFT) legSideSelector.setValue( OCO.Side.RIGHT );
                else if (side == OCO.Side.RIGHT) legSideSelector.setValue( OCO.Side.LEFT );

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            };

            var optionsPanel = legButton.optionsPanel;

            if (type == 'hominoid') addIllustration( optionsPanel, w128_human_leg );
            else if (type == 'plantigrade') addIllustration( optionsPanel, w128_human_leg );
            else if (type == 'digitigrade') addIllustration( optionsPanel, w128_digitigrade_leg );
            else if (type == 'ungulate') addIllustration( optionsPanel, w128_ungulate_leg );

            var legLocationSelector = addNativeLocationSelector( optionsPanel, OCO.Location.BACK );
            var legSideSelector = addNativeSideSelector( optionsPanel, OCO.Side.LEFT );

            var legThighButton = addLimbCheckBox( optionsPanel, i18n._("Thigh"), DuColor.Color.ORANGE, true );
            var legCalfButton = addLimbCheckBox( optionsPanel, i18n._("Calf"), DuColor.Color.YELLOW, true );
            var legFootButton = addLimbCheckBox( optionsPanel, i18n._("Foot"), DuColor.Color.LIGHT_BLUE, true );

            var clawsName = i18n._("Claws");
            if (type == 'hominoid') clawsName = i18n._("Toes");
            else if (type == 'ungulate') clawsName = i18n._("Hoof");
            var legClawsButton = addLimbCheckBox( optionsPanel, clawsName, DuColor.Color.LIGHT_PURPLE, false );

            legButton.onClick = createLeg;
            legButton.onAltClick = function() { createLeg(false, true); };
            legButton.onCtrlClick = function() { createLeg(true, false); };
            legButton.onCtrlAltClick = function() { createLeg(true, true); };
        }
    }

    function createSpineButton( group, numNeck, numSpine, hips )
    {
        numNeck = def(numNeck, 1);
        numSpine = def(numSpine, 3);
        hips = def(hips, true);

        var spineButton = group.addButton(
            i18n._("Spine"),
            w16_spine,
            i18n._("Add an armature for a spine (including the hips and head)") + '\n\n' +
                i18n._("[Ctrl]: Auto-parent the selection to the new bones.\n[Alt]: Assign a random color to the new limb."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        spineButton.optionsPopup.build = function ()
        {
            function createSpine(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create spine"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var neck = parseInt(spineNeckEdit.text);
                if (isNaN(neck)) neck = numNeck;
                var spine = parseInt(spineNumEdit.text);
                if (isNaN(spine)) spine = numSpine;

                var bones = Duik.Bone.spine(
                    characterName,
                    spineHeadButton.value,
                    neck,
                    spine,
                    spineHipsButton.value,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            }

            var optionsPanel = spineButton.optionsPanel;

            addIllustration( optionsPanel, w128_human_spine );

            var spineHeadButton = addLimbCheckBox( optionsPanel, i18n._("Head"), DuColor.Color.LIGHT_BLUE, true );

            var spineNeckEdit = addLayerCountField(
                optionsPanel,
                i18n._("Neck") + ':',
                i18n._("Layers").toLowerCase(),
                numNeck,
                DuColor.Color.YELLOW
            );

            var spineNumEdit = addLayerCountField(
                optionsPanel,
                i18n._("Spine") + ':',
                i18n._("Layers").toLowerCase(),
                numSpine,
                DuColor.Color.ORANGE
            );

            var spineHipsButton = addLimbCheckBox( optionsPanel, i18n._("Hips"), DuColor.Color.RAINBOX_RED, hips );

            spineButton.onClick = createSpine;
            spineButton.onAltClick = function() { createSpine(false, true); };
            spineButton.onCtrlClick = function() { createSpine(true, false); };
            spineButton.onCtrlAltClick = function() { createSpine(true, true); };
        }
    }

    function createHairButton( group )
    {
        var hairButton = group.addButton(
            i18n._("Hair"),
            w16_hair_strand,
            i18n._("Add an armature for a hair strand.") + '\n\n' +
                i18n._("[Ctrl]: Auto-parent the selection to the new bones.\n[Alt]: Assign a random color to the new limb."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        hairButton.optionsPopup.build = function ()
        {
            function createHair(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create hair strand"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var num = parseInt(hairEdit.text);
                if (isNaN(num)) num = 3;

                var bones = Duik.Bone.hair(
                    characterName,
                    num,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();

            }

            var hairEdit = addLayerCountField(
                hairButton.optionsPanel,
                i18n._("Hair:"),
                i18n._("layers"),
                3
            );

            hairButton.onClick = createHair;
            hairButton.onAltClick = function() { createHair(false, true); };
            hairButton.onCtrlClick = function() { createHair(true, false); };
            hairButton.onCtrlAltClick = function() { createHair(true, true); };
        }
    }

    function createTailButton( group )
    {
        var tailButton = group.addButton(
            i18n._("Tail"),
            w16_tail,
            "Add an armature for a tail.",
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        tailButton.optionsPopup.build = function ()
        {
            function createTail(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create tail"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var num = parseInt(tailEdit.text);
                if (isNaN(num)) num = 3;

                var bones = Duik.Bone.tail(
                    characterName,
                    num,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            }

            addIllustration( tailButton.optionsPanel, w128_tail );

            var tailEdit = addLayerCountField(
                tailButton.optionsPanel,
                i18n._("Tail:"),
                i18n._("layers"),
                3
            );

            tailButton.onClick = createTail;
            tailButton.onAltClick = function() { createTail(false, true); };
            tailButton.onCtrlClick = function() { createTail(true, false); };
            tailButton.onCtrlAltClick = function() { createTail(true, true); };
        }
    }

    function createWingButton( group )
    {
        var wingButton = group.addButton(
            i18n._("Wing"),
            w16_wing,
            i18n._("Add an armature for a wing."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        wingButton.optionsPopup.build = function ()
        {
            function createWing(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create wing"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var side = wingSideSelector.getValue();

                var num = parseInt(wingFeathersEdit.text);
                if (isNaN(num)) num = 5;

                var bones = Duik.Bone.wing(
                    characterName,
                    side,
                    wingArmButton.value,
                    wingForearmButton.value,
                    wingHandButton.value,
                    num,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                // Set the side to the other for the next limb
                if (side == OCO.Side.LEFT) wingSideSelector.setValue( OCO.Side.RIGHT );
                else if (side == OCO.Side.RIGHT) wingSideSelector.setValue( OCO.Side.LEFT );

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            };

            var optionsPanel = wingButton.optionsPanel;

            addIllustration( optionsPanel, w128_wing );

            var wingSideSelector = addNativeSideSelector( optionsPanel, OCO.Side.LEFT );

            var wingArmButton = addLimbCheckBox( optionsPanel, i18n._("Arm"), DuColor.Color.ORANGE, true );
            var wingForearmButton = addLimbCheckBox( optionsPanel, i18n._("Forearm"), DuColor.Color.YELLOW, true );
            var wingHandButton = addLimbCheckBox( optionsPanel, i18n._("Hand"), DuColor.Color.LIGHT_BLUE, true );

            var wingFeathersEdit = addLayerCountField(
                optionsPanel,
                i18n._("Feathers:"),
                i18n._("layers"),
                5,
                DuColor.Color.LIGHT_PURPLE
            );

            wingButton.onClick = createWing;
            wingButton.onAltClick = function() { createWing(false, true); };
            wingButton.onCtrlClick = function() { createWing(true, false); };
            wingButton.onCtrlAltClick = function() { createWing(true, true); };
        }
    }

    function createFishSpineButton( group )
    {
        var fishSpineButton = group.addButton(
            i18n._("Fish spine"),
            w16_fish_spine,
            i18n._("Add an armature for the spine of a fish."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        fishSpineButton.optionsPopup.build = function ()
        {
            function createFishSpine(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create fish spine"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var num = parseInt(fishEdit.text);
                if (isNaN(num)) num = 3;

                var bones =Duik.Bone.fishSpine(
                    characterName,
                    fishHeadButton.value,
                    num,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            };

            var fishHeadButton = addLimbCheckBox( fishSpineButton.optionsPanel, i18n._("Head"), DuColor.Color.LIGHT_BLUE, true );

            var fishEdit = addLayerCountField(
                fishSpineButton.optionsPanel,
                i18n._("Spine:"),
                i18n._("layers"),
                3
            );

            fishSpineButton.onClick = createFishSpine;
            fishSpineButton.onAltClick = function() { createFishSpine(false, true); };
            fishSpineButton.onCtrlClick = function() { createFishSpine(true, false); };
            fishSpineButton.onCtrlAltClick = function() { createFishSpine(true, true); };
        };
    }

    function createFinButton( group )
    {
        var finButton = group.addButton(
            i18n._("Fin"),
            w16_fin,
            i18n._("Add an armature for a fin."),
            true, // Options
            undefined, // optionsWithoutButton
            i18n._("Create") // optionsButtonText
        );

        finButton.optionsPopup.build = function ()
        {
            function createFin(forceLink, randomColor) {
                forceLink = def(forceLink, false);
                randomColor = def(randomColor, false);

                DuAE.beginUndoGroup( i18n._("Create fin"));

                DuScriptUI.progressBar.reset();
                DuScriptUI.progressBar.show();

                // Get options
                var characterName = nameEdit.text;

                var num = parseInt(finEdit.text);
                if (isNaN(num)) num = 5;

                var bones = Duik.Bone.fin(
                    characterName,
                    OCO.Side.NONE,
                    num,
                    forceLink
                );

                // Set the color
                if (randomColor) {
                    Duik.Bone.setColor( DuColor.random(), bones );
                };

                DuScriptUI.progressBar.close();

                DuAE.endUndoGroup();
            };

            addIllustration( finButton.optionsPanel, w128_fin );

            var finEdit = addLayerCountField(
                finButton.optionsPanel,
                i18n._("Fishbones:"),
                i18n._("layers"),
                5
            );

            finButton.onClick = createFin;
            finButton.onAltClick = function() { createFin(false, true); };
            finButton.onCtrlClick = function() { createFin(true, false); };
            finButton.onCtrlAltClick = function() { createFin(true, true); };
        }
    }

    // A grid with a row per button, like the Links and constraints panel: its options and image, then the button.
    var line1 = addNativeButtonGrid(bonesGroup);
    line1.buttonHeight = 24;

    var hominoidGroup = addNativeMenuButton(
        line1,
        i18n._("Hominoid"),
        w16_hominoid,
        i18n._("Create limbs for an hominoid (Humans and apes).")
    );
    hominoidGroup.build = function()
    {
        createArmButton( this, 'hominoid' );
        createLegButton( this, 'hominoid' );
        createSpineButton( this, 1, 3 );
        createHairButton( this );
    }

    var plantigradeGroup = addNativeMenuButton(
        line1,
        i18n._("Plantigrade"),
        w16_bunny,
        i18n._("Create limbs for a plantigrade (primates, bears, rabbits...).")
    );
    plantigradeGroup.build = function()
    {
        createArmButton( this, 'plantigrade' );
        createLegButton( this, 'plantigrade' );
        createSpineButton( this, 1, 3 );
        createTailButton( this );
        createHairButton( this );
    }

    var digitigradeGroup = addNativeMenuButton(
        line1,
        i18n._("Digitigrade"),
        w16_cat,
        i18n._("Create limbs for a digitigrade (dogs, cats, dinosaurs...).")
    );
    digitigradeGroup.build = function()
    {
        createArmButton( this, 'digitigrade' );
        createLegButton( this, 'digitigrade' );
        createSpineButton( this, 2, 3 );
        createTailButton( this );
        createHairButton( this );
    }

    var ungulateGroup = addNativeMenuButton(
        line1,
        i18n._("Ungulate"),
        w16_horse,
        i18n._("Create limbs for an ungulate (horses, cattle, giraffes, pigs, deers, camels, hippopotamuses...).")
    );
    ungulateGroup.build = function()
    {
        createArmButton( this, 'ungulate' );
        createLegButton( this, 'ungulate' );
        createSpineButton( this, 2, 3 );
        createTailButton( this );
        createHairButton( this );
    }

    var arthropodGroup = addNativeMenuButton(
        line1,
        i18n._("Arthropod"),
        w16_ant,
        i18n._("Create limbs for an arthropod (insects, spiders, scorpions, crabs, shrimps...)")
    );
    arthropodGroup.build = function()
    {
        createArmButton( this, 'arthropod' );
        createSpineButton( this, 0, 1, false );
        createTailButton( this );
    }

    // The same grid as the buttons above, so that the columns line up.
    var line2 = line1;

    var birdGroup = addNativeMenuButton(
        line2,
        i18n._("Bird"),
        w16_bird,
        i18n._("Create limbs for a cute flying beast.")
    );
    birdGroup.build = function()
    {
        createLegButton( this, 'digitigrade' );
        createSpineButton( this, 1, 1 );
        createWingButton( this );
        createTailButton( this );
    }

    var fishGroup = addNativeMenuButton(
        line2,
        i18n._("Fish"),
        w16_fish,
        i18n._("Create limbs for weird swimming beasts.")
    );
    fishGroup.build = function()
    {
        createFishSpineButton( this );
        createFinButton( this );
    }

    // Snake deactivated for now, still needs work
    /*var snakeButton = addNativeButton(
        line2,
        i18n._("Snake"),
        w16_snake_spine,
        "Add an armature for a snake / worm with a head.",
        {
            options: true,
            optionsButtonText: i18n._("Create")
        }
    );
    snakeButton.optionsPopup.build = function ()
    {
        addIllustration( snakeButton.optionsPanel, w128_snake_spine );

        var snakeHeadButton = addLimbCheckBox( snakeButton.optionsPanel, i18n._("Head"), DuColor.Color.LIGHT_BLUE, true );

        var snakeEdit = addLayerCountField(
            snakeButton.optionsPanel,
            i18n._("Spine") + ':',
            i18n._("Layers").toLowerCase(),
            5
        );

        snakeButton.onClick = function()
        {
            // Get options
            var characterName = nameEdit.text;

            var num = parseInt(snakeEdit.text);
            if (isNaN(num)) num = 5;

            Duik.Bone.snakeSpine(
                characterName,
                snakeHeadButton.value,
                num
            );
        };
    }//*/

    var customButton = addNativeButton(
        line2,
        i18n._("Custom"),
        w16_custom,
        i18n._("Add a custom armature.")+
        "\n\n"+
        i18n._("[Ctrl]: Automatically parent the selected items (layers, path vertices or puppet pins) to the new bones."),
        {
            options: true,
            optionsButtonText: i18n._("Create")
        }
    );
    customButton.optionsPopup.build = function ()
    {
        function createCustom(forceLink, randomColor) {
            forceLink = def(forceLink, false);
            randomColor = def(randomColor, false);

            DuAE.beginUndoGroup( i18n._("Create custom armature"));

            DuScriptUI.progressBar.reset();
            DuScriptUI.progressBar.show();

            // Get options
            var num = parseInt( numCustomEdit.text );
            if (isNaN(num)) num = 2;
            if (num < 1) num = 1;

            var name = customNameEdit.text;
            var characterName = nameEdit.text;
            var side = customSideSelector.getValue();
            var location = customLocationSelector.getValue();

            var bones = Duik.Bone.customLimb(num, name, characterName, side, location, forceLink);

            // Set the color
            if (randomColor) {
                Duik.Bone.setColor( DuColor.random(), bones );
            };

            DuScriptUI.progressBar.close();

            DuAE.endUndoGroup();
        };

        var optionsPanel = customButton.optionsPanel;

        var customLocationSelector = addNativeLocationSelector( optionsPanel );
        var customSideSelector = addNativeSideSelector( optionsPanel );

        var numCustomEdit = addLayerCountField(
            optionsPanel,
            i18n._("Number of bones:"),
            undefined,
            2
        );

        // Native fields have no place holder, so the name has a label instead.
        var customNameGroup = addNativeGroup( optionsPanel, 'row' );
        customNameGroup.alignment = ['fill', 'top'];
        customNameGroup.add('statictext', undefined, i18n._("Limb name") + ':');
        var customNameEdit = customNameGroup.add('edittext', undefined, '');
        customNameEdit.alignment = ['fill', 'center'];
        customNameEdit.characters = 12;

        customButton.onClick = createCustom;
        customButton.onAltClick = function() { createCustom(false, true); };
        customButton.onCtrlClick = function() { createCustom(true, false); };
        customButton.onCtrlAltClick = function() { createCustom(true, true); };
    }

    // Auto-Rig

    addNativeSeparator(bonesGroup);

    // Its own grid, after the separator, the same size as the one above.
    var autorigLine = addNativeButtonGrid(bonesGroup);
    autorigLine.buttonHeight = 24;

    addNativeAutorigButton(autorigLine);

    // Edit Group
    var editGroup = addNativeGroup(mainGroup, 'column');
    editGroup.visible = false;
    editGroup.built = false;

    function showBoneSettings() {
        if (!editGroup.built) {
            buildNativeBoneSettingsGroup(editGroup, bonesGroup);
        }

        editGroup.refresh();
        bonesGroup.visible = false;
        editGroup.visible = true;
    }

    // The native version of the bone settings: the type of the bones to create,
    // and the appearance of the selected ones, set like the controller settings.
    function buildNativeBoneSettingsGroup( editGroup, mainGroup ) {
        function setSide()
        {
            Duik.Bone.setSide(sideEditSelector.getValue());
        }

        function setLocation()
        {
            Duik.Bone.setLocation(locationEditSelector.getValue());
        }

        function setColor( allRandom )
        {
            var color = colorEditSelector.color;
            if (allRandom) color = null;
            Duik.Bone.setColor(color);
        }

        function setSize()
        {
            var size = parseInt( sizeEdit.text );
            if (isNaN(size)) return;
            Duik.Bone.setSize(size);
        }

        function setOpacity()
        {
            var opacity = parseInt( opacityEdit.text );
            if (isNaN(opacity)) return;
            Duik.Bone.setOpacity(opacity);
        }

        function setCharacterName()
        {
            Duik.Bone.setCharacterName( characterEdit.text );
        }

        function setLimbName()
        {
            Duik.Bone.setLimbName( limbEdit.text );
        }

        function setEnvelopEnabled()
        {
            Duik.Bone.setEnvelopEnabled( envelopBox.value );
        }

        function setNoodleEnabled()
        {
            Duik.Bone.setNoodleEnabled( noodleBox.value );
        }

        function setEnvelopOpacity()
        {
            var opacity = parseInt( envelopOpacityEdit.text );
            if (isNaN(opacity)) return;
            Duik.Bone.setEnvelopOpacity( opacity );
        }

        function setEnvelopColor()
        {
            Duik.Bone.setEnvelopColor( envelopColorSelector.color );
        }

        function setEnvelopStrokeSize()
        {
            var size = parseInt( envelopStrokeSizeEdit.text );
            if (isNaN(size)) return;
            Duik.Bone.setEnvelopStrokeSize( size );
        }

        function setEnvelopStrokeColor()
        {
            Duik.Bone.setEnvelopStrokeColor( envelopStrokeColorSelector.color );
        }

        function setNoodleColor()
        {
            Duik.Bone.setNoodleColor( noodleColorSelector.color );
        }

        // Applies the checked settings; allRandom assigns a random color to each bone.
        function apply( allRandom )
        {
            DuAE.beginUndoGroup(i18n._("Edit bones"));
            if (sideEditGroup.checked) setSide();
            if (locationEditGroup.checked) setLocation();
            if (colorEditGroup.checked) setColor(allRandom);
            if (sizeEditGroup.checked) setSize();
            if (opacityEditGroup.checked) setOpacity();
            if (characterEditGroup.checked) setCharacterName();
            if (limbEditGroup.checked) setLimbName();
            if (envelopBoxGroup.checked) setEnvelopEnabled();
            if (noodleBoxGroup.checked) setNoodleEnabled();
            if (envelopOpacityGroup.checked) setEnvelopOpacity();
            if (envelopColorGroup.checked) setEnvelopColor();
            if (envelopStrokeSizeGroup.checked) setEnvelopStrokeSize();
            if (envelopStrokeColorGroup.checked) setEnvelopStrokeColor();
            if (noodleColorGroup.checked) setNoodleColor();
            DuAE.endUndoGroup();
        }

        // Some of the colors of the envelops and noodles can't always be read, and come back as 0.
        function showColor( selector, color )
        {
            if (color instanceof DuColor) selector.setColor( color );
        }

        addNativeSubPanel(
            editGroup,
            i18n._("Bone settings"),
            mainGroup,
            false
        );

        addNativeBoneTypeSelector(editGroup);

        var selectionSection = addNativeSection( editGroup, i18n._("Current Selection") );

        var sideEditGroup = addNativeSetting(selectionSection, i18n._("Side"));
        var sideEditSelector = addNativeSideSelector(sideEditGroup);

        var locationEditGroup = addNativeSetting(selectionSection, i18n._("Location"));
        var locationEditSelector = addNativeLocationSelector(locationEditGroup);

        addNativeSeparator(selectionSection);

        var colorEditGroup = addNativeSetting(selectionSection, i18n._("Color"));
        var colorEditSelector = addNativeColorSelector(colorEditGroup, i18n._("Set the color of the selected layers."));

        var sizeEditGroup = addNativeSetting(selectionSection, i18n._("Size"));
        var sizeEdit = addNativeEditText(
            sizeEditGroup,
            "100",
            " %",
            i18n._("Change the size of the layer.")
        );

        var opacityEditGroup = addNativeSetting(selectionSection, i18n._("Opacity"));
        var opacityEdit = addNativeEditText(
            opacityEditGroup,
            "100",
            " %",
            i18n._("Change the opacity of the bones.")
        );

        addNativeSeparator(selectionSection);

        var characterEditGroup = addNativeSetting(selectionSection, i18n._("Group name"));
        var characterEdit = addNativeEditText(
            characterEditGroup,
            '',
            undefined,
            i18n._("Choose the name of the character.")
        );

        var limbEditGroup = addNativeSetting(selectionSection, i18n._("Name"));
        var limbEdit = addNativeEditText(
            limbEditGroup,
            '',
            undefined,
            i18n._("Change the name of the limb this layer belongs to")
        );

        addNativeSeparator(selectionSection);

        var envelopBoxGroup = addNativeSetting(selectionSection, i18n._("Envelop"));
        var envelopBox = addNativeCheckBox(
            envelopBoxGroup,
            i18n._("Enabled"),
            null,
            i18n._("Toggle the envelops of the selected bones")
        );

        var envelopOpacityGroup = addNativeSetting(selectionSection, i18n._("Envelop opacity"));
        var envelopOpacityEdit = addNativeEditText(
            envelopOpacityGroup,
            "50",
            " %",
            i18n._("Change the opacity of the envelop.")
        );

        var envelopColorGroup = addNativeSetting(selectionSection, i18n._("Envelop color"));
        var envelopColorSelector = addNativeColorSelector(envelopColorGroup, i18n._("Set the color of the selected envelops."));

        var envelopStrokeSizeGroup = addNativeSetting(selectionSection, i18n._("Envelop stroke size"));
        var envelopStrokeSizeEdit = addNativeEditText(
            envelopStrokeSizeGroup,
            "4",
            " px",
            i18n._("Change the size of the envelop stroke.")
        );

        var envelopStrokeColorGroup = addNativeSetting(selectionSection, i18n._("Envelop stroke color"));
        var envelopStrokeColorSelector = addNativeColorSelector(envelopStrokeColorGroup, i18n._("Set the color of the selected envelops strokes."));

        addNativeSeparator(selectionSection);

        var noodleBoxGroup = addNativeSetting(selectionSection, i18n._("Noodle"));
        var noodleBox = addNativeCheckBox(
            noodleBoxGroup,
            i18n._("Enabled"),
            null,
            i18n._("Toggle the noodles of the selected bones")
        );

        var noodleColorGroup = addNativeSetting(selectionSection, i18n._("Noodle color"));
        var noodleColorSelector = addNativeColorSelector(noodleColorGroup, i18n._("Set the color of the selected noodles."));

        addNativeSeparator(editGroup);

        var applyGroup = addNativeGroup( editGroup, 'row' );
        applyGroup.alignment = ['fill', 'top'];

        var pickButton = addNativeButton(
            applyGroup,
            i18n._("Pick selected layer"),
            DuScriptUI.Icon.EYE_DROPPER
        );

        // Valid button
        var applyEditButton = addNativeButton(
            applyGroup,
            i18n._("Apply"),
            DuScriptUI.Icon.CHECK,
            i18n._("Apply changes.\n\n[Alt]: assigns a random color to each bone.")
        );
        applyEditButton.onClick = function() { apply(false); };
        applyEditButton.onAltClick = function() { apply(true); };

        editGroup.refresh = function ()
        {
            sideEditSelector.setValue( Duik.Layer.side() );

            locationEditSelector.setValue( Duik.Layer.location() );

            showColor( colorEditSelector, Duik.Bone.color( ) );

            sizeEdit.text = Duik.Bone.size();

            opacityEdit.text = Duik.Bone.opacity();

            characterEdit.text = Duik.Layer.groupName();

            limbEdit.text = Duik.Layer.name();

            envelopBox.value = !!Duik.Bone.hasEnvelop();

            envelopOpacityEdit.text = Duik.Bone.envelopOpacity();

            showColor( envelopColorSelector, Duik.Bone.envelopColor() );

            envelopStrokeSizeEdit.text = Duik.Bone.envelopStrokeSize();

            showColor( envelopStrokeColorSelector, Duik.Bone.envelopStrokeColor() );

            noodleBox.value = !!Duik.Bone.hasNoodle();

            showColor( noodleColorSelector, Duik.Bone.noodleColor() );
        }

        pickButton.onClick = editGroup.refresh;

        nativeLayout(editGroup);
    }
}
