/**
 * Adds a drop down list of the sides of a layer: none, left or right. The native version of <code>createSideSelector</code>.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {string} [side=OCO.Side.NONE] - The selected side.
 * @return {DropDownList} The list, from {@link addNativeValueSelector}: <code>getValue()</code> returns the
 * selected <code>OCO.Side</code>, and <code>setValue(side)</code> selects one.
 */
function addNativeSideSelector(container, side) {
    return addNativeValueSelector(container, [
        [i18n._("None"), w16_no_side, OCO.Side.NONE],
        [i18n._("Left"), w16_left_hand, OCO.Side.LEFT],
        [i18n._("Right"), w16_right_hand, OCO.Side.RIGHT]
    ], side, i18n._("Side"));
}
