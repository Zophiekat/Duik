/**
 * Lays a group out again, once controls have been added to it.
 * @param {Group} group - The group.
 */
function nativeLayout(group) {
    group.layout.layout(true);
    group.layout.resize();
}
