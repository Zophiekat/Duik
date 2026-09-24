/**
 * Adds a drop down list of the locations of a layer: none, front, back, middle, above, under or tail.
 * The native version of <code>createLocationSelector</code>.
 * @param {Group|Panel|Window} container - Where to add the list.
 * @param {string} [location=OCO.Location.NONE] - The selected location.
 * @return {DropDownList} The list, from {@link addNativeValueSelector}: <code>getValue()</code> returns the
 * selected <code>OCO.Location</code>, and <code>setValue(location)</code> selects one.
 */
function addNativeLocationSelector(container, location) {
    return addNativeValueSelector(container, [
        [i18n._("None"), w16_no_loc, OCO.Location.NONE],
        [i18n._("Front"), w16_front, OCO.Location.FRONT],
        [i18n._("Back"), w16_back, OCO.Location.BACK],
        [i18n._("Middle"), w16_middle, OCO.Location.MIDDLE],
        [i18n._("Above"), w16_above, OCO.Location.ABOVE],
        [i18n._("Under"), w16_under, OCO.Location.UNDER],
        [i18n._("Tail"), w16_tail_loc, OCO.Location.TAIL]
    ], location, i18n._("Location"));
}
