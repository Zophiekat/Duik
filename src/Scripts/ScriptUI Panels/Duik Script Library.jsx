(function(thisObj) {

var mainScriptFile = new File($.fileName);

#include "inc/core.jsx"

var mainStack = addNativeGroup(ui.mainGroup, 'stack' );
mainStack.alignment = ['fill','fill'];
var libGroup = addNativeGroup(mainStack, 'column');
libGroup.alignment = ['fill','fill'];
var editorGroup = addNativeGroup(mainStack, 'column');
editorGroup.alignment = ['fill','fill'];
editorGroup.visible = false;

#include "inc/scriptLibPanel.jsx"
buildScriptLibPanel( libGroup, editorGroup );

#include "inc/scriptEditorPanel.jsx"
addNativeSubPanel(
    editorGroup,
    DuScriptUI.String.SCRIPT_LIB,
    libGroup,
    false
);
buildScriptEditorUI( editorGroup );
editorGroup.edit = function(content) {
    editorGroup.editText.text = content;
    libGroup.visible = false;
    editorGroup.visible = true;
};

#include "inc/ui_show.jsx"

})(this);