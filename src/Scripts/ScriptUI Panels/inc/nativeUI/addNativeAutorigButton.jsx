/**
 * Adds the auto-rig button, with its options: the native version of <code>createAutorigButton</code>,
 * shared by the Bones and the Links and constraints panels.
 * @param {Group|Panel|Window} container - Where to add the button, or a grid from {@link addNativeButtonGrid}.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeAutorigButton( container ) {
    var autorigButton = addNativeButton(
        container,
        i18n._("Auto-rig"),
        w16_autorig,
        i18n._("Automatically rig armatures (use the Links & constraints tab for more options)."),
        { options: true }
    );
    autorigButton.optionsPopup.build = function() {
        var optionsPanel = autorigButton.optionsPanel;

        // A checkbox saving its setting.
        function addSettingCheckBox( text, setting, defaultValue ) {
            var checkbox = addNativeCheckBox(optionsPanel, text, null, '', DuESF.scriptSettings.get(setting, defaultValue));
            checkbox.onClick = function() {
                DuESF.scriptSettings.set(setting, checkbox.value);
                DuESF.scriptSettings.save();
            };
            return checkbox;
        }

        optionsPanel.add('statictext', undefined, i18n._("3-Layer rig:"));
        var threeLayerSelector = addNativeDropdown(optionsPanel, [
            [
                i18n._("1+2-layer IK"),
                w16_one_two_ik,
                i18n._("Create a one-layer IK combined with a two-layer IK\nto handle Z-shape limbs.")
            ],
            [
                i18n._("2+1-layer IK"),
                w16_two_one_ik,
                i18n._("Create a two-layer IK combined with a one-layer IK\nto handle Z-shape limbs.")
            ],
            [
                i18n._("FK"),
                w16_fk,
                i18n._("Forward Kinematics\nwith automatic overlap and follow-through.")
            ],
            [
                i18n._("Bézier IK"),
                w16_bezier_ik,
                i18n._("Bézier Inverse Kinematics.")
            ],
            [
                i18n._("Bézier FK"),
                w16_bezier_fk,
                i18n._("Bézier FK")
            ]
        ], DuESF.scriptSettings.get("autorig/threeLayerMode" , 0));
        threeLayerSelector.onChange = function() {
            DuESF.scriptSettings.set("autorig/threeLayerMode", threeLayerSelector.selection.index);
            DuESF.scriptSettings.save();
        };

        optionsPanel.add('statictext', undefined, i18n._("Long chain rig:"));
        var longSelector = addNativeDropdown(optionsPanel, [
            [
                i18n._("FK"),
                w16_fk,
                i18n._("Forward Kinematics\nwith automatic overlap and follow-through.")
            ],
            [
                i18n._("Bézier IK"),
                w16_bezier_ik,
                i18n._("Bézier Inverse Kinematics.")
            ],
            [
                i18n._("Bézier FK"),
                w16_bezier_fk,
                i18n._("Bézier FK")
            ]
        ], DuESF.scriptSettings.get("autorig/longMode" , 0));
        longSelector.onChange = function() {
            DuESF.scriptSettings.set("autorig/longMode", longSelector.selection.index);
            DuESF.scriptSettings.save();
        };

        var createMasterButton = addSettingCheckBox(i18n._("Create a root controller"), "autorig/createMaster", false);
        optionsPanel.add('statictext', undefined, i18n._("Baking:"));
        var bakeBonesButton = addSettingCheckBox(i18n._("Bake bones"), "autorig/bakeBones", true);
        var bakeEnvelopsButton = addSettingCheckBox(i18n._("Bake envelops"), "autorig/bakeEnvelops", true);
        var bakeNoodlesButton = addSettingCheckBox(i18n._("Remove deactivated noodles."), "autorig/removeNoodles", true);

        autorigButton.onClick = function() {
            var threeMode = threeLayerSelector.selection.index + 1;
            var longMode = longSelector.selection.index + 3;

            if (!DuAEProject.setProgressMode(true, true, true, [autorigButton.screenX, autorigButton.screenY] )) return;
            DuAE.beginUndoGroup( i18n._("Auto-rig") );

            Duik.Rig.auto(bakeBonesButton.value, bakeEnvelopsButton.value, bakeNoodlesButton.value, longMode, threeMode, undefined, createMasterButton.value);

            DuAE.endUndoGroup( i18n._("Auto-rig") );
            DuAEProject.setProgressMode(false);
        };
    }

    return autorigButton;
}
