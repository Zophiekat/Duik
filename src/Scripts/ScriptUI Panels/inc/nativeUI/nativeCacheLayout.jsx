/**
 * Keeps ScriptUI from laying a group out again at a size it has already been laid out at.<br />
 * ScriptUI lays a group which fills its parent out twice each time the parent is laid out: once to measure it,
 * once at the size it's given. The time doubles with every level of such groups, so Duik's buttons, some
 * 15 levels deep, took more than a minute to lay out at launch. With this, the group is only laid out when
 * its size changes, or after {@link nativeLayout} changed what's inside it: the layout itself is still done
 * by ScriptUI's own layout manager, so the group keeps filling and resizing with the panel.<br />
 * Set it on a few big groups spread along the depth of the UI, like the content of the panel and its tabs:
 * each call it skips still costs a little, so it's not worth it on small ones.
 * @param {Group} group - The group.
 */
function nativeCacheLayout(group) {
    // ScriptUI's own layout manager, which lays the group out.
    var auto = group.layout;
    var laidOutSize = '';

    function sizeKey() {
        var size = group.size;
        return size ? size[0] + 'x' + size[1] : '';
    }

    group.layout = {
        layout: function(recalculate) {
            var size = sizeKey();
            if (size != '' && size == laidOutSize) return;
            auto.layout(recalculate);
            laidOutSize = sizeKey();
        },
        resize: function() {
            auto.resize();
        },
        // Lays the group out again the next time, whatever its size: what's inside it has changed.
        invalidate: function() {
            laidOutSize = '';
        }
    };
}
