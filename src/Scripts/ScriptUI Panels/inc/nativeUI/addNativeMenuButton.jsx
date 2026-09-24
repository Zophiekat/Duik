/**
 * Adds a button showing a menu of buttons, the native version of Duik's multi-buttons.<br />
 * The menu is built the first time it's shown, by the <code>build</code> callback, which adds the buttons with
 * <code>this.addButton(text, image, helpTip, hasOptions, optionsWithoutButton, optionsButtonText)</code>.
 * Call <code>ensureBuilt()</code> to build it right away, when its buttons are needed before it's shown.
 * Clicking a button of the menu hides the menu.
 * @param {Group|Panel|Window} container - Where to add the button.
 * @param {string} text - The text. Without one, the button only shows its image.
 * @param {DuBinary} [image] - The image.
 * @param {string} [helpTip] - The help tip.
 * @param {int} [height] - The height of the button in pixels, {@link nativeMenuButtonHeight} by default.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeMenuButton(container, text, image, helpTip, height) {
    if (!isdef(height)) {
        // The layout wins over the default height of the menu buttons.
        var layoutHeight = nativeLayoutSize(container).height;
        height = layoutHeight > 0 ? layoutHeight : nativeMenuButtonHeight;
    }
    var menuButton = addNativeButton(container, text == '' ? '' : text + '...', image, helpTip, {
        height: height
    });

    menuButton.build = function() {};
    menuButton.built = false;
    menuButton.buttons = [];

    var menu = null;
    var menuButtons = null;

    menuButton.addButton = function(text, image, helpTip, hasOptions, optionsWithoutButton, optionsButtonText) {
        var button = addNativeButton(menuButtons, text, image, helpTip, {
            options: hasOptions,
            optionsWithoutButton: optionsWithoutButton,
            optionsButtonText: optionsButtonText
        });
        button.control.onClick = function() {
            menu.hide();
            button.click();
        };
        if (button.optionsButton) button.optionsButton.onClick = function() {
            menu.hide();
            button.showOptions();
        };
        menuButton.buttons.push(button);
        return button;
    };

    menuButton.ensureBuilt = function() {
        if (!menu) {
            menu = new Window('palette', '', undefined, { borderless: true });
            menu.margins = 2;
            menu.spacing = 2;
            menu.alignChildren = ['fill', 'top'];

            var cancelButton = menu.add('button', undefined, i18n._("Cancel"));
            cancelButton.onClick = function() {
                menu.hide();
            };

            menuButtons = addNativeGroup(menu, 'column');

            menu.onDeactivate = function() {
                menu.hide();
            };
            menu.addEventListener('keydown', function(e) {
                if (e.keyName == 'Escape') menu.hide();
            });
        }

        if (!menuButton.built) {
            menuButton.built = true;
            menuButton.build();
        }
    };

    menuButton.control.onClick = function() {
        menuButton.ensureBuilt();

        // Opens over the button, like Duik's menus: the cancel button is right under the cursor.
        nativeShowPopup(menu, [menuButton.screenX, menuButton.screenY]);
    };

    return menuButton;
}
