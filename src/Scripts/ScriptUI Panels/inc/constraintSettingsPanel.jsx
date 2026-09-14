/**
 * Builds the constraint settings, which show and set the target of the selected copy
 * location, copy rotation or armature constraint.<br />
 * They're built in the Links and constraints panel, and in their own dockable panel,
 * <i>Duik Constraint Settings.jsx</i>.
 * @param {Group} container - The group to build the settings into.
 * @param {DuTitleBar} [titleBar] - The title bar to add the refresh button to.
 * When omitted, a title bar is created at the top of the container.
 * @return {Object} The settings, with a <code>refresh()</code> method showing what the
 * selected constraint points at.
 */
function buildConstraintSettingsUI(container, titleBar) {
    // The copy location, copy rotation and armature constraints look their target up by name.
    // The target can't live in the effect: an After Effects effect has no parameter
    // type able to hold or display a name, and effect parameters can't be renamed.
    var settingsCompList;
    var settingsLayerList;
    var settingsTargetText;
    var restPoseButton;

    var noneText = i18n._p("Select", "None");
    var dropArrow = '  \u25BE';

    function settingsComp() {
        if (!settingsCompList.key) return null;
        return DuAEProject.getItemById(settingsCompList.key);
    }

    function settingsTarget() {
        var comp = settingsComp();
        if (!comp) return null;
        var index = settingsLayerList.key;
        if (!index || index > comp.numLayers) return null;
        return { comp: comp, layer: comp.layer(index) };
    }

    // Lists the layers of a composition, and selects one of them.
    function listLayers(comp, layer) {
        var layers = [];
        if (comp) {
            for (var i = 1, n = comp.numLayers; i <= n; i++)
                layers.push({ name: comp.layer(i).name, key: i });
        }
        settingsLayerList.setItems(layers, layer ? layer.index : 0);
    }

    // Lists the compositions of the project and the layers of one of them, and selects the target.
    function listTarget(comp, layer) {
        var comps = DuAEProject.getComps();
        var items = [];
        for (var i = 0, n = comps.length; i < n; i++)
            items.push({ name: comps[i].name, key: comps[i].id });
        settingsCompList.setItems(items, comp ? comp.id : 0);
        listLayers(comp, layer);
    }

    // The layer with the name in a composition, looked up like the expression of the constraint does.
    function layerByName(comp, name) {
        if (!comp || name == '') return null;
        try { return comp.layer(name); }
        catch (e) { return null; }
    }

    // Shows what the selected constraint effect currently points at, and returns it
    // like Duik.Constraint.getTarget does.
    function showCurrentTarget() {
        var target = Duik.Constraint.getTarget();
        if (!target) settingsTargetText.text = i18n._("Select a copy location, copy rotation or armature effect.");
        else if (target.comp == '') settingsTargetText.text = target.effect + ': ' + i18n._("no target");
        else settingsTargetText.text = target.effect + ': ' + target.comp + ' / ' + target.layer;
        // Only an armature constraint with a target has a rest pose to set.
        restPoseButton.enabled = target != null && target.restPose && target.comp != '';
        return target;
    }

    // Shows what the selected constraint effect currently points at and puts its target
    // in the lists, listing the compositions and layers again. Doesn't set the target.
    function refreshConstraintTarget() {
        var target = showCurrentTarget();
        if (!target) {
            // Keep the target being picked.
            var current = settingsTarget();
            listTarget(settingsComp(), current ? current.layer : null);
            return;
        }

        // Looked up by name, like the expression of the constraint does.
        // The lists are set to None when there's no target, or it can't be found anymore.
        var comp = null;
        var comps = DuAEProject.getComps();
        for (var i = 0, n = comps.length; i < n; i++) {
            if (comps[i].name == target.comp) {
                comp = comps[i];
                break;
            }
        }

        listTarget(comp, layerByName(comp, target.layer));
    }

    // Points the selected constraint effect at the target picked in the lists.
    function setConstraintTarget() {
        var t = settingsTarget();
        if (!t) return;
        Duik.Constraint.setTarget(t.comp, t.layer);
        showCurrentTarget();
    }

    // A list to pick an item from: a button showing the selected item, which opens a popup
    // with a search field and the items. A native drop down menu can't hold a search field.
    // The items are { name, key }. The key and name of the list are the ones of the
    // selected item: 0 and an empty string for None.
    // Searching only filters the popup: the selection changes when an item is clicked,
    // which calls onChange. Selecting an item from the code doesn't.
    function addSearchList(image, pickTip) {
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

        // Slimmer than the default native buttons.
        var buttonHeight = 18;

        var icon = group.add('image', undefined, image);
        icon.alignment = ['left', 'center'];

        // Some room between the icon and the button.
        var iconSpace = group.add('group');
        iconSpace.preferredSize.width = 4;

        var button = group.add('button', undefined, noneText + dropArrow);
        button.alignment = ['fill', 'center'];
        button.preferredSize.height = buttonHeight;

        searchList.pickButton = group.add('iconbutton', undefined, w12_eye_dropper.binAsString, { style: 'button' });
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

        var searchIcon = searchGroup.add('image', undefined, w12_search.binAsString);
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

        return searchList;
    }

    // The dockable panel has no sub-panel title bar, so it gets its own.
    if (!titleBar) titleBar = DuScriptUI.titleBar( container, i18n._("Constraint settings"), false, false );

    // The controls are native After Effects ones rather than Duik ones: they respond instantly.
    var refreshButton = titleBar.add(
        'iconbutton',
        undefined,
        w12_blender_icon_file_refresh.binAsString,
        { style: 'button' }
    );
    refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
        i18n._("Show what the selected copy location, copy rotation or armature constraint points at, and update the lists of compositions and layers.");
    refreshButton.alignment = ['left', 'center'];
    refreshButton.onClick = refreshConstraintTarget;

    DuScriptUI.separator( container, i18n._("Current target") );

    settingsTargetText = container.add(
        'statictext',
        undefined,
        i18n._("Select a copy location, copy rotation or armature effect."),
        { multiline: true }
    );
    settingsTargetText.alignment = ['fill', 'top'];
    settingsTargetText.minimumSize = [-1, 48];

    DuScriptUI.separator( container, i18n._("Set target") );

    DuScriptUI.staticText(
        container,
        i18n._("Target Composition") + ':',
        undefined,
        false
    );

    settingsCompList = addSearchList(w12_comp.binAsString, i18n._("Pick the active composition."));
    // Picking a composition or a layer, in the lists or with the eyedroppers, sets the target
    // right away; refreshing only fills the lists. The eyedroppers can set it only while the
    // constraint effect is still selected in the active composition.
    settingsCompList.onChange = function() {
        // Keep the layer with the same name in the new composition, if there's one.
        var comp = settingsComp();
        listLayers(comp, layerByName(comp, settingsLayerList.name));
        setConstraintTarget();
    }
    settingsCompList.pickButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;
        listTarget(comp, layerByName(comp, settingsLayerList.name));
        setConstraintTarget();
    }

    DuScriptUI.staticText(
        container,
        i18n._("Target Layer") + ':',
        undefined,
        false
    );

    settingsLayerList = addSearchList(w12_layers.binAsString, i18n._("Pick the selected layer of the active composition."));
    settingsLayerList.onChange = setConstraintTarget;
    settingsLayerList.pickButton.onClick = function() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return;
        // The layer of the selected constraint effect is selected too, but can't be its own target.
        var constraint = Duik.Constraint.getTargetConstraints()[0];
        var layers = comp.selectedLayers;
        for (var i = 0, n = layers.length; i < n; i++) {
            if (constraint && constraint.layer.index == layers[i].index) continue;
            listTarget(comp, layers[i]);
            setConstraintTarget();
            return;
        }
    }

    DuScriptUI.separator( container, i18n._("Rest pose") );

    // An armature constraint takes the rest pose when its target is set; this takes it again.
    restPoseButton = container.add('button', undefined, i18n._("Set rest pose"));
    restPoseButton.helpTip = i18n._("Take the current pose of the target of the selected armature constraint as its rest pose: the pose in which the constraint doesn't move the layer.");
    restPoseButton.alignment = ['fill', 'top'];
    restPoseButton.enabled = false;
    restPoseButton.onClick = function() {
        Duik.Constraint.setRestPose();
        showCurrentTarget();
    }

    listTarget(null, null);

    return { refresh: refreshConstraintTarget };
}
