/**
 * Builds the constraint settings, which show and set the target of the active copy location
 * or copy rotation constraint, one constraint at a time.<br />
 * They're built in the Links and constraints panel, and in their own dockable panel,
 * <i>Duik Constraint Settings.jsx</i>.
 * @param {Group} container - The group to build the settings into.
 * @return {Object} The settings, with a <code>refresh()</code> method showing the settings
 * of the selected constraint.
 */
function buildConstraintSettingsUI(container) {
    // The copy location and copy rotation constraints look their target up by name.
    // The target can't live in the effect: an After Effects effect has no parameter
    // type able to hold or display a name, and effect parameters can't be renamed.
    var settingsCompSelector;
    var settingsLayerSelector;
    var settingsConstraintText;
    var settingsTargetValidButton;

    var noConstraintText = i18n._("Select a copy location or copy rotation effect.");

    // The constraint shown, kept by layer and name: a reference to an effect doesn't
    // survive changes to the other effects of its layer.
    // After Effects doesn't tell scripts when the selection changes, so this is the
    // constraint picked by the last refresh, even if it isn't selected anymore.
    var constraintLayer = null;
    var constraintName = '';

    function settingsTarget() {
        var comp = settingsCompSelector.getComp();
        if (!comp) return null;
        if (settingsLayerSelector.index <= 0) return null;
        return { comp: comp, layer: comp.layer(settingsLayerSelector.index) };
    }

    // The effect of the constraint shown, or null if it has been removed since.
    function shownConstraint() {
        if (!constraintLayer || !Object.isValid(constraintLayer)) return null;
        return constraintLayer("ADBE Effect Parade").property(constraintName);
    }

    function updateValidButton() {
        settingsTargetValidButton.enabled = constraintLayer !== null && settingsLayerSelector.index > 0;
    }

    // Shows the name, the layer and the target of the constraint.
    function showConstraint() {
        var target = Duik.Constraint.getTarget( shownConstraint() );
        if (!target) {
            constraintLayer = null;
            settingsConstraintText.text = noConstraintText;
        }
        else {
            var targetName = i18n._("no target");
            if (target.comp != '') targetName = target.comp + ' / ' + target.layer;
            settingsConstraintText.text = [
                target.effect,
                i18n._("Layer") + ': ' + constraintLayer.index + ' - ' + constraintLayer.name,
                i18n._("Target") + ': ' + targetName
            ].join('\n');
        }
        updateValidButton();
    }

    // Picks the active constraint, the last selected one, and shows it.
    function refreshConstraint() {
        var effect = Duik.Constraint.getActiveConstraint();
        constraintLayer = effect ? effect.propertyGroup(2) : null;
        constraintName = effect ? effect.name : '';
        showConstraint();
    }

    DuScriptUI.separator( container, i18n._("Active constraint") );

    settingsConstraintText = container.add(
        'statictext',
        undefined,
        noConstraintText,
        { multiline: true }
    );
    settingsConstraintText.alignment = ['fill', 'top'];
    settingsConstraintText.minimumSize = [-1, 48];

    var refreshButton = DuScriptUI.button(
        container,
        i18n._("Refresh"),
        w16_update_expression,
        i18n._("Show the settings of the selected copy location or copy rotation effect.\n" +
                "When several are selected, the last one is shown.")
    );
    refreshButton.onClick = refreshConstraint;

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
    settingsLayerSelector.onChange = updateValidButton;

    settingsTargetValidButton = addValidButton(
        container,
        i18n._("Set target"),
        i18n._("Point the constraint shown above at this layer. The other constraints keep their targets.\n\n" +
                "The target is looked up by name: set it again after renaming the composition or the layer.")
    );
    settingsTargetValidButton.enabled = false;
    settingsTargetValidButton.onClick = function() {
        var t = settingsTarget();
        var effect = shownConstraint();
        if (t && effect) Duik.Constraint.setConstraintTarget(t.comp, t.layer, effect);
        showConstraint();
    }

    return { refresh: refreshConstraint };
}
