/**
 * Adds a grid of buttons showing their text, with a row per button: its options button and image in a cell
 * aligned to the right, then the button in a cell aligned to the left.<br />
 * Add the buttons with {@link addNativeButton} or {@link addNativeMenuButton}, with the grid as their container.
 * @param {Group|Panel|Window} container - Where to add the grid.
 * @return {Group} The grid.
 */
function addNativeButtonGrid(container) {
    var grid = addNativeGroup(container, 'row');
    grid.alignment = ['fill', 'top'];
    grid.alignChildren = ['left', 'top'];
    grid.spacing = 4;
    grid.isButtonGrid = true;

    // ScriptUI has no grid layout: the grid is a column per cell, and both cells of a row get the same height.
    grid.iconColumn = addNativeGroup(grid, 'column');
    grid.iconColumn.alignment = ['left', 'top'];
    grid.iconColumn.alignChildren = ['right', 'center'];

    grid.buttonColumn = addNativeGroup(grid, 'column');
    grid.buttonColumn.alignment = ['fill', 'top'];
    grid.buttonColumn.alignChildren = ['left', 'center'];

    return grid;
}
