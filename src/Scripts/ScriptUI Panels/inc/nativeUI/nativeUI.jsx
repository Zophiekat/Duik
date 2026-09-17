/**
 * Native After Effects controls, used by the Links and constraints panel and the constraint settings
 * instead of Duik's own controls.<br />
 * Duik's controls run their own event and redraw code, which makes them slow to respond;
 * native controls respond instantly.<br />
 * The buttons keep the features of Duik's buttons: they run <code>onClick</code>, <code>onAltClick</code>,
 * <code>onCtrlClick</code>, <code>onCtrlAltClick</code> or <code>onShiftClick</code> depending on the
 * modifier keys held, and show their options with <code>[Shift] + [Click]</code>.
 */

// Each control is in its own file, in this folder.

#include "defaults.jsx"
#include "nativeImage.jsx"
#include "nativeModifiers.jsx"
#include "nativeLayout.jsx"
#include "nativeShowPopup.jsx"
#include "addNativeGroup.jsx"
#include "addNativeSeparator.jsx"
#include "addNativeSection.jsx"
#include "addNativeTitleBar.jsx"
#include "addNativeSubPanel.jsx"
#include "addNativeOptionsPopup.jsx"
#include "addNativeLayout.jsx"
#include "nativeLayoutSize.jsx"
#include "addNativeButtonGrid.jsx"
#include "addNativeButton.jsx"
#include "addNativeValidButton.jsx"
#include "addNativeMenuButton.jsx"
#include "addNativeToolBar.jsx"
#include "addNativeDropdown.jsx"
#include "addNativeCheckBox.jsx"
#include "addNativeSetting.jsx"
#include "addNativeEditText.jsx"
#include "addNativeSlider.jsx"
#include "addNativeColorSelector.jsx"
#include "addNativeForm.jsx"
#include "addSearchList.jsx"
