/**
 * Adds a grid of buttons showing their text, with a row per button: its options button and image in a cell
 * aligned to the right, then the button filling the rest of the row.<br />
 * Add the buttons with {@link addNativeButton} or {@link addNativeMenuButton}, with the grid as their container.<br />
 * ScriptUI has no grid layout: the first cells of all the rows get the width of the widest one, so that the
 * buttons line up. Each row is a single group, as every level of groups doubles the time ScriptUI takes to
 * lay the UI out.
 * @param {Group|Panel|Window} container - Where to add the grid.
 * @return {Group} The grid.
 */
function addNativeButtonGrid(container) {
    var grid = addNativeGroup(container, 'column');
    grid.alignment = ['fill', 'top'];
    grid.alignChildren = ['fill', 'center'];
    grid.isButtonGrid = true;

    var cells = [];
    var cellWidth = 0;

    /**
     * Adds the first cell of a row to the ones which line up, once its options button and image are in it.
     * Only this cell is measured: measuring lays a group out.
     * @param {Group} cell - The cell.
     */
    grid.alignCell = function(cell) {
        cells.push(cell);
        var width = cell.children.length > 0 ? cell.preferredSize[0] : 0;
        if (width > cellWidth) {
            // A wider cell: all the cells grow to its width.
            cellWidth = width;
            for (var i = 0; i < cells.length; i++) cells[i].minimumSize.width = cellWidth;
        }
        else cell.minimumSize.width = cellWidth;
    };

    return grid;
}
