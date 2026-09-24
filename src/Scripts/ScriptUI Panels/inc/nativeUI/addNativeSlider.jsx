/**
 * Adds a slider, with a field for its value. The native version of <code>DuScriptUI.slider</code>.
 * @param {Group|Panel|Window} container - Where to add the slider.
 * @param {Number} value - The value.
 * @param {Number} min - The minimum value.
 * @param {Number} max - The maximum value.
 * @param {string} [label=''] - The name of the value, before its field.
 * @param {string} [suffix=''] - The unit of the value, after its field.
 * @param {Object} [options] - More options.
 * @param {string} [options.orientation='column'] - 'column' puts the field under the slider, 'row' next to it.
 * @param {Boolean} [options.inverted=false] - Puts the maximum value on the left.
 * @param {string} [options.textAlignment='center'] - Where the field is under the slider: 'left', 'center' or 'right'.
 * @param {Number[]} [options.valueButtons=[]] - Values set with a click, as small buttons next to the field:
 * before it when it's on the right, after it otherwise.
 * @return {Group} The slider. Its <code>value</code> is the current value and <code>setValue(value)</code> changes it.
 * <code>onChanging</code> runs while it's being changed, <code>onChange</code> once it's changed.
 */
function addNativeSlider(container, value, min, max, label, suffix, options) {
    label = def(label, '');
    suffix = def(suffix, '');
    options = def(options, {});
    var orientation = def(options.orientation, 'column');
    var inverted = def(options.inverted, false);
    var valueButtons = def(options.valueButtons, []);
    var textAlignment = def(options.textAlignment, 'center');
    // Like Duik's sliders, the buttons push a centered field to the right.
    if (valueButtons.length > 0 && textAlignment == 'center') textAlignment = 'right';

    var group = addNativeGroup(container, orientation);
    group.alignment = ['fill', 'top'];
    group.value = value;
    group.onChanging = function() {};
    group.onChange = function() {};

    // The position of a value on the slider, which is reversed when the slider is inverted.
    function toSlider(val) {
        return inverted ? max - val + min : val;
    }

    function fromSlider() {
        return Math.round(toSlider(slider.value));
    }

    var slider = group.add('slider', undefined, toSlider(value), min, max);
    slider.alignment = ['fill', 'center'];

    var valueGroup = addNativeGroup(group, 'row');
    if (orientation == 'row') valueGroup.alignment = ['right', 'center'];
    else valueGroup.alignment = [textAlignment, 'top'];

    function addValueButton(val) {
        var button = valueGroup.add('button', undefined, '' + val);
        // A native button is much wider than its text by default: it's given the width of the text.
        var ruler = valueGroup.add('statictext', undefined, '' + val);
        button.preferredSize.width = ruler.preferredSize[0] + 14;
        valueGroup.remove(ruler);
        button.onClick = function() {
            group.setValue(val);
            group.onChange();
        };
    }

    function addValueButtons() {
        for (var i = 0, n = valueButtons.length; i < n; i++) addValueButton(valueButtons[i]);
    }

    if (textAlignment == 'right') addValueButtons();

    if (label != '') valueGroup.add('statictext', undefined, label + ':');
    var edit = valueGroup.add('edittext', undefined, '' + value);
    edit.characters = Math.max(('' + min).length, ('' + max).length) + 1;
    if (suffix != '') valueGroup.add('statictext', undefined, suffix);

    if (textAlignment != 'right') addValueButtons();

    group.setValue = function(val) {
        val = Number(val);
        if (isNaN(val)) return;
        group.value = val;
        edit.text = '' + val;
        slider.value = toSlider(val);
    };

    slider.onChanging = function() {
        group.value = fromSlider();
        edit.text = '' + group.value;
        group.onChanging();
    };

    slider.onChange = function() {
        group.value = fromSlider();
        edit.text = '' + group.value;
        group.onChange();
    };

    edit.onChanging = function() {
        var val = parseInt(edit.text, 10);
        if (isNaN(val)) return;
        group.value = val;
        slider.value = toSlider(val);
        group.onChanging();
    };

    edit.onChange = function() {
        var val = parseInt(edit.text, 10);
        if (isNaN(val)) val = group.value;
        val = Math.min(max, Math.max(min, val));
        group.setValue(val);
        group.onChange();
    };

    return group;
}
