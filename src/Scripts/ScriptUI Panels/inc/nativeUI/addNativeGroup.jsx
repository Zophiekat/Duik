/**
 * Adds a group without margins.
 * @param {Group|Panel|Window} container - Where to add the group.
 * @param {string} orientation - 'row', 'column' or 'stack'.
 * @return {Group} The group.
 */
function addNativeGroup(container, orientation) {
    var group = container.add('group');
    group.orientation = orientation;
    group.margins = 0;
    group.spacing = 2;
    if (orientation == 'row') group.alignChildren = ['left', 'center'];
    else if (orientation == 'column') group.alignChildren = ['fill', 'top'];
    else group.alignChildren = ['fill', 'fill'];
    return group;
}
