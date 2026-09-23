/**
 * Modifiers change the geometry of a layer — its paths — where the constraints change its
 * transformation. They're the After Effects counterpart of Blender's modifier stack.
 * @namespace
 * @category Duik
 */
Duik.Modifier = {};

Duik.CmdLib['Modifier'] = {};

/**
 * The default prefix of the bone layers read by the armature deform modifier: the one Duik
 * names its bones with, <code>B &lt; Name &gt;</code>.
 * @type {string}
 */
Duik.Modifier.BONE_PREFIX = Duik.Layer.Type.BONE + ' < ';

/**
 * The part of a vertex each bone of a trio drives, as it's written in the name of the bone.
 * @enum {string}
 * @readonly
 */
Duik.Modifier.BonePart = {
    POINT: 'Point (Head)',
    IN_TANGENT: 'Handle Left (Tail)',
    OUT_TANGENT: 'Handle Right (Tail)'
}

/**
 * Reads back the armature written in the expression of an armature deform modifier.
 * @private
 * @param {string} expression The expression.
 * @return {Object|null} <code>{ fx, comp, prefix, bone, side }</code>: the name of the effect
 * controlling the modifier, the name of the composition holding the armature, and the prefix,
 * name and side the bones are named with.<br />
 * <code>null</code> if the expression isn't an armature deform modifier written by Duik.
 */
Duik.Modifier.bakedArmatureDeform = function(expression) {
    if (!expression) return null;
    if (expression.indexOf(DuAEExpression.Id.ARMATURE_DEFORM_MODIFIER) < 0) return null;

    var match = expression.match(/var DUIK_ARMATURE_DEFORM = (\{.*\});/);
    if (!match) return null;

    try {
        var s = eval('(' + match[1] + ')');
        return {
            fx: def(s.fx, ''),
            comp: def(s.comp, ''),
            prefix: def(s.prefix, ''),
            bone: def(s.bone, ''),
            side: def(s.side, '')
        };
    }
    catch (e) { return null; }
}

/**
 * The expression holding the armature of a modifier, written the way
 * {@link Duik.Constraint.targetExpression} holds the target of a constraint: on a single line,
 * so that Duik can read it back and show it in its panel.
 * @private
 * @param {Object} settings <code>{ fx, comp, prefix, bone, side }</code>.
 * @return {string} The expression.
 */
Duik.Modifier.armatureExpression = function(settings) {
    var quote = Duik.Constraint.expressionString;

    return [
        '// The armature this modifier deforms the path with, written here by Duik: an expression',
        '// can\'t list the compositions of the project, and an After Effects effect has no text',
        '// parameter to hold a name. The key is the name of the effect, so don\'t rename it, and',
        '// set the armature again in Duik after renaming its composition or its bones.',
        'var DUIK_ARMATURE_DEFORM = {' +
            'fx:' + quote(settings.fx) + ',' +
            'comp:' + quote(settings.comp) + ',' +
            'prefix:' + quote(settings.prefix) + ',' +
            'bone:' + quote(settings.bone) + ',' +
            'side:' + quote(settings.side) + '};'
    ].join('\n');
}

/**
 * Builds the expression of the armature deform modifier, which goes on the path it deforms.
 * @private
 * @param {Object} settings <code>{ fx, comp, prefix, bone, side }</code>: the name of the effect
 * controlling the modifier, the name of the composition holding the armature, and the prefix,
 * name and side the bones are named with.
 * @return {string} The expression.
 */
Duik.Modifier.armatureDeformExpression = function(settings) {
    var p = Duik.PseudoEffect.ARMATURE_DEFORM.props;
    var part = Duik.Modifier.BonePart;

    function param(name) {
        return 'fx(' + p[name].index + ').value';
    }

    return [DuAEExpression.Id.ARMATURE_DEFORM_MODIFIER,
        DuAEExpression.Library.get(['checkDuikEffect']),
        Duik.Modifier.armatureExpression(settings),
        '',
        '// A vertex is driven by three bones, named after the path and numbered like its',
        '// vertices: the point itself, and the two handles around it. The side goes last,',
        '// the way Duik names its layers: "B < Lashes 0 Point (Head) > [L]".',
        'var DUIK_SIDE_TAG = DUIK_ARMATURE_DEFORM.side == "" ? "" : " [" + DUIK_ARMATURE_DEFORM.side + "]";',
        '',
        '// The effect controlling the modifier. Removing it removes the modifier, the way',
        '// a modifier is taken off the stack in Blender: the path keeps the shape it was drawn with.',
        'function modifierEffect() {',
        '    try {',
        '        var fx = effect(DUIK_ARMATURE_DEFORM.fx);',
        '        if ( !checkDuikEffect(fx, "DUIK armatureDeform") ) return null;',
        '        return fx;',
        '    }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// The composition holding the armature; null when it\'s been renamed or removed.',
        'function armature() {',
        '    try { return comp(DUIK_ARMATURE_DEFORM.comp); }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// The layer this composition is nested through, when the armature is a precomposition',
        '// of this one: it\'s the layer named after it.',
        'function precompLayer() {',
        '    try { return thisComp.layer(DUIK_ARMATURE_DEFORM.comp); }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// One of the three bones of a vertex, by the part of the vertex it drives.',
        '// Throws when the armature has no bone for it, which leaves that vertex alone.',
        'function bone(src, i, part) {',
        '    return src.layer(DUIK_ARMATURE_DEFORM.prefix + DUIK_ARMATURE_DEFORM.bone +',
        '        " " + i + " " + part + " >" + DUIK_SIDE_TAG);',
        '}',
        '',
        '// Where a bone is, in the space this path is drawn in.',
        'function bonePoint(b, precomp) {',
        '    var w = b.toWorld(b.anchorPoint);',
        '    if (precomp) return fromComp(precomp.toComp([w[0], w[1], 0]));',
        '    return fromWorld(w);',
        '}',
        '',
        'var fx = modifierEffect();',
        'var influence = fx ? ' + param('Influence') + ' / 100 : 0;',
        'var viaPrecomp = fx ? ' + param('Via precomp layer') + ' : false;',
        '',
        'var pts = points();',
        'var inT = inTangents();',
        'var outT = outTangents();',
        '',
        'var src = influence != 0 ? armature() : null;',
        'var precomp = src && viaPrecomp ? precompLayer() : null;',
        'var n = src ? pts.length : 0;',
        '',
        'for (var i = 0; i < n; i++) {',
        '    var head, left, right;',
        '    // A vertex the armature has no bones for keeps the shape the path was drawn with.',
        '    try {',
        '        head  = bonePoint(bone(src, i, "' + part.POINT + '"), precomp);',
        '        left  = bonePoint(bone(src, i, "' + part.IN_TANGENT + '"), precomp);',
        '        right = bonePoint(bone(src, i, "' + part.OUT_TANGENT + '"), precomp);',
        '    }',
        '    catch (e) { continue; }',
        '',
        '    // The tangents are the handles relative to the point they belong to.',
        '    for (var k = 0; k < 2; k++) {',
        '        var v = pts[i][k];',
        '        pts[i][k] = v + (head[k] - v) * influence;',
        '        inT[i][k] += (left[k] - head[k] - inT[i][k]) * influence;',
        '        outT[i][k] += (right[k] - head[k] - outT[i][k]) * influence;',
        '    }',
        '}',
        '',
        'createPath(pts, inT, outT, isClosed());'
    ].join('\n');
}

Duik.CmdLib['Modifier']["Armature Deform"] = "Duik.Modifier.armatureDeform()";
/**
 * Adds an <i>armature deform</i> modifier to Bézier paths: each vertex of the path follows a trio
 * of bones of an armature — one for the point, one for each of its two handles — matched to it by
 * index instead of by a skin weight.<br />
 * This is the index-based After Effects counterpart of Blender's <i>Armature</i> deform modifier:
 * the bones live in any composition of the project and are looked up by name, as
 * <code>&lt;prefix&gt;&lt;bone&gt; &lt;index&gt; Point (Head) &gt; [&lt;side&gt;]</code> and the
 * two handles around it. A vertex the armature has no bones for keeps the shape it was drawn with.<br />
 * The armature is looked up by name, so run this again after renaming its composition or its bones.<br />
 * The modifier is computed live by an expression on the path, and never needs a keyframe.
 * @param {CompItem} comp - The composition holding the armature.
 * @param {string} bone - The name of the bones, without their index and their side.
 * @param {string} [side=''] - The side of the bones, as it's written between brackets at the
 * end of their name. An empty string for bones with no side.
 * @param {string} [prefix=Duik.Modifier.BONE_PREFIX] - What the name of the bones starts with.
 * @param {PropertyBase|DuAEProperty|PropertyBase[]|DuAEProperty[]} [paths] - The paths to deform.
 * The selected ones in the active composition if omitted.
 * @return {Property[]} The effects added on the layers to control the modifiers.
 */
Duik.Modifier.armatureDeform = function(comp, bone, side, prefix, paths) {
    bone = def(bone, '');
    side = def(side, '');
    prefix = def(prefix, Duik.Modifier.BONE_PREFIX);
    paths = def(paths, DuAEComp.getSelectedProps(PropertyValueType.SHAPE));
    paths = new DuList(paths);
    if (paths.length() == 0) return [];

    DuAE.beginUndoGroup( i18n._("Armature deform"), false);

    var pe = Duik.PseudoEffect.ARMATURE_DEFORM;
    var effects = [];

    paths.do(function(path) {
        path = new DuAEProperty(path);
        path = path.pathProperty();
        if (!path) return;

        var layer = path.layer;
        var prop = path.getProperty();

        // A path which already has a modifier keeps its effect, so that the settings of the
        // others on the same layer, and the animation of this one, are left alone.
        var name = '';
        var baked = Duik.Modifier.bakedArmatureDeform(prop.expression);
        if (baked) {
            var current = layer("ADBE Effect Parade").property(baked.fx);
            if (current && current.matchName.indexOf(pe.matchName) == 0) name = baked.fx;
        }

        var effect;
        if (name != '') effect = layer("ADBE Effect Parade").property(name);
        else {
            // The name of the effect is what ties a modifier to its armature, so it has to be unique.
            name = Duik.Constraint.uniqueEffectName(layer, pe.name);
            effect = pe.apply(layer, name);
        }
        effects.push(effect);

        // Never keeping the value: that would bake the deformed path into the drawn one.
        path.setExpression( Duik.Modifier.armatureDeformExpression({
            fx: name,
            comp: comp ? comp.name : '',
            prefix: prefix,
            bone: bone,
            side: side
        }), false );
    });

    DuAE.endUndoGroup( i18n._("Armature deform"));

    return effects;
}

/**
 * Tells what armature the armature deform modifier of a path reads. The armature can't be shown in
 * the effect itself: an After Effects effect has no parameter able to display a name, and effect
 * parameters can't be renamed.
 * @param {PropertyBase|DuAEProperty} [path] - The path. The first selected one in the active
 * composition if omitted.
 * @return {Object|null} <code>{ fx, comp, prefix, bone, side }</code>, as
 * {@link Duik.Modifier.bakedArmatureDeform} returns it.<br />
 * <code>null</code> if there's no path with an armature deform modifier.
 */
Duik.Modifier.getArmatureDeform = function(path) {
    var paths = isdef(path) ? new DuList(path) : new DuList(DuAEComp.getSelectedProps(PropertyValueType.SHAPE));

    var settings = null;
    paths.do(function(p) {
        if (settings) return;
        p = new DuAEProperty(p);
        p = p.pathProperty();
        if (!p) return;
        settings = Duik.Modifier.bakedArmatureDeform(p.getProperty().expression);
    });

    return settings;
}

/**
 * How the pose shape interpolator blends the poses around its target position, in the order of
 * the <i>Interpolation</i> menu of its effect.
 * @enum {int}
 * @readonly
 */
Duik.Modifier.PoseInterpolation = {
    /** The three poses of the triangle the target is in, weighted by where it is inside it. */
    TRIANGLES: 1,
    /** The same three poses, eased so that the shape settles on each pose around its point. */
    SMOOTH_TRIANGLES: 2,
    /** Only the pose nearest to the target, without blending. */
    NEAREST_POSE: 3
}

/**
 * Reads back the name of the effect controlling a pose shape interpolator modifier.
 * @private
 * @param {string} expression The expression.
 * @return {Object|null} <code>{ fx }</code>: the name of the effect.<br />
 * <code>null</code> if the expression isn't a pose shape interpolator modifier written by Duik.
 */
Duik.Modifier.bakedPoseShapeInterpolator = function(expression) {
    if (!expression) return null;
    if (expression.indexOf(DuAEExpression.Id.POSE_SHAPE_INTERPOLATOR_MODIFIER) < 0) return null;

    var match = expression.match(/var DUIK_POSE_SHAPE = (\{.*\});/);
    if (!match) return null;

    try {
        var s = eval('(' + match[1] + ')');
        return { fx: def(s.fx, '') };
    }
    catch (e) { return null; }
}

/**
 * Builds the expression of the pose shape interpolator modifier, which goes on the path it deforms.
 * @private
 * @param {Object} settings <code>{ fx }</code>: the name of the effect controlling the modifier.
 * @return {string} The expression.
 */
Duik.Modifier.poseShapeInterpolatorExpression = function(settings) {
    var p = Duik.PseudoEffect.POSE_SHAPE_INTERPOLATOR.props;
    var mode = Duik.Modifier.PoseInterpolation;

    return [DuAEExpression.Id.POSE_SHAPE_INTERPOLATOR_MODIFIER,
        DuAEExpression.Library.get(['checkDuikEffect']),
        '// The effect this modifier is controlled with, written here by Duik. Its layers and',
        '// settings are in the effect itself; don\'t rename it.',
        'var DUIK_POSE_SHAPE = {fx:' + Duik.Constraint.expressionString(settings.fx) + '};',
        '',
        'var TRIANGLES = ' + mode.TRIANGLES + ';',
        'var SMOOTH_TRIANGLES = ' + mode.SMOOTH_TRIANGLES + ';',
        'var NEAREST_POSE = ' + mode.NEAREST_POSE + ';',
        '',
        '// The effect controlling the modifier. Removing it removes the modifier: the path keeps',
        '// the shape it was drawn with.',
        'function modifierEffect() {',
        '    try {',
        '        var fx = effect(DUIK_POSE_SHAPE.fx);',
        '        if ( !checkDuikEffect(fx, "DUIK poseShapeInterp") ) return null;',
        '        return fx;',
        '    }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// A layer of the effect; null when it\'s set to None.',
        'function layerParam(fx, index) {',
        '    try { return fx(index); }',
        '    catch (e) { return null; }',
        '}',
        '',
        '// Where a layer is in the composition.',
        'function worldPosition(l) {',
        '    var w;',
        '    try { w = l.toWorld(l.anchorPoint); }',
        '    catch (e) { w = l.toWorld([0, 0, 0]); }',
        '    return [w[0], w[1]];',
        '}',
        '',
        '// The poses: every Point Control of the pose points layer, named after its pose, and where',
        '// its point is in the composition. These points are the ones the path of that layer joins up.',
        '// A Point Control at the same place as one above it is left out.',
        'function readPoses(src) {',
        '    var poses = [];',
        '    var effects = src("ADBE Effect Parade");',
        '    for (var i = 1, n = effects.numProperties; i <= n; i++) {',
        '        var e = effects(i);',
        '        var v;',
        '        try { v = e(1).value; }',
        '        catch (err) { continue; }',
        '        if ( !v || typeof v[0] != "number" || v.length != 2 ) continue;',
        '        var w = src.toWorld(v);',
        '        var twin = false;',
        '        for (var j = 0; j < poses.length; j++) {',
        '            if ( Math.abs(poses[j].p[0] - w[0]) < 0.001 && Math.abs(poses[j].p[1] - w[1]) < 0.001 ) {',
        '                twin = true;',
        '                break;',
        '            }',
        '        }',
        '        if (!twin) poses.push({ name: e.name, p: [w[0], w[1]] });',
        '    }',
        '    return poses;',
        '}',
        '',
        '// How far the point c is from the line through a and b: > 0 on its left, < 0 on its right.',
        'function side(P, a, b, c) {',
        '    var dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1];',
        '    return ( dx * (P[c][1] - P[a][1]) - dy * (P[c][0] - P[a][0]) ) / Math.sqrt(dx * dx + dy * dy);',
        '}',
        '',
        '// > 0 when d is inside the circle through the corners of the triangle a, b, c, turning left.',
        'function inCircle(P, a, b, c, d) {',
        '    var ax = P[a][0] - P[d][0], ay = P[a][1] - P[d][1];',
        '    var bx = P[b][0] - P[d][0], by = P[b][1] - P[d][1];',
        '    var cx = P[c][0] - P[d][0], cy = P[c][1] - P[d][1];',
        '    var a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy;',
        '    return ax * (by * c2 - b2 * cy) - ay * (bx * c2 - b2 * cx) + a2 * (bx * cy - by * cx);',
        '}',
        '',
        '// The Delaunay triangulation of the points, and its outline: { tris: [[a, b, c], ...], outline: [[a, b], ...] },',
        '// every triangle turning left. The points are swept from left to right, each one joined to the edges',
        '// of the outline it can see, which covers them all; then the edges are flipped until no point is',
        '// inside the circle of a triangle. Points all on a line have no triangle: the outline joins them up.',
        'function triangulate(P) {',
        '    var n = P.length;',
        '    var order = [];',
        '    for (var i = 0; i < n; i++) order.push(i);',
        '    order.sort(function(i, j) { return (P[i][0] - P[j][0]) || (P[i][1] - P[j][1]); });',
        '',
        '    // What counts as a straight line, and as a point on a circle, at the scale of the poses.',
        '    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;',
        '    for (var i = 0; i < n; i++) {',
        '        minX = Math.min(minX, P[i][0]); maxX = Math.max(maxX, P[i][0]);',
        '        minY = Math.min(minY, P[i][1]); maxY = Math.max(maxY, P[i][1]);',
        '    }',
        '    var size = Math.max(maxX - minX, maxY - minY, 1);',
        '    var flat = size * 1e-9;',
        '    var round = size * size * size * size * 1e-12;',
        '',
        '    // The first points, as long as they\'re on a line.',
        '    var k = 2;',
        '    while ( k < n && Math.abs( side(P, order[0], order[1], order[k]) ) <= flat ) k++;',
        '    if (k == n) {',
        '        var line = [];',
        '        for (var i = 1; i < n; i++) line.push([ order[i - 1], order[i] ]);',
        '        return { tris: [], outline: line };',
        '    }',
        '',
        '    // The first triangles, joining that line to the next point, and their outline.',
        '    var p = order[k];',
        '    var left = side(P, order[0], order[1], p) > 0;',
        '    var tris = [];',
        '    for (var i = 0; i < k - 1; i++) {',
        '        if (left) tris.push([ order[i], order[i + 1], p ]);',
        '        else tris.push([ order[i + 1], order[i], p ]);',
        '    }',
        '    var hull = [];',
        '    if (left) {',
        '        for (var i = 0; i < k; i++) hull.push(order[i]);',
        '        hull.push(p);',
        '    }',
        '    else {',
        '        hull.push(order[0], p);',
        '        for (var i = k - 1; i > 0; i--) hull.push(order[i]);',
        '    }',
        '',
        '    // Each next point is outside of the outline: it\'s joined to the edges which have it on their',
        '    // right, and they follow each other along the outline.',
        '    for (var i = k + 1; i < n; i++) {',
        '        p = order[i];',
        '        var m = hull.length;',
        '        var sees = [];',
        '        for (var j = 0; j < m; j++) sees.push( side(P, hull[j], hull[(j + 1) % m], p) < -flat );',
        '        var s = -1;',
        '        for (var j = 0; j < m; j++) {',
        '            if ( sees[j] && !sees[(j + m - 1) % m] ) {',
        '                s = j;',
        '                break;',
        '            }',
        '        }',
        '        if (s < 0) continue;',
        '        var e = s;',
        '        while ( sees[(e + 1) % m] ) e = (e + 1) % m;',
        '        for (var j = s; ; j = (j + 1) % m) {',
        '            tris.push([ hull[(j + 1) % m], hull[j], p ]);',
        '            if (j == e) break;',
        '        }',
        '        var newHull = [];',
        '        for (var j = (e + 1) % m; ; j = (j + 1) % m) {',
        '            newHull.push(hull[j]);',
        '            if (j == s) break;',
        '        }',
        '        newHull.push(p);',
        '        hull = newHull;',
        '    }',
        '',
        '    // Flips the edge between two triangles when the far corner of one is inside the circle of the',
        '    // other, until there\'s none left. A triangle flipped in a pass waits for the next one.',
        '    for (var pass = 0; pass < 100; pass++) {',
        '        var edges = {};',
        '        var flipped = [];',
        '        var any = false;',
        '        for (var t = 0; t < tris.length; t++) {',
        '            for (var c = 0; c < 3; c++) {',
        '                var a = tris[t][c], b = tris[t][(c + 1) % 3];',
        '                var key = Math.min(a, b) + "," + Math.max(a, b);',
        '                var o = edges[key];',
        '                if (o === undefined) {',
        '                    edges[key] = t;',
        '                    continue;',
        '                }',
        '                if (flipped[t] || flipped[o]) continue;',
        '                var cT = tris[t][(c + 2) % 3];',
        '                var dT = tris[o][0] + tris[o][1] + tris[o][2] - a - b;',
        '                if ( inCircle(P, a, b, cT, dT) <= round ) continue;',
        '                tris[t] = [a, dT, cT];',
        '                tris[o] = [dT, b, cT];',
        '                flipped[t] = flipped[o] = any = true;',
        '            }',
        '        }',
        '        if (!any) break;',
        '    }',
        '',
        '    var outline = [];',
        '    for (var j = 0; j < hull.length; j++) outline.push([ hull[j], hull[(j + 1) % hull.length] ]);',
        '    return { tris: tris, outline: outline };',
        '}',
        '',
        '// The weights of the three corners of a triangle at a point.',
        'function barycentric(q, a, b, c) {',
        '    var d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);',
        '    var l1 = ( (b[1] - c[1]) * (q[0] - c[0]) + (c[0] - b[0]) * (q[1] - c[1]) ) / d;',
        '    var l2 = ( (c[1] - a[1]) * (q[0] - c[0]) + (a[0] - c[0]) * (q[1] - c[1]) ) / d;',
        '    return [l1, l2, 1 - l1 - l2];',
        '}',
        '',
        '// Blends the two ends of the edge nearest to the point, at the nearest place along it.',
        'function nearestEdge(P, edges, q) {',
        '    var best = null, bestD = Infinity;',
        '    for (var e = 0; e < edges.length; e++) {',
        '        var a = P[edges[e][0]], b = P[edges[e][1]];',
        '        var ab = [ b[0] - a[0], b[1] - a[1] ];',
        '        var len2 = ab[0] * ab[0] + ab[1] * ab[1];',
        '        var t = len2 > 0 ? ( (q[0] - a[0]) * ab[0] + (q[1] - a[1]) * ab[1] ) / len2 : 0;',
        '        t = Math.max(0, Math.min(1, t));',
        '        var dx = a[0] + ab[0] * t - q[0], dy = a[1] + ab[1] * t - q[1];',
        '        var d = dx * dx + dy * dy;',
        '        if (d < bestD) {',
        '            bestD = d;',
        '            best = [ { i: edges[e][0], w: 1 - t }, { i: edges[e][1], w: t } ];',
        '        }',
        '    }',
        '    return best;',
        '}',
        '',
        '// The poses to blend, as { i, w }: the index of the pose and its weight, the weights adding up to 1.',
        'function poseWeights(P, q, mode) {',
        '    var n = P.length;',
        '    if (n == 0) return [];',
        '',
        '    if (mode == NEAREST_POSE || n == 1) {',
        '        var nearest = 0;',
        '        for (var i = 1; i < n; i++) if ( length(P[i], q) < length(P[nearest], q) ) nearest = i;',
        '        return [ { i: nearest, w: 1 } ];',
        '    }',
        '',
        '    var weights = null;',
        '    var T = triangulate(P);',
        '    for (var t = 0; t < T.tris.length; t++) {',
        '        var tri = T.tris[t];',
        '        var l = barycentric(q, P[tri[0]], P[tri[1]], P[tri[2]]);',
        '        if (l[0] < -1e-9 || l[1] < -1e-9 || l[2] < -1e-9) continue;',
        '        l = [ Math.max(0, l[0]), Math.max(0, l[1]), Math.max(0, l[2]) ];',
        '        var sum = l[0] + l[1] + l[2];',
        '        weights = [ { i: tri[0], w: l[0] / sum }, { i: tri[1], w: l[1] / sum }, { i: tri[2], w: l[2] / sum } ];',
        '        break;',
        '    }',
        '',
        '    // Outside of the poses, the target is brought back onto their outline.',
        '    if (!weights) weights = nearestEdge(P, T.outline, q);',
        '',
        '    if (mode == SMOOTH_TRIANGLES) {',
        '        var sum = 0;',
        '        for (var k = 0; k < weights.length; k++) {',
        '            var w = weights[k].w;',
        '            weights[k].w = w * w * (3 - 2 * w);',
        '            sum += weights[k].w;',
        '        }',
        '        for (var k = 0; k < weights.length; k++) weights[k].w /= sum;',
        '    }',
        '',
        '    return weights;',
        '}',
        '',
        '// The target paths of the poses, found by name in the target poses layer: a path by its own',
        '// name, or a group by the name of the group. A group stands for the first path inside it named',
        '// like this one, or else for its first path, so the paths of a Grease Pencil layer imported as a',
        '// group can each be deformed. Masks are paths too.',
        'function findTargets(tgt, names, ownName) {',
        '    var found = {};',
        '    var left = 0;',
        '    for (var k = 0; k < names.length; k++) {',
        '        if (found["#" + names[k]] === undefined) left++;',
        '        found["#" + names[k]] = null;',
        '    }',
        '',
        '    function add(name, path) {',
        '        if (found["#" + name] !== null) return;',
        '        found["#" + name] = path;',
        '        left--;',
        '    }',
        '',
        '    function walk(group) {',
        '        var first = null, own = null;',
        '        for (var i = 1, n = group.numProperties; i <= n && left > 0; i++) {',
        '            var item = group(i);',
        '            var path = null;',
        '            try { path = item("ADBE Vector Shape"); }',
        '            catch (e) { path = null; }',
        '',
        '            if (path) {',
        '                if (!own && item.name == ownName) own = path;',
        '            }',
        '            else {',
        '                var contents = null;',
        '                try { contents = item("ADBE Vectors Group"); }',
        '                catch (e) { contents = null; }',
        '                if (!contents) continue;',
        '                var inside = walk(contents);',
        '                if (!own) own = inside.own;',
        '                path = inside.own ? inside.own : inside.first;',
        '                if (!path) continue;',
        '            }',
        '',
        '            if (!first) first = path;',
        '            add(item.name, path);',
        '        }',
        '        return { first: first, own: own };',
        '    }',
        '',
        '    try { walk( tgt("ADBE Root Vectors Group") ); }',
        '    catch (e) {}',
        '',
        '    try {',
        '        var masks = tgt("ADBE Mask Parade");',
        '        for (var i = 1, n = masks.numProperties; i <= n && left > 0; i++)',
        '            add(masks(i).name, masks(i)("ADBE Mask Shape"));',
        '    }',
        '    catch (e) {}',
        '',
        '    return found;',
        '}',
        '',
        'var fx = modifierEffect();',
        'var influence = fx ? fx(' + p['Influence'].index + ').value / 100 : 0;',
        '',
        'var pts = points();',
        'var inT = inTangents();',
        'var outT = outTangents();',
        'var numPoints = pts.length;',
        '',
        'var posePoints = influence != 0 ? layerParam(fx, ' + p['Pose Points Layer'].index + ') : null;',
        'var targetPoses = posePoints ? layerParam(fx, ' + p['Target Poses Layer'].index + ') : null;',
        'var targetPosition = targetPoses ? layerParam(fx, ' + p['Target Position Layer'].index + ') : null;',
        'var poses = targetPosition ? readPoses(posePoints) : [];',
        '',
        'if (poses.length > 0) {',
        '    var P = [];',
        '    for (var i = 0; i < poses.length; i++) P.push(poses[i].p);',
        '    var weights = poseWeights(P, worldPosition(targetPosition), fx(' + p['Interpolation'].index + ').value);',
        '',
        '    var names = [];',
        '    for (var k = 0; k < weights.length; k++) if (weights[k].w > 0) names.push(poses[weights[k].i].name);',
        '    var targets = findTargets(targetPoses, names, thisProperty.propertyGroup(1).name);',
        '',
        '    // The blend of the poses. A pose with no path, or with a path which hasn\'t as many',
        '    // vertices as this one, holds the shape this path was drawn with.',
        '    var bp = [], bi = [], bo = [];',
        '    for (var j = 0; j < numPoints; j++) {',
        '        bp.push([0, 0]);',
        '        bi.push([0, 0]);',
        '        bo.push([0, 0]);',
        '    }',
        '    for (var k = 0; k < weights.length; k++) {',
        '        var w = weights[k].w;',
        '        if (w <= 0) continue;',
        '        var sp = pts, si = inT, so = outT;',
        '        var path = targets["#" + poses[weights[k].i].name];',
        '        if (path) {',
        '            var tp = path.points();',
        '            if (tp.length == numPoints) {',
        '                sp = tp;',
        '                si = path.inTangents();',
        '                so = path.outTangents();',
        '            }',
        '        }',
        '        for (var j = 0; j < numPoints; j++) {',
        '            for (var c = 0; c < 2; c++) {',
        '                bp[j][c] += sp[j][c] * w;',
        '                bi[j][c] += si[j][c] * w;',
        '                bo[j][c] += so[j][c] * w;',
        '            }',
        '        }',
        '    }',
        '',
        '    for (var j = 0; j < numPoints; j++) {',
        '        for (var c = 0; c < 2; c++) {',
        '            pts[j][c] += (bp[j][c] - pts[j][c]) * influence;',
        '            inT[j][c] += (bi[j][c] - inT[j][c]) * influence;',
        '            outT[j][c] += (bo[j][c] - outT[j][c]) * influence;',
        '        }',
        '    }',
        '}',
        '',
        'createPath(pts, inT, outT, isClosed());'
    ].join('\n');
}

Duik.CmdLib['Modifier']["Pose Shape Interpolator"] = "Duik.Modifier.poseShapeInterpolator()";
/**
 * Adds a <i>pose shape interpolator</i> modifier to Bézier paths: the path morphs between the
 * shapes of a set of poses, laid out as points in a 2D space, following where a target layer is
 * in that space.<br />
 * The poses are the Point Controls of the <i>Pose Points Layer</i>; each one is named after its
 * pose, and its shape is the path, or the group, of the same name in the <i>Target Poses Layer</i>.
 * The world position of the <i>Target Position Layer</i> tells how much of each pose goes into the
 * shape: the Delaunay triangulation of the points gives the triangle it's in, and the three poses
 * at its corners are blended by where it is inside it.<br />
 * The three layers are set in the effect, and can be changed there at any time. The modifier is
 * computed live by an expression on the path, and never needs a keyframe.
 * @param {Layer} [posePointsLayer] - The layer holding the Point Controls of the poses.
 * @param {Layer} [targetPosesLayer] - The layer holding the path of each pose.
 * @param {Layer} [targetPositionLayer] - The layer whose position blends the poses.
 * @param {PropertyBase|DuAEProperty|PropertyBase[]|DuAEProperty[]} [paths] - The paths to deform.
 * The selected ones in the active composition if omitted.
 * @return {Property[]} The effects added or reused on the layers to control the modifiers:
 * the paths of a same layer share one.
 */
Duik.Modifier.poseShapeInterpolator = function(posePointsLayer, targetPosesLayer, targetPositionLayer, paths) {
    paths = def(paths, DuAEComp.getSelectedProps(PropertyValueType.SHAPE));
    paths = new DuList(paths);
    if (paths.length() == 0) return [];

    DuAE.beginUndoGroup( i18n._("Pose shape interpolator"), false);

    var pe = Duik.PseudoEffect.POSE_SHAPE_INTERPOLATOR;
    var p = pe.props;

    // The path properties, by layer.
    var layers = [];
    paths.do(function(path) {
        path = new DuAEProperty(path);
        path = path.pathProperty();
        if (!path) return;

        var layer = path.layer;
        for (var i = 0, n = layers.length; i < n; i++) {
            if (layers[i].layer.index != layer.index) continue;
            layers[i].paths.push(path);
            return;
        }
        layers.push({ layer: layer, paths: [path] });
    });

    // The layers a modifier reads have to be in the same composition as the path.
    function setLayer(effect, index, layer, comp) {
        if (!layer) return;
        if (layer.containingComp.id != comp.id) return;
        effect(index).setValue(layer.index);
    }

    var effects = [];

    for (var i = 0, n = layers.length; i < n; i++) {
        var layer = layers[i].layer;
        var layerPaths = layers[i].paths;

        // The paths of a layer share an effect: the one of a path which already has the
        // modifier, so that its settings and its animation are kept.
        var name = '';
        for (var j = 0, m = layerPaths.length; j < m; j++) {
            var baked = Duik.Modifier.bakedPoseShapeInterpolator(layerPaths[j].getProperty().expression);
            if (!baked) continue;
            var current = layer("ADBE Effect Parade").property(baked.fx);
            if (!current || current.matchName.indexOf(pe.matchName) != 0) continue;
            name = baked.fx;
            break;
        }

        var effect;
        if (name != '') effect = layer("ADBE Effect Parade").property(name);
        else {
            name = Duik.Constraint.uniqueEffectName(layer, pe.name);
            effect = pe.apply(layer, name);
        }

        var comp = layer.containingComp;
        setLayer(effect, p['Pose Points Layer'].index, posePointsLayer, comp);
        setLayer(effect, p['Target Poses Layer'].index, targetPosesLayer, comp);
        setLayer(effect, p['Target Position Layer'].index, targetPositionLayer, comp);
        effects.push(effect);

        // Never keeping the value: that would bake the deformed path into the drawn one.
        var expression = Duik.Modifier.poseShapeInterpolatorExpression({ fx: name });
        for (var j = 0, m = layerPaths.length; j < m; j++) layerPaths[j].setExpression(expression, false);
    }

    DuAE.endUndoGroup( i18n._("Pose shape interpolator"));

    return effects;
}

/**
 * Tells what the pose shape interpolator modifier of a path reads: the layers set in its effect.
 * @param {PropertyBase|DuAEProperty} [path] - The path. The first selected one in the active
 * composition if omitted.
 * @return {Object|null} <code>{ effect, posePoints, targetPoses, targetPosition }</code>: the effect
 * controlling the modifier, and its three layers, <code>null</code> when they're set to None.<br />
 * <code>null</code> if there's no path with a pose shape interpolator modifier.
 */
Duik.Modifier.getPoseShapeInterpolator = function(path) {
    var paths = isdef(path) ? new DuList(path) : new DuList(DuAEComp.getSelectedProps(PropertyValueType.SHAPE));
    var pe = Duik.PseudoEffect.POSE_SHAPE_INTERPOLATOR;
    var p = pe.props;

    var settings = null;
    paths.do(function(prop) {
        if (settings) return;
        prop = new DuAEProperty(prop);
        prop = prop.pathProperty();
        if (!prop) return;

        var baked = Duik.Modifier.bakedPoseShapeInterpolator(prop.getProperty().expression);
        if (!baked) return;

        var effect = prop.layer("ADBE Effect Parade").property(baked.fx);
        if (!effect || effect.matchName.indexOf(pe.matchName) != 0) return;

        var comp = prop.comp;
        function layerAt(index) {
            var layerIndex = effect(index).value;
            if (layerIndex < 1 || layerIndex > comp.numLayers) return null;
            return comp.layer(layerIndex);
        }

        settings = {
            effect: effect,
            posePoints: layerAt(p['Pose Points Layer'].index),
            targetPoses: layerAt(p['Target Poses Layer'].index),
            targetPosition: layerAt(p['Target Position Layer'].index)
        };
    });

    return settings;
}
