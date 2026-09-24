/**
 * Builds the path spreadsheet, which shows the geometry of the selected Bézier paths in a table,
 * the way the Spreadsheet editor of Blender shows the geometry of the active object.
 * The values of the paths which can be edited can be slid or typed in the table.<br />
 * It's built in the Controllers panel, and in its own dockable panel, <i>Duik Path Spreadsheet.jsx</i>.
 * Both include <i>nativeUI.jsx</i> first, for the native controls.
 * @param {Group} container - The group to build the spreadsheet into.
 * @param {Group} [titleBar] - The title bar to add the refresh button to.
 * When omitted, a title bar is created at the top of the container.
 * @return {Object} The spreadsheet, with a <code>refresh()</code> method reading the selected paths again.
 */
function buildPathSpreadsheetUI(container, titleBar) {
    // Like Blender's spreadsheet, a table shows one domain of the geometry at a time: a row is
    // a control point, a spline, or, for masks only, a feather point. Blender's curves have the
    // first two; After Effects keeps the feather points of a mask in its path too.
    var CONTROL_POINT = 0;
    var SPLINE = 1;
    var FEATHER_POINT = 2;

    // Blender's own labels, keeping its "Evaluated" and "Original" states: the modifiers of Duik
    // are the expressions of the paths, as Blender's are applied to the evaluated object.
    var ORIGINAL = 1;

    // The types of values, which decide how a column is shown, like Blender's column value types.
    var FLOAT = 'float';
    var FLOAT2 = 'float2';
    var INT = 'int';
    var BOOL = 'bool';
    var STRING = 'string';

    // The Bezier path properties shown: the ones selected at the last refresh, or the pinned ones.
    var paths = [];
    // What was read from them, for each path: { prop, layer, name, shape, editable },
    // the shape being its value at the current time.
    var shapes = [];

    // The dockable panel has no sub-panel title bar, so it gets its own.
    if (!titleBar) titleBar = addNativeTitleBar( container, i18n._("Path Spreadsheet"), false, false );

    var refreshButton = titleBar.add(
        'iconbutton',
        undefined,
        nativeImage(w12_blender_icon_file_refresh),
        { style: 'button' }
    );
    refreshButton.helpTip = i18n._("Refresh") + "\n\n" +
        i18n._("Read the selected paths at the current time: a shape path, a mask, or all the paths of the selected layers when no path is selected. When pinned, reads the same paths again.");
    refreshButton.alignment = ['left', 'center'];
    refreshButton.onClick = function() { refresh(); };

    // The context, like the one on top of Blender's spreadsheet: what's shown, and the pin.
    var contextGroup = addNativeGroup(container, 'row');
    contextGroup.alignment = ['fill', 'top'];

    contextGroup.add('image', undefined, nativeImage(w12_blender_icon_curve_bezcurve));

    var contextLabel = contextGroup.add('statictext', undefined, i18n._("No path selected"));
    contextLabel.alignment = ['fill', 'center'];
    // Filling the row whatever its text: a long name mustn't make the panel wider.
    contextLabel.preferredSize.width = 50;

    var pinButton = addNativeToggleButton(
        contextGroup,
        w12_pin,
        w12_pinned,
        i18n._("Pin") + "\n\n" +
            i18n._("Keep showing these paths: refreshing reads them again at the current time instead of reading the selection.")
    );
    pinButton.alignment = ['right', 'center'];
    pinButton.onClick = function() {
        // Unpinned, it follows the selection again, like Blender's.
        if (!pinButton.checked) refresh();
    };

    var optionsGroup = addNativeGroup(container, 'row');
    optionsGroup.alignment = ['fill', 'top'];

    var domainSelector = addNativeDropdown(optionsGroup, [
        [i18n._("Control Point"), w16_blender_icon_curve_bezcircle, i18n._("The vertices of the paths, and their handles.")],
        [i18n._("Spline"), w16_blender_icon_curve_path, i18n._("The paths.")],
        [i18n._("Feather Point"), w16_mask, i18n._("The feather points of the masks.")]
    ], DuESF.scriptSettings.get('pathSpreadsheet/domain', CONTROL_POINT));
    // Its items get longer with the number of rows: it fills the row instead of growing.
    domainSelector.preferredSize.width = 50;
    domainSelector.onChange = function() {
        DuESF.scriptSettings.set('pathSpreadsheet/domain', domainSelector.selection.index);
        DuESF.scriptSettings.save();
        showTable(false);
    };

    var evaluationSelector = addNativeDropdown(optionsGroup, [
        [i18n._("Evaluated"), null, i18n._("The value of the paths with their expressions, as After Effects draws them, Duik's modifiers included. The values computed by an expression can't be edited.")],
        [i18n._("Original"), null, i18n._("The value of the paths without their expressions. Editing them changes the path under its expression.")]
    ], DuESF.scriptSettings.get('pathSpreadsheet/evaluation', 0));
    evaluationSelector.alignment = ['right', 'center'];
    evaluationSelector.onChange = function() {
        DuESF.scriptSettings.set('pathSpreadsheet/evaluation', evaluationSelector.selection.index);
        DuESF.scriptSettings.save();
        readPaths();
        showContext();
        showTable(true);
    };

    var sheet = addNativeSpreadsheet(container);
    sheet.onEdit = function(column, row, component, value) {
        var target = column.targets[row];
        editPath(target.path, target.index, column.edit, component, value);
    };
    // After Effects doesn't tell scripts when a path changes, by an undo for example: the values are read
    // again when the spreadsheet may be looked at or used, and shown again only when they've changed.
    sheet.onSync = function() {
        var before = signature();
        readPaths();
        if (signature() == before) return;
        showContext();
        showTable(true);
    };
    // A key released anywhere in the panel, like the undo shortcut, reads them again too.
    container.addEventListener('keyup', function() { sheet.sync(true); });

    // The footer, like Blender's: the number of rows and columns.
    var footerLabel = container.add('statictext', undefined, i18n._("Rows:"), { justify: 'right' });
    footerLabel.alignment = ['fill', 'bottom'];
    footerLabel.preferredSize.width = 50;

    // The name of a path in its layer, like the Target Path list of the constraint settings shows it:
    // "Contents / Group 1 / Path 1", or "Masks / Mask 1".
    function pathName(prop) {
        var names = [];
        // Starts at the shape path or the mask holding the path; the layer is the only property without a parent.
        for (var p = prop.parentProperty; p && p.parentProperty; p = p.parentProperty) {
            // The contents of a shape group add nothing to the name.
            if (p.matchName != 'ADBE Vectors Group') names.unshift(p.name);
        }
        return names.join(' / ');
    }

    // The paths to show: the selected ones in the active composition, or, when none is selected,
    // all the paths of the selected layers, like Blender shows the whole active object.
    // They're listed layer by layer, in the order of their contents and masks.
    function selectedPaths() {
        var comp = DuAEProject.getActiveComp();
        if (!comp) return [];

        var layers = [];
        var selectedLayers = comp.selectedLayers;
        for (var i = 0, n = selectedLayers.length; i < n; i++) layers.push(selectedLayers[i]);
        layers.sort(function(a, b) { return a.index - b.index; });

        // The addresses of the selected paths, by layer: a path is selected with its shape path or mask,
        // or with the path property itself.
        var selected = {};
        var anySelected = false;
        for (var i = 0, n = layers.length; i < n; i++) {
            var props = layers[i].selectedProperties;
            for (var j = 0, m = props.length; j < m; j++) {
                var address = Duik.Constraint.pathAddress(props[j]);
                if (!address) continue;
                selected[layers[i].index + Duik.Constraint.pathAddressLiteral(address)] = true;
                anySelected = true;
            }
        }

        var found = [];
        for (var i = 0, n = layers.length; i < n; i++) {
            var list = Duik.Constraint.listPaths(layers[i]);
            for (var j = 0, m = list.length; j < m; j++) {
                var key = layers[i].index + Duik.Constraint.pathAddressLiteral(list[j].address);
                if (anySelected && !selected[key]) continue;
                var prop = Duik.Constraint.pathAtAddress(layers[i], list[j].address);
                if (prop) found.push(prop);
            }
        }
        return found;
    }

    // Reads the paths at the current time of their composition. The ones which don't exist anymore
    // are dropped: a pinned path may have been deleted since.
    function readPaths() {
        var original = evaluationSelector.selection.index == ORIGINAL;
        var kept = [];
        shapes = [];
        for (var i = 0, n = paths.length; i < n; i++) {
            try {
                var prop = paths[i];
                var layer = prop.propertyGroup(prop.propertyDepth);
                shapes.push({
                    prop: prop,
                    layer: layer,
                    name: pathName(prop),
                    // An expression is what the pre-expression value leaves out.
                    shape: prop.valueAtTime(layer.containingComp.time, original),
                    // What an expression computes can't be edited, but the path under it can.
                    editable: !layer.locked && (original || !prop.expressionEnabled)
                });
                kept.push(prop);
            }
            catch (e) {}
        }
        paths = kept;
    }

    // Everything shown of the paths, to know whether they've changed.
    function signature() {
        var parts = [];
        for (var i = 0, n = shapes.length; i < n; i++) {
            var s = shapes[i];
            var shape = s.shape;
            parts.push(s.layer.name, s.name, s.editable, shape.closed,
                shape.vertices.join(), shape.inTangents.join(), shape.outTangents.join());
            if (!shape.featherSegLocs) continue;
            parts.push(shape.featherSegLocs.join(), shape.featherRelSegLocs.join(), shape.featherRadii.join(),
                shape.featherInterps.join(), shape.featherTensions.join(), shape.featherTypes.join(),
                shape.featherRelCornerAngles.join());
        }
        return parts.join('|');
    }

    // The number of layers the paths shown belong to. Pinned paths may come from several compositions.
    function layerCount() {
        var indices = {};
        var count = 0;
        for (var i = 0, n = shapes.length; i < n; i++) {
            var key = shapes[i].layer.containingComp.id + ':' + shapes[i].layer.index;
            if (indices[key]) continue;
            indices[key] = true;
            count++;
        }
        return count;
    }

    // The name of a spline in the table: with its layer when the paths come from several layers.
    function splineName(s, withLayer) {
        return withLayer ? s.layer.name + ' / ' + s.name : s.name;
    }

    // Shows what's in the table, like the context on top of Blender's spreadsheet shows the object,
    // and the size of each domain in the list, like Blender shows it next to the domain.
    function showContext() {
        var n = shapes.length;
        var layers = layerCount();
        if (n == 0) contextLabel.text = i18n._("No path selected");
        else if (layers > 1) contextLabel.text = i18n._("%1 layers", layers) + ', ' + i18n._("%1 paths", n);
        else if (n == 1) contextLabel.text = shapes[0].layer.name + ' / ' + shapes[0].name;
        else contextLabel.text = shapes[0].layer.name + ', ' + i18n._("%1 paths", n);
        contextLabel.helpTip = contextLabel.text;

        var counts = [0, n, 0];
        for (var i = 0; i < n; i++) {
            var shape = shapes[i].shape;
            counts[CONTROL_POINT] += shape.vertices.length;
            if (shape.featherSegLocs) counts[FEATHER_POINT] += shape.featherSegLocs.length;
        }
        var labels = [i18n._("Control Point"), i18n._("Spline"), i18n._("Feather Point")];
        for (var i = 0, m = labels.length; i < m; i++)
            domainSelector.items[i].text = labels[i] + '  (' + counts[i] + ')';
    }

    // Edits a path, like typing a value in the timeline: an animated path gets a key at the current time.
    // Edits change the value under the expression, and the paths shown are read again afterwards.
    function editPath(pathIndex, index, edit, component, value) {
        var s = shapes[pathIndex];
        if (!s || !s.editable || !edit) return;

        DuAE.beginUndoGroup(i18n._("Edit path"), false);
        try {
            var time = s.layer.containingComp.time;
            var shape = s.prop.valueAtTime(time, true);
            edit(shape, index, component, value);
            if (s.prop.numKeys > 0) s.prop.setValueAtTime(time, shape);
            else s.prop.setValue(shape);
        }
        catch (e) {
            alert(i18n._("The path can't be edited:") + '\n' + e.message);
        }
        DuAE.endUndoGroup(i18n._("Edit path"));

        readPaths();
        showContext();
        showTable(true);
    }

    // How the values of a column are written in a path: edit(shape, index, component, value)
    // changes the value at the index in a Shape.

    // A vertex, or the tangent of a vertex.
    function setPoint(key) {
        return function(shape, index, component, value) {
            var list = shape[key];
            var point = [list[index][0], list[index][1]];
            point[component] = value;
            list[index] = point;
            shape[key] = list;
        };
    }

    // Where a handle is: After Effects keeps where it points to from its vertex.
    function setHandle(key) {
        var setTangent = setPoint(key);
        return function(shape, index, component, value) {
            setTangent(shape, index, component, value - shape.vertices[index][component]);
        };
    }

    // A value of a feather point.
    function setFeather(key) {
        return function(shape, index, component, value) {
            var list = shape[key];
            list[index] = value;
            shape[key] = list;
        };
    }

    function setHold(shape, index, component, value) {
        setFeather('featherInterps')(shape, index, component, value ? 1 : 0);
    }

    function setClosed(shape, index, component, value) {
        shape.closed = !!value;
    }

    // Whether the values of a row can be edited: the ones of the paths which can.
    function editableRow(targets) {
        return function(row) { return shapes[targets[row].path].editable; };
    }

    // The columns of each domain, like the attributes Blender shows for a curve.
    // Blender's names are kept for what Blender has too, so both spreadsheets can be compared.
    // Each row targets a value of a path: targets[row] is { path, index }. Sliding a value changes it by
    // its step for each pixel: one pixel for coordinates, a hundredth for values going from 0 to 1.
    // Its arrows change it by its increment: one, or a tenth for values going from 0 to 1.

    function controlPointColumns() {
        var position = [];
        var handleLeft = [];
        var handleRight = [];
        var inTangents = [];
        var outTangents = [];
        var targets = [];
        for (var i = 0, n = shapes.length; i < n; i++) {
            var shape = shapes[i].shape;
            for (var j = 0, m = shape.vertices.length; j < m; j++) {
                var v = shape.vertices[j];
                var inT = shape.inTangents[j];
                var outT = shape.outTangents[j];
                position.push(v);
                // Blender's handles are where they are, After Effects' tangents where they point to from the vertex.
                handleLeft.push([v[0] + inT[0], v[1] + inT[1]]);
                handleRight.push([v[0] + outT[0], v[1] + outT[1]]);
                inTangents.push(inT);
                outTangents.push(outT);
                targets.push({ path: i, index: j });
            }
        }
        var editable = editableRow(targets);
        return [
            { name: 'position', type: FLOAT2, values: position, targets: targets, editable: editable,
                edit: setPoint('vertices'),
                tip: i18n._("The vertex. Its handles move with it.") },
            { name: 'handle_left', type: FLOAT2, values: handleLeft, targets: targets, editable: editable,
                edit: setHandle('inTangents'),
                tip: i18n._("The handle towards the previous vertex, where it is.") },
            { name: 'handle_right', type: FLOAT2, values: handleRight, targets: targets, editable: editable,
                edit: setHandle('outTangents'),
                tip: i18n._("The handle towards the next vertex, where it is.") },
            { name: 'in_tangent', type: FLOAT2, values: inTangents, targets: targets, editable: editable,
                edit: setPoint('inTangents'),
                tip: i18n._("The handle towards the previous vertex, from the vertex, as After Effects keeps it.") },
            { name: 'out_tangent', type: FLOAT2, values: outTangents, targets: targets, editable: editable,
                edit: setPoint('outTangents'),
                tip: i18n._("The handle towards the next vertex, from the vertex, as After Effects keeps it.") }
        ];
    }

    function splineColumns() {
        var withLayer = layerCount() > 1;
        var names = [];
        var cyclic = [];
        var starts = [];
        var counts = [];
        var targets = [];
        var start = 0;
        for (var i = 0, n = shapes.length; i < n; i++) {
            var count = shapes[i].shape.vertices.length;
            names.push(splineName(shapes[i], withLayer));
            cyclic.push(shapes[i].shape.closed);
            starts.push(start);
            counts.push(count);
            targets.push({ path: i, index: 0 });
            start += count;
        }
        return [
            { name: i18n._("Name"), type: STRING, values: names,
                tip: i18n._("Where the path is.") },
            { name: 'cyclic', type: BOOL, values: cyclic, targets: targets, editable: editableRow(targets),
                edit: setClosed,
                tip: i18n._("Whether the path is closed.") },
            { name: i18n._("Point Start"), type: INT, values: starts,
                tip: i18n._("The index of its first control point.") },
            { name: i18n._("Point Count"), type: INT, values: counts,
                tip: i18n._("The number of its control points.") }
        ];
    }

    function featherPointColumns() {
        var segments = [];
        var factors = [];
        var radii = [];
        var tensions = [];
        var cornerAngles = [];
        var hold = [];
        var inner = [];
        var targets = [];
        // The index of the first control point of the path.
        var start = 0;
        for (var i = 0, n = shapes.length; i < n; i++) {
            var shape = shapes[i].shape;
            // Only masks have feather points.
            var locations = shape.featherSegLocs || [];
            for (var j = 0, m = locations.length; j < m; j++) {
                segments.push(start + locations[j]);
                factors.push(shape.featherRelSegLocs[j]);
                radii.push(shape.featherRadii[j]);
                tensions.push(shape.featherTensions[j]);
                cornerAngles.push(shape.featherRelCornerAngles[j]);
                hold.push(shape.featherInterps[j] == 1);
                inner.push(shape.featherTypes[j] == 1);
                targets.push({ path: i, index: j });
            }
            start += shape.vertices.length;
        }
        var editable = editableRow(targets);
        // The segment and the side of a feather point are only shown: After Effects sorts the feather
        // points by segment, and its side goes with the sign of its radius.
        return [
            { name: 'segment', type: INT, values: segments,
                tip: i18n._("The control point starting the segment the feather point is on.") },
            { name: 'factor', type: FLOAT, values: factors, targets: targets, editable: editable,
                edit: setFeather('featherRelSegLocs'), step: 0.01, increment: 0.1, min: 0, max: 1,
                tip: i18n._("Where it is on the segment, from 0 at its start to 1 at its end.") },
            { name: 'radius', type: FLOAT, values: radii, targets: targets, editable: editable,
                edit: setFeather('featherRadii'),
                tip: i18n._("The feather amount: negative for an inner feather point.") },
            { name: 'tension', type: FLOAT, values: tensions, targets: targets, editable: editable,
                edit: setFeather('featherTensions'), step: 0.01, increment: 0.1, min: 0, max: 1,
                tip: i18n._("The tension, from 0 to 1.") },
            { name: 'corner_angle', type: FLOAT, values: cornerAngles, targets: targets, editable: editable,
                edit: setFeather('featherRelCornerAngles'), min: 0, max: 100,
                tip: i18n._("How round the feather is around a corner, in percent: 0 for 0°, 100 for 180°.") },
            { name: 'hold', type: BOOL, values: hold, targets: targets, editable: editable,
                edit: setHold,
                tip: i18n._("Whether its interpolation is Hold.") },
            { name: 'inner', type: BOOL, values: inner,
                tip: i18n._("Whether it's an inner feather point.") }
        ];
    }

    // Shows the domain selected in the drop down.
    // keepScroll keeps the rows and the columns shown, when the columns are the same.
    function showTable(keepScroll) {
        var domain = domainSelector.selection ? domainSelector.selection.index : CONTROL_POINT;
        var columns;
        if (domain == SPLINE) columns = splineColumns();
        else if (domain == FEATHER_POINT) columns = featherPointColumns();
        else columns = controlPointColumns();

        sheet.setColumns(columns, keepScroll);

        var rows = columns.length > 0 ? columns[0].values.length : 0;
        var footer = i18n._("Rows:") + ' ' + rows + '   |   ' + i18n._("Columns:") + ' ' + columns.length;

        // Tells why values can't be edited.
        var readOnly = 0;
        for (var i = 0, n = shapes.length; i < n; i++) if (!shapes[i].editable) readOnly++;
        if (readOnly > 0) footer += '   |   ' + i18n._("Read only: %1", readOnly);
        footerLabel.text = footer;
        footerLabel.helpTip = readOnly > 0 ?
            i18n._("The paths of locked layers can't be edited, nor, when the evaluated values are shown, the paths with an expression: show the original values to edit the path under the expression.") :
            '';
    }

    // Reads the selected paths again, or the pinned ones, and shows them.
    function refresh() {
        if (!pinButton.checked) paths = selectedPaths();
        readPaths();
        showContext();
        showTable(true);
    }

    showContext();
    showTable(false);

    return { refresh: refresh };
}
