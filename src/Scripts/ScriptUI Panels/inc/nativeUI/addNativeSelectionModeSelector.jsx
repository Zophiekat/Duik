/**
 * Adds a drop down list of what a tool works on: the selected properties, layers, compositions...
 * The native version of <code>DuScriptUI.selectionModeSelector</code>.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {int} [minimalMode=DuAE.SelectionMode.SELECTED_PROPERTIES] - The first mode listed.
 * @param {int} [mode] - The selected mode, the first one by default.
 * @return {DropDownList} The list, from {@link addNativeValueSelector}: <code>getValue()</code> returns
 * the selected <code>DuAE.SelectionMode</code>.
 */
function addNativeSelectionModeSelector(container, minimalMode, mode) {
    minimalMode = def(minimalMode, DuAE.SelectionMode.SELECTED_PROPERTIES);

    var modes = [
        [i18n._("Selected properties"), w16_selected_props, DuAE.SelectionMode.SELECTED_PROPERTIES],
        [i18n._("Selected layers"), w16_selected_layers, DuAE.SelectionMode.SELECTED_LAYERS],
        [i18n._("Active composition"), w16_layers, DuAE.SelectionMode.ACTIVE_COMPOSITION],
        [i18n._("Selected compositions"), w16_selected_compositions, DuAE.SelectionMode.SELECTED_COMPOSITIONS],
        [i18n._("All compositions"), w16_compositions, DuAE.SelectionMode.ALL_COMPOSITIONS]
    ];

    var items = [];
    for (var i = 0, n = modes.length; i < n; i++) {
        if (modes[i][2] >= minimalMode) items.push(modes[i]);
    }

    return addNativeValueSelector(container, items, mode);
}
