/**
 * Adds a native button, with the callbacks of Duik's buttons: <code>onClick</code>, <code>onAltClick</code>,
 * <code>onCtrlClick</code>, <code>onCtrlAltClick</code> and <code>onShiftClick</code>, run depending on the
 * modifier keys held.<br />
 * The image is shown next to the text.
 * @param {Group|Panel|Window} container - Where to add the button, or a grid from {@link addNativeButtonGrid}.
 * @param {string} text - The text.
 * @param {DuBinary} [image] - The image.
 * @param {string} [helpTip=''] - The help tip. The name of the button is added as its first line.
 * @param {Object} [options] - More options.
 * @param {Boolean} [options.cell=false] - Shows the image above the text, for tool bars. Only the image is clickable.
 * @param {Boolean} [options.label=true] - Shows the text under the image of a cell. The help tip names
 * the button either way, so an unlabelled cell is still identified.
 * @param {Boolean} [options.options=false] - The button has more options, shown with [Shift] + [Click] or a small options button.
 * The button builds them before running its callbacks, through <code>onOptions(false)</code> and the popup.
 * @param {Boolean} [options.optionsWithoutPanel=false] - The options aren't in a popup: <code>onOptions(true)</code> shows them.
 * @param {Boolean} [options.optionsWithoutButton=false] - The options popup has no button running the action.
 * @param {int} [options.height] - The height of the button in pixels, {@link nativeButtonHeight} by default. 0 lets ScriptUI size it.
 * @param {int} [options.width] - The width of the button in pixels. 0, the default, lets the layout size it.
 * @return {Group} The button. Its <code>control</code> is the native button, its <code>optionsPopup</code> the popup
 * from {@link addNativeOptionsPopup}, and <code>screenX</code> and <code>screenY</code> its location on screen,
 * known from the latest click. In a grid, its <code>iconCell</code> is the cell with its options button and image.
 */
function addNativeButton(container, text, image, helpTip, options) {
    image = def(image, null);
    helpTip = def(helpTip, '');
    options = def(options, {});

    var cell = def(options.cell, false);
    var hasOptions = def(options.options, false);

    // Every help tip starts with the name of the button, on its own line. The trailing dots of a
    // menu button ("Kinematics...") are dropped so that the name reads as a sentence.
    var title = text.replace(/\.+$/, '');
    if (title != '') helpTip = helpTip == '' ? title + '.' : title + '.\n\n' + helpTip;

    if (hasOptions) helpTip += (helpTip == '' ? '' : '\n\n') + i18n._("[Shift]: More options...");

    // In a grid of buttons, the options button and the image are in the first column, and the button in the second one.
    var grid = container.isButtonGrid && !cell ? container : null;

    var button;
    var iconCell;
    if (grid) {
        iconCell = addNativeGroup(grid.iconColumn, 'row');
        iconCell.alignment = ['right', 'center'];
        button = addNativeGroup(grid.buttonColumn, 'row');
        button.alignment = ['fill', 'center'];
        button.iconCell = iconCell;
    }
    else {
        button = addNativeGroup(container, cell ? 'column' : 'row');
        button.alignment = ['fill', 'top'];
        if (cell) button.alignChildren = ['center', 'top'];
        iconCell = button;
    }

    button.onClick = function() {};
    button.onAltClick = function() {};
    button.onCtrlClick = function() {};
    button.onCtrlAltClick = function() {};
    button.onShiftClick = function() {};
    button.onOptions = function(showUI) {};

    button.screenX = 0;
    button.screenY = 0;
    function storeLocation(e) {
        button.screenX = e.screenX - e.clientX;
        button.screenY = e.screenY - e.clientY;
    }

    if (hasOptions) {
        if (!def(options.optionsWithoutPanel, false))
            button.optionsPopup = addNativeOptionsPopup(button, text, !def(options.optionsWithoutButton, false));

        // Like Duik's buttons, a small button shows the options; cells, like the ones of tool bars, only have [Shift] + [Click].
        if (!cell) {
            button.optionsButton = iconCell.add('iconbutton', undefined, nativeImage(w12_options), { style: 'button' });
            button.optionsButton.alignment = ['left', 'center'];
            button.optionsButton.helpTip = text + '\n' + i18n._("Options");
            button.optionsButton.addEventListener('mousedown', storeLocation);
            button.optionsButton.onClick = function() {
                button.showOptions();
            };
        }
    }

    if (image && cell) {
        button.control = button.add('iconbutton', undefined, nativeImage(image), { style: 'button' });
        button.control.alignment = ['center', 'top'];
        if (def(options.label, true)) {
            // Shown in full or not at all: without a minimum width, a narrow panel would shrink the
            // label until its text is gone.
            var label = button.add('statictext', undefined, text);
            label.alignment = ['center', 'top'];
            label.helpTip = helpTip;
            label.minimumSize.width = label.preferredSize[0];
        }
    }
    else if (image && nativeIconInButton) {
        // The image goes inside the button: an iconbutton draws it, and carries the text too.
        button.control = button.add('iconbutton', undefined, nativeImage(image), { style: 'button' });
        button.control.text = text;
        button.control.alignment = ['fill', 'center'];
        // An iconbutton is only as wide as its image, so the text it carries is cropped unless it's
        // given room: a static text measures the text, then goes away again.
        var ruler = button.add('statictext', undefined, text);
        button.control.minimumSize.width = ruler.preferredSize[0] + nativeIconButtonPadding;
        button.remove(ruler);
    }
    else {
        if (image) {
            var icon = iconCell.add('image', undefined, nativeImage(image));
            icon.alignment = ['left', 'center'];
            icon.helpTip = helpTip;
        }
        button.control = button.add('button', undefined, text);
        button.control.alignment = ['fill', 'center'];
    }
    button.control.helpTip = helpTip;
    button.control.addEventListener('mousedown', storeLocation);

    // A custom size: this button's own options first, then the closest layout which sets one.
    var layoutSize = nativeLayoutSize(container);
    var buttonHeight = def(options.height, layoutSize.height);
    var buttonWidth = def(options.width, layoutSize.width);
    if (buttonWidth > 0) {
        button.control.preferredSize.width = buttonWidth;
        button.control.minimumSize.width = button.control.maximumSize.width = buttonWidth;
    }
    if (buttonHeight > 0) button.control.preferredSize.height = buttonHeight;

    if (grid) {
        // Both cells of a row get the same height, so that the columns line up:
        // the custom height, or the height of the tallest control of the row.
        var height = buttonHeight;
        if (height <= 0) {
            height = button.control.preferredSize[1];
            for (var i = 0, n = iconCell.children.length; i < n; i++)
                height = Math.max(height, iconCell.children[i].preferredSize[1]);
        }
        if (height > 0) {
            iconCell.minimumSize.height = iconCell.maximumSize.height = height;
            button.minimumSize.height = button.maximumSize.height = height;
        }
    }
    else if (buttonHeight > 0) button.minimumSize.height = button.maximumSize.height = buttonHeight;

    button.showOptions = function() {
        if (button.optionsPopup) button.optionsPopup.show([button.screenX, button.screenY]);
        button.onOptions(true);
    };

    // Building the options may set the callbacks, so they're read afterwards.
    function run(callback) {
        if (button.optionsPopup) button.optionsPopup.ensureBuilt();
        if (hasOptions) button.onOptions(false);
        DuDebug.safeRun(button[callback]);
    }

    button.click = function() {
        var keys = nativeModifiers();
        if (keys.shift) {
            if (hasOptions) button.showOptions();
            DuDebug.safeRun(button.onShiftClick);
        }
        else if (keys.alt && keys.ctrl) run('onCtrlAltClick');
        else if (keys.alt) run('onAltClick');
        else if (keys.ctrl) run('onCtrlClick');
        else run('onClick');
    };
    button.control.onClick = button.click;

    return button;
}
