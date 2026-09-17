/**
 * Adds a tool bar: a grid of small buttons showing their image, named by their help tip.
 * The native version of Duik's tool bars.
 * @param {Group|Panel|Window} container - Where to add the tool bar.
 * @param {int} [numCols=3] - The number of buttons per row, like Duik's tool bars.
 * @param {int} [height] - The height of the buttons in pixels, {@link nativeButtonHeight} by default.
 * @param {int} [width] - The width of the buttons in pixels. By default they're as wide as the widest one.
 * @param {Boolean} [showLabels=false] - Shows the text of the buttons under their image.
 * @return {Group} The tool bar. Add buttons with its <code>addButton(text, image, helpTip, addOptions, optionsWithoutPanel)</code>
 * method, which returns a button from {@link addNativeButton}. Their options are shown with [Shift] + [Click].
 */
function addNativeToolBar(container, numCols, height, width, showLabels) {
    numCols = def(numCols, 3);
    showLabels = def(showLabels, false);

    var toolBar = addNativeGroup(container, 'row');
    // The buttons read these as they're added, through nativeLayoutSize.
    if (isdef(height)) toolBar.buttonHeight = height;
    if (isdef(width)) toolBar.buttonWidth = width;
    toolBar.alignment = ['fill', 'top'];
    toolBar.margins = 3;
    toolBar.spacing = 3;
    toolBar.alignChildren = ['fill', 'top'];

    var columns = [];
    for (var i = 0; i < numCols; i++) columns.push(addNativeGroup(toolBar, 'column'));
    var currentCol = 0;

    // ScriptUI has no grid layout: each column is sized by its own widest cell, so without
    // this the cells of a row don't line up with the ones of the rows above and below.
    function alignCells() {
        var w = 0;
        var h = 0;
        var i, j, cells;
        for (i = 0; i < numCols; i++) {
            cells = columns[i].children;
            for (j = 0; j < cells.length; j++) {
                w = Math.max(w, cells[j].preferredSize[0]);
                h = Math.max(h, cells[j].preferredSize[1]);
            }
        }
        if (w <= 0 || h <= 0) return;

        // A size set for the buttons wins over the measured one: they have already been pinned to it,
        // and a measured minimum bigger than that maximum would fight it.
        var fixed = nativeLayoutSize(toolBar);
        if (fixed.height > 0) h = fixed.height;
        if (fixed.width > 0) w = fixed.width;

        for (i = 0; i < numCols; i++) {
            cells = columns[i].children;
            for (j = 0; j < cells.length; j++) cells[j].minimumSize = [w, h];
        }
    }

    toolBar.addButton = function(text, image, helpTip, addOptions, optionsWithoutPanel) {
        var button = addNativeButton(columns[currentCol], text, image, helpTip, {
            cell: true,
            label: showLabels,
            options: addOptions,
            optionsWithoutPanel: optionsWithoutPanel
        });
        button.alignment = ['fill', 'top'];

        currentCol = (currentCol + 1) % numCols;
        alignCells();

        return button;
    };

    return toolBar;
}
