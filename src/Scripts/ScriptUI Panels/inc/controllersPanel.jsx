function buildControllersUI(tab, standAlone)
{
    standAlone = def(standAlone, false);

    if (!standAlone) {
        // A Spacer
        var spacer = tab.add('group');
        spacer.margins = 0;
        spacer.spacing = 0;
        spacer.size = [-1,3];

        // A title
        tab.add('statictext', undefined, i18n._("Controllers")).alignment = ['center', 'top'];
    }

    // The panel is a row, like the Links and constraints panel: the tool bar on the left,
    // then the buttons and the controller settings they open.
    var contentGroup = addNativeGroup(tab, 'row');
    contentGroup.alignment = ['fill', 'fill'];
    contentGroup.alignChildren = ['fill', 'fill'];
    // Room on each side of the separator, so the tool bar and the buttons don't hug it.
    contentGroup.spacing = 8;

    // tools: two per row, down the left of the panel
    var toolsGroup = addNativeToolBar(contentGroup, 2, 32, 32);
    toolsGroup.alignment = ['left', 'top'];

    var selectButton = toolsGroup.addButton(
        i18n._("Select controllers"),
        w12_select,
        i18n._("Select all controllers")
    );
    selectButton.onClick = Duik.Controller.select;

    var showButton = toolsGroup.addButton(
        i18n._("Show/hide ctrls"),
        w12_show,
        i18n._("Show/Hide controllers\n\n[Alt]: Only the unselected controllers.")
    );
    showButton.onClick = Duik.Controller.toggleVisibility;
    showButton.onAltClick = function( ) { Duik.Controller.toggleVisibility(undefined, true); };

    var tagButton = toolsGroup.addButton(
        i18n._("Tag as ctrls"),
        w12_tag,
        i18n._("Tag as controllers")
    );
    tagButton.onClick = Duik.Controller.tag;

    var bakeButton = toolsGroup.addButton(
        i18n._("Bake controllers"),
        w12_bake,
        i18n._("Bake controllers appearance")
    );
    bakeButton.onClick = Duik.Controller.bake;

    var editButton = toolsGroup.addButton(
        i18n._("Controller settings"),
        DuScriptUI.Icon.SETTINGS,
        i18n._("Edit selected controllers.")
    );
    editButton.onClick = function() { showControllerSettings(); };

    var spreadsheetButton = toolsGroup.addButton(
        i18n._("Path Spreadsheet"),
        w12_blender_icon_spreadsheet,
        i18n._("Show the geometry of the selected paths in a spreadsheet, like Blender's Spreadsheet editor: their control points, splines, and the feather points of masks.") + "\n\n" +
            i18n._("[Alt]: Launches the corresponding ScriptUI Stand-Alone panel if it is installed.")
    );
    spreadsheetButton.onClick = function() { showPathSpreadsheet(); };
    spreadsheetButton.onAltClick = function() { DuAE.openScriptUIPanel( "Duik Path Spreadsheet.jsx" ); };

    // Between the tool bar and the buttons.
    addNativeSeparator(contentGroup, 'vertical');

    var mainGroup = addNativeGroup(contentGroup, 'stack');
    mainGroup.alignment = ['fill', 'fill'];

    var controllersGroup = addNativeGroup(mainGroup, 'column');

    // The controller shapes, five per row, showing their image like the tool bar does.
    // The same size as the tool bar, so that their rows line up.
    var ctrlGrid = addNativeToolBar(controllersGroup, 5, 32, 32);

    function addCtrlButton( icon, helpTip, type ) {
        return addNativeCtrlButton( ctrlGrid, icon, helpTip, type );
    }

    var rotateButton = addCtrlButton(
        w16_rotate,
        i18n._("Create a rotation controller."),
        Duik.Controller.Type.ROTATION
        );
    var moveHButton = addCtrlButton(
        w16_move_h,
        i18n._("Create a horizontal translation controller."),
        Duik.Controller.Type.X_POSITION
        );
    var moveVButton = addCtrlButton(
        w16_move_v,
        i18n._("Create a vertical translation controller."),
        Duik.Controller.Type.Y_POSITION
        );
    var moveButton = addCtrlButton(
        w16_move,
        i18n._("Create a translation controller."),
        Duik.Controller.Type.POSITION
        );
    var moveRotateButton = addCtrlButton(
        w16_move_rotate,
        i18n._("Create a translation and rotation controller."),
        Duik.Controller.Type.TRANSFORM
        );

    var cameraButton = addCtrlButton(
        w16_camera,
        i18n._("Create a camera controller."),
        Duik.Controller.Type.CAMERA
        );
    var sliderButton = addCtrlButton(
        w16_slider,
        i18n._("Creates a slider controller."),
        Duik.Controller.Type.SLIDER
        );
    var slider2DButton = addCtrlButton(
        w16_2d_slider,
        i18n._("Create a 2D slider controller."),
        Duik.Controller.Type.DOUBLE_SLIDER
        );
    var angleButton = addCtrlButton(
        w16_angle,
        i18n._("Create an angle controller."),
        Duik.Controller.Type.ANGLE
        );
    var eyebrowButton = addCtrlButton(
        w16_eyebrow,
        i18n._("Create an eyebrow controller."),
        Duik.Controller.Type.EYEBROW
        );

    var earButton = addCtrlButton(
        w16_ear,
        i18n._("Creates an ear controller."),
        Duik.Controller.Type.EAR
        );
    var hairButton = addCtrlButton(
        w16_hair,
        i18n._("Create a hair controller."),
        Duik.Controller.Type.HAIR
        );
    var mouthButton = addCtrlButton(
        w16_mouth,
        i18n._("Create a mouth controller."),
        Duik.Controller.Type.MOUTH
        );
    var noseButton = addCtrlButton(
        w16_nose,
        i18n._("Create a nose controller."),
        Duik.Controller.Type.NOSE
        );
    var eyeButton = addCtrlButton(
        w16_eye,
        i18n._("Create an eye controller."),
        Duik.Controller.Type.EYE
        );

    var headButton = addCtrlButton(
        w16_head,
        i18n._("Create a head controller."),
        Duik.Controller.Type.HEAD
        );
    var footButton = addCtrlButton(
        w16_foot,
        i18n._("Create a foot controller."),
        Duik.Controller.Type.FOOT
        );
    var pawButton = addCtrlButton(
        w16_digitigrade,
        i18n._("Create a paw controller."),
        Duik.Controller.Type.CLAWS
        );
    var hoofButton = addCtrlButton(
        w16_ungulate,
        i18n._("Create a hoof controller."),
        Duik.Controller.Type.HOOF
        );
    var handButton = addCtrlButton(
        w16_controller,
        i18n._("Create a hand controller."),
        Duik.Controller.Type.HAND
        );

    var hipsButton = addCtrlButton(
        w16_hips,
        i18n._("Create a hips controller."),
        Duik.Controller.Type.HIPS
        );
    var bodyButto = addCtrlButton(
        w16_body,
        i18n._("Create a body controller."),
        Duik.Controller.Type.BODY
        );
    var shouldersButton = addCtrlButton(
        w16_shoulders,
        i18n._("Create a neck and shoulders controller."),
        Duik.Controller.Type.SHOULDERS
        );
    var torsoButton = addCtrlButton(
        w16_torso,
        i18n._("Create a torso controller."),
        Duik.Controller.Type.TORSO
        );
    var vertebraeButton = addCtrlButton(
        w16_vertebrae,
        i18n._("Create a vertebrae (neck or spine) controller."),
        Duik.Controller.Type.VERTEBRAE
        );

    var finButton = addCtrlButton(
        w16_fin,
        i18n._("Create a fin controller."),
        Duik.Controller.Type.FIN
        );
    var wingButton = addCtrlButton(
        w16_wing,
        i18n._("Create a wing controller."),
        Duik.Controller.Type.WING
        );
    var pincerButton = addCtrlButton(
        w16_arthropod,
        i18n._("Create a pincer controller."),
        Duik.Controller.Type.PINCER
        );
    var tailButton = addCtrlButton(
        w16_tail_ctrl,
        i18n._("Create a tail controller."),
        Duik.Controller.Type.TAIL
        );
    var hairStrandButton = addCtrlButton(
        w16_hair_strand,
        i18n._("Create a hair strand controller."),
        Duik.Controller.Type.PONEYTAIL
        );

    var audioButton = addCtrlButton(
        w16_audio,
        i18n._("Create an audio controller."),
        Duik.Controller.Type.AUDIO
        );
    var nullButton = addCtrlButton(
        w16_null,
        i18n._("Create a null controller."),
        Duik.Controller.Type.NULL
        );
    var aeNullButton = addCtrlButton(
        w16_ae_null,
        i18n._("Create an After Effects null controller."),
        Duik.Controller.Type.AE_NULL
        );
    var bezierPointButton = addCtrlButton(
        w16_blender_icon_handle_aligned,
        i18n._("Create a Bezier point controller: a point and its two handles, each handle parented to the point through a zero."),
        Duik.Controller.Type.BEZIER_POINT
        );

    // Tools

    addNativeSeparator(controllersGroup);

    // A grid with a row per button, like the Links and constraints panel: its options and image, then the button.
    var buttonsGrid = addNativeButtonGrid(controllersGroup);
    buttonsGrid.buttonHeight = 24;

    // Pseudo Effects
    var fxButton = addNativeMenuButton(
        buttonsGrid,
        i18n._("Pseudo-effects"),
        w16_fx,
        i18n._("Create pre-rigged pseudo-effects.")
    );
    fxButton.build = function()
    {
        var fxEyesButton = this.addButton(
            i18n._("Eyes"),
            w16_eye,
            i18n._("Create a pre-rigged pseudo-effect to control eyes.")
        );
        fxEyesButton.onClick = function () {
            Duik.Controller.pseudoEffect( Duik.Controller.PseudoEffect.EYES );
        }
        var fxFingersButton = this.addButton(
            i18n._("Fingers"),
            w16_fingers,
            i18n._("Create a pre-rigged pseudo-effect to control fingers.")
        );
        fxFingersButton.onClick = function () {
            Duik.Controller.pseudoEffect( Duik.Controller.PseudoEffect.FINGERS );
        }
        var fxHandButton = this.addButton(
            i18n._("Hand"),
            w16_controller,
            i18n._("Create a pre-rigged pseudo-effect to control a hand and its fingers.")
        );
        fxHandButton.onClick = function () {
            Duik.Controller.pseudoEffect( Duik.Controller.PseudoEffect.HAND );
        }
        var fxHeadButton = this.addButton(
            i18n._("Head"),
            w16_head,
            i18n._("Create a pre-rigged pseudo-effect to control a head.")
        );
        fxHeadButton.onClick = function () {
            Duik.Controller.pseudoEffect( Duik.Controller.PseudoEffect.HEAD );
        }
    }

    var extractButton = addNativeButton(
        buttonsGrid,
        i18n._("Extract"),
        w16_extract,
        i18n._("Extract the controllers from the selected precomposition, to animate from outside the composition."),
        { options: true }
    );
    extractButton.optionsPopup.build = function ()
    {
        // Essential properties need After Effects 17.
        var extractModeSelector = addNativeDropdown(extractButton.optionsPanel, [
            [i18n._("Use expressions"), w16_expression],
            [i18n._("Use essential properties"), w16_essential_property]
        ], DuAE.version.version < 17.0 ? 0 : DuESF.scriptSettings.get("ctrls/useEssentialProperties", 1));
        extractModeSelector.onChange = function() {
            DuESF.scriptSettings.set("ctrls/useEssentialProperties", extractModeSelector.selection.index);
            DuESF.scriptSettings.save();
        }

        var extractBakeButton = addNativeCheckBox(
            extractButton.optionsPanel,
            i18n._("Bake controllers"),
            w16_bake,
            '',
            DuESF.scriptSettings.get("ctrls/bakeOnExtract", true)
        );
        extractBakeButton.onClick = function() {
            DuESF.scriptSettings.set("ctrls/bakeOnExtract", extractBakeButton.value);
            DuESF.scriptSettings.save();
        }

        extractButton.onClick = function() {
            var useEP = extractModeSelector.selection.index == 1;
            var bake = extractBakeButton.value;

            Duik.Controller.extract( undefined, useEP, bake);
        }
    }

    // Edit Group
    var editGroup = addNativeGroup(mainGroup, 'column');
    editGroup.visible = false;
    editGroup.built = false;

    function showControllerSettings() {
        if (!editGroup.built) {
            buildNativeControllerSettingsGroup(editGroup, controllersGroup);
        }

        controllersGroup.visible = false;
        spreadsheetGroup.visible = false;
        editGroup.visible = true;
    }

    // The path spreadsheet, shared with its own dockable panel, Duik Path Spreadsheet.jsx.
    #include "pathSpreadsheetPanel.jsx"
    var spreadsheetGroup = addNativeGroup(mainGroup, 'column');
    spreadsheetGroup.visible = false;
    spreadsheetGroup.built = false;
    var pathSpreadsheet;

    function showPathSpreadsheet() {
        if (!spreadsheetGroup.built) {
            var titleBar = addNativeSubPanel(
                spreadsheetGroup,
                i18n._("Path Spreadsheet"),
                controllersGroup,
                false
            );

            pathSpreadsheet = buildPathSpreadsheetUI(spreadsheetGroup, titleBar);

            nativeLayout(spreadsheetGroup);
        }

        controllersGroup.visible = false;
        editGroup.visible = false;
        spreadsheetGroup.visible = true;
        pathSpreadsheet.refresh();
    }

    // The native version of the controller settings: the type of the controllers to create,
    // and the appearance of the selected ones, set like the options of the pins.
    function buildNativeControllerSettingsGroup( editGroup, mainGroup ) {
        function setSide()
        {
            Duik.Controller.setSide(sideEditSelector.getValue());
        }

        function setLocation()
        {
            Duik.Controller.setLocation(locationEditSelector.getValue());
        }

        function setColor( allRandom )
        {
            var color = colorEditSelector.color;
            if (allRandom) color = null;
            Duik.Controller.setColor(color);
        }

        function setSize()
        {
            var size = parseInt( sizeEdit.text );
            if (isNaN(size)) return;
            Duik.Controller.setSize(size);
        }

        function setOpacity()
        {
            var opacity = parseInt( opacityEdit.text );
            if (isNaN(opacity)) return;
            Duik.Controller.setOpacity(opacity);
        }

        function setAColor( allRandom ) {
            var color = colorAEditSelector.color;
            if (allRandom) color = null;
            Duik.Controller.setAnchorColor(color);
        }

        function setASize() {
            var size = parseInt( sizeAEdit.text );
            if (isNaN(size)) return;
            Duik.Controller.setAnchorSize(size);
        }

        function setAOpacity() {
            var opacity = parseInt( opacityAEdit.text );
            if (isNaN(opacity)) return;
            Duik.Controller.setAnchorOpacity(opacity);
        }

        function setCharacterName()
        {
            Duik.Controller.setCharacterName( characterEdit.text );
        }

        function setLimbName()
        {
            Duik.Controller.setLimbName( limbEdit.text );
        }

        // Applies the checked settings; allRandom assigns a random color to each controller.
        function apply( allRandom )
        {
            DuAE.beginUndoGroup(i18n._("Edit Controllers"));
            if (sideEditGroup.checked) setSide();
            if (locationEditGroup.checked) setLocation();
            if (colorEditGroup.checked) setColor(allRandom);
            if (sizeEditGroup.checked) setSize();
            if (opacityEditGroup.checked) setOpacity();
            if (colorAEditGroup.checked) setAColor(allRandom);
            if (sizeAEditGroup.checked) setASize();
            if (opacityAEditGroup.checked) setAOpacity();
            if (characterEditGroup.checked) setCharacterName();
            if (limbEditGroup.checked) setLimbName();
            DuAE.endUndoGroup();
        }

        addNativeSubPanel(
            editGroup,
            i18n._("Controller settings"),
            mainGroup,
            false
        );

        var ctrlTypeSelector = addNativeDropdown(editGroup, [
            [i18n._("Use AE Null Objects"), w16_ae_null],
            [i18n._("Use Shape Layers"), w16_controller],
            [i18n._("Use Shape Layers (Draft mode)"), w16_controller_draft],
            [i18n._("Use Raster Layers (PNG)"), w16_controller_raster]
        ], OCO.config.get('after effects/controller layer type', 1));
        ctrlTypeSelector.onChange = function() {
            OCO.config.set('after effects/controller layer type', ctrlTypeSelector.selection.index);
        };

        var scaleButton = addNativeCheckBox(
            editGroup,
            i18n._("Don't lock scale of null controllers."),
            null,
            i18n._("The scale of null controllers, and After Effects nulls as controllers created by Duik won't be locked by default."),
            !DuESF.scriptSettings.get('controllers/lockNullScale', true)
        );
        scaleButton.onClick = function() {
            DuESF.scriptSettings.set('controllers/lockNullScale', !scaleButton.value);
            DuESF.scriptSettings.save();
        }

        var selectionSection = addNativeSection( editGroup, i18n._("Current Selection") );

        var sideEditGroup = addNativeSetting(selectionSection, i18n._("Side"));
        var sideEditSelector = addNativeSideSelector(sideEditGroup);

        var locationEditGroup = addNativeSetting(selectionSection, i18n._("Location"));
        var locationEditSelector = addNativeLocationSelector(locationEditGroup);

        addNativeSeparator(selectionSection);

        var colorEditGroup = addNativeSetting(selectionSection, i18n._("Icon color"));
        var colorEditSelector = addNativeColorSelector(colorEditGroup, i18n._("Set the color of the selected controllers.\n\n[Alt]: assigns a random color for each controller."));

        var sizeEditGroup = addNativeSetting(selectionSection, i18n._("Icon size"));
        var sizeEdit = addNativeEditText(
            sizeEditGroup,
            "100",
            " %",
            i18n._("Change the size of the controller.")
        );

        var opacityEditGroup = addNativeSetting(selectionSection, i18n._("Icon opacity"));
        var opacityEdit = addNativeEditText(
            opacityEditGroup,
            "100",
            " %",
            i18n._("Change the opacity of the controllers.")
        );

        addNativeSeparator(selectionSection);

        var colorAEditGroup = addNativeSetting(selectionSection, i18n._("Anchor color"));
        var colorAEditSelector = addNativeColorSelector(colorAEditGroup, i18n._("Set the color of the selected anchors.\n\n[Alt]: assigns a random color for each anchor."));

        var sizeAEditGroup = addNativeSetting(selectionSection, i18n._("Anchor size"));
        var sizeAEdit = addNativeEditText(
            sizeAEditGroup,
            "100",
            " %",
            i18n._("Change the size of the anchor.")
        );

        var opacityAEditGroup = addNativeSetting(selectionSection, i18n._("Anchor opacity"));
        var opacityAEdit = addNativeEditText(
            opacityAEditGroup,
            "100",
            " %",
            i18n._("Change the opacity of the anchors.")
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
            i18n._("Apply changes.\n\n[Alt]: assigns a random color to each layer.")
        );
        applyEditButton.onClick = function() { apply(false); };
        applyEditButton.onAltClick = function() { apply(true); };

        editGroup.refresh = function ()
        {
            sideEditSelector.setValue( Duik.Layer.side() );

            locationEditSelector.setValue( Duik.Layer.location() );

            colorEditSelector.setColor( Duik.Controller.color( ) );

            sizeEdit.text = Duik.Controller.size();

            opacityEdit.text = Duik.Controller.opacity();

            colorAEditSelector.setColor( Duik.Controller.anchorColor( ) );

            sizeAEdit.text = Duik.Controller.anchorSize();

            opacityAEdit.text = Duik.Controller.anchorOpacity();

            characterEdit.text = Duik.Layer.groupName();

            limbEdit.text = Duik.Layer.name();
        };

        pickButton.onClick = editGroup.refresh;

        nativeLayout(editGroup);
    }
}
