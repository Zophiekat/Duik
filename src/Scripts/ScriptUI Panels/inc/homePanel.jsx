function buildHomePanelUI( tab )
{
    var homePanel = addNativeGroup( tab, 'column' );
    homePanel.alignment = ['fill', 'fill'];

    // A grid with a row per button, like the Links and constraints panel: its image, then the button.
    var line1 = addNativeButtonGrid(homePanel);
    line1.buttonHeight = 24;

    var ocoButton = addNativeButton(
        line1,
        i18n._("OCO Meta-rig"),
        w16_oco,
        i18n._("Create, import, export Meta-Rigs and templates")
    );

    var bonesButton = addNativeButton(
        line1,
        i18n._("Bones"),
        w16_bones,
        i18n._("The bones and armatures panel")
    );

    var constraintsButton = addNativeButton(
        line1,
        i18n._("Links & constraints"),
        w16_constraint,
        i18n._("Links & constraints")
    );

    var controllersButton = addNativeButton(
        line1,
        i18n._("Controllers"),
        w16_controller,
        i18n._("Controllers")
    );

    addNativeSeparator(homePanel);

    var line2 = addNativeButtonGrid(homePanel);
    line2.buttonHeight = 24;

    var automationButton = addNativeButton(
        line2,
        i18n._("Automation & expressions"),
        w16_automation,
        i18n._("Automation & expressions")
    );

    var animationButton = addNativeButton(
        line2,
        i18n._("Animation"),
        w16_animation,
        i18n._("Animation")
    );

    var cameraButton = addNativeButton(
        line2,
        i18n._("Camera"),
        w16_camera,
        i18n._("Camera")
    );

    addNativeSeparator(homePanel);

    var line3 = addNativeButtonGrid(homePanel);
    line3.buttonHeight = 24;

    var toolsButton = addNativeButton(
        line3,
        i18n._("Tools"),
        w16_tools,
        i18n._("Tools")
    );

    var helpButton = addNativeButton(
        line3,
        i18n._("Get help"),
        w16_help,
        i18n._("Read the doc!")
    );

    var donateButton = addNativeButton(
        line3,
        "I ♥ Duik",
        w16_heart,
        i18n._("Support %1 if you love it!", "Duik")
    );

    ocoButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(0);
    }

    bonesButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(1);
    }

    constraintsButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(2);
    }

    controllersButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(3);
    }

    automationButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(4);
    }

    animationButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(5);
    }

    cameraButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(6);
    }

    toolsButton.onClick = function()
    {
        mainTabPanel.setCurrentIndex(7);
    }

    helpButton.onClick = function()
    {
        DuSystem.openURL( DuESF.docURL );
    }

    donateButton.onClick = function()
    {
        DuSystem.openURL( DuESF.donateURL );
    }


    return homePanel;
}
