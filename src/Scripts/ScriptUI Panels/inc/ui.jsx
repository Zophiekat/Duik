function buildUI()
{       
    #include "icons.jsx"

    #include "utils.jsx"

    var ui = DuScriptUI.scriptPanel( thisObj, true, true, mainScriptFile );
    ui.addCommonSettings();

    // Settings
    #include "settings.jsx"
    buildSettingsUI( ui.settingsGroup );

    // Add Sanity status without label
    var sanityIcon = DuSanity.UI.button( ui.bottomGroup, false );
    sanityIcon.alignment = ['right', 'fill'];

    // Create a sanity popup
    var sanityPopup = DuScriptUI.popUp( i18n._("Sanity status") );
    sanityPopup.content.minimumSize = [400,-1];
    DuSanity.UI.panel( sanityPopup.content );
    sanityPopup.tieTo( sanityIcon );
    sanityPopup.pin();//*/