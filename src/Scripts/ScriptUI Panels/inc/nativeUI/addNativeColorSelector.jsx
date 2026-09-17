/**
 * Adds a color field: its hexadecimal code, a button opening the color picker and one picking a random color.
 * @param {Group|Panel|Window} container - Where to add the field.
 * @param {string} [helpTip=''] - The help tip.
 * @return {Group} The selector. Its <code>color</code> property is the current <code>DuColor</code>,
 * <code>setColor(color)</code> changes it, and <code>onChange</code> is called when it changes.
 */
function addNativeColorSelector(container, helpTip) {
    helpTip = def(helpTip, '');

    var selector = addNativeGroup(container, 'row');
    selector.alignment = ['fill', 'top'];
    selector.color = DuColor.Color.RX_PURPLE;
    selector.onChange = function() {};

    selector.add('statictext', undefined, '#');

    var edit = selector.add('edittext', undefined, 'A526C4');
    edit.alignment = ['fill', 'center'];
    edit.characters = 7;
    edit.helpTip = helpTip;

    function changed() {
        selector.color = DuColor.fromHex(edit.text);
        selector.onChange();
    }
    edit.onChange = changed;

    var pickerButton = selector.add('iconbutton', undefined, nativeImage(w16_paint), { style: 'button' });
    pickerButton.alignment = ['right', 'center'];
    pickerButton.helpTip = i18n._("Color") + '...';
    pickerButton.onClick = function() {
        var current = parseInt(edit.text, 16);
        nativeDialogOpen = true;
        var picked = $.colorPicker(isNaN(current) ? -1 : current);
        nativeDialogOpen = false;
        if (picked < 0) return;
        edit.text = ('000000' + picked.toString(16)).slice(-6).toUpperCase();
        changed();
    };

    var randomButton = selector.add('iconbutton', undefined, nativeImage(DuScriptUI.Icon.RANDOM), { style: 'button' });
    randomButton.alignment = ['right', 'center'];
    randomButton.helpTip = i18n._("Set a random value.");
    randomButton.onClick = function() {
        edit.text = DuColor.random().hex();
        changed();
    };

    selector.setColor = function(color) {
        edit.text = color.hex();
        changed();
    };

    return selector;
}
