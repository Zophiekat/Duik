/**
 * Adds the button aligning layers to a tool bar, with its options: the native version of
 * <code>createAlignButton</code>, shared by the Links and constraints and Animation panels.
 * @param {Group} toolBar - The tool bar, from {@link addNativeToolBar}.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeAlignButton( toolBar ) {
    var alignButton = toolBar.addButton(
        i18n._("Align layers"),
        w12_h_align,
        i18n._("Align layers.") + '\n' +
            i18n._("All selected layers will be aligned\nto the last selected one."),
        true
    );
    alignButton.optionsPopup.build = function() {
        var posButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Position"), w16_move, '', true);
        var rotButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Rotation"), w16_rotate, '', true);
        var scaButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Scale"), w16_scale, '', true);
        var opaButton = addNativeCheckBox(alignButton.optionsPanel, i18n._("Opacity"), w16_opacity);

        alignButton.optionsPanel.add(
            'statictext',
            undefined,
            i18n._("All selected layers will be aligned\nto the last selected one."),
            { multiline: true }
        );

        alignButton.onClick = function() {
            Duik.Constraint.alignLayers(
                posButton.value,
                rotButton.value,
                scaButton.value,
                opaButton.value
            )
        }
    }

    return alignButton;
}
