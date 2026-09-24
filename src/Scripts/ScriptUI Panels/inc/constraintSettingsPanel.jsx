/**
 * Builds the constraint settings, which show and set the target of the selected copy location,
 * copy rotation, copy point location, copy point rotation or armature constraint.<br />
 * They're built in the Links and constraints panel, and in their own dockable panel,
 * <i>Duik Constraint Settings.jsx</i>. Both include <i>nativeUI.jsx</i> first, for the native controls.
 * @param {Group} container - The group to build the settings into.
 * @param {Group} [titleBar] - The title bar to add the refresh button to.
 * When omitted, a title bar is created at the top of the container.
 * @return {Object} The settings, with a <code>refresh()</code> method showing what the
 * selected constraint points at.
 */
function buildConstraintSettingsUI(container, titleBar) {
    // The copy location, copy rotation, copy point location, copy point rotation and armature constraints
    // look their target up by name, and the point constraints their path too.
    // The target can't live in the effect: an After Effects effect has no parameter
    // type able to hold or display a name, and effect parameters can't be renamed.
    var settingsCompList;
    var settingsLayerList;
    var settingsPathList;
    var restPoseButton;

    // The addresses of the paths listed, by their key in the list.
    var settingsPaths = {};

    function settingsComp() {
        if (!settingsCompList.key) return null;
        return DuAEProject.getItemById(settingsCompList.key);
    }

    // The address of the path picked in the list, or null.
    function settingsPath() {
        if (!settingsPathList.key) return null;
        return settingsPaths[settingsPathList.key];
    }

    function settingsTarget() {
        var comp = settingsComp();
        if (!comp) return null;
        var index = settingsLayerList.key;
        if (!index || index > comp.numLayers) return null;
        return { comp: comp, layer: comp.layer(index), path: settingsPath() };
    }

    // Lists the Bezier paths of a layer, and selects the one at the address. When there's none,
    // selects the first path if firstPath is true, or None.
    function listPaths(layer, address, firstPath) {
        settingsPaths = {};
        var items = [];
        var paths = layer ? Duik.Constraint.listPaths(layer) : [];
        for (var i = 0, n = paths.length; i < n; i++) {
            var key = Duik.Constraint.pathAddressLiteral(paths[i].address);
            settingsPaths[key] = paths[i].address;
            items.push({ name: paths[i].name, key: key });
        }

        var key = address ? Duik.Constraint.pathAddressLiteral(address) : 0;
        if (!settingsPaths[key]) key = firstPath && items.length > 0 ? items[0].key : 0;
        settingsPathList.setItems(items, key);
    }

    // Lists the layers of a composition and the paths of one of them, and selects them.
    function listLayers(comp, layer, address, firstPath) {
        var layers = [];
        if (comp) {
            for (var i = 1, n = comp.numLayers; i <= n; i++)
                layers.push({ name: comp.layer(i).name, key: i });
        }
        settingsLayerList.setItems(layers, layer ? layer.index : 0);
        listPaths(layer, address, firstPath);
    }

    // Lists the compositions of the project, the layers of one of them and the paths of one of
    // these, and selects the target.
    function listTarget(comp, layer, address, firstPath) {
        var comps = DuAEProject.getComps();
        var items = [];
        for (var i = 0, n = comps.length; i < n; i++)
            items.push({ name: comps[i].name, key: comps[i].id });
        settingsCompList.setItems(items, comp ? comp.id : 0);
        listLayers(comp, layer, address, firstPath);
    }

    // The layer with the name in a composition, looked up like the expression of the constraint does.
    function layerByName(comp, name) {
        if (!comp || name == '') return null;
        try { return comp.layer(name); }
        catch (e) { return null; }
    }

    // What the selected constraint effect currently points at, like Duik.Constraint.getTarget does.
    // The target itself is shown by the composition, layer and path lists.
    function currentTarget() {
        var target = Duik.Constraint.getTarget();
        // Only an armature constraint with a target has a rest pose to set.
        restPoseButton.enabled = target != null && target.restPose && target.comp != '';
        // Only the point constraints target a path. Without a constraint, a path can still be picked.
        settingsPathList.enable(target == null || target.usesPath);
        return target;
    }

    // Shows what the selected constraint effect currently points at and puts its target
    // in the lists, listing the compositions, layers and paths again. Doesn't set the target.
    function refreshConstraintTarget() {
        var target = currentTarget();
        if (!target) {
            // Keep the target being picked.
            var current = settingsTarget();
            listTarget(settingsComp(), current ? current.layer : null, settingsPath(), false);
            return;
        }

        // Looked up by name, like the expression of the constraint does.
        // The lists are set to None when there's no target, or it can't be found anymore.
        var comp = null;
        var comps = DuAEProject.getComps();
        for (var i = 0, n = comps.length; i < n; i++) {
            if (comps[i].name == target.comp) {
                comp = comps[i];
                break;
            }
        }

        listTarget(comp, layerByName(comp, target.layer), target.path, false);
    }

    // Points the selected constraint effect at the target picked in the lists.
    function setConstraintTarget() {
        var t = settingsTarget();
        if (!t) return;
        Duik.Constraint.setTarget(t.comp, t.layer, undefined, t.path);
        currentTarget();
    }

    // The dockable panel has no sub-panel title bar, so it gets its own.
    if (!titleBar) titleBar = addNativeTitleBar( container, i18n._("Constraint settings"), false, false );

    // The controls are native After Effects ones rather than Duik ones: they respond instantly.
    var refreshButton = titleBar.add(
        'iconbutton',
        undefined,
        nativeImage(w12_blender_icon_file_refresh),
        { style: 'button' }
    );
    refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
        i18n._("Show what the selected copy location, copy rotation, copy point location, copy point rotation or armature constraint points at, and update the lists of compositions, layers and paths.");
    refreshButton.alignment = ['left', 'center'];
    refreshButton.onClick = refreshConstraintTarget;

    var setTargetSection = addNativeSection( container, i18n._("Set target") );
    // The height of the target lists and their eyedroppers. The default of addSearchList is 12,
    // which is slimmer than the rest of the panel.
    setTargetSection.buttonHeight = 20;

    setTargetSection.add('statictext', undefined, i18n._("Target Composition") + ':');

    settingsCompList = addSearchList(setTargetSection, w12_comp, i18n._("Pick the active composition."));
    // Picking a composition, a layer or a path, in the lists or with the eyedroppers, sets the target
    // right away; refreshing only fills the lists. The eyedroppers can set it only while the
    // constraint effect is still selected in the active composition.
    // A new layer keeps the path at the same place, or else takes its first path.
    settingsCompList.onChange = function() {
        // Keep the layer with the same name in the new composition, if there's one.
        var comp = settingsComp();
        listLayers(comp, layerByName(comp, settingsLayerList.name), settingsPath(), true);
        setConstraintTarget();
    }
    settingsCompList.pickButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;
        listTarget(comp, layerByName(comp, settingsLayerList.name), settingsPath(), true);
        setConstraintTarget();
    }

    setTargetSection.add('statictext', undefined, i18n._("Target Layer") + ':');

    settingsLayerList = addSearchList(setTargetSection, w12_layers, i18n._("Pick the selected layer of the active composition."));
    settingsLayerList.onChange = function() {
        var t = settingsTarget();
        listPaths(t ? t.layer : null, settingsPath(), true);
        setConstraintTarget();
    }
    settingsLayerList.pickButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;
        // The layer of the selected constraint effect is selected too, but can't be its own target.
        var constraint = Duik.Constraint.getTargetConstraints()[0];
        var layers = comp.selectedLayers;
        for (var i = 0, n = layers.length; i < n; i++) {
            if (constraint && constraint.layer.index == layers[i].index) continue;
            listTarget(comp, layers[i], settingsPath(), true);
            setConstraintTarget();
            return;
        }
    }

    setTargetSection.add('statictext', undefined, i18n._("Target Path") + ':');

    settingsPathList = addSearchList(setTargetSection, w12_blender_icon_curve_bezcurve,
        i18n._("Pick the selected path of the active composition: a shape path or a mask."),
        i18n._("The path the copy point location and copy point rotation constraints read the vertex of.")
    );
    settingsPathList.onChange = setConstraintTarget;
    settingsPathList.pickButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;
        // The selected constraint effect is selected too, and its layer can't be its own target.
        var constraint = Duik.Constraint.getTargetConstraints()[0];
        var props = comp.selectedProperties;
        for (var i = 0, n = props.length; i < n; i++) {
            var address = Duik.Constraint.pathAddress(props[i]);
            if (!address) continue;
            var layer = props[i].propertyGroup(props[i].propertyDepth);
            if (constraint && constraint.layer.index == layer.index) continue;
            listTarget(comp, layer, address, false);
            setConstraintTarget();
            return;
        }
    }

    var restPoseSection = addNativeSection( container, i18n._("Rest pose") );

    // An armature constraint takes the rest pose when its target is set; this takes it again.
    restPoseButton = restPoseSection.add('button', undefined, i18n._("Set rest pose"));
    restPoseButton.helpTip = i18n._("Take the current pose of the target of the selected armature constraint as its rest pose: the pose in which the constraint doesn't move the layer.");
    restPoseButton.alignment = ['fill', 'top'];
    restPoseButton.enabled = false;
    restPoseButton.onClick = function() {
        Duik.Constraint.setRestPose();
        currentTarget();
    }

    listTarget(null, null, null, false);

    return { refresh: refreshConstraintTarget };
}
