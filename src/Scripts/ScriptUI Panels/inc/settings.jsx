// Settings
function buildSettingsUI( tab )
{
    // Native checkboxes, checked when the feature is enabled.

    // Home panel
    var homeButton = addNativeCheckBox(
        tab,
        i18n._("Home panel enabled"),
        w16_home,
        i18n._("The home panel helps Duik to launch much faster.\nDisabling it may make the launch time of Duik much slower."),
        !DuESF.scriptSettings.get("homeScreenDisabled", false )
    );

    var layerControlsAlertButton = addNativeCheckBox(
        tab,
        i18n._("Layer controls alert enabled"),
        w16_dialog,
        i18n._("You can disable the \"Layer controls\" alert dialog which is shown before long operations."),
        !DuESF.scriptSettings.get("layerControlsDialogDisabled", false )
    );

    ui.onResetSettings = function()
    {
        homeButton.value = !DuESF.scriptSettings.get("homeScreenDisabled", false );
        layerControlsAlertButton.value = !DuESF.scriptSettings.get("layerControlsDialogDisabled", false );
    };

    ui.onApplySettings = function()
    {
        DuESF.scriptSettings.set("homeScreenDisabled", !homeButton.value);
        DuESF.scriptSettings.set("layerControlsDialogDisabled", !layerControlsAlertButton.value);
        DuESF.scriptSettings.save();
    };
}
