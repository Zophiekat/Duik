/**
 * The size for the buttons of a container: the closest layout which sets one, then the default
 * for the whole script.
 * @param {Group|Panel|Window} container - The container of the button.
 * @return {Object} Its <code>height</code> and <code>width</code> in pixels.
 */
function nativeLayoutSize(container) {
    var size = { height: nativeButtonHeight, width: 0 };
    var gotHeight = false;
    var gotWidth = false;
    var parent = container;
    // The depth is limited: a window is its own parent in some versions of ScriptUI.
    for (var i = 0; parent && i < 50 && !(gotHeight && gotWidth); i++) {
        if (!gotHeight && isdef(parent.buttonHeight)) {
            size.height = parent.buttonHeight;
            gotHeight = true;
        }
        if (!gotWidth && isdef(parent.buttonWidth)) {
            size.width = parent.buttonWidth;
            gotWidth = true;
        }
        if (parent.parent === parent) break;
        parent = parent.parent;
    }
    return size;
}
