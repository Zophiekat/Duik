/**
 * Adds a checkbox, with an image before it.
 * @param {Group|Panel|Window} container - Where to add the checkbox.
 * @param {string} text - The text.
 * @param {DuBinary} [image] - The image.
 * @param {string} [helpTip=''] - The help tip.
 * @param {Boolean} [checked=false] - Whether the checkbox is checked.
 * @return {Checkbox} The checkbox.
 */
function addNativeCheckBox(container, text, image, helpTip, checked) {
    helpTip = def(helpTip, '');

    var group = addNativeGroup(container, 'row');
    group.alignment = ['fill', 'top'];
    group.spacing = 4;

    if (image) {
        var icon = group.add('image', undefined, nativeImage(image));
        icon.alignment = ['left', 'center'];
        icon.helpTip = helpTip;
    }

    var checkbox = group.add('checkbox', undefined, text);
    checkbox.alignment = ['fill', 'center'];
    checkbox.helpTip = helpTip;
    checkbox.value = def(checked, false);

    return checkbox;
}
