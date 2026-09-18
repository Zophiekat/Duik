/**
 * Adds a tab panel: a row of toggle buttons over a stack of tabs, the native version of
 * <code>DuScriptUI.tabPanel</code>.<br />
 * A tab is built the first time it's shown, by its <code>build</code> callback, and only once the
 * UI is shown, which keeps the panel quick to open. Tabs are registered with
 * <code>DuScriptUI.allTabs</code>, so <code>DuScriptUI.showUI</code> builds the visible ones.
 * @param {Group|Panel|Window} container - Where to add the tab panel.
 * @param {string} [tabOrientation='row'] - Kept for the signature of DuScriptUI.tabPanel.
 * @return {Group} The tab panel. Add tabs with <code>addTab(text, image, helpTip)</code>, show one
 * with <code>setCurrentIndex(index)</code>, and read the shown one from <code>index</code>.
 * Its <code>onChange</code> runs whenever the tab changes.
 */
function addNativeTabPanel(container, tabOrientation) {
    var panel = addNativeGroup(container, 'column');
    panel.alignment = ['fill', 'fill'];
    panel.tabOrientation = def(tabOrientation, 'row');
    panel.buttons = [];
    panel.tabs = [];
    panel.index = -1;
    panel.onChange = function() {};

    panel.buttonsGroup = addNativeGroup(panel, 'row');
    panel.mainGroup = addNativeGroup(panel, 'stack');
    panel.mainGroup.alignment = ['fill', 'fill'];

    panel.addTab = function(text, image, helpTip, translatable) {
        text = def(text, '');
        helpTip = def(helpTip, '');

        // Like the other native buttons, the help tip starts with the name of the tab.
        var title = text.replace(/\.+$/, '');
        if (title != '') helpTip = helpTip == '' ? title + '.' : title + '.\n\n' + helpTip;

        // Some room between two tabs which both show a label.
        if (panel.buttons.length > 0 && text != '') {
            var previous = panel.buttons[panel.buttons.length - 1];
            if (previous.tabText != '') {
                var spacer = panel.buttonsGroup.add('group');
                spacer.margins = 0;
                spacer.spacing = 0;
                spacer.minimumSize = [5, -1];
            }
        }

        // A toggle button stays pressed while its tab is the one shown.
        var button = panel.buttonsGroup.add(
            'iconbutton',
            undefined,
            image ? nativeImage(image) : undefined,
            { style: 'toolbutton', toggle: true }
        );
        button.alignment = ['left', 'center'];
        if (text != '') button.text = text;
        button.helpTip = helpTip;
        button.tabText = text;
        button.index = panel.tabs.length;
        button.onAltClick = function() {};
        button.setChecked = function(checked) {
            button.value = checked;
        };
        panel.buttons.push(button);

        var tab = addNativeGroup(panel.mainGroup, 'column');
        tab.alignment = ['fill', 'fill'];
        tab.visible = false;
        tab.activated = false;
        tab.built = false;
        tab.index = panel.tabs.length;
        tab.name = text;
        tab.button = button;
        tab.scriptUIPanel = '';
        tab.tabActivated = function() {};
        tab.tabDeActivated = function() {};
        tab.build = function(theTab) {};
        tab.duBuild = function() {
            if (tab.built) return;
            tab.build(tab);
            nativeLayout(tab);
            tab.built = true;
        };

        panel.tabs.push(tab);
        DuScriptUI.allTabs.push(tab);

        button.onClick = function() {
            if (nativeModifiers().alt) {
                // An alt-click runs its own action and leaves the shown tab alone.
                button.value = tab.activated;
                DuDebug.safeRun(button.onAltClick);
                return;
            }
            panel.setCurrentIndex(button.index);
        };

        return tab;
    };

    panel.setCurrentIndex = function(index) {
        index = def(index, panel.index);

        var numTabs = panel.tabs.length;
        if (numTabs == 0) return;

        for (var i = 0; i < numTabs; i++) {
            var tab = panel.tabs[i];
            tab.activated = i == index;
            // Built only once the UI is shown: DuScriptUI.showUI builds the tab which starts visible.
            if (tab.activated && DuScriptUI.uiShown) {
                tab.duBuild();
                tab.visible = true;
                tab.tabActivated();
            }
            if (!tab.activated) {
                tab.visible = false;
                tab.tabDeActivated();
            }
            panel.buttons[i].setChecked(tab.activated);
        }

        if (index >= 0 && index < numTabs) panel.index = index;
        else panel.index = -1;

        panel.onChange();
    };

    return panel;
}
