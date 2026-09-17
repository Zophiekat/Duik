/**
 * Adds a text field, with a suffix after it.
 * @param {Group|Panel|Window} container - Where to add the field.
 * @param {string} text - The text.
 * @param {string} [suffix] - A suffix, like a unit. Without one, there's no suffix label.
 * @param {string} [helpTip=''] - The help tip.
 * @return {EditText} The field. Its <code>suffixText</code> is the label of the suffix, if any.
 */
function addNativeEditText(container, text, suffix, helpTip) {
    var group = addNativeGroup(container, 'row');
    group.alignment = ['fill', 'center'];

    var edit = group.add('edittext', undefined, text);
    edit.alignment = ['fill', 'center'];
    edit.characters = 6;
    edit.helpTip = def(helpTip, '');

    if (isdef(suffix)) {
        edit.suffixText = group.add('statictext', undefined, suffix);
        edit.suffixText.alignment = ['right', 'center'];
        edit.suffixText.characters = 3;
    }

    return edit;
}
