    
    logStartupStep("Panel built");
    DuSanity.run();
    logStartupStep("Sanity checked");
    // Every tab is built now, rather than the first time it's shown, and laid out with the rest of the UI.
    nativeBuildTabs();
    DuScriptUI.showUI(ui);
    logStartupStep("UI laid out and shown");
}
