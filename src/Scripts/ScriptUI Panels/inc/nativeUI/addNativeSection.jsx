/**
 * Adds a panel with a title, to group controls.
 * @param {Group|Panel|Window} container - Where to add the panel.
 * @param {string} title - The title.
 * @return {Panel} The panel, to add the controls to.
 */
function addNativeSection(container, title) {
    var section = container.add('panel', undefined, title);
    section.orientation = 'column';
    section.alignment = ['fill', 'top'];
    section.alignChildren = ['fill', 'top'];
    section.spacing = 2;
    return section;
}
