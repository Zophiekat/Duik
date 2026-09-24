/**
 * Builds the sub-panel connecting properties to a texture layer: the native version of
 * <code>buildEffectorMapGroup</code>, shared by the Links and constraints and Automation panels.
 * @param {Group} effectorMapGroup - The group of the sub-panel. Its <code>listLayers([layer])</code>
 * method lists the layers of the active composition again, and selects one or keeps the selected one.
 * @param {Group} mainGroup - The group shown again when the sub-panel is closed.
 */
function buildNativeEffectorMapGroup( effectorMapGroup, mainGroup ) {
    var titleBar = addNativeSubPanel(
        effectorMapGroup,
        i18n._("Pick texture"),
        mainGroup,
        false
    );

    var mapLabel = effectorMapGroup.add('statictext', undefined, i18n._("Select the layer (texture/map)") + ':');
    mapLabel.enabled = false;

    var layerList = addSearchList(
        effectorMapGroup,
        w12_layers,
        i18n._("Pick the selected layer of the active composition."),
        i18n._("Select the layer (texture) to use as an effector.")
    );

    // Lists the layers of the active composition, and selects the layer, or keeps the selected index.
    effectorMapGroup.listLayers = function( layer ) {
        var comp = DuAEProject.getActiveComp();
        var items = [];
        if (comp) {
            for (var i = 1, n = comp.numLayers; i <= n; i++)
                items.push({ name: i + ' | ' + comp.layer(i).name, key: i });
        }
        layerList.setItems(items, layer ? layer.index : layerList.key);
    };

    layerList.pickButton.onClick = function() {
        var layers = DuAEComp.getSelectedLayers();
        if (layers.length > 0) effectorMapGroup.listLayers(layers[0]);
    };

    // Like the constraint settings, the list is filled when the panel is shown, and by the refresh button.
    var refreshButton = titleBar.add(
        'iconbutton',
        undefined,
        nativeImage(w12_blender_icon_file_refresh),
        { style: 'button' }
    );
    refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
        i18n._("Update the list of layers.");
    refreshButton.alignment = ['left', 'center'];
    refreshButton.onClick = function() {
        effectorMapGroup.listLayers();
    };

    var connectButton = addNativeButton(
        effectorMapGroup,
        i18n._("Connect properties"),
        w16_props,
        i18n._("Connects the selected properties to the control you've just set.")
    );
    connectButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;

        var layerIndex = layerList.key;
        if (layerIndex < 1 || layerIndex > comp.numLayers) return;

        DuAE.beginUndoGroup( i18n._("Effector map"));

        var props = DuAEComp.getSelectedProps();

        Duik.Automation.effectorMap( comp.layer(layerIndex), props);

        DuAE.endUndoGroup();
    }

    effectorMapGroup.built = true;
    nativeLayout(effectorMapGroup);
}
