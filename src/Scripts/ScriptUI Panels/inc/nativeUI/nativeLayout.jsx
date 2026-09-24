/**
 * Lays a group out again, once controls have been added to it.<br />
 * Before the UI is shown, it does nothing: the whole UI is built at launch, then laid out once by
 * <code>DuScriptUI.showUI</code>, so laying a part of it out on the way would only be done again.
 * @param {Group} group - The group.
 */
function nativeLayout(group) {
    if (!DuScriptUI.uiShown) return;

    // The groups which skip the layouts at an unchanged size must lay this one out again, as its content changed.
    var parent = group;
    // The depth is limited: a window is its own parent in some versions of ScriptUI.
    for (var i = 0; parent && i < 50; i++) {
        if (parent.layout && parent.layout.invalidate) parent.layout.invalidate();
        if (parent.parent === parent) break;
        parent = parent.parent;
    }

    group.layout.layout(true);
    group.layout.resize();
}
