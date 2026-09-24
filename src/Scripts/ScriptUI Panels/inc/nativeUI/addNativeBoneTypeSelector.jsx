/**
 * Adds a drop down list of the types of bones to create, full or light, saved in the OCO config.
 * The native version of <code>createBoneTypeSelector</code>, shared by the Bones and OCO panels.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @return {DropDownList} The list, from {@link addNativeDropdown}.
 */
function addNativeBoneTypeSelector( container ) {
    var boneTypeSelector = addNativeDropdown(container, [
        [i18n._("Use Full bones (with envelop and noodle)"), w16_bone],
        [i18n._("Use Light bones"), w16_bone_light]
    ], OCO.config.get("after effects/bone layer type", 'full') == 'light' ? 1 : 0);
    boneTypeSelector.onChange = function() {
        var type = 'full';
        if (boneTypeSelector.selection && boneTypeSelector.selection.index == 1) type = 'light';
        OCO.config.set('after effects/bone layer type', type);
    };
    return boneTypeSelector;
}
