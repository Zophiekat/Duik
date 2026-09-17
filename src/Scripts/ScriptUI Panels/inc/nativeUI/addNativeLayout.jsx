/**
 * Adds a layout: a group which gives its size to every button added inside it, directly or in a
 * nested group, the way a Blender row or column does. The panels size their buttons with these
 * instead of changing the defaults for the whole script.<br />
 * Any container works the same way once it has a <code>buttonHeight</code> or a
 * <code>buttonWidth</code>, including a grid from {@link addNativeButtonGrid} and a tool bar.
 * @param {Group|Panel|Window} container - Where to add the layout.
 * @param {string} [orientation='row'] - 'row', 'column' or 'stack'.
 * @param {Object} [options] - The size given to the buttons inside, in pixels.
 * @param {int} [options.height] - Their height. 0 lets ScriptUI size them.
 * @param {int} [options.width] - Their width. 0 lets the layout size them.
 * @return {Group} The layout, to be used as the container of the buttons.
 */
function addNativeLayout(container, orientation, options) {
    options = def(options, {});
    var layout = addNativeGroup(container, def(orientation, 'row'));
    // Only what's given, so that a layout inside another one keeps the size it doesn't set.
    if (isdef(options.height)) layout.buttonHeight = options.height;
    if (isdef(options.width)) layout.buttonWidth = options.width;
    return layout;
}
