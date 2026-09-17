/**
 * Adds a separator and a button to validate a sub-panel. The native version of <code>addValidButton</code>.
 * @param {Group|Panel|Window} container - Where to add the button.
 * @param {string} text - The text.
 * @param {string} [helpTip] - The help tip.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeValidButton(container, text, helpTip) {
    addNativeSeparator(container);
    return addNativeButton(container, text, DuScriptUI.Icon.CHECK, helpTip);
}
