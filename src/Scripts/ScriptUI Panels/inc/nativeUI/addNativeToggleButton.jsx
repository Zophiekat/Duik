/**
 * Adds a button which stays checked or not, showing a different image in each state, like the link
 * buttons of Duik. The native version of an image-only <code>DuScriptUI.checkBox</code>.
 * @param {Group|Panel|Window} container - Where to add the button.
 * @param {DuBinary} image - The image when it's not checked.
 * @param {DuBinary} [checkedImage] - The image when it's checked. The same image by default.
 * @param {string} [helpTip=''] - The help tip.
 * @param {Boolean} [checked=false] - Whether it's checked.
 * @return {Group} The button. Its <code>checked</code> property is its state, which <code>setChecked(checked)</code>
 * changes without calling <code>onClick</code>. <code>onClick</code> runs when it's clicked, once the state has changed.
 */
function addNativeToggleButton(container, image, checkedImage, helpTip, checked) {
    checkedImage = def(checkedImage, image);

    var toggle = addNativeGroup(container, 'row');
    toggle.checked = false;
    toggle.onClick = function() {};

    toggle.control = toggle.add('iconbutton', undefined, nativeImage(image), { style: 'toolbutton', toggle: true });
    toggle.control.helpTip = def(helpTip, '');

    toggle.setChecked = function(c) {
        toggle.checked = !!c;
        toggle.control.value = toggle.checked;
        toggle.control.image = nativeImage(toggle.checked ? checkedImage : image);
    };

    toggle.control.onClick = function() {
        toggle.setChecked(toggle.control.value);
        toggle.onClick();
    };

    toggle.setChecked(def(checked, false));

    return toggle;
}
