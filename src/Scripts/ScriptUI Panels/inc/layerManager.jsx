function buildLayerManagerUI( tab )
{
    tab = def(tab, this);

    // The panel is a row, like the Links and constraints panel: the tool bar creating layers on the left,
    // then the settings of the selected layers.
    var contentGroup = addNativeGroup(tab, 'row');
    contentGroup.alignment = ['fill', 'fill'];
    contentGroup.alignChildren = ['fill', 'fill'];
    // Room on each side of the separator, so the tool bar and the settings don't hug it.
    contentGroup.spacing = 8;

    // tools: two per row, down the left of the panel
    var creationGroup = addNativeToolBar(contentGroup, 2, 32, 32);
    creationGroup.alignment = ['left', 'top'];

    var nullButton = creationGroup.addButton(
        '',
        w16_null,
        i18n._("Create a null object.")
    );
    nullButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Null") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addNull();
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var solidButton = creationGroup.addButton(
        '',
        w16_solid,
        i18n._("Create a solid layer.")
    );
    solidButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Solid") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addSolid();
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var adjustmentButton = creationGroup.addButton(
        '',
        w16_adjustment,
        i18n._("Create an adjustment layer.")
    );
    adjustmentButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Adjustment layer") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addAdjustmentLayer();
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var circleButton = creationGroup.addButton(
        '',
        w16_circle,
        i18n._("Create a shape layer.")
    );
    circleButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Circle") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addShape(DuAEShapeLayer.Primitive.CIRCLE);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var squareButton = creationGroup.addButton(
        '',
        w16_square,
        i18n._("Create a shape layer.")
    );
    squareButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Square") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addShape(DuAEShapeLayer.Primitive.SQUARE);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var rounded_squareButton = creationGroup.addButton(
        '',
        w16_rounded_square,
        i18n._("Create a shape layer.")
    );
    rounded_squareButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Rounded square") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addShape(DuAEShapeLayer.Primitive.ROUNDED_SQUARE);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var polyButton = creationGroup.addButton(
        '',
        w16_polygon,
        i18n._("Create a shape layer.")
    );
    polyButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Polygon") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addShape(DuAEShapeLayer.Primitive.POLYGON);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var starButton = creationGroup.addButton(
        '',
        w16_star,
        i18n._("Create a shape layer.")
    );
    starButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Star") );
        DuAEProject.setProgressMode( true );
        DuAEComp.addShape(DuAEShapeLayer.Primitive.STAR);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var boneButton = creationGroup.addButton(
        '',
        w16_bone,
        i18n._("Add a custom armature.")
    );
    boneButton.onClick = function() {
        DuAE.beginUndoGroup( i18n._("Star") );
        DuAEProject.setProgressMode( true );
        Duik.Bone.customLimb(2, "Bones", "Character", OCO.Side.NONE, OCO.Location.NONE);
        DuAEProject.setProgressMode( false );
        DuAE.endUndoGroup();
    };

    var moveRotateButton = addNativeCtrlButton(
        creationGroup,
        w16_move_rotate,
        i18n._("Create a translation and rotation controller."),
        Duik.Controller.Type.TRANSFORM
    );

    var zeroButton = creationGroup.addButton(
        '',
        w16_zero,
        i18n._("Zero out the selected layers transformation.\n[Alt]: Reset the transformation of the selected layers to 0.\n[Ctrl] + [Alt]: Also resets the opacity to 100 %.")
    );
    zeroButton.onClick = Duik.Constraint.zero;
    zeroButton.onAltClick = Duik.Constraint.resetPRS;
    zeroButton.onCtrlAltClick = function () { Duik.Constraint.resetPRS(undefined, true); };

    var locatorButton = creationGroup.addButton(
        '',
        w16_locator,
        i18n._("Create locator.")
    );
    locatorButton.onClick = Duik.Constraint.locator;

    // Between the tool bar and the settings.
    addNativeSeparator(contentGroup, 'vertical');

    var layersGroup = addNativeGroup(contentGroup, 'column');
    layersGroup.alignment = ['fill', 'fill'];

    // A grid with a row per button, like the Links and constraints panel: its image, then the button.
    var line1 = addNativeButtonGrid(layersGroup);
    line1.buttonHeight = 24;

    var sanitizeButton = addNativeButton(
        line1,
        i18n._("Auto-Rename & Tag"),
        w16_autorig,
        i18n._("Automagically renames, tags and groups the selected layers (or all of them if there's no selection)")
    );
    sanitizeButton.onClick = function() {
        DuAE.beginUndoGroup(i18n._("Auto-Rename & Tag"));
        Duik.Layer.sanitize();
        DuAE.endUndoGroup();
    }

    // The settings of the selected layers, applied only when checked.
    var selectionSection = addNativeSection( layersGroup, i18n._("Current Selection") );

    var typeGroup = addNativeSetting(selectionSection, i18n._("Type"));
    var typeSelector = addNativeValueSelector( typeGroup, [
        [i18n._("None"), w16_layer, Duik.Layer.Type.NONE],
        [i18n._("Bone"), w16_bone, Duik.Layer.Type.BONE],
        [i18n._("Pin"), w16_pin, Duik.Layer.Type.PIN],
        [i18n._("Controller"), w16_controller, Duik.Layer.Type.CONTROLLER],
        [i18n._("Zero"), w16_zero, Duik.Layer.Type.ZERO],
        [i18n._("Locator"), w16_locator, Duik.Layer.Type.LOCATOR],
        [i18n._("Effector"), w16_effector, Duik.Layer.Type.EFFECTOR],
        [i18n._("Audio"), w16_audio, Duik.Layer.Type.AUDIO],
        [i18n._("Art"), w16_paint, Duik.Layer.Type.ART],
        [i18n._("Null"), w16_null, Duik.Layer.Type.NULL],
        [i18n._("Solid"), w16_solid, Duik.Layer.Type.SOLID],
        [i18n._("Adjustment"), w16_adjustment, Duik.Layer.Type.ADJUSTMENT]
    ]);

    var locationEditGroup = addNativeSetting(selectionSection, i18n._("Location"));
    var locationEditSelector = addNativeLocationSelector( locationEditGroup );

    var sideEditGroup = addNativeSetting(selectionSection, i18n._("Side"));
    var sideEditSelector = addNativeSideSelector( sideEditGroup );

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

    addNativeSeparator(layersGroup);

    var buttonsGroup = addNativeGroup( layersGroup, 'row' );
    buttonsGroup.alignment = ['fill', 'top'];

    var pickButton = addNativeButton(
        buttonsGroup,
        i18n._("Pick selected layer"),
        DuScriptUI.Icon.EYE_DROPPER
    );

    var applyAllButton = addNativeButton(
        buttonsGroup,
        i18n._("Apply"),
        DuScriptUI.Icon.CHECK
    );

    pickButton.onClick = function()
    {
        Duik.Layer.sanitize();
        typeSelector.setValue( Duik.Layer.type() );
        sideEditSelector.setValue( Duik.Layer.side() );
        locationEditSelector.setValue( Duik.Layer.location() );
        characterEdit.text = Duik.Layer.groupName();
        limbEdit.text = Duik.Layer.name();
    }

    applyAllButton.onClick = function()
    {
        DuAE.beginUndoGroup( i18n._("Layer manager") );
        DuAEProject.setProgressMode(true);
        DuScriptUI.progressBar.setMax(5);
        DuScriptUI.progressBar.hit(1, i18n._("Setting layers type..."));
        if (typeGroup.checked) Duik.Layer.setType( typeSelector.getValue() );
        DuScriptUI.progressBar.hit(1, i18n._("Setting layers location..."));
        if (locationEditGroup.checked) Duik.Layer.setLocation( locationEditSelector.getValue() );
        DuScriptUI.progressBar.hit(1, i18n._("Setting layers side..."));
        if (sideEditGroup.checked) Duik.Layer.setSide( sideEditSelector.getValue() );
        DuScriptUI.progressBar.hit(1, i18n._("Setting layers group name..."));
        if (characterEditGroup.checked) Duik.Layer.setGroupName( characterEdit.text );
        DuScriptUI.progressBar.hit(1, i18n._("Setting layers name..."));
        if (limbEditGroup.checked) Duik.Layer.setName( limbEdit.text );
        DuAEProject.setProgressMode(false);
        DuAE.endUndoGroup();
    }
}
