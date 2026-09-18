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
