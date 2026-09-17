/**
 * Sets a group up as a sub-panel, shown instead of the main group, with a title bar.
 * The native version of <code>createSubPanel</code>.
 * @param {Group} container - The group of the sub-panel.
 * @param {string} title - The title.
 * @param {Group} mainGroup - The group shown again when the sub-panel is closed.
 * @param {Boolean} [pinButton=true] - Whether to add a button to keep the sub-panel open.
 * @return {Group} The title bar.
 */
function addNativeSubPanel(container, title, mainGroup, pinButton) {
    container.built = true;

    var titleBar = addNativeTitleBar(container, title, true, def(pinButton, true));
    titleBar.onClose = function() {
        container.visible = false;
        mainGroup.visible = true;
    };

    return titleBar;
}
