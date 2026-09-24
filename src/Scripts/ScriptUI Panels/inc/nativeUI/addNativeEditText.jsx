/**
 * Adds a text field, with a prefix before it and a suffix after it.
 * @param {Group|Panel|Window} container - Where to add the field.
 * @param {string} text - The text.
 * @param {string} [suffix] - A suffix, like a unit. Without one, there's no suffix label.
 * @param {string} [helpTip=''] - The help tip.
 * @param {string} [prefix] - A label before the field, like "Duration:". Without one, there's no prefix label.
 * @return {EditText} The field. Its <code>suffixText</code> and <code>prefixText</code> are the labels, if any,
 * and its <code>group</code> the row holding them with the field, to show or hide them together.
 */
function addNativeEditText(container, text, suffix, helpTip, prefix) {
    helpTip = def(helpTip, '');

    var group = addNativeGroup(container, 'row');
    group.alignment = ['fill', 'center'];

    var prefixText = null;
    if (isdef(prefix)) {
        prefixText = group.add('statictext', undefined, prefix);
        prefixText.alignment = ['left', 'center'];
        prefixText.helpTip = helpTip;
    }

    var edit = group.add('edittext', undefined, text);
    edit.alignment = ['fill', 'center'];
    edit.characters = 6;
    edit.helpTip = helpTip;
    edit.group = group;
    if (prefixText) edit.prefixText = prefixText;

    if (isdef(suffix)) {
        edit.suffixText = group.add('statictext', undefined, suffix);
        edit.suffixText.alignment = ['right', 'center'];
        // Room for a short unit, which may change later on; a longer suffix gets the room it needs.
        edit.suffixText.characters = Math.max(3, suffix.length);
    }

    return edit;
}
