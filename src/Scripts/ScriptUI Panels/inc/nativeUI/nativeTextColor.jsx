/**
 * Colors the text of a native control, like the colored labels of Duik's check boxes.
 * The native version of <code>DuScriptUI.setTextColor</code>.
 * @param {Control} control - The control: a static text, a checkbox...
 * @param {DuColor} color - The color.
 */
function nativeTextColor(control, color) {
    var g = control.graphics;
    g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, color.floatRGBA(true), 1);
}
