/**
 * Adds a form: the labels in a column, with their fields next to them.
 * @param {Group|Panel|Window} container - Where to add the form.
 * @return {Group} The form. Add a field with <code>addField(label, type, value, helpTip)</code>, which returns
 * the label and the field, or add controls to its <code>labels</code> and <code>buttons</code> groups.
 */
function addNativeForm(container) {
    var form = addNativeGroup(container, 'row');
    form.alignment = ['fill', 'top'];
    form.alignChildren = ['fill', 'top'];

    form.labels = addNativeGroup(form, 'column');
    form.labels.alignment = ['left', 'top'];
    form.labels.alignChildren = ['left', 'bottom'];

    form.buttons = addNativeGroup(form, 'column');
    form.buttons.alignment = ['fill', 'top'];
    form.buttons.alignChildren = ['fill', 'fill'];

    form.addField = function(label, type, value, helpTip) {
        helpTip = def(helpTip, '');

        var field = form.buttons.add(type, undefined, value);
        field.helpTip = helpTip;

        var labelText = form.labels.add('statictext', undefined, label);
        labelText.helpTip = helpTip;
        labelText.minimumSize.height = labelText.maximumSize.height = field.preferredSize[1];

        return [labelText, field];
    };

    return form;
}
