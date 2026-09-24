/**
 * Adds a list of the layers of the active composition, whose eyedropper picks the selected layer.
 * The native version of <code>DuScriptUI.layerSelector</code>, built on {@link addSearchList}.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {string} [helpTip] - The help tip of the list.
 * @return {Object} The list, from {@link addSearchList}. Its <code>listLayers([layer])</code> method lists the layers
 * again and selects one, or keeps the selected index; <code>getLayer()</code> returns the selected layer, or null.
 */
function addNativeLayerSelector(container, helpTip) {
    var list = addSearchList(
        container,
        w12_layers,
        i18n._("Pick the selected layer of the active composition."),
        helpTip
    );

    list.listLayers = function(layer) {
        var comp = DuAEProject.getActiveComp();
        var items = [];
        if (comp) {
            for (var i = 1, n = comp.numLayers; i <= n; i++)
                items.push({ name: i + ' | ' + comp.layer(i).name, key: i });
        }
        if (isdef(layer)) list.setItems(items, layer ? layer.index : 0);
        else list.setItems(items, list.key);
    };

    list.getLayer = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp || list.key < 1 || list.key > comp.numLayers) return null;
        return comp.layer(list.key);
    };

    list.pickButton.onClick = function() {
        var layers = DuAEComp.getSelectedLayers();
        if (layers.length > 0) list.listLayers(layers[0]);
    };

    return list;
}
