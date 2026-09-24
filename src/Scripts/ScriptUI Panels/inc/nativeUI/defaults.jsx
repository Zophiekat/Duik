/**
 * The values shared by the native controls: the state of the popups, and the default
 * size of the buttons when no layout sets one.
 */

// True while a modal dialog opened from an options popup is shown, so that the popup stays open.
var nativeDialogOpen = false;

// The tabs of all the native tab panels, built at launch by nativeBuildTabs.
var nativeTabs = [];

/**
 * The height of the native buttons in pixels, or 0 to let ScriptUI size them.<br />
 * This is the fallback for the whole script: size the buttons of one panel with
 * {@link addNativeLayout}, and a single button with the <code>height</code> and
 * <code>width</code> options of {@link addNativeButton}.
 */
var nativeButtonHeight = 0;

/**
 * The height of the buttons showing a menu in pixels, or 0 to size them like the other buttons.
 * @see addNativeMenuButton
 */
var nativeMenuButtonHeight = 20;

/**
 * Puts the image of a button inside it, as an iconbutton carrying the text, instead of beside it
 * in the icon column of a grid. Native buttons draw either text or an image, so whether the text
 * shows depends on the platform: set this to false to go back to the icon next to the button.
 */
var nativeIconInButton = true;

/**
 * The room left beside the text of a button which carries its image inside it, in pixels: enough
 * for the image and the margins of the button. Raise it if the labels are still cropped.
 * @see nativeIconInButton
 */
var nativeIconButtonPadding = 32;
