/**
 * Adds a title bar, with a button to keep the panel open and a close button.
 * @param {Group|Panel|Window} container - Where to add the title bar.
 * @param {string} title - The title.
 * @param {Boolean} [closeButton=true] - Whether to add a close button.
 * @param {Boolean} [pinButton=true] - Whether to add a button to keep the panel open.
 * @return {Group} The title bar. Set its <code>onClose</code> and <code>onPin(pinned)</code> callbacks;
 * its <code>pinned</code> property is true when the panel has to stay open.
 */
function addNativeTitleBar(container, title, closeButton, pinButton) {
    closeButton = def(closeButton, true);
    pinButton = def(pinButton, true);

    var titleBar = container.add('group');
    titleBar.orientation = 'row';
    titleBar.alignment = ['fill', 'top'];
    titleBar.margins = 0;
    titleBar.spacing = 2;

    titleBar.pinned = false;
    titleBar.onClose = function() {};
    titleBar.onPin = function(pinned) {};

    if (pinButton) {
        titleBar.pinButton = titleBar.add('iconbutton', undefined, nativeImage(w12_pin), { style: 'button' });
        titleBar.pinButton.alignment = ['left', 'center'];
        titleBar.pinButton.helpTip = i18n._("Keep this panel open");
        titleBar.pinButton.onClick = function() {
            titleBar.pinned = !titleBar.pinned;
            titleBar.pinButton.image = nativeImage(titleBar.pinned ? w12_pinned : w12_pin);
            titleBar.onPin(titleBar.pinned);
        };
    }

    if (title != '') {
        titleBar.titleLabel = titleBar.add('statictext', undefined, title);
        titleBar.titleLabel.alignment = ['center', 'center'];
    }

    if (closeButton) {
        titleBar.closeButton = titleBar.add('iconbutton', undefined, nativeImage(w12_close), { style: 'button' });
        titleBar.closeButton.alignment = ['right', 'center'];
        titleBar.closeButton.helpTip = i18n._("Close");
        titleBar.closeButton.onClick = function() {
            titleBar.onClose();
        };
    }

    return titleBar;
}
