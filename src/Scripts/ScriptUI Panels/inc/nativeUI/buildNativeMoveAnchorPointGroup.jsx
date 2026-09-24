/**
 * Builds the sub-panel moving the anchor points of the selected layers: the native version of
 * <code>buildMoveAnchorPointGroup</code>, shared by the Links and constraints and Animation panels.
 * @param {Group} moveAnchorPointGroup - The group of the sub-panel.
 * @param {Group} mainGroup - The group shown again when the sub-panel is closed.
 */
function buildNativeMoveAnchorPointGroup( moveAnchorPointGroup, mainGroup ) {
    addNativeSubPanel(
        moveAnchorPointGroup,
        i18n._("Move anchor points"),
        mainGroup,
        false
    );

    var maskButton = addNativeCheckBox(
        moveAnchorPointGroup,
        i18n._("Include masks"),
        w16_mask,
        i18n._("Use the masks too to compute the bounds of the layers when repositionning the anchor point.")
    );

    var gridGroup = addNativeGroup(moveAnchorPointGroup, 'row');
    gridGroup.alignment = ['center', 'top'];
    var columns = [
        addNativeGroup(gridGroup, 'column'),
        addNativeGroup(gridGroup, 'column'),
        addNativeGroup(gridGroup, 'column')
    ];

    var marginsSlider;

    // Adds a button moving the anchor points to a location, in a column of the grid.
    function addAnchorButton( column, image, location ) {
        var button = columns[column].add('iconbutton', undefined, nativeImage(image), { style: 'button' });
        button.onClick = function() {
            Duik.Constraint.moveAnchorPoint(location, marginsSlider.value, maskButton.value);
        };
    }

    addAnchorButton(0, w12_move_tl, DuMath.Location.TOP_LEFT);
    addAnchorButton(0, w12_move_l, DuMath.Location.LEFT);
    addAnchorButton(0, w12_move_bl, DuMath.Location.BOTTOM_LEFT);
    addAnchorButton(1, w12_move_t, DuMath.Location.TOP);
    addAnchorButton(1, w12_center, DuMath.Location.CENTER);
    addAnchorButton(1, w12_move_b, DuMath.Location.BOTTOM);
    addAnchorButton(2, w12_move_tr, DuMath.Location.TOP_RIGHT);
    addAnchorButton(2, w12_move_r, DuMath.Location.RIGHT);
    addAnchorButton(2, w12_move_br, DuMath.Location.BOTTOM_RIGHT);

    marginsSlider = addNativeSlider(
        moveAnchorPointGroup,
        0,
        -500,
        500,
        i18n._("Margin"),
        DuAE.UnitText.PIXELS
    );

    moveAnchorPointGroup.built = true;
    nativeLayout(moveAnchorPointGroup);
}
