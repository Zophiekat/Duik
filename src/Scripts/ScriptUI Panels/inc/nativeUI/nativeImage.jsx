/**
 * The image of an icon, for native controls.
 * @param {DuBinary|string} icon - The icon.
 * @return {string|File} The PNG data, or the icon file when Duik is set to extract the icons.
 */
function nativeImage(icon) {
    if (!(icon instanceof DuBinary)) return icon;
    if (DuESF.scriptSettings.get("common/extractIcons", false)) return icon.toFile();
    return icon.binAsString;
}
