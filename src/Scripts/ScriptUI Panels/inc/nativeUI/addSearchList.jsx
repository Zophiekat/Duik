/**
 * Adds a list to pick an item from: a button showing the selected item, which opens a popup
 * with a search field and the items. A native drop down menu can't hold a search field.<br />
 * The items are <code>{ name, key }</code>. The key and name of the list are the ones of the
 * selected item: 0 and an empty string for None.<br />
 * Searching only filters the popup: the selection changes when an item is clicked,
 * which calls <code>onChange</code>. Selecting an item from the code doesn't.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {DuBinary} image - The icon of the list and its items.
 * @param {string} pickTip - The help tip of the eyedropper button, <code>pickButton</code>.
 * @param {string} [helpTip] - The help tip of the list.
 * @param {int} [height=12] - The height of the button in pixels. A layout can set it instead.
 * @return {Object} The list, with its <code>select(key)</code> and <code>setItems(items, key)</code> methods.
 */
function addSearchList(container, image, pickTip, helpTip, height) {
    image = nativeImage(image);

    var noneText = i18n._p("Select", "None");
    var dropArrow = '  ▾';

    var searchList = {
        key: 0,
        name: '',
        items: [],
        onChange: function() {}
    };

    var group = container.add('group');
    group.orientation = 'row';
    group.alignment = ['fill', 'top'];
    group.margins = 0;
    group.spacing = 2;

    // Slimmer than the default native buttons, unless a layout or the call sets a height.
    var buttonHeight = def(height, nativeLayoutSize(container).height);
    if (buttonHeight <= 0) buttonHeight = 12;

    var icon = group.add('image', undefined, image);
    icon.alignment = ['left', 'center'];

    // Some room between the icon and the button.
    var iconSpace = group.add('group');
    iconSpace.preferredSize.width = 4;

    var button = group.add('button', undefined, noneText + dropArrow);
    button.alignment = ['fill', 'center'];
    button.preferredSize.height = buttonHeight;
    if (isdef(helpTip)) button.helpTip = helpTip;

    searchList.pickButton = group.add('iconbutton', undefined, nativeImage(w12_eye_dropper), { style: 'button' });
    searchList.pickButton.alignment = ['right', 'center'];
    searchList.pickButton.preferredSize.height = buttonHeight;
    searchList.pickButton.helpTip = pickTip;

    var popup = new Window('palette', '', undefined, { borderless: true });
    popup.margins = 2;
    popup.spacing = 2;
    popup.alignChildren = ['fill', 'top'];

    var list = popup.add('listbox');
    list.alignment = ['fill', 'fill'];

    // The search field is below the list, right above the cursor.
    var searchGroup = popup.add('group');
    searchGroup.orientation = 'row';
    searchGroup.margins = 0;
    searchGroup.spacing = 2;

    var search = searchGroup.add('edittext');
    search.alignment = ['fill', 'center'];
    search.helpTip = i18n._("Search");

    var searchIcon = searchGroup.add('image', undefined, nativeImage(w12_search));
    searchIcon.alignment = ['right', 'center'];

    // Filling the list triggers its onChange event, which is ignored meanwhile.
    var filling = false;

    // Shows None and the items whose name contains the search. Nothing is selected
    // in the list, so that clicking any item picks it.
    function fill() {
        filling = true;
        list.removeAll();
        var none = list.add('item', noneText);
        none.key = 0;
        var text = search.text.toLowerCase();
        for (var i = 0, n = searchList.items.length; i < n; i++) {
            var it = searchList.items[i];
            if (it.name.toLowerCase().indexOf(text) < 0) continue;
            var item = list.add('item', it.name);
            item.image = image;
            item.key = it.key;
        }
        filling = false;
    }
    search.onChanging = fill;

    list.onChange = function() {
        if (filling || !list.selection) return;
        var key = list.selection.key;
        popup.hide();
        if (key == searchList.key) return;
        searchList.select(key);
        searchList.onChange();
    }

    popup.onDeactivate = function() { popup.hide(); };
    popup.addEventListener('keydown', function(e) {
        if (e.keyName == 'Escape') popup.hide();
    });

    // Where the button and the cursor are on screen is only known from a mouse event:
    // this is the left of the button, and the height of the cursor.
    var clickLocation = null;
    button.addEventListener('mousedown', function(e) {
        clickLocation = [e.screenX - e.clientX, e.screenY];
    });

    button.onClick = function() {
        search.text = '';
        fill();

        list.minimumSize.width = list.maximumSize.width = Math.max(button.size.width, 200);
        list.minimumSize.height = list.maximumSize.height = 200;
        popup.layout.layout(true);
        popup.layout.resize();

        // Opens above the cursor, aligned with the button.
        if (clickLocation) popup.location = DuScriptUI.moveInsideScreen(
            [clickLocation[0], clickLocation[1] - popup.frameSize.height],
            popup.frameSize
        );
        else popup.center();

        popup.show();
        search.active = true;
    }

    // Selects the item with the key, or None. Doesn't call onChange.
    searchList.select = function(key) {
        searchList.key = 0;
        searchList.name = '';
        button.text = noneText + dropArrow;
        for (var i = 0, n = searchList.items.length; i < n; i++) {
            if (searchList.items[i].key != key) continue;
            searchList.key = key;
            searchList.name = searchList.items[i].name;
            button.text = searchList.name + dropArrow;
            break;
        }
    }

    searchList.setItems = function(items, key) {
        searchList.items = items;
        searchList.select(key);
    }

    // Enables or disables the list and its eyedropper.
    searchList.enable = function(enabled) {
        group.enabled = enabled;
    }

    return searchList;
}
