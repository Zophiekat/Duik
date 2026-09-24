function buildToolsPanelUI(tab) {
    // A Spacer
    var spacer = tab.add('group');
    spacer.margins = 0;
    spacer.spacing = 0;
    spacer.size = [-1, 3];

    var toolsTabPanel = addNativeTabPanel(tab, 'column');

    var compTab = toolsTabPanel.addTab(
        i18n._("Composition"),
        w16_composition,
        i18n._("Composition tools (crop, change settings...)")
    );

    var layerTab = toolsTabPanel.addTab(
        i18n._("Layer"),
        w16_layers,
        i18n._("Layer manager")
    );

    var textTab = toolsTabPanel.addTab(
        i18n._("Text"),
        w16_text,
        i18n._("Text tools (rename, search and replace...)")
    );

    var devTab = toolsTabPanel.addTab(
        i18n._("Scripting"),
        w16_expression,
        i18n._("Scripting tools")
    );

    compTab.build = function() {
        function hideAllGroups() {
            compGroup.visible = false;
            compSettingsGroup.visible = false;
        }

        var mainGroup = addNativeGroup(this, 'stack');
        mainGroup.alignment = ['fill', 'fill'];

        var compGroup = addNativeGroup(mainGroup, 'column');

        // A grid with a row per button, like the Links and constraints panel: its image, then the button.
        var compGrid = addNativeButtonGrid(compGroup);
        compGrid.buttonHeight = 24;

        var cropButton = addNativeButton(
            compGrid,
            i18n._("Crop precompositions"),
            w16_crop,
            i18n._("Crops the selected precompositions using the bounds of their masks.")
        );
        cropButton.onClick = Duik.Tool.cropPrecompositions;

        var compSettingsButton = addNativeButton(
            compGrid,
            i18n._("Comp settings") + '...',
            w16_composition_settings,
            i18n._("Sets the current or selected composition(s) settings, also changing the settings of all precompositions.")
        );
        compSettingsButton.onClick = function() {
            if (!compSettingsGroup.built) {
                addNativeSubPanel(
                    compSettingsGroup,
                    i18n._("Comp settings"),
                    compGroup,
                    false
                );

                #include "compSettingsPanel.jsx"
                buildCompSettingsPanel( compSettingsGroup );

                nativeLayout(compSettingsGroup);
            }

            hideAllGroups();
            compSettingsGroup.visible = true;
        };

        var compSettingsGroup = addNativeGroup(mainGroup, 'column');
        compSettingsGroup.visible = false;
        compSettingsGroup.built = false;
    };

    textTab.build = function() {
        function hideAllGroups() {
            textGroup.visible = false;
            renameGroup.visible = false;
            replaceGroup.visible = false;
        }

        var mainGroup = addNativeGroup(this, 'stack');
        mainGroup.alignment = ['fill', 'fill'];

        var textGroup = addNativeGroup(mainGroup, 'column');

        // A grid with a row per button, like the Links and constraints panel: its image, then the button.
        var textGrid = addNativeButtonGrid(textGroup);
        textGrid.buttonHeight = 24;

        var renameButton = addNativeButton(
            textGrid,
            i18n._("Rename") + '...',
            w16_rename,
            i18n._("Renames the selected items (layers, pins, project items...)")
        );
        renameButton.onClick = function() {
            if (!renameGroup.built) {

                function generateNewName(oldName,i)
                {
                    var prefix = prefixEdit.text;
                    var suffix = suffixEdit.text;

                    var newName = nameEdit.text;
                    if (newName == '')
                    {
                        newName = oldName;
                        var removeFirst = parseInt(removeFEdit.text);
                        var removeLast = parseInt(removeLEdit.text);
                        if (removeFGroup.checked && removeFirst > 0)
                        {
                            newName = newName.substr(removeFirst);
                        }
                        if (removeLGroup.checked && removeLast > 0)
                        {
                            newName = newName.substring(0,newName.length-removeLast);
                        }
                    }
                    var newName = prefix + newName + suffix;

                    var num = parseInt(numberEdit.text);
                    if (! isNaN(num) && numberGroup.checked)
                    {
                        newName += (num + i);
                    }

                    return newName;
                }

                addNativeSubPanel(
                    renameGroup,
                    i18n._("Rename"),
                    textGroup,
                    false
                );

                var itemSelector = addNativeDropdown(renameGroup, [
                    [i18n._("Layers"), w16_layers],
                    [i18n._("Puppet pins"), w16_pin],
                    [i18n._("Project items"), w16_items]
                ], 0);

                var expButton = addNativeCheckBox(
                    renameGroup,
                    i18n._("Update expressions"),
                    w16_update_expression,
                    i18n._("Automatically updates the expressions."),
                    true
                );

                var removeFGroup = addNativeSetting( renameGroup, i18n._("Remove the first digits"));
                var removeFEdit = addNativeEditText( removeFGroup, '001', ' ' + i18n._("digits") + '.' );

                var removeLGroup = addNativeSetting( renameGroup, i18n._("Remove the last digits"));
                var removeLEdit = addNativeEditText( removeLGroup, '001', ' ' + i18n._("digits") + '.' );

                var numberGroup = addNativeSetting( renameGroup, i18n._("Number from"));
                var numberEdit = addNativeEditText( numberGroup, '001' );
                var numberReverseBox = addNativeCheckBox(
                    numberGroup,
                    i18n._("Reverse"), /// TRANSLATORS: as in "reverse numbering / reverse order"
                    null,
                    i18n._("Number from last to first.")
                );
                numberReverseBox.parent.alignment = ['right', 'center'];

                // Native fields have no place holder, so the parts of the new name have labels instead.
                var newNameForm = addNativeForm(renameGroup);
                var prefixEdit = newNameForm.addField(i18n._("Prefix") + ':', 'edittext', '')[1];
                var nameEdit = newNameForm.addField(i18n._("Name") + ':', 'edittext', '')[1];
                var suffixEdit = newNameForm.addField(i18n._("Suffix") + ':', 'edittext', '')[1];

                var validButton = addNativeValidButton(
                    renameGroup,
                    i18n._("Rename"),
                    i18n._("Renames the selected items (layers, pins, project items...)")
                );
                validButton.onClick = function() {
                    // Layers
                    if (itemSelector.selection.index == 0) {
                        var comp = DuAEProject.getActiveComp();
                        if (!comp) return;
                        var layers = comp.selectedLayers;
                        if (layers.length == 0) return;

                        DuAE.beginUndoGroup( i18n._("Rename"));
                        app.beginSuppressDialogs();

                        layers = new DuList(layers);
                        layers.do(function (layer) {
                            var oldName = layer.name;
                            var i = layers.current;
                            if ( numberReverseBox.value) i = layers.length() - i - 1;
                            var newName = generateNewName(oldName, i);

                            layer.name = newName;
                            if (expButton.value) app.project.autoFixExpressions(oldName,newName);
                        });

                        app.endSuppressDialogs(false);
                        DuAE.endUndoGroup();
                    }
                    // Pins
                    else if (itemSelector.selection.index == 1) {
                        var props = DuAEComp.getSelectedProps('ADBE FreePin3 PosPin Atom');
                        if (props.length == 0) {
                            // Try to find puppet pins on the first selected layer, if single
                            var layers = DuAEComp.getSelectedLayers();
                            if (layers.length != 1) return;
                            var layer = layers[0];
                            // Find puppet effects
                            var effects = layer.property('ADBE Effect Parade');
                            for(var i = 1; i <= effects.numProperties; i++) {
                                var effect = effects.property(i);
                                if (effect.matchName != 'ADBE FreePin3') continue;
                                var meshGroup = effect.property("ADBE FreePin3 ARAP Group").property("ADBE FreePin3 Mesh Group");
                                for (var j = 1; j <= meshGroup.numProperties; j++) {
                                    var pins = meshGroup.property(j).property("ADBE FreePin3 PosPins");
                                    for (var k = 1; k <= pins.numProperties; k++) {
                                        props.push(new DuAEProperty(pins.property(k)));
                                    }
                                }
                            }
                        }

                        DuAE.beginUndoGroup( i18n._("Rename"));
                        app.beginSuppressDialogs();

                        props = new DuList(props);
                        props.do(function(prop) {
                            var oldName = prop.getProperty().name;
                            var i = props.current;
                            if ( numberReverseBox.value) i = props.length() - i - 1;
                            var newName = generateNewName(oldName,i);
                            prop.getProperty().name = newName;
                            if (expButton.value) app.project.autoFixExpressions(oldName,newName);
                        });

                        app.endSuppressDialogs(false);
                        DuAE.endUndoGroup();
                    }
                    // Project Items
                    else {
                        var items = app.project.selection;
                        if (items.length == 0) return;

                        DuAE.beginUndoGroup( i18n._("Rename"));
                        app.beginSuppressDialogs();

                        items = new DuList(items);
                        items.do(function (item)
                        {
                            var oldName = item.name;
                            var i = items.current;
                            if ( numberReverseBox.value) i = items.length() - i - 1;
                            var newName = generateNewName(oldName,i);
                            item.name = newName;
                            if (expButton.value) app.project.autoFixExpressions(oldName,newName);
                        });

                        app.endSuppressDialogs(false);
                        DuAE.endUndoGroup();
                    }
                };

                nativeLayout(renameGroup);
            }
            hideAllGroups();
            renameGroup.visible = true;
        };

        var replaceButton = addNativeButton(
            textGrid,
            i18n._("Search and replace") + '...',
            w16_search_replace,
            i18n._("Searches and replaces text in the project.")
        );
        replaceButton.onClick = function() {
            if (!replaceGroup.built) {
                addNativeSubPanel(
                    replaceGroup,
                    i18n._("Search and replace"),
                    textGroup,
                    false
                );

                var itemSelector = addNativeDropdown(replaceGroup, [
                    [i18n._("Expressions"), w16_expression],
                    [i18n._("Texts"), w16_text],
                    [i18n._("Effects"), w16_fx],
                    [i18n._("Layers"), w16_layers],
                    [i18n._("Project items"), w16_items]
                ], 0);
                itemSelector.onChange = function() {
                    if (!itemSelector.selection) return;
                    var index = itemSelector.selection.index;
                    // The whole row of the checkbox, with its image.
                    expButton.parent.visible = index == 2 || index == 3 || index == 4;
                    compItemGroup.visible = index != 4;
                    projectItemsGroup.visible = !compItemGroup.visible;
                };

                var itemMainGroup = addNativeGroup( replaceGroup, 'stack');
                itemMainGroup.alignment = ['fill', 'top'];

                var compItemGroup = addNativeGroup(itemMainGroup, 'column');

                var compSelector = addNativeDropdown( compItemGroup, [
                    [i18n._("Active composition"), w16_composition],
                    [i18n._("All Compositions"), w16_compositions]
                ], 0);
                compSelector.onChange = function() {
                    if (!compSelector.selection) return;
                    layerSelector.visible = compSelector.selection.index == 0;
                };

                var layerSelector = addNativeDropdown( compItemGroup, [
                    [i18n._("Selected layers"), w16_selected_layers],
                    [i18n._("All layers"), w16_layers]
                ], 1);

                var projectItemsGroup = addNativeGroup( itemMainGroup, 'column');
                projectItemsGroup.visible = false;

                var itemTypeGroup = addNativeGroup( projectItemsGroup, 'row' );

                var compButton = addNativeCheckBox( itemTypeGroup, '', w16_composition, i18n._("Compositions"), true );
                var footageButton = addNativeCheckBox( itemTypeGroup, '', w16_footage, i18n._("Footages"), true );
                var folderButton = addNativeCheckBox( itemTypeGroup, '', w16_folder, i18n._("Folders"), true );

                var projectIemsSelector = addNativeDropdown( projectItemsGroup, [
                    [i18n._("All items"), w16_items],
                    [i18n._("Selected items"), w16_selected_items]
                ], 0);

                var caseButton = addNativeCheckBox( replaceGroup, i18n._("Case sensitive"), w16_case, '', true );

                var expButton = addNativeCheckBox(
                    replaceGroup,
                    i18n._("Update expressions"),
                    w16_update_expression,
                    i18n._("Automatically updates the expressions."),
                    true
                );
                expButton.parent.visible = false;

                // Native fields have no place holder, so they have labels instead.
                var replaceForm = addNativeForm(replaceGroup);
                var searchEdit = replaceForm.addField(i18n._("Search") + ':', 'edittext', '')[1];
                var replaceEdit = replaceForm.addField(i18n._("Replace") + ':', 'edittext', '')[1];

                var validButton = addNativeValidButton(
                    replaceGroup,
                    i18n._("Search and replace"),
                    i18n._("Search and replace text in the project.")
                );
                validButton.onClick = function() {
                    var search = searchEdit.text;
                    var replace = replaceEdit.text;
                    if (search == replace) return;

                    DuAE.beginUndoGroup( i18n._("Search and replace") );
                    app.beginSuppressDialogs();

                    // Expressions
                    if (itemSelector.selection.index == 0) {
                        // All comps
                        if (compSelector.selection.index == 1) {
                            DuAEProject.replaceInExpressions( search, replace, caseButton.value );
                        }
                        // Active comp
                        else {
                            DuAEComp.replaceInExpressions( search, replace, caseButton.value, layerSelector.selection.index == 0 )
                        }
                    }
                    // Texts
                    else if (itemSelector.selection.index == 1) {
                        // All comps
                        if (compSelector.selection.index == 1) {
                            var items = new DuList(app.project.items);
                            items.do(function(item) {
                                if (!(item instanceof CompItem)) return;
                                var layers = new DuList(item.layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    if (!(layer instanceof TextLayer)) return;
                                    var source = layer.sourceText.value;
                                    source.text = DuString.replace( source.text, search, replace, caseButton.value);
                                    layer.sourceText.setValue(source);
                                });
                            });
                        }
                        // Active comp
                        else {
                            var comp = DuAEProject.getActiveComp();
                            if (comp) {
                                var layers = [];
                                if (layerSelector.selection.index == 0) layers = comp.selectedLayers;
                                else layers = comp.layers;
                                layers = new DuList(layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    if (!(layer instanceof TextLayer)) return;
                                    var source = layer.sourceText.value;
                                    source.text = DuString.replace( source.text, search, replace, caseButton.value);
                                    layer.sourceText.setValue(source);
                                });
                            }
                        }
                    }
                    // Effects
                    else if (itemSelector.selection.index == 2) {
                        // All comps
                        if (compSelector.selection.index == 1) {
                            var items = new DuList(app.project.items);
                            items.do(function (comp) {
                                if (!(comp instanceof CompItem)) return;
                                var layers = new DuList(comp.layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    for (var i = 1, n = layer.property('ADBE Effect Parade').numProperties; i <= n; i++) {
                                        var oldName = layer.effect(i).name;
                                        layer.effect(i).name = DuString.replace(oldName, search, replace, caseButton.value);
                                        if (expButton.value) app.project.autoFixExpressions(oldName,layer.effect(i).name);
                                    }
                                });
                            });
                        }
                        // Active comp
                        else {
                            var comp = DuAEProject.getActiveComp();
                            if (comp) {
                                var layers = [];
                                if (layerSelector.selection.index == 0) layers = comp.selectedLayers;
                                else layers = comp.layers;
                                layers = new DuList(layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    for (var i = 1, n = layer.property('ADBE Effect Parade').numProperties; i <= n; i++) {
                                        var oldName = layer.effect(i).name;
                                        layer.effect(i).name = DuString.replace(oldName, search, replace, caseButton.value);
                                        if (expButton.value) app.project.autoFixExpressions(oldName,layer.effect(i).name);
                                    }
                                });
                            }
                        }
                    }
                    // Layers
                    else if (itemSelector.selection.index == 3) {
                        // All comps
                        if (compSelector.selection.index == 1) {
                            var items = new DuList(app.project.items);
                            items.do(function (comp) {
                                if (!(comp instanceof CompItem)) return;
                                var layers = new DuList(comp.layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    var oldName = layer.name;
                                    layer.name = DuString.replace(oldName, search, replace, caseButton.value);
                                    if (expButton.value) app.project.autoFixExpressions(oldName,layer.name);
                                });
                            });
                        }
                        // Active comp
                        else {
                            var comp = DuAEProject.getActiveComp();
                            if (comp) {
                                var layers = [];
                                if (layerSelector.selection.index == 0) layers = comp.selectedLayers;
                                else layers = comp.layers;
                                layers = new DuList(layers);
                                layers.do(function(layer) {
                                    if (layer.locked) return;
                                    var oldName = layer.name;
                                    layer.name = DuString.replace(oldName, search, replace, caseButton.value);
                                    if (expButton.value) app.project.autoFixExpressions(oldName,layer.name);
                                });
                            }
                        }
                    }
                    // Items
                    else if (itemSelector.selection.index == 4) {
                        var items = [];
                        if (projectIemsSelector.selection.index == 0) items = app.project.items;
                        else items = app.project.selection;
                        items = new DuList(items);
                        
                        items.do(function(item) {
                            if (item instanceof CompItem && !compButton.value) return;
                            if (item instanceof FolderItem && !folderButton.value) return;
                            if (item instanceof FootageItem && !footageButton.value) return;

                            var oldName = item.name;
                            item.name = DuString.replace(oldName, search, replace, caseButton.value);
                            if (expButton.value) app.project.autoFixExpressions(oldName,item.name);
                        });
                    }


                    app.endSuppressDialogs(false);
                    DuAE.endUndoGroup();
                };

                nativeLayout(replaceGroup);
            }
            hideAllGroups();
            replaceGroup.visible = true;
        };

        var renameGroup = addNativeGroup(mainGroup, 'column');
        renameGroup.visible = false;
        renameGroup.built = false;

        var replaceGroup = addNativeGroup(mainGroup, 'column');
        replaceGroup.visible = false;
        replaceGroup.built = false;
    }

    devTab.build = function() {

        function hideAllGroups() {
            scriptifyGroup.visible = false;
            scriptLibGroup.visible = false;
            scriptEditorGroup.visible = false;
            devGroup.visible = false;
        }

        var mainGroup = addNativeGroup(this, 'stack');
        mainGroup.alignment = ['fill', 'fill'];

        var devGroup = addNativeGroup(mainGroup, 'column');

        // A grid with a row per button, like the Links and constraints panel: its options and image, then the button.
        var devGrid = addNativeButtonGrid(devGroup);
        devGrid.buttonHeight = 24;

        var scriptLibButton = addNativeButton(
            devGrid,
            i18n._("Script library") + '...',
            w16_library,
            i18n._("Quickly access and run all your scripts and panels.")
        );
        scriptLibButton.onClick = function() {
            if (!scriptLibGroup.built) {
                addNativeSubPanel(
                    scriptLibGroup,
                    i18n._("Script library"),
                    devGroup,
                    false
                );

                #include "scriptLibPanel.jsx"
                buildScriptLibPanel( scriptLibGroup, scriptEditorGroup );

                nativeLayout(scriptLibGroup);
            }

            hideAllGroups();
            scriptLibGroup.visible = true;
        };

        var scriptifyButton = addNativeButton(
            devGrid,
            i18n._("Scriptify expression"),
            w16_scriptify_expression,
            i18n._("Generate a handy ExtendScript code to easily include the selected expression into a script.")
        );
        scriptifyButton.onClick = function() {
            if (!scriptifyGroup.built) {

                addNativeSubPanel(
                    scriptifyGroup,
                    i18n._("Scriptify expression"),
                    devGroup,
                    false
                );

                scriptifyGroup.edit = scriptifyGroup.add('edittext', undefined, "", {
                    multiline: true
                });
                scriptifyGroup.edit.alignment = ['fill', 'fill'];

                addNativeSeparator( scriptifyGroup ).alignment = ['fill', 'bottom'];

                var validButton = addNativeButton(
                    scriptifyGroup,
                    i18n._("Scriptify expression"),
                    w16_scriptify_expression,
                    i18n._("Generate a handy ExtendScript code to easily include the selected expression into a script.")
                );
                validButton.alignment = ['fill', 'bottom'];
                validButton.onClick = function() {
                    var props = DuAEComp.getSelectedProps();
                    if (props.length == 0) return;
                    prop = props.pop();
                    scriptifyGroup.edit.text = DuAEExpression.scriptifyExpression(prop, prop.name + "Exp");
                };

                scriptifyGroup.refresh = validButton.onClick;

                scriptifyGroup.built = true;
                nativeLayout(scriptifyGroup);
            }

            scriptifyGroup.refresh();
            hideAllGroups();
            scriptifyGroup.visible = true;
        };

        var scriptEditorButton = addNativeButton(
            devGrid,
            i18n._("Script editor"),
            w16_script,
            i18n._("A quick editor for editing and running simple scripts and snippets.")
        );
        scriptEditorButton.onClick = function() {
            if (!scriptEditorGroup.built) {
                addNativeSubPanel(
                    scriptEditorGroup,
                    i18n._("Script editor"),
                    devGroup,
                    false
                );

                #include "scriptEditorPanel.jsx"
                buildScriptEditorUI( scriptEditorGroup );
            }
            hideAllGroups();
            scriptEditorGroup.visible = true;
        }

        var editExpressionButton = addNativeButton(
            devGrid,
            i18n._("Edit expression"),
            w16_expression_file,
            i18n._( "Use an external editor to edit the selected expression.\n\n[Ctrl]: Reloads the expressions from the external editor."),
            { options: true }
        );
        editExpressionButton.optionsPopup.build = function() {

            var editorSelector = addNativeFileSelector(
                editExpressionButton.optionsPanel,
                i18n._("Open expressions with..."),
                true,
                i18n._("Select an application to open the expressions.\nLeave the field empty to use the system default for '.jsxinc' files."), /// TRANSLATORS: "System" stands for Operating System here.
                undefined,
                'open',
                undefined,
                'column'
            );
            editorSelector.onChange = function() {
                var f = editorSelector.getFile();
                if (!f && editorSelector.editText.text != "") return;
                if (f) DuESF.scriptSettings.set("expression/expressionEditor", f.absoluteURI);
                else DuESF.scriptSettings.set("expression/expressionEditor", "");
                DuESF.scriptSettings.save();
            };

            editorSelector.setPath( DuESF.scriptSettings.get("expression/expressionEditor", "" ) );
            editorSelector.setPlaceholder( i18n._("System default") );

            editExpressionButton.onClick = function() {
                Duik.Tool.editExpression();
            };

            editExpressionButton.onCtrlClick = function() {
                Duik.Tool.reloadExpressions();
            };
        };

        var scriptifyGroup = addNativeGroup(mainGroup, 'column');
        scriptifyGroup.visible = false;
        scriptifyGroup.built = false;

        var scriptLibGroup = addNativeGroup(mainGroup, 'column');
        scriptLibGroup.visible = false;
        scriptLibGroup.built = false;

        var scriptEditorGroup = addNativeGroup(mainGroup, 'column');
        scriptEditorGroup.visible = false;
        scriptEditorGroup.built = false;
        scriptEditorGroup.edit = function( content ) {
            scriptEditorButton.onClick();
            scriptEditorGroup.editText.text = content;
        };
    };

    #include "layerManager.jsx"
    layerTab.build = buildLayerManagerUI;

    toolsTabPanel.buttonsGroup.alignment = ['center', 'top'];

}