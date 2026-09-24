/**
 * Adds a button to pick a file, with a field showing its path. The native version of <code>DuScriptUI.fileSelector</code>.
 * @param {Group|Panel|Window} container - Where to add the selector.
 * @param {string} [text='Browse...'] - The text of the button.
 * @param {Boolean} [textField=true] - Whether to show the path in a field, where it can be typed too.
 * @param {string} [helpTip=''] - The help tip.
 * @param {DuBinary} [image=w12_file] - The image of the button.
 * @param {string} [mode='open'] - 'open' to pick an existing file, 'save' to pick where to save one.
 * @param {string} [filters='All files: *.*'] - The file types, for the file dialog.
 * @param {string} [orientation='column'] - 'column' puts the field under the button, 'row' next to it.
 * @return {Group} The selector. Its <code>path</code> is the path picked, <code>getFile()</code> returns the file,
 * <code>setPath(path)</code> changes it, and <code>onChange</code> runs when a file is picked.
 */
function addNativeFileSelector(container, text, textField, helpTip, image, mode, filters, orientation) {
    text = def(text, "Browse...");
    textField = def(textField, true);
    helpTip = def(helpTip, '');
    image = def(image, w12_file);
    mode = def(mode, 'open');
    filters = def(filters, "All files: *.*");
    orientation = def(orientation, 'column');

    var selector = addNativeGroup(container, orientation);
    selector.alignment = ['fill', 'top'];
    selector.path = '';
    selector.onChange = function() {};

    selector.button = addNativeButton(selector, text, image, helpTip);
    if (orientation == 'row') selector.button.alignment = ['left', 'center'];

    selector.editText = null;
    if (textField) {
        selector.editText = selector.add('edittext', undefined, '');
        selector.editText.alignment = ['fill', 'center'];
        selector.editText.helpTip = helpTip;
        selector.editText.onChange = function() {
            selector.path = selector.editText.text;
            selector.onChange();
        };
    }

    function showPath(file) {
        if (selector.editText) selector.editText.text = file ? file.fsName : '';
    }

    selector.button.onClick = function() {
        var file = new File(selector.path);
        nativeDialogOpen = true;
        if (file.exists) {
            if (mode == 'open') file = file.openDlg("Select File", filters);
            else file = file.saveDlg("Save File", filters);
        }
        else {
            if (mode == 'open') file = File.openDialog("Select File", filters);
            else file = File.saveDialog("Save File", filters);
        }
        nativeDialogOpen = false;

        if (!file) return;

        showPath(mode == 'open' && !file.exists ? null : file);
        selector.path = file.absoluteURI;

        selector.onChange();
    };

    selector.getFile = function() {
        var file = new File(selector.path);
        if (!file.exists && mode == 'open') return null;
        return file;
    };

    selector.setPath = function(path) {
        var file = new File(path);
        selector.path = file.absoluteURI;
        showPath((mode == 'open' && file.exists) || mode == 'save' ? file : null);
    };

    // Native fields have no place holder: it's added to the help tip.
    selector.setPlaceholder = function(placeholder) {
        if (!selector.editText) return;
        selector.editText.helpTip = helpTip == '' ? placeholder : helpTip + '\n\n' + placeholder;
    };

    return selector;
}
