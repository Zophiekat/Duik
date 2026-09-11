/**
 * Builds the constraint settings, which show and set the target of the copy location and
 * copy rotation constraints of the selected layers.<br />
 * They're built in the Links and constraints panel, and in their own dockable panel,
 * <i>Duik Constraint Settings.jsx</i>.
 * @param {Group} container - The group to build the settings into.
 * @return {Object} The settings, with a <code>refresh()</code> method showing what the
 * constraints of the selected layers point at.
 */
function buildConstraintSettingsUI(container) {
    // The copy location and copy rotation constraints look their target up by name.
    // The target can't live in the effect: an After Effects effect has no parameter
    // type able to hold or display a name, and effect parameters can't be renamed.
    var settingsCompSelector;
    var settingsLayerSelector;
    var settingsTargetText;
    var settingsTargetValidButton;

    function settingsTarget() {
        var comp = settingsCompSelector.getComp();
        if (!comp) return null;
        if (settingsLayerSelector.index <= 0) return null;
        return { comp: comp, layer: comp.layer(settingsLayerSelector.index) };
    }

    // Shows what the constraints of the selected layer currently point at.
    function refreshConstraintTargets() {
        var layers = DuAEComp.getSelectedLayers();
        if (layers.length == 0) {
            settingsTargetText.text = i18n._("Select a constrained layer.");
            return;
        }

        var lines = [];
        for (var i = 0, n = layers.length; i < n; i++) {
            var targets = Duik.Constraint.getTargets(layers[i]);
            for (var j = 0, m = targets.length; j < m; j++) {
                var t = targets[j];
                if (t.comp == '') lines.push(t.effect + ': ' + i18n._("no target"));
                else lines.push(t.effect + ': ' + t.comp + ' / ' + t.layer);
            }
        }

        if (lines.length == 0) settingsTargetText.text = i18n._("No copy constraint on the selection.");
        else settingsTargetText.text = lines.join('\n');
    }

    DuScriptUI.separator( container, i18n._("Current target") );

    settingsTargetText = container.add(
        'statictext',
        undefined,
        i18n._("Select a constrained layer."),
        { multiline: true }
    );
    settingsTargetText.alignment = ['fill', 'top'];
    settingsTargetText.minimumSize = [-1, 48];

    var refreshButton = DuScriptUI.button(
        container,
        i18n._("Refresh"),
        w16_update_expression,
        i18n._("Show what the copy location and copy rotation constraints of the selected layers point at.")
    );
    refreshButton.onClick = refreshConstraintTargets;

    DuScriptUI.separator( container, i18n._("Set target") );

    DuScriptUI.staticText(
        container,
        i18n._("Target Composition") + ':',
        undefined,
        false
    );

    settingsCompSelector = DuScriptUI.compSelector(container);
    settingsCompSelector.onChange = function() {
        var comp = settingsCompSelector.getComp();
        if (!comp) return;
        settingsLayerSelector.comp = comp;
        settingsLayerSelector.refresh();
    }

    DuScriptUI.staticText(
        container,
        i18n._("Target Layer") + ':',
        undefined,
        false
    );

    settingsLayerSelector = DuScriptUI.layerSelector(container);
    settingsLayerSelector.onChange = function() {
        settingsTargetValidButton.enabled = settingsLayerSelector.index > 0;
    }

    settingsTargetValidButton = addValidButton(
        container,
        i18n._("Set target"),
        i18n._("Point the copy location and copy rotation constraints of the selected layers at this layer.\n\n" +
                "The target is looked up by name: set it again after renaming the composition or the layer.")
    );
    settingsTargetValidButton.enabled = false;
    settingsTargetValidButton.onClick = function() {
        var t = settingsTarget();
        if (!t) return;
        Duik.Constraint.setTarget(t.comp, t.layer);
        refreshConstraintTargets();
    }

    return { refresh: refreshConstraintTargets };
}
