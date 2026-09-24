/**
 * Adds a spreadsheet: a table of values with a column per attribute, like Blender's spreadsheet.
 * The attributes are separated by lines, the values of a vector share the column of their attribute,
 * and numbers are aligned to the right.<br />
 * The numbers which can be edited are blue, like the values of the After Effects timeline: drag one
 * sideways to slide it, [Shift] for ten times faster, [Ctrl] or [Cmd] for ten times slower, or click it to
 * type a value, like in Blender. [Enter] and the up and down arrows go on to the value below or above,
 * [Escape] cancels. Like Blender's, the value under the pointer shows arrows on its sides to decrease or
 * increase it by one step, with the same modifier keys.<br />
 * Only the rows which fit are built, and a scroll bar picks the ones they show: ScriptUI groups don't clip
 * what they hold, so they can't scroll. Another scroll bar picks the attributes when they don't all fit.<br />
 * The spreadsheet places its controls itself, rather than letting ScriptUI lay them out: every cell has
 * a known place, and laying hundreds of controls out would be slow.
 * @param {Group|Panel|Window} container - Where to add the spreadsheet. It fills the space it's given.
 * @return {Group} The spreadsheet. Show values with its <code>setColumns(columns, keepScroll)</code> method.
 * Each column is <code>{ name, tip, type, values, editable, step, increment, min, max }</code>: <code>type</code> is
 * <code>'float'</code>, <code>'float2'</code>, <code>'int'</code>, <code>'bool'</code> or <code>'string'</code>;
 * <code>editable(row)</code>, if set, tells whether a value can be edited; <code>step</code> is how much a value
 * changes for each pixel it's dragged, 1 by default; <code>increment</code> is how much its arrows change it, 1 by
 * default; <code>min</code> and <code>max</code> limit the values.<br />
 * When a value is edited, <code>onEdit(column, row, component, value)</code> runs, with the column object,
 * the index of the row, the index of the value in a vector, and the new value.<br />
 * <code>onSync()</code> runs when the values shown may be out of date: when the pointer comes over the
 * spreadsheet, when a key is released in it, and before a value is edited, but never while one is being
 * dragged or typed. Call <code>sync(force)</code> to run it from other events; unless forced, it runs at most
 * twice a second.
 */
function addNativeSpreadsheet(container) {
    // Sizes in pixels. Like in Blender, a unit is 20 pixels, and so is the height of a row.
    var UNIT = 20;
    var ROW_HEIGHT = 20;
    var HEADER_HEIGHT = 20;
    // The lines are empty panels, like the ones of addNativeSeparator, with some room on each side.
    var LINE = 2;
    var GAP = 3;
    var SCROLLBAR = 16;
    // Static texts are drawn from their top: this centers them in their row.
    var TEXT_OFFSET = 3;
    // Keeps numbers off the line on their right.
    var TEXT_INSET = 4;
    var CHECKBOX = 16;
    // How far the pointer moves before a click becomes a drag, like in Blender.
    var DRAG_THRESHOLD = 3;
    // The width of the arrows on the sides of a value, like Blender's: 70% of the height of a row.
    var ARROW = 14;
    // Milliseconds between two syncs which aren't forced.
    var SYNC_INTERVAL = 500;

    var sheet = container.add('group');
    sheet.alignment = ['fill', 'fill'];
    // It fills the space it's given: without this, ScriptUI would size it to hold all its controls.
    sheet.preferredSize = [150, 100];
    sheet.onEdit = function(column, row, component, value) {};
    sheet.onSync = function() {};

    var columns = [];
    var rowCount = 0;
    var indexWidth = UNIT;
    // What the columns are, to know when their controls can be reused.
    var structure = '';

    // The first row and the first column shown.
    var firstRow = 0;
    var firstColumn = 0;
    // What fits: the number of rows, and the indices of the columns.
    var slotCount = 0;
    var visibleRows = 0;
    var visibleColumns = [];
    var maxFirstColumn = 0;

    // The controls, created the first time they're shown and reused when scrolling.
    var indexCells = [];
    // For each column: { header, line, cells }, cells being a row of controls for each row shown.
    var columnControls = [];
    var indexLine = null;
    var headerLine = null;
    var vScroll = null;
    var hScroll = null;
    // The field a value is typed in, over its cell.
    var editor = null;
    // The arrows on the sides of the value under the pointer, and that value's control.
    var leftArrow = null;
    var rightArrow = null;
    var hover = null;
    // The size and the columns they were placed for.
    var placedKey = '';
    var version = 0;

    // The value being dragged: { column, row, component, cell, value, startX, lastX, moved }.
    var drag = null;
    // The value being typed: { column, row, component, cell, text }.
    var editing = null;
    var lastSync = 0;

    // The spreadsheet places its controls itself, whenever ScriptUI lays it out.
    sheet.layout = {
        layout: function() { place(); },
        resize: function() { place(); }
    };

    // Integers are grouped by thousands, like Blender shows them.
    function formatInt(value) {
        var digits = String(Math.abs(Math.round(value)));
        var grouped = '';
        while (digits.length > 3) {
            grouped = ',' + digits.substr(digits.length - 3) + grouped;
            digits = digits.substr(0, digits.length - 3);
        }
        return (value < 0 ? '-' : '') + digits + grouped;
    }

    // Floats have three decimals, like Blender shows them.
    function formatFloat(value) {
        return value.toFixed(3);
    }

    function componentCount(column) {
        return column.type == 'float2' ? 2 : 1;
    }

    function isNumber(column) {
        return column.type == 'float' || column.type == 'float2' || column.type == 'int';
    }

    function valueOf(column, row, component) {
        var value = column.values[row];
        return column.type == 'float2' ? value[component] : value;
    }

    function formatValue(column, value) {
        return column.type == 'int' ? formatInt(value) : formatFloat(value);
    }

    function cellText(column, row, component) {
        if (column.type == 'string') return String(column.values[row]);
        if (column.type == 'bool') return '';
        return formatValue(column, valueOf(column, row, component));
    }

    // Keeps a value in the limits of its column, and drops the noise of the steps it was dragged by.
    function limit(column, value) {
        if (isdef(column.min)) value = Math.max(column.min, value);
        if (isdef(column.max)) value = Math.min(column.max, value);
        return Math.round(value * 1000000) / 1000000;
    }

    function isEditable(column, row) {
        return !column.readOnly && row >= 0 && row < rowCount && column.editable(row);
    }

    function textWidth(text) {
        if (text == '') return 0;
        try { return sheet.graphics.measureString(text)[0]; }
        catch (e) { return text.length * 7; }
    }

    // The width of a column, the way Blender fits a column to its values: the widest of the first hundred,
    // not narrower than the minimum of the type, or the name if it's wider. A vector is split in equal parts.
    function fitColumn(column) {
        var n = componentCount(column);
        var widest = 0;
        for (var c = 0; c < n; c++) {
            // The longest text is measured, not each one: the digits are about as wide as each other.
            var longest = '';
            for (var r = 0, m = Math.min(rowCount, 100); r < m; r++) {
                var text = cellText(column, r, c);
                if (text.length > longest.length) longest = text;
            }
            widest = Math.max(widest, textWidth(longest));
        }

        var minimum = 3 * UNIT;
        if (column.type == 'bool') minimum = 2 * UNIT;
        else if (column.type == 'string') minimum = UNIT;

        // The values which can be edited leave room for their arrows.
        var arrows = !column.readOnly && isNumber(column) ? 2 * ARROW : 0;
        var valueWidth = Math.max(minimum, widest + arrows) + UNIT / 2;
        column.width = Math.round(Math.max(valueWidth * n, textWidth(column.name) + UNIT / 2));
    }

    // A column is read only when none of its values can be edited.
    function isReadOnly(column) {
        if (!column.editable || column.type == 'string') return true;
        for (var r = 0; r < rowCount; r++)
            if (column.editable(r)) return false;
        return true;
    }

    // The room a column takes: itself, and the line on its right.
    function columnSpace(column) {
        return column.width + LINE + 2 * GAP;
    }

    // The columns which fit between start and right, from the first one; at least that one.
    // Returns the index after the last one, and where it would start.
    function fittingColumns(first, start, right) {
        var x = start;
        var i = first;
        for (var n = columns.length; i < n; i++) {
            if (i > first && x + columns[i].width > right) break;
            x += columnSpace(columns[i]);
        }
        return { end: i, x: x };
    }

    function removeColumnControls() {
        showArrows(null);
        for (var i = 0, n = columnControls.length; i < n; i++) {
            var controls = columnControls[i];
            if (!controls) continue;
            sheet.remove(controls.header);
            sheet.remove(controls.line);
            for (var s = 0, m = controls.cells.length; s < m; s++)
                for (var c = 0, k = controls.cells[s].length; c < k; c++) sheet.remove(controls.cells[s][c]);
        }
        columnControls = [];
    }

    // The control showing a value, when its row is shown.
    function cellAt(columnIndex, row, component) {
        var controls = columnControls[columnIndex];
        var slot = row - firstRow;
        if (!controls || slot < 0 || slot >= visibleRows || !controls.cells[slot]) return null;
        return controls.cells[slot][component];
    }

    function scrollToShow(row) {
        if (row < firstRow) scrollTo(row);
        else if (row >= firstRow + visibleRows) scrollTo(row - visibleRows + 1);
    }

    // Types a value: a field takes the place of its cell.
    function openEditor(columnIndex, row, component) {
        var column = columns[columnIndex];
        if (!column || !isNumber(column) || !isEditable(column, row)) return;
        scrollToShow(row);
        var cell = cellAt(columnIndex, row, component);
        if (!cell) return;

        if (!editor) {
            editor = sheet.add('edittext', undefined, '');
            editor.visible = false;
            editor.onDeactivate = function() { closeEditor(true); };
            editor.addEventListener('keydown', function(e) {
                if (e.keyName == 'Escape') {
                    closeEditor(false);
                    return;
                }
                var step = 0;
                if (e.keyName == 'Up') step = -1;
                else if (e.keyName == 'Down' || e.keyName == 'Enter') step = 1;
                if (step == 0 || !editing) return;
                var target = editing;
                closeEditor(true);
                openEditor(target.column, target.row + step, target.component);
            });
        }

        showArrows(null);
        // All the decimals, like Blender shows them when a number is typed.
        var text = String(limit({}, valueOf(column, row, component)));
        editing = { column: columnIndex, row: row, component: component, cell: cell, text: text };
        editor.text = text;
        editor.bounds = cell.area;
        cell.visible = false;
        editor.visible = true;
        editor.active = true;
    }

    // Stops typing, and edits the value if apply is true and it's a new number.
    function closeEditor(apply) {
        if (!editing) return;
        var target = editing;
        editing = null;
        var text = editor.text;
        editor.visible = false;
        target.cell.visible = true;
        if (!apply || text == target.text) return;

        var value = parseFloat(String(text).replace(',', '.'));
        if (isNaN(value)) return;
        var column = columns[target.column];
        sheet.onEdit(column, target.row, target.component, limit(column, value));
    }

    // Stops dragging: the value dragged is edited, or, when it wasn't dragged but clicked, it's typed.
    function endDrag(released) {
        var d = drag;
        drag = null;
        if (d.moved) sheet.onEdit(columns[d.column], d.row, d.component, d.value);
        else if (released) openEditor(d.column, d.row, d.component);
    }

    // Where the text of a value goes in its cell, leaving room for its arrows when they're shown.
    function textBounds(cell, withArrows) {
        var a = cell.area;
        if (withArrows) return [a[0] + ARROW, a[1] + TEXT_OFFSET, a[2] - ARROW, a[3]];
        return [a[0], a[1] + TEXT_OFFSET, a[2] - TEXT_INSET, a[3]];
    }

    // Whether a control is a value which can be edited, with arrows.
    function canStep(control) {
        if (!control || control.type != 'statictext' || !isdef(control.column) || !control.visible) return false;
        var column = columns[control.column];
        return column && isNumber(column) && isEditable(column, control.row);
    }

    // Shows the arrows on the sides of a value, or hides them with no value, or one which can't be edited.
    // Nothing changes when they're already on it, unless forced: its place may have changed.
    function showArrows(cell, force) {
        if (drag || editing || !canStep(cell)) cell = null;
        if (cell === hover && !force) return;
        if (hover && hover !== cell && hover.area) hover.bounds = textBounds(hover, false);
        hover = cell;

        if (!cell) {
            if (leftArrow) leftArrow.visible = rightArrow.visible = false;
            return;
        }

        if (!leftArrow) {
            leftArrow = listen(sheet.add('iconbutton', undefined, nativeImage(w12_blender_icon_tria_left), { style: 'toolbutton' }));
            leftArrow.onClick = function() { stepValue(-1); };
            rightArrow = listen(sheet.add('iconbutton', undefined, nativeImage(w12_blender_icon_tria_right), { style: 'toolbutton' }));
            rightArrow.onClick = function() { stepValue(1); };
            var modifiers = '\n\n' + i18n._("[Shift]: ten times more.") + '\n' + i18n._("[Ctrl] or [Cmd]: ten times less.");
            leftArrow.helpTip = i18n._("Decrease") + modifiers;
            rightArrow.helpTip = i18n._("Increase") + modifiers;
        }

        var a = cell.area;
        cell.bounds = textBounds(cell, true);
        leftArrow.bounds = [a[0], a[1], a[0] + ARROW, a[3]];
        rightArrow.bounds = [a[2] - ARROW, a[1], a[2], a[3]];
        leftArrow.visible = rightArrow.visible = true;
    }

    // Decreases or increases the value with the arrows by its increment, like Blender's arrows.
    function stepValue(direction) {
        if (!canStep(hover)) return;
        var columnIndex = hover.column;
        var row = hover.row;
        var component = hover.component;
        // The value may have changed since it was shown, by an undo for example.
        sheet.sync(true);
        var column = columns[columnIndex];
        if (!column || !isEditable(column, row)) return;

        var keys = nativeModifiers();
        var amount = isdef(column.increment) ? column.increment : 1;
        if (keys.shift) amount *= 10;
        if (keys.ctrl) amount /= 10;
        sheet.onEdit(column, row, component, limit(column, valueOf(column, row, component) + direction * amount));
    }

    // After Effects gives a mouse event to the control under the pointer only, not to the groups holding it,
    // so every control of the spreadsheet listens itself, like DuAEF's own widgets do. The values listen for
    // the pointer going down on them; all the controls follow it moving, going up, leaving and coming in.

    // Starts following a value the pointer went down on: it's dragged if the pointer moves, typed if not.
    function startDrag(cell, e) {
        // A drag released where the spreadsheet didn't see it.
        if (drag) endDrag(false);
        // Clicking another value commits the one being typed.
        if (editing) closeEditor(true);
        if (!columns[cell.column] || !isNumber(columns[cell.column]) || cell.row < 0) return;
        var size = sheetSize();
        if (!size) return;

        // Where the spreadsheet is on screen, to know when the pointer leaves it: the event tells where the
        // pointer is on screen and in the cell, like Duik's buttons find where they are.
        var left = e.screenX - e.clientX - cell.bounds[0];
        var top = e.screenY - e.clientY - cell.bounds[1];
        var screen = [left, top, left + size[0], top + size[1]];
        // Without a sensible place, the drag just doesn't stop at the edges.
        if (!insideRect(screen, e)) screen = null;

        var columnIndex = cell.column;
        var row = cell.row;
        var component = cell.component;
        // The value may have changed since it was shown, by an undo for example.
        sheet.sync(true);
        var column = columns[columnIndex];
        cell = cellAt(columnIndex, row, component);
        if (!cell || !column || !isEditable(column, row)) return;

        showArrows(null);
        drag = {
            column: columnIndex,
            row: row,
            component: component,
            cell: cell,
            value: valueOf(column, row, component),
            startX: e.screenX,
            lastX: e.screenX,
            moved: false,
            screen: screen
        };
    }

    function insideRect(rect, e) {
        return e.screenX >= rect[0] && e.screenY >= rect[1] && e.screenX < rect[2] && e.screenY < rect[3];
    }

    // The pointer may be released outside the spreadsheet, where it isn't seen: the drag stops at the edge.
    function leftSheet(e) {
        return drag.screen && !insideRect(drag.screen, e);
    }

    function mouseMoved(e) {
        if (!drag) return;
        if (leftSheet(e)) {
            endDrag(false);
            return;
        }
        var x = e.screenX;
        if (!drag.moved) {
            if (Math.abs(x - drag.startX) < DRAG_THRESHOLD) return;
            // The value starts changing from here, so it doesn't jump.
            drag.moved = true;
            drag.lastX = x;
            return;
        }
        // Like the values of the timeline: [Shift] is faster, [Ctrl] or [Cmd] slower.
        var column = columns[drag.column];
        var step = isdef(column.step) ? column.step : 1;
        if (e.shiftKey) step *= 10;
        if (e.ctrlKey || e.metaKey) step /= 10;
        drag.value = limit(column, drag.value + (x - drag.lastX) * step);
        drag.lastX = x;
        drag.cell.text = formatValue(column, drag.value);
    }

    // Several controls may hear the same event: once the drag has ended, the others do nothing.
    function mouseReleased() {
        if (drag) endDrag(true);
    }

    function mouseLeft(e) {
        if (drag && leftSheet(e)) endDrag(false);
    }

    // The arrows go to the value under the pointer, and stay while the pointer is on them.
    function mouseEntered(control) {
        sheet.sync(false);
        if (control !== leftArrow && control !== rightArrow) showArrows(control);
    }

    function listen(control) {
        control.addEventListener('mousemove', mouseMoved);
        control.addEventListener('mouseup', mouseReleased);
        control.addEventListener('mouseout', mouseLeft);
        control.addEventListener('mouseover', function() { mouseEntered(control); });
        return control;
    }

    listen(sheet);
    sheet.addEventListener('keyup', function() { sheet.sync(true); });

    /**
     * Runs onSync, unless a value is being dragged or typed.
     * @param {Boolean} [force=false] - Runs it even if it ran less than half a second ago.
     */
    sheet.sync = function(force) {
        if (drag || editing) return;
        var now = new Date().getTime();
        // Forced, it still runs once for events coming together, like a key released in the spreadsheet,
        // which the panel holding it hears too.
        if (now - lastSync < (force ? 50 : SYNC_INTERVAL)) return;
        lastSync = now;
        sheet.onSync();
    };

    // The control of a value.
    function addCell(columnIndex, component) {
        var column = columns[columnIndex];
        var cell;
        if (column.type == 'bool') {
            cell = sheet.add('checkbox', undefined, '');
            cell.onClick = function() {
                sheet.onEdit(columns[cell.column], cell.row, 0, cell.value);
            };
        }
        else {
            cell = sheet.add('statictext', undefined, '', { justify: isNumber(column) ? 'right' : 'left' });
            cell.addEventListener('mousedown', function(e) { startDrag(cell, e); });
        }
        listen(cell);
        cell.column = columnIndex;
        cell.component = component;
        cell.row = -1;
        // Whether it's shown in blue, as editable.
        cell.blue = false;
        return cell;
    }

    // The controls of a row of a column: one for each value of a vector.
    function addCells(columnIndex) {
        var cells = [];
        for (var c = 0, n = componentCount(columns[columnIndex]); c < n; c++) cells.push(addCell(columnIndex, c));
        return cells;
    }

    function columnControlsAt(columnIndex) {
        if (columnControls[columnIndex]) return columnControls[columnIndex];
        var column = columns[columnIndex];
        var controls = {
            header: listen(sheet.add('statictext', undefined, column.name, { justify: 'center' })),
            line: listen(sheet.add('panel')),
            cells: []
        };
        // Blender shows what a column is when its name is hovered.
        controls.header.helpTip = column.tip ? column.name + '\n' + column.tip : column.name;
        columnControls[columnIndex] = controls;
        return controls;
    }

    function hideColumn(controls) {
        controls.header.visible = false;
        controls.line.visible = false;
        for (var s = 0, n = controls.cells.length; s < n; s++)
            for (var c = 0, m = controls.cells[s].length; c < m; c++) controls.cells[s][c].visible = false;
    }

    function sheetSize() {
        try {
            var size = sheet.size;
            if (size && size[0] > 0 && size[1] > 0) return [size[0], size[1]];
        }
        catch (e) {}
        return null;
    }

    // Places the controls for the size of the spreadsheet: finds what fits, creates what's missing,
    // hides what doesn't fit.
    function place() {
        var size = sheetSize();
        if (!size) return;
        var width = size[0];
        var height = size[1];

        var key = [width, height, version, firstColumn].join(':');
        if (key == placedKey) return;
        placedKey = key;

        // The arrows go back on their value once it's placed again: fill() puts them back.
        var hovered = hover;
        showArrows(null);
        hover = hovered;

        // The room left of the vertical scroll bar.
        var right = width - SCROLLBAR;
        var start = indexWidth + LINE + 2 * GAP;

        // The first column shown at the end of the horizontal scroll: from it, all the last columns fit.
        maxFirstColumn = 0;
        while (maxFirstColumn < columns.length - 1 && fittingColumns(maxFirstColumn, start, right).end < columns.length)
            maxFirstColumn++;
        firstColumn = Math.max(0, Math.min(firstColumn, maxFirstColumn));

        var fitting = fittingColumns(firstColumn, start, right);
        visibleColumns = [];
        for (var i = firstColumn; i < fitting.end; i++) visibleColumns.push(i);
        var x = fitting.x;
        var scrollsHorizontally = visibleColumns.length < columns.length;

        var bottom = height - (scrollsHorizontally ? SCROLLBAR : 0);
        slotCount = Math.max(0, Math.floor((bottom - HEADER_HEIGHT - LINE) / ROW_HEIGHT));
        firstRow = Math.max(0, Math.min(firstRow, rowCount - slotCount));
        visibleRows = Math.min(slotCount, rowCount - firstRow);
        var rowsTop = HEADER_HEIGHT + LINE;

        // The index of the rows, on the left, without a name, like in Blender.
        if (!indexLine) indexLine = listen(sheet.add('panel'));
        indexLine.bounds = [indexWidth + GAP, 0, indexWidth + GAP + LINE, bottom];
        if (!headerLine) headerLine = listen(sheet.add('panel'));
        headerLine.bounds = [0, HEADER_HEIGHT, Math.min(x, right), HEADER_HEIGHT + LINE];

        for (var s = 0; s < visibleRows; s++) {
            if (!indexCells[s]) indexCells[s] = listen(sheet.add('statictext', undefined, '', { justify: 'right' }));
            var y = rowsTop + s * ROW_HEIGHT;
            indexCells[s].bounds = [0, y + TEXT_OFFSET, indexWidth, y + ROW_HEIGHT];
            indexCells[s].visible = true;
        }
        for (var s = visibleRows, n = indexCells.length; s < n; s++) indexCells[s].visible = false;

        // The columns shown.
        var shown = {};
        x = start;
        for (var v = 0, n = visibleColumns.length; v < n; v++) {
            var index = visibleColumns[v];
            var column = columns[index];
            var controls = columnControlsAt(index);
            shown[index] = true;

            // A column wider than the room left, like a long name, is cut to fit.
            var columnWidth = Math.min(column.width, right - x);
            controls.header.bounds = [x, TEXT_OFFSET, x + columnWidth, HEADER_HEIGHT];
            controls.header.visible = true;
            controls.line.bounds = [x + columnWidth + GAP, 0, x + columnWidth + GAP + LINE, bottom];
            controls.line.visible = true;

            var components = componentCount(column);
            var part = columnWidth / components;
            for (var s = 0; s < visibleRows; s++) {
                if (!controls.cells[s]) controls.cells[s] = addCells(index);
                var y = rowsTop + s * ROW_HEIGHT;
                for (var c = 0; c < components; c++) {
                    var cell = controls.cells[s][c];
                    var left = Math.round(x + c * part);
                    var cellRight = Math.round(x + (c + 1) * part);
                    // Where the field typing the value goes.
                    cell.area = [left, y, cellRight, y + ROW_HEIGHT];
                    if (cell.type == 'checkbox') {
                        var middle = Math.round((left + cellRight) / 2);
                        cell.bounds = [middle - CHECKBOX / 2, y + 2, middle + CHECKBOX / 2, y + 2 + CHECKBOX];
                    }
                    else cell.bounds = textBounds(cell, false);
                    cell.visible = true;
                }
            }
            for (var s = visibleRows, m = controls.cells.length; s < m; s++)
                for (var c = 0; c < components; c++) controls.cells[s][c].visible = false;

            x += columnWidth + LINE + 2 * GAP;
        }
        for (var i = 0, n = columnControls.length; i < n; i++)
            if (columnControls[i] && !shown[i]) hideColumn(columnControls[i]);

        // The scroll bars, shown only when something doesn't fit.
        if (!vScroll) {
            vScroll = listen(sheet.add('scrollbar', undefined, 0, 0, 1));
            vScroll.stepdelta = 1;
            vScroll.onChanging = vScroll.onChange = function() { scrollTo(Math.round(vScroll.value)); };
        }
        vScroll.bounds = [width - SCROLLBAR, 0, width, bottom];
        vScroll.visible = rowCount > slotCount;
        if (vScroll.visible) {
            vScroll.maxvalue = rowCount - slotCount;
            vScroll.jumpdelta = Math.max(1, slotCount);
            vScroll.value = firstRow;
        }

        if (!hScroll) {
            hScroll = listen(sheet.add('scrollbar', undefined, 0, 0, 1));
            hScroll.stepdelta = 1;
            hScroll.jumpdelta = 1;
            hScroll.onChanging = hScroll.onChange = function() {
                var column = Math.round(hScroll.value);
                if (column == firstColumn) return;
                firstColumn = column;
                place();
            };
        }
        hScroll.bounds = [0, height - SCROLLBAR, right, height];
        hScroll.visible = scrollsHorizontally;
        if (scrollsHorizontally) {
            hScroll.maxvalue = Math.max(1, maxFirstColumn);
            hScroll.value = firstColumn;
        }

        fill();
    }

    // Shows the values of the rows from the first one shown.
    function fill() {
        for (var s = 0; s < visibleRows; s++) {
            var row = firstRow + s;
            indexCells[s].text = String(row);
            for (var v = 0, n = visibleColumns.length; v < n; v++) {
                var index = visibleColumns[v];
                var column = columns[index];
                var cells = columnControls[index].cells[s];
                var editable = isEditable(column, row);
                for (var c = 0, m = cells.length; c < m; c++) {
                    var cell = cells[c];
                    cell.row = row;
                    if (cell.type == 'checkbox') {
                        cell.value = !!column.values[row];
                        cell.enabled = editable;
                        continue;
                    }
                    cell.text = cellText(column, row, c);
                    // The values which can be edited are blue, like the ones of the timeline.
                    if (cell.blue != editable) {
                        nativeTextColor(cell, editable ? DuColor.Color.AFTER_EFFECTS_BLUE : DuColor.Color.APP_TEXT_COLOR);
                        cell.blue = editable;
                    }
                    // Blender shows the whole value when a number is hovered.
                    if (column.type == 'float') cell.helpTip = String(column.values[row]);
                    else if (column.type == 'float2') cell.helpTip = String(column.values[row][c]);
                    else if (column.type == 'string') cell.helpTip = cell.text;
                }
            }
        }

        // The arrows stay on the control under the pointer, whose value may not be editable anymore.
        if (hover) showArrows(hover, true);

        // The value being typed stays over its cell, or stops when its row isn't shown anymore.
        if (editing) {
            var cell = cellAt(editing.column, editing.row, editing.component);
            if (!cell) closeEditor(false);
            else {
                editing.cell = cell;
                editor.bounds = cell.area;
                cell.visible = false;
            }
        }
    }

    function scrollTo(row) {
        row = Math.max(0, Math.min(row, rowCount - slotCount));
        if (row == firstRow) return;
        firstRow = row;
        if (vScroll && vScroll.visible) vScroll.value = firstRow;
        fill();
    }

    /**
     * Shows new values.
     * @param {Object[]} newColumns - The columns.
     * @param {Boolean} [keepScroll=false] - Keeps the rows and the columns shown, when the columns are the same.
     */
    sheet.setColumns = function(newColumns, keepScroll) {
        columns = newColumns;
        rowCount = columns.length > 0 ? columns[0].values.length : 0;

        var keys = [];
        for (var i = 0, n = columns.length; i < n; i++) {
            columns[i].readOnly = isReadOnly(columns[i]);
            fitColumn(columns[i]);
            keys.push(columns[i].name + ':' + columns[i].type);
        }
        // Other columns need other controls.
        var key = keys.join('|');
        if (key != structure) {
            if (editing) closeEditor(false);
            removeColumnControls();
            structure = key;
            keepScroll = false;
        }
        if (!def(keepScroll, false)) {
            firstRow = 0;
            firstColumn = 0;
        }

        indexWidth = Math.round(Math.max(UNIT, textWidth(String(Math.max(0, rowCount - 1))) + 0.75 * UNIT));

        version++;
        place();
    };

    return sheet;
}
