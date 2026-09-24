function buildUI()
{       
    logStartupStep("Initialized: settings, translations, update check");

    #include "icons.jsx"

    #include "utils.jsx"

    // Native After Effects controls, used by the panels and by the header and footer below.
    #include "nativeUI/nativeUI.jsx"
    logStartupStep("Icons and UI helpers loaded");

    var ui = DuScriptUI.scriptPanel( thisObj, true, true, mainScriptFile );
    // The content sits five levels of groups deep in the panel, and every level doubles the time
    // ScriptUI takes to lay it out: it's only laid out again when its size changes.
    nativeCacheLayout( ui.mainGroup );
    ui.addCommonSettings();
    logStartupStep("Script panel created");

    // Settings
    #include "settings.jsx"
    buildSettingsUI( ui.settingsGroup );
    logStartupStep("Settings built");

    // The footer: Duik's own bottom buttons are replaced with native ones.
    addNativeFooter( ui, mainScriptFile );

    // Add Sanity status without label
    var sanityIcon = DuSanity.UI.button( ui.bottomGroup, false );
    sanityIcon.alignment = ['right', 'fill'];

    // Create a sanity popup
    var sanityPopup = DuScriptUI.popUp( i18n._("Sanity status") );
    sanityPopup.content.minimumSize = [400,-1];
    DuSanity.UI.panel( sanityPopup.content );
    sanityPopup.tieTo( sanityIcon );
    sanityPopup.pin();//*/
    logStartupStep("Footer and sanity popup built");