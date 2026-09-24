/**
 * Adds a tab panel: a row of toggle buttons over a stack of tabs, the native version of
 * <code>DuScriptUI.tabPanel</code>.<br />
 * Every tab is built by its <code>build</code> callback before the UI is shown, by {@link nativeBuildTabs}
 * in <i>ui_show.jsx</i>, so that switching to a tab never waits for it to be built; the whole UI is then
 * laid out once. A tab which failed to build is built again when it's shown. Tabs are registered with
 * <code>DuScriptUI.allTabs</code> too, so <code>DuScriptUI.showUI</code> shows the visible ones.<br />
 * The row of buttons and the stack are added straight to the container, without a group around them,
 * and each tab skips the layouts at an unchanged size ({@link nativeCacheLayout}): every level of groups
 * doubles the time ScriptUI takes to lay the UI out.
 * @param {Group|Panel|Window} container - Where to add the tab panel: a column.
 * @param {string} [tabOrientation='row'] - Kept for the signature of DuScriptUI.tabPanel.
 * @return {Group} The tab panel: the stack of tabs, which is also its <code>mainGroup</code>, with the row
 * of buttons above it in <code>buttonsGroup</code>. Add tabs with <code>addTab(text, image, helpTip)</code>,
 * show one with <code>setCurrentIndex(index)</code>, and read the shown one from <code>index</code>.
 * Its <code>onChange</code> runs whenever the tab changes.
 */
function addNativeTabPanel(container, tabOrientation) {
    var buttonsGroup = addNativeGroup(container, 'row');
    buttonsGroup.alignment = ['fill', 'top'];

    var panel = addNativeGroup(container, 'stack');
    panel.alignment = ['fill', 'fill'];
    panel.tabOrientation = def(tabOrientation, 'row');
    panel.buttons = [];
    panel.tabs = [];
    panel.index = -1;
    panel.onChange = function() {};

    panel.buttonsGroup = buttonsGroup;
    panel.mainGroup = panel;

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
        nativeCacheLayout(tab);
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
            // Before the UI is shown, this does nothing: it's laid out once as a whole by DuScriptUI.showUI.
            nativeLayout(tab);
            tab.built = true;
        };

        panel.tabs.push(tab);
        DuScriptUI.allTabs.push(tab);
        nativeTabs.push(tab);

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
            // Tabs are built before the UI is shown; DuScriptUI.showUI shows the one which starts visible.
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

/**
 * Builds all the tabs of the native tab panels which aren't built yet, including the ones added by
 * the tabs being built, like the tabs of the Tools panel. Called once, right before the UI is shown,
 * so that the whole UI is built at launch and laid out in one go.<br />
 * A tab which fails to build is reported, and doesn't keep the other ones from being built.
 */
function nativeBuildTabs() {
    // The list grows while the tabs are built.
    for (var i = 0; i < nativeTabs.length; i++) {
        var tab = nativeTabs[i];
        if (tab.built) continue;
        DuDebug.safeRun(tab.duBuild);
        // Icon-only tabs have no name: their help tip starts with it.
        if (typeof logStartupStep === 'function')
            logStartupStep("Tab built: " + (tab.name != '' ? tab.name : tab.button.helpTip.split('\n')[0]));
    }
}
