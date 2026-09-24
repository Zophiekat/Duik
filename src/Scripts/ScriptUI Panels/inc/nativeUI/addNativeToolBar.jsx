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
    // Every cell gets the size of the biggest one. A size set for the buttons wins over the measured one:
    // they have already been pinned to it, and a measured minimum bigger than that maximum would fight it.
    var fixed = nativeLayoutSize(toolBar);
    var cells = [];
    var cellSize = [0, 0];

    // Stretching groups double the time ScriptUI takes to lay the UI out: when the buttons have a set size,
    // the columns and the cells don't need to stretch.
    var fixedSize = fixed.width > 0 && fixed.height > 0;
    var cellAlignment = fixedSize ? ['left', 'top'] : ['fill', 'top'];
    if (fixedSize) toolBar.alignChildren = ['left', 'top'];

    function alignCell(cell) {
        cells.push(cell);

        var w = fixed.width;
        var h = fixed.height;
        // Measuring a group lays it out, which is slow: only the new cell is measured, and only when
        // the tool bar doesn't set the size.
        if (w <= 0 || h <= 0) {
            var size = cell.preferredSize;
            if (w <= 0) w = size[0];
            if (h <= 0) h = size[1];
        }
        if (w <= 0 || h <= 0) return;

        if (w > cellSize[0] || h > cellSize[1]) {
            // A bigger cell: all the cells grow to its size.
            cellSize = [Math.max(w, cellSize[0]), Math.max(h, cellSize[1])];
            for (var i = 0; i < cells.length; i++) cells[i].minimumSize = [cellSize[0], cellSize[1]];
        }
        else cell.minimumSize = [cellSize[0], cellSize[1]];
    }

    toolBar.addButton = function(text, image, helpTip, addOptions, optionsWithoutPanel) {
        var button = addNativeButton(columns[currentCol], text, image, helpTip, {
            cell: true,
            label: showLabels,
            options: addOptions,
            optionsWithoutPanel: optionsWithoutPanel
        });
        button.alignment = cellAlignment;

        currentCol = (currentCol + 1) % numCols;
        alignCell(button);

        return button;
    };

    return toolBar;
}
