/**
 * Replaces the buttons of the bottom bar of a script panel with native ones.<br />
 * The bar itself is built by <code>DuScriptUI.scriptPanel</code>, with Duik's own buttons: they are
 * removed and built again here, so that the footer responds like the rest of the native panels.
 * The buttons keep what the Duik ones did, including the alt-click of the donate button.
 * @param {Panel|Window} panel - The script panel, from <code>DuScriptUI.scriptPanel</code>.
 * @param {File} [scriptFile] - The script file, for the refresh button shown while debugging.
 * @return {Group} The bottom bar, with the buttons as <code>settingsButton</code>,
 * <code>translateButton</code>, <code>bugButton</code>, <code>helpButton</code>,
 * <code>donateButton</code> and <code>versionButton</code>.
 */
function addNativeFooter(panel, scriptFile) {
    var bar = panel.bottomGroup;

    // Duik's own buttons are already there: take them out before adding the native ones.
    while (bar.children.length > 0) bar.remove(bar.children[0]);

    bar.margins = 0;
    bar.spacing = 2;
    bar.alignChildren = ['left', 'center'];

    // A small button which only shows its image, named by its help tip.
    function addFooterButton(image, helpTip, onClick, onAltClick) {
        var button = bar.add('iconbutton', undefined, nativeImage(image), { style: 'button' });
        button.alignment = ['left', 'center'];
        button.helpTip = helpTip;
        button.onClick = function() {
            if (nativeModifiers().alt && onAltClick) onAltClick();
            else onClick();
        };
        return button;
    }

    function openURL(url) {
        return function() { DuSystem.openURL(url); };
    }

    // The settings panel is the group above Duik's settings group, shown instead of the main group.
    var settingsRoot = panel.settingsGroup ? panel.settingsGroup.parent : null;
    if (settingsRoot) {
        bar.settingsButton = addFooterButton(w12_settings, i18n._("Edit settings"), function() {
            if (!settingsRoot.visible) {
                if (panel.hasCommonSettings) panel.settingsGroup.reset();
                panel.mainGroup.visible = false;
                settingsRoot.visible = true;
            }
            else {
                panel.mainGroup.visible = true;
                settingsRoot.visible = false;
            }
        });
    }

    if (DuESF.translateURL != '')
        bar.translateButton = addFooterButton(
            w12_language,
            i18n._("Translate %1", DuESF.scriptName) + '\n\n' +
                i18n._("Help translating %1 to make it available to more people.", DuESF.scriptName),
            openURL(DuESF.translateURL));

    if (DuESF.bugReportURL != '')
        bar.bugButton = addFooterButton(
            w12_bugreport,
            i18n._("Bug report") + '\n' + i18n._("Feature request") + '\n\n' +
                i18n._("Tell us what's wrong or request a new feature."),
            openURL(DuESF.bugReportURL));

    if (DuESF.docURL != '')
        bar.helpButton = addFooterButton(w12_help, i18n._("Help") + '\n\n' + i18n._("Get help."),
            openURL(DuESF.docURL));

    if (DuESF.donateURL != '')
        bar.donateButton = addFooterButton(
            w12_heart,
            "I ♥ " + DuESF.scriptName,
            openURL(DuESF.donateURL),
            openURL('http://patreon.com/duduf'));

    // The version, pushed to the right like Duik's own version button.
    var versionGroup = bar.add('group');
    versionGroup.alignment = ['fill', 'center'];
    versionGroup.margins = 0;

    bar.versionButton = bar.add('button', undefined, 'v' + DuESF.scriptVersion.fullVersion);
    bar.versionButton.alignment = ['right', 'center'];
    bar.versionButton.helpTip = DuESF.companyName + '\n' + DuESF.scriptName +
        ' v' + DuESF.scriptVersion.fullVersion;
    if (DuESF.aboutURL != '') bar.versionButton.onClick = openURL(DuESF.aboutURL);

    // Reloads the script while debugging, like Duik's own bottom bar does.
    if (DuESF.debug && (scriptFile instanceof File) && scriptFile.exists) {
        var refreshButton = bar.add('button', undefined, 'R');
        refreshButton.alignment = ['right', 'center'];
        refreshButton.maximumSize = [20, 20];
        refreshButton.helpTip = i18n._("Refresh");
        refreshButton.onClick = function() {
            DuScriptUI.refreshPanel(panel, scriptFile);
        };
    }

    return bar;
}
