/**
 * Native After Effects controls, used by all of Duik's panels instead of Duik's own controls.<br />
 * Duik's controls run their own event and redraw code, which makes them slow to respond;
 * native controls respond instantly.<br />
 * The buttons keep the features of Duik's buttons: they run <code>onClick</code>, <code>onAltClick</code>,
 * <code>onCtrlClick</code>, <code>onCtrlAltClick</code> or <code>onShiftClick</code> depending on the
 * modifier keys held, and show their options with <code>[Shift] + [Click]</code>.
 */

// Each control is in its own file, in this folder.

#include "defaults.jsx"
#include "nativeImage.jsx"
#include "nativeTextColor.jsx"
#include "nativeModifiers.jsx"
#include "nativeLayout.jsx"
#include "nativeCacheLayout.jsx"
#include "nativeShowPopup.jsx"
#include "addNativeGroup.jsx"
#include "addNativeSeparator.jsx"
#include "addNativeSection.jsx"
#include "addNativeTitleBar.jsx"
#include "addNativeSubPanel.jsx"
#include "addNativeOptionsPopup.jsx"
#include "addNativePopup.jsx"
#include "addNativeStringPrompt.jsx"
#include "addNativeLayout.jsx"
#include "nativeLayoutSize.jsx"
#include "addNativeButtonGrid.jsx"
#include "addNativeButton.jsx"
#include "addNativeValidButton.jsx"
#include "addNativeMenuButton.jsx"
#include "addNativeToggleButton.jsx"
#include "addNativeToolBar.jsx"
#include "addNativeTabPanel.jsx"
#include "addNativeFooter.jsx"
#include "addNativeDropdown.jsx"
#include "addNativeValueSelector.jsx"
#include "addNativeSideSelector.jsx"
#include "addNativeLocationSelector.jsx"
#include "addNativeSelectionModeSelector.jsx"
#include "addNativeBoneTypeSelector.jsx"
#include "addNativeCheckBox.jsx"
#include "addNativeSetting.jsx"
#include "addNativeEditText.jsx"
#include "addNativeSlider.jsx"
#include "addNativeColorSelector.jsx"
#include "addNativeFileSelector.jsx"
#include "addNativeForm.jsx"
#include "addSearchList.jsx"
#include "addNativeLayerSelector.jsx"
#include "addNativeLibrary.jsx"
#include "addNativeSpreadsheet.jsx"

// Duik's own buttons and sub-panels, shared by several panels.
#include "addNativeAutorigButton.jsx"
#include "addNativeAlignButton.jsx"
#include "addNativeKleanerButton.jsx"
#include "addNativeXSheetButton.jsx"
#include "addNativeCtrlButton.jsx"
#include "buildNativeMoveAnchorPointGroup.jsx"
#include "buildNativeEffectorMapGroup.jsx"
