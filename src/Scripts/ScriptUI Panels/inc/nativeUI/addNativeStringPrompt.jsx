/**
 * Creates a popup asking for a text, the native version of <code>DuScriptUI.stringPrompt</code>.
 * @param {string} title - The title.
 * @param {string} [defaultString=''] - What to type, shown in the help tip of the field:
 * native fields have no place holder.
 * @return {Object} The popup, from {@link addNativePopup}. Its <code>editText</code> is the field,
 * <code>setText(text)</code> fills it and keeps the text in <code>previousString</code>, <code>edit()</code> focuses it,
 * and <code>onAccept(text)</code> runs when the text is validated, with [Enter] or the OK button.
 */
function addNativeStringPrompt(title, defaultString) {
    var prompt = addNativePopup(title);

    prompt.editText = prompt.content.add('edittext', undefined, '');
    prompt.editText.alignment = ['fill', 'top'];
    prompt.editText.characters = 20;
    prompt.editText.helpTip = def(defaultString, '');

    var okButton = addNativeButton(prompt.content, i18n._("OK"), DuScriptUI.Icon.CHECK, title);

    prompt.previousString = '';
    prompt.onAccept = function(text) {};

    prompt.accept = function() {
        prompt.onAccept(prompt.editText.text);
        prompt.hide();
        return prompt.editText.text;
    };

    prompt.setText = function(text) {
        prompt.previousString = text;
        prompt.editText.text = text;
    };

    prompt.edit = function() {
        prompt.editText.active = true;
    };

    // A field can only get the focus once its window is shown.
    var show = prompt.show;
    prompt.show = function(location) {
        show(location);
        prompt.editText.active = true;
    };

    okButton.onClick = prompt.accept;
    prompt.editText.addEventListener('keydown', function(e) {
        if (e.keyName == 'Enter') prompt.accept();
    });

    return prompt;
}
