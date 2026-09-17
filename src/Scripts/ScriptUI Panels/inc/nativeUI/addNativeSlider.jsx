/**
 * Adds a slider, with a field for its value.
 * @param {Group|Panel|Window} container - Where to add the slider.
 * @param {int} value - The value.
 * @param {int} min - The minimum value.
 * @param {int} max - The maximum value.
 * @param {string} label - The name of the value.
 * @param {string} suffix - The unit of the value.
 * @return {Group} The slider. Its <code>value</code> property is the current value.
 */
function addNativeSlider(container, value, min, max, label, suffix) {
    var group = addNativeGroup(container, 'column');
    group.alignment = ['fill', 'top'];
    group.value = value;

    var slider = group.add('slider', undefined, value, min, max);
    slider.alignment = ['fill', 'top'];

    var valueGroup = addNativeGroup(group, 'row');
    valueGroup.alignment = ['center', 'top'];
    valueGroup.add('statictext', undefined, label + ':');
    var edit = valueGroup.add('edittext', undefined, '' + value);
    edit.characters = 5;
    valueGroup.add('statictext', undefined, suffix);

    slider.onChanging = function() {
        group.value = Math.round(slider.value);
        edit.text = '' + group.value;
    };

    edit.onChange = function() {
        var val = parseInt(edit.text, 10);
        if (isNaN(val)) val = group.value;
        val = Math.min(max, Math.max(min, val));
        group.value = val;
        slider.value = val;
        edit.text = '' + val;
    };

    return group;
}
