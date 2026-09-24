/**
 * Adds a setting which is applied only when its checkbox is checked. The native version of <code>addSetting</code>.
 * @param {Group|Panel|Window} container - Where to add the setting.
 * @param {string} text - The name of the setting.
 * @return {Group} The group to add the controls of the setting to, enabled when the checkbox is checked.
 * Its <code>checked</code> property is the state of the checkbox, and its <code>onClick</code> callback
 * runs when the checkbox is clicked.
 */
function addNativeSetting(container, text) {
    var row = addNativeGroup(container, 'row');
    row.alignment = ['fill', 'top'];
    row.spacing = 3;

    var checkbox = row.add('checkbox', undefined, text + ':');
    checkbox.alignment = ['left', 'center'];

    var setting = addNativeGroup(row, 'row');
    setting.alignment = ['fill', 'fill'];
    setting.alignChildren = ['fill', 'center'];
    setting.checked = setting.enabled = false;
    setting.onClick = function() {};

    checkbox.onClick = function() {
        setting.checked = setting.enabled = checkbox.value;
        setting.onClick();
    };

    return setting;
}
