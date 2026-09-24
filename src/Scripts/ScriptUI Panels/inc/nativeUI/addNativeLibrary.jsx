/**
 * Adds a library: a list of items and categories to browse and run, with a field to search and run them
 * by typing. The native version of <code>DuScriptUI.library</code>, with the same options and callbacks.<br />
 * The list isn't refreshed by a timer: <code>options.refreshInterval</code> is ignored, and the libraries
 * which set one have a refresh button instead, which is enough for native lists.
 * @param {Group|Panel|Window} container - Where to add the library.
 * @param {Object} library - The library: key/value pairs, the values being the items and categories,
 * with their <code>libType</code>, <code>data</code>, <code>icon</code>, <code>editableData</code>
 * and <code>editableItem</code>, the keys their names.
 * @param {Object} [options] - The options of <code>DuScriptUI.library</code>.
 * @return {Group} The library. Its <code>list</code> is the list box, <code>currentCategory</code> the category shown.
 * Set its <code>onRun</code>, <code>onAltRun</code>, <code>onCtrlRun</code>, <code>onCtrlAltRun</code>,
 * <code>onEditData</code>, <code>onAltEditData</code>, <code>onFolderOpened</code>, <code>onFolderEdited</code>,
 * <code>onAddItem</code>, <code>onAddCategory</code>, <code>onEditItem</code>, <code>onRemoveItem</code>
 * and <code>onRefresh</code> callbacks.
 */
function addNativeLibrary(container, library, options) {
    options = def(options, {});
    options.runButton = def(options.runButton, true);
    options.editDataButton = def(options.editDataButton, false);
    options.folderButton = def(options.folderButton, true);
    options.canEditFolder = def(options.canEditFolder, false);
    options.editListButtons = def(options.editListButtons, true);
    options.defaultItemIcon = def(options.defaultItemIcon, '');
    options.itemName = def(options.itemName, i18n._p("project", "Item")); /// TRANSLATORS: an item in the After Effects project
    options.runHelpTip = def(options.runHelpTip, i18n._p("file", "Run")); /// TRANSLATORS: as in "run script"
    options.folderHelpTip = def(options.folderHelpTip, i18n._("Open folder"));
    options.addItemHelpTip = def(options.addItemHelpTip, i18n._("Add item or category"));
    options.editItemHelpTip = def(options.editItemHelpTip, i18n._("Edit item or category"));
    options.removeItemHelpTip = def(options.removeItemHelpTip, i18n._("Remove item or category"));
    options.editDataHelpTip = def(options.editDataHelpTip, '');
    options.sortButton = def(options.sortButton, true);
    options.refreshButton = def(options.refreshButton, false);

    var duLibrary = addNativeGroup(container, 'column');
    duLibrary.alignment = ['fill', 'fill'];
    duLibrary.library = library;
    duLibrary.currentCategory = library;
    duLibrary.sortMode = 'up';

    // The names of the categories opened, from the root.
    var currentCommand = [];

    // The properties of the library objects which aren't items.
    var libProperties = { libType: true, icon: true, data: true, editableData: true, editableItem: true };

    // Adds an item of the library to the list.
    function addListItem( name, val, libType, defaultIcon ) {
        var item = libList.add('item', name);
        item.libType = libType;
        item.data = val.data;
        item.editableItem = val.editableItem;
        item.editableData = val.editableData;
        try { item.image = val.icon == '' ? defaultIcon : val.icon; }
        catch(e) {}
    }

    function setCategory( cat ) {
        duLibrary.onRefresh( cat );

        duLibrary.currentCategory = cat;
        updateSortButton();

        if (duLibrary.sortMode != 'none') cat = DuJSObj.sort(cat, false, function( a, b ) {
            var aType = cat[a].libType;
            var bType = cat[b].libType;
            var r = duLibrary.sortMode == 'down' ? -1 : 1;
            // Categories go first no matter what
            if (aType == 'category' && bType == 'item') return -r;
            else if (aType == 'item' && bType == 'category') return r;
            // Alphabetical
            if (a < b) return -r;
            if (a > b) return r;
            return 0;
        });

        libList.removeAll();

        if (duLibrary.currentCategory != duLibrary.library) {
            var parent = libList.add('item', '..');
            parent.image = nativeImage(DuScriptUI.Icon.PARENT);
            parent.libType = 'parent';
            parent.data = '';
            parent.editableItem = false;
            parent.editableData = false;
        }

        for (var i in cat) {
            if (!cat.hasOwnProperty(i)) continue;
            if (libProperties[i] === true) continue;
            var val = cat[i];
            // ignore unknown types
            if (typeof val.libType === 'undefined') continue;
            if (val.libType == 'item') {
                val.icon = def(val.icon, options.defaultItemIcon);
                val.data = def(val.data, '');
                val.editableData = def(val.editableData, false);
                val.editableItem = def(val.editableItem, false);
                addListItem(i, val, 'item', options.defaultItemIcon);
            }
            else {
                val.icon = def(val.icon, nativeImage(DuScriptUI.Icon.FOLDER_CLOSED));
                val.data = def(val.data, '');
                val.editableData = false;
                val.editableItem = def(val.editableItem, false);
                addListItem(i, val, 'category', nativeImage(DuScriptUI.Icon.FOLDER_CLOSED));
            }
        }

        updateButtons();
    }

    function updateCategory() {
        var cat = duLibrary.library;
        duLibrary.onRefresh( cat );
        for (var i = 0; i < currentCommand.length; i++) {
            if (!cat[currentCommand[i]]) break;
            cat = cat[currentCommand[i]];
            if (cat) duLibrary.onRefresh( cat );
        }
        setCategory(cat);
    }

    function updateBreadCrumbs() {
        tipLabel.text = currentCommand.join(' > ');
    }

    function openCategory( name ) {
        currentCommand.push(name);
        updateBreadCrumbs();
        updateCategory();
        cmdEdit.text = '';
    }

    function openParent() {
        currentCommand.pop();
        updateBreadCrumbs();
        updateCategory();
        cmdEdit.text = '';
    }

    // Filters the list with what's typed; a trailing space opens the first category listed.
    function parseCmd() {
        var currentCmd = cmdEdit.text;

        if ( DuString.endsWith(currentCmd, ' >')) return;
        if ( DuString.fullTrim(currentCmd) == '') {
            updateCategory();
            return;
        }

        if (!DuString.endsWith(currentCmd, ' ')) {
            var search = currentCmd.toLowerCase();
            setCategory(duLibrary.currentCategory);
            for (var i = libList.items.length -1; i >= 0; i--) {
                if (libList.items[i].text.toLowerCase().indexOf(search) < 0) libList.remove(i);
            }
            updateButtons();
            return;
        }

        if (libList.items.length > 0 && currentCmd.length > 0) {
            var item = libList.items[0];
            if (item.libType == 'parent') openParent();
            else if (item.libType == 'category') openCategory(item.text);
        }
    }

    // Runs the first item listed, from the field.
    function run() {
        parseCmd();
        cmdEdit.text = cmdEdit.text + ' ';
        parseCmd();
        if (libList.items.length == 0) {
            cmdEdit.text = '';
            parseCmd();
            tipLabel.text = i18n._("Item not found.");
            return;
        }
        var item = libList.items[0];
        if (item.libType == 'item') {
            duLibrary.onRun(item);
            cmdEdit.text = '';
            parseCmd();
        }
    }

    duLibrary.runItem = function( modifier ) {
        var item = libList.selection;
        if (!item) return;
        modifier = def(modifier, '');

        if (item.libType == 'parent') {
            openParent();
            return;
        }

        if (item.libType == 'category') {
            openCategory(item.text);
            return;
        }

        if (modifier == 'alt') duLibrary.onAltRun(item);
        else if (modifier == 'ctrl') duLibrary.onCtrlRun(item);
        else if (modifier == 'ctrlAlt') duLibrary.onCtrlAltRun(item);
        else duLibrary.onRun(item);

        cmdEdit.text = '';
        parseCmd();
    };

    duLibrary.clear = function() {
        currentCommand = [];
        cmdEdit.text = '';
        updateBreadCrumbs();
        updateCategory();
    };

    duLibrary.refresh = function() {
        if (!duLibrary.visible) return;
        setCategory(duLibrary.currentCategory);
        updateBreadCrumbs();
    };

    duLibrary.sort = function( mode ) {
        duLibrary.sortMode = mode;
        duLibrary.onRefresh(duLibrary.currentCategory);
        setCategory(duLibrary.currentCategory);
        updateBreadCrumbs();
    };

    duLibrary.setLibrary = function( newLib ) {
        duLibrary.library = newLib;
        updateCategory();
    };

    // The field

    var cmdGroup = addNativeGroup(duLibrary, 'row');
    cmdGroup.alignment = ['fill', 'top'];
    cmdGroup.spacing = 3;

    var clearButton = addNativeButton(cmdGroup, '', DuScriptUI.Icon.CLOSE, i18n._("Remove all"));
    clearButton.alignment = ['left', 'center'];
    clearButton.onClick = duLibrary.clear;

    // Native fields have no place holder: it's in the help tip.
    var cmdEdit = cmdGroup.add('edittext', undefined, '');
    cmdEdit.alignment = ['fill', 'center'];
    cmdEdit.helpTip = i18n._("Start typing..."); /// TRANSLATORS: start typing a command in a command line interface
    cmdEdit.onChanging = parseCmd;
    cmdEdit.addEventListener('keydown', function(e) {
        if (e.keyName == 'Enter') run();
    });

    var tipLabel = duLibrary.add('statictext', undefined, '');
    tipLabel.alignment = ['fill', 'top'];

    // The list, and its buttons on the right

    var listGroup = addNativeGroup(duLibrary, 'row');
    listGroup.alignment = ['fill', 'fill'];
    listGroup.alignChildren = ['fill', 'fill'];

    var libList = listGroup.add('listbox');
    libList.alignment = ['fill', 'fill'];
    libList.onDoubleClick = function() { duLibrary.runItem(); };
    libList.onChange = updateButtons;
    duLibrary.list = libList;

    var listButtonsGroup = addNativeGroup(listGroup, 'column');
    listButtonsGroup.alignment = ['right', 'fill'];
    listButtonsGroup.alignChildren = ['right', 'top'];

    // An icon button of the column.
    function addListButton( image, helpTip ) {
        var button = addNativeButton(listButtonsGroup, '', image, helpTip);
        button.alignment = ['right', 'top'];
        return button;
    }

    duLibrary.runButton = addListButton(options.runButton ? DuScriptUI.Icon.RUN : DuScriptUI.Icon.CHECK, options.runHelpTip);
    duLibrary.runButton.onClick = function() { duLibrary.runItem(); };
    duLibrary.runButton.onAltClick = function() { duLibrary.runItem('alt'); };
    duLibrary.runButton.onCtrlClick = function() { duLibrary.runItem('ctrl'); };
    duLibrary.runButton.onCtrlAltClick = function() { duLibrary.runItem('ctrlAlt'); };

    if (options.editDataButton) {
        duLibrary.editDataButton = addListButton(DuScriptUI.Icon.EDIT, options.editDataHelpTip);
        duLibrary.editDataButton.onClick = function() {
            var selection = libList.selection;
            if (!selection || !selection.editableData) return;
            duLibrary.onEditData( selection );
        };
        duLibrary.editDataButton.onAltClick = function() {
            var selection = libList.selection;
            if (!selection || !selection.editableData) return;
            duLibrary.onAltEditData( selection );
        };
    }

    if (options.folderButton) {
        var folderButton = addListButton(DuScriptUI.Icon.FOLDER_CLOSED, options.folderHelpTip);
        folderButton.onClick = function() {
            duLibrary.onFolderOpened(libList.selection, duLibrary.currentCategory);
        };
        if (options.canEditFolder) folderButton.onAltClick = function() {
            duLibrary.onFolderEdited(libList.selection, duLibrary.currentCategory);
        };
    }

    // The sort button cycles through its modes: none, up, down.
    var sortModes = ['none', 'up', 'down'];
    var sortImages = [DuScriptUI.Icon.SORT, DuScriptUI.Icon.SORT_UP, DuScriptUI.Icon.SORT_DOWN];

    function updateSortButton() {
        if (!options.sortButton) return;
        for (var i = 0; i < sortModes.length; i++) {
            if (sortModes[i] == duLibrary.sortMode) duLibrary.srtButton.control.image = nativeImage(sortImages[i]);
        }
    }

    if (options.sortButton) {
        duLibrary.srtButton = addListButton(DuScriptUI.Icon.SORT_UP, '');
        duLibrary.srtButton.onClick = function() {
            for (var i = 0; i < sortModes.length; i++) {
                if (sortModes[i] != duLibrary.sortMode) continue;
                duLibrary.sort(sortModes[(i + 1) % sortModes.length]);
                return;
            }
            duLibrary.sort('up');
        };
    }

    if (options.refreshButton) {
        var refreshButton = addListButton(DuScriptUI.Icon.UPDATE, i18n._("Refresh")); /// TRANSLATORS: refresh a list
        refreshButton.onClick = duLibrary.refresh;
    }

    var addItemButton = null;
    var removeItemButton = null;

    if (options.editListButtons) {
        // Built right away: the popups of the panels are tied to its buttons.
        addItemButton = addNativeMenuButton(listButtonsGroup, '', DuScriptUI.Icon.ADD, options.addItemHelpTip);
        addItemButton.alignment = ['right', 'bottom'];
        addItemButton.build = function() {
            duLibrary.addItemButton = this.addButton(options.itemName);
            duLibrary.addCategoryButton = this.addButton(i18n._("Category"));
        };
        addItemButton.ensureBuilt();

        duLibrary.addItemButton.onClick = function() {
            duLibrary.onAddItem(duLibrary.currentCategory);
        };
        duLibrary.addCategoryButton.onClick = function() {
            duLibrary.onAddCategory(duLibrary.currentCategory);
        };

        duLibrary.editItemButton = addListButton(DuScriptUI.Icon.EDIT, options.editItemHelpTip);
        duLibrary.editItemButton.alignment = ['right', 'bottom'];
        duLibrary.editItemButton.onClick = function() {
            var selection = libList.selection;
            if (!selection || !selection.editableItem) return;
            duLibrary.onEditItem(selection, duLibrary.currentCategory);
        };

        removeItemButton = addListButton(DuScriptUI.Icon.REMOVE, options.removeItemHelpTip);
        removeItemButton.alignment = ['right', 'bottom'];
        removeItemButton.onClick = function() {
            var selection = libList.selection;
            if (!selection || selection.libType == 'parent') return;
            duLibrary.onRemoveItem(selection, duLibrary.currentCategory);
        };
    }

    // Shows the buttons which can act on the selected item.
    function updateButtons() {
        var item = libList.selection;
        if (options.editDataButton) duLibrary.editDataButton.visible = item ? item.editableData : false;
        if (options.editListButtons) {
            duLibrary.editItemButton.visible = item ? item.editableItem : false;
            removeItemButton.visible = item ? duLibrary.currentCategory.editableItem && item.editableItem : false;
            addItemButton.visible = duLibrary.currentCategory.editableItem;
        }
    }

    duLibrary.onRun = function() {};
    duLibrary.onAltRun = function() {};
    duLibrary.onCtrlRun = function() {};
    duLibrary.onCtrlAltRun = function() {};
    duLibrary.onEditData = function() {};
    duLibrary.onAltEditData = function() {};
    duLibrary.onFolderOpened = function() {};
    duLibrary.onFolderEdited = function() {};
    duLibrary.onAddItem = function() {};
    duLibrary.onAddCategory = function() {};
    duLibrary.onEditItem = function() {};
    duLibrary.onRemoveItem = function() {};
    duLibrary.onRefresh = function() {};

    setCategory(duLibrary.library);

    return duLibrary;
}
