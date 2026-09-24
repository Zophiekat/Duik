/**
 * Adds the X-Sheet button: the native version of <code>createXSheetButton</code>,
 * shared by the Animation and Automation panels.
 * @param {Group|Panel|Window} container - Where to add the button, or a grid from {@link addNativeButtonGrid}.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeXSheetButton( container ) {
    var xSheetButton = addNativeButton(
        container,
        i18n._("X-Sheet"),
        w16_x_sheet,
        i18n._("Adjusts the exposure of the animation\n(changes and animates the framerate)\n\n[Ctrl]: (Try to) auto-compute the best values.")
    );
    xSheetButton.onClick = Duik.Animation.xSheet;
    xSheetButton.onCtrlClick = function() { Duik.Animation.xSheet(true) };
    return xSheetButton;
}
