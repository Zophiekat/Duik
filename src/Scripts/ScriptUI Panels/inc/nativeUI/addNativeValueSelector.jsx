/**
 * Adds a drop down list whose items stand for values, like the sides or the locations of a layer.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {Array[]} items - The items, as <code>[text, image, value]</code> arrays.
 * @param {*} [value] - The value of the selected item. The first item is selected when none has it.
 * @param {string} [helpTip=''] - The help tip.
 * @return {DropDownList} The list, from {@link addNativeDropdown}. Its <code>getValue()</code> method returns the
 * value of the selected item, <code>setValue(value)</code> selects the item with the value, if there's one,
 * <code>selectText(text)</code> the item with the text, and <code>setItems(items, value)</code> replaces the items.<br />
 * A native list may run <code>onChange</code> when the selection is changed from the code: these methods set
 * <code>freeze</code> to true meanwhile, for <code>onChange</code> to check first.
 */
function addNativeValueSelector(container, items, value, helpTip) {
    var values = [];

    var list = addNativeDropdown(container, []);
    list.helpTip = def(helpTip, '');
    list.freeze = false;

    list.getValue = function() {
        return values[list.selection ? list.selection.index : 0];
    };

    list.setValue = function(value) {
        for (var i = 0, n = values.length; i < n; i++) {
            if (values[i] != value) continue;
            list.freeze = true;
            list.selection = i;
            list.freeze = false;
            return;
        }
    };

    list.selectText = function(text) {
        for (var i = 0, n = list.items.length; i < n; i++) {
            if (list.items[i].text != text) continue;
            list.freeze = true;
            list.selection = i;
            list.freeze = false;
            return;
        }
    };

    list.setItems = function(items, value) {
        list.freeze = true;
        list.removeAll();
        values = [];
        for (var i = 0, n = items.length; i < n; i++) {
            var item = list.add('item', items[i][0]);
            if (items[i][1]) item.image = nativeImage(items[i][1]);
            values.push(items[i][2]);
        }
        if (items.length > 0) list.selection = 0;
        list.freeze = false;
        if (isdef(value)) list.setValue(value);
    };

    list.setItems(items, value);

    return list;
}
