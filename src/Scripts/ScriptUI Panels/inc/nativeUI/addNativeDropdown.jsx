/**
 * Adds a drop down list of items with images.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {Array[]} items - The items, as <code>[text, image, helpTip]</code> arrays.
 * The help tips of the items are listed in the help tip of the list.
 * @param {int} [index=0] - The index of the selected item.
 * @param {int} [height] - The height of the list in pixels, or the height set by a layout.
 * A native list may keep its own height whatever this asks for.
 * @return {DropDownList} The list.
 */
function addNativeDropdown(container, items, index, height) {
    index = def(index, 0);

    var list = container.add('dropdownlist');
    list.alignment = ['fill', 'center'];

    height = def(height, nativeLayoutSize(container).height);
    if (height > 0) list.preferredSize.height = height;

    var tips = [];
    for (var i = 0, n = items.length; i < n; i++) {
        var item = list.add('item', items[i][0]);
        if (items[i][1]) item.image = nativeImage(items[i][1]);
        if (items[i][2] && items[i][2] != items[i][0]) tips.push(items[i][0] + ': ' + items[i][2]);
    }
    list.helpTip = tips.join('\n\n');

    if (index < 0 || index >= items.length) index = 0;
    if (items.length > 0) list.selection = index;

    return list;
}
