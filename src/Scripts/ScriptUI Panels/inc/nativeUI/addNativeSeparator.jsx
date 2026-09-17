/**
 * Adds a separator line: an empty panel.
 * @param {Group|Panel|Window} container - Where to add the separator.
 * @param {string} [orientation='horizontal'] - 'horizontal' for a line across a column of controls,
 * 'vertical' for a line between the controls of a row.
 * @return {Panel} The separator.
 */
function addNativeSeparator(container, orientation) {
    var line = container.add('panel');
    if (def(orientation, 'horizontal') == 'vertical') {
        line.alignment = ['left', 'fill'];
        line.minimumSize.width = line.maximumSize.width = 2;
    }
    else {
        line.alignment = ['fill', 'top'];
        line.minimumSize.height = line.maximumSize.height = 2;
    }
    return line;
}
