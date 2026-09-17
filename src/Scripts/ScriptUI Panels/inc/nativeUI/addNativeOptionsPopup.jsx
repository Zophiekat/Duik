/**
 * Creates the options popup of a button: a floating panel, built the first time it's needed.
 * It hides when it loses the focus, unless <i>Keep this panel open</i> is checked, or when [Esc] is pressed.
 * @param {Group} button - The button, from {@link addNativeButton}. Once the popup is built,
 * its <code>optionsPanel</code> is the group containing the options.
 * @param {string} title - The title of the popup, which is also the text of the button running the action.
 * @param {Boolean} actionButton - Whether to add a button running the action of the button.
 * @return {Object} The popup. Set its <code>build</code> callback to add the options to <code>button.optionsPanel</code>.
 * <code>ensureBuilt()</code> builds it without showing it; <code>show(location)</code> and <code>hide()</code>.
 */
function addNativeOptionsPopup(button, title, actionButton) {
    var popup = {
        built: false,
        window: null,
        build: function() {}
    };

    popup.ensureBuilt = function() {
        if (popup.built) return;
        popup.built = true;

        var win = new Window('palette', title == '' ? i18n._("Options") : title, undefined, { resizeable: false });
        win.orientation = 'column';
        win.alignChildren = ['fill', 'top'];
        win.margins = 5;
        win.spacing = 3;
        popup.window = win;

        button.optionsPanel = addNativeGroup(win, 'column');
        popup.build();

        if (actionButton) {
            addNativeSeparator(win);
            var runButton = win.add('button', undefined, title);
            runButton.onClick = button.click;
        }

        var keepOpenCheckBox = win.add('checkbox', undefined, i18n._("Keep this panel open"));

        win.onDeactivate = function() {
            if (!keepOpenCheckBox.value && !nativeDialogOpen) win.hide();
        };
        win.addEventListener('keydown', function(e) {
            if (e.keyName == 'Escape') win.hide();
        });
    };

    popup.show = function(location) {
        popup.ensureBuilt();
        nativeShowPopup(popup.window, location);
    };

    popup.hide = function() {
        if (popup.window) popup.window.hide();
    };

    return popup;
}
