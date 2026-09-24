/**
 * Adds a button of a tool bar creating a controller: the native version of <code>createCtrlButton</code>,
 * shared by the Controllers panel and the layer manager.
 * @param {Group} toolBar - The tool bar, from {@link addNativeToolBar}.
 * @param {DuBinary} icon - The image.
 * @param {string} helpTip - The help tip.
 * @param {string} type - The <code>Duik.Controller.Type</code> to create.
 * @return {Group} The button, from {@link addNativeButton}.
 */
function addNativeCtrlButton( toolBar, icon, helpTip, type ) {
    var button = toolBar.addButton(
        '',
        icon,
        helpTip + '\n\n' + i18n._("[Alt]: One controller for all layers.\n[Ctrl]: Parent layers to the controllers.")
    );

    // AE nulls have no shape to draw: while they're the controller type, the buttons create raster layers.
    function create( parent, single ) {
        var mode = OCO.config.get('after effects/controller layer type', Duik.Controller.LayerMode.SHAPE);
        if (mode == Duik.Controller.LayerMode.NULL) OCO.config.set('after effects/controller layer type', Duik.Controller.LayerMode.RASTER);

        Duik.Controller.fromLayers(type, parent, single);

        OCO.config.set('after effects/controller layer type', mode);
    }

    button.onClick = function() { create(); };
    button.onAltClick = function() { create(false, true); };
    button.onCtrlClick = function() { create(true); };
    button.onCtrlAltClick = function() { create(true, true); };

    return button;
}
