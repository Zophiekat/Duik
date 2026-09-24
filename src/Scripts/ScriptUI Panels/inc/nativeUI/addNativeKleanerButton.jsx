/**
 * Adds the Kleaner button, showing a menu of its presets: the native version of <code>createKleanerButton</code>,
 * shared by the Animation and Automation panels. The menu is the one of <code>createKleanerButton</code>,
 * built by <code>buildKleanerMenu</code> in <i>utils.jsx</i>.
 * @param {Group|Panel|Window} container - Where to add the button, or a grid from {@link addNativeButtonGrid}.
 * @return {Group} The button, from {@link addNativeMenuButton}.
 */
function addNativeKleanerButton( container ) {
    var kleanerButton = addNativeMenuButton(
        container,
        i18n._("Kleaner"), /// TRANSLATORS: contraction of Keyframe cLEANER. Fee free to find something funny in your language. i.e. ES: Climpiador, FR: Clétoyeur
        w16_kleaner,
        i18n._("Clean Keyframes.\nAutomates the animation process, and makes it easier to control:\n- Anticipation\n- Motion interpolation\n- Overlap\n- Follow through or Bounce\n- Soft Body simulation\n")
    );
    kleanerButton.build = buildKleanerMenu;
    return kleanerButton;
}
