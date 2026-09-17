/**
 * The modifier keys held down, read like Duik's buttons do: [Cmd] stands for [Ctrl] on macOS.
 * @return {Object} The <code>shift</code>, <code>alt</code> and <code>ctrl</code> booleans.
 */
function nativeModifiers() {
    var keys = ScriptUI.environment.keyboardState;
    return {
        shift: keys.shiftKey,
        alt: keys.altKey,
        ctrl: DuSystem.mac ? keys.metaKey : keys.ctrlKey
    };
}
