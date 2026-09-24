/**
 * Creates a popup: a floating panel, the native version of <code>DuScriptUI.popUp</code>.<br />
 * It hides when it loses the focus, unless it's pinned with its <i>Keep this panel open</i> checkbox,
 * and when [Esc] is pressed.
 * @param {string} [title=''] - The title.
 * @param {string[]} [alignment=['fill','top']] - The alignment of the content.
 * @return {Object} The popup. Add controls to its <code>content</code>; its <code>build</code> callback,
 * if set, adds them the first time it's shown, and <code>built</code> is true once it has run.
 * <code>show([location])</code> shows it, at the location it was last tied to by default,
 * <code>hide()</code> hides it, <code>pin(pinned)</code> keeps it open. <code>tieTo(button, onShift, alwaysBlock)</code>
 * shows it when a button is clicked. Its <code>window</code> is the native window.
 */
function addNativePopup(title, alignment) {
    title = def(title, '');
    alignment = def(alignment, ['fill', 'top']);

    var popup = {
        built: false,
        // Set to true to keep the popup hidden at the next click of the button it's tied to.
        block: false,
        pinned: false,
        location: null,
        build: function() {}
    };

    var win = new Window('palette', title, undefined, { resizeable: false });
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.margins = 5;
    win.spacing = 3;
    popup.window = win;

    popup.content = addNativeGroup(win, 'column');
    popup.content.alignment = alignment;
    popup.content.alignChildren = alignment;

    var pinCheckBox = win.add('checkbox', undefined, i18n._("Keep this panel open"));
    pinCheckBox.onClick = function() {
        popup.pinned = pinCheckBox.value;
    };

    popup.pin = function(pinned) {
        popup.pinned = def(pinned, true);
        pinCheckBox.value = popup.pinned;
    };

    // Like Duik's popups, the build callback runs before built is set.
    function ensureBuilt() {
        if (popup.built) return;
        popup.build();
        popup.built = true;
    }

    popup.show = function(location) {
        ensureBuilt();
        if (location) popup.location = location;
        nativeShowPopup(win, popup.location);
    };

    popup.hide = popup.hidePopup = popup.cancel = function() {
        win.hide();
    };

    win.onDeactivate = function() {
        if (!popup.pinned && !nativeDialogOpen) win.hide();
    };
    win.addEventListener('keydown', function(e) {
        if (e.keyName == 'Escape') win.hide();
    });

    /**
     * Shows the popup when a button is clicked, over the button, after the button has run its own action.
     * Call it once the button has its callbacks.
     * @param {Group|Control} button - The button: a button from {@link addNativeButton}, or a native control.
     * @param {Boolean} [onShift=false] - Shows the popup only with [Shift] + [Click].
     * @param {Boolean} [alwaysBlock=false] - Never shows the popup, only moves it over the button:
     * the action of the button shows it, with <code>show()</code>.
     */
    popup.tieTo = function(button, onShift, alwaysBlock) {
        onShift = def(onShift, false);
        alwaysBlock = def(alwaysBlock, false);

        var control = button.control ? button.control : button;

        control.addEventListener('mousedown', function(e) {
            popup.location = [e.screenX - e.clientX, e.screenY - e.clientY];
        });

        var click = control.onClick;
        control.onClick = function() {
            if (click) click();
            if (onShift && !nativeModifiers().shift) return;
            if (popup.block) {
                popup.block = false;
                return;
            }
            ensureBuilt();
            if (!alwaysBlock) popup.show();
        };
    };

    return popup;
}
