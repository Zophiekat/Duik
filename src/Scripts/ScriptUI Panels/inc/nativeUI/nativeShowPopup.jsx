/**
 * Shows a popup window at a location on screen, kept inside the screen.
 * @param {Window} popup - The popup.
 * @param {int[]} [location] - The top left corner of the popup. It's centered on the screen when the location is unknown.
 */
function nativeShowPopup(popup, location) {
    popup.layout.layout(true);
    popup.layout.resize();
    if (location && (location[0] != 0 || location[1] != 0))
        popup.location = DuScriptUI.moveInsideScreen([location[0], location[1]], popup.frameSize);
    else popup.center();
    popup.show();
}
