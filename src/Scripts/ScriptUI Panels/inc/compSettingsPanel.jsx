function buildCompSettingsPanel( container ) {

    // Native fields don't keep their previous text: it's kept here, for the linked fields to keep their ratio.
    function keepText( edit ) {
        edit.previousText = edit.text;
    }

    function setText( edit, text ) {
        edit.text = text;
        keepText(edit);
    }

    var sizeGroup = addNativeGroup( container, 'row');
    sizeGroup.alignment = ['fill', 'top'];

    var sizeOptionsGroup = addNativeGroup( sizeGroup, 'column');
    sizeOptionsGroup.alignment = ['left', 'center'];

    var sizeSettingsButton = addNativeButton(
        sizeOptionsGroup,
        '',
        DuScriptUI.Icon.OPTIONS,
        i18n._("Adjust other parameters for setting the size.")
    );
    sizeSettingsButton.alignment = ['center', 'top'];

    var sizeAnchorPopup = addNativePopup( i18n._("Resize settings") );
    sizeAnchorPopup.anchor = DuMath.Location.CENTER;
    sizeAnchorPopup.build = function() {
        var anchorButtons = [];

        var gridGroup = addNativeGroup(sizeAnchorPopup.content, 'row');
        gridGroup.alignment = ['center', 'top'];
        var columns = [
            addNativeGroup(gridGroup, 'column'),
            addNativeGroup(gridGroup, 'column'),
            addNativeGroup(gridGroup, 'column')
        ];

        // The anchor buttons work like radio buttons: the one clicked is the only one checked.
        function addAnchorButton( column, image, location ) {
            var button = addNativeToggleButton( columns[column], image, image, '', location == sizeAnchorPopup.anchor );
            button.onClick = function() {
                for (var i = 0; i < anchorButtons.length; i++) anchorButtons[i].setChecked( anchorButtons[i] == button );
                sizeAnchorPopup.anchor = location;
            };
            anchorButtons.push(button);
        }

        addAnchorButton(0, w12_move_tl, DuMath.Location.TOP_LEFT);
        addAnchorButton(0, w12_move_l, DuMath.Location.LEFT);
        addAnchorButton(0, w12_move_bl, DuMath.Location.BOTTOM_LEFT);
        addAnchorButton(1, w12_move_t, DuMath.Location.TOP);
        addAnchorButton(1, w12_center, DuMath.Location.CENTER);
        addAnchorButton(1, w12_move_b, DuMath.Location.BOTTOM);
        addAnchorButton(2, w12_move_tr, DuMath.Location.TOP_RIGHT);
        addAnchorButton(2, w12_move_r, DuMath.Location.RIGHT);
        addAnchorButton(2, w12_move_br, DuMath.Location.BOTTOM_RIGHT);
    };
    sizeAnchorPopup.tieTo(sizeSettingsButton);

    var sizeLinkButton = addNativeToggleButton(
        sizeOptionsGroup,
        w12_constraints,
        w12_unlink_chain,
        i18n._("Constraint the dimensions together.")
    );
    sizeLinkButton.alignment = ['center', 'center'];

    var sizeValuesGroup = addNativeGroup( sizeGroup, 'column');
    sizeValuesGroup.alignment = ['fill', 'top'];

    var widthGroup = addNativeSetting(sizeValuesGroup, i18n._("Width"));
    widthGroup.onClick = function() {
        if (heightGroup.checked) return;
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        setText(widthEdit, comp.width);
        setText(heightEdit, comp.height);
    };
    var widthEdit = addNativeEditText( widthGroup, '1920', " px" );
    keepText(widthEdit);
    widthEdit.onChange = function() {
        var prevWidth = parseInt( widthEdit.previousText );
        keepText(widthEdit);

        if (sizeLinkButton.checked) return;

        var width = parseInt(widthEdit.text);
        if ( isNaN(width) ) return;
        if ( isNaN(prevWidth) ) return;
        if (prevWidth == 0) return;

        var height = parseInt(heightEdit.text);
        if ( isNaN(height) ) return;

        height = width * height / prevWidth;
        setText(heightEdit, Math.round(height));
    };

    var heightGroup = addNativeSetting(sizeValuesGroup, i18n._("Height"));
    heightGroup.onClick = function() {
        if (widthGroup.checked) return;
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        setText(heightEdit, comp.height);
        setText(widthEdit, comp.width);
    };
    var heightEdit = addNativeEditText( heightGroup, '1080', " px" );
    keepText(heightEdit);
    heightEdit.onChange = function() {
        var prevHeight = parseInt( heightEdit.previousText );
        keepText(heightEdit);

        if (sizeLinkButton.checked) return;

        var height = parseInt(heightEdit.text);
        if ( isNaN(height) ) return;
        if ( isNaN(prevHeight) ) return;
        if (prevHeight == 0) return;

        var width = parseInt(widthEdit.text);
        if ( isNaN(width) ) return;

        width = height * width / prevHeight;
        setText(widthEdit, Math.round(width));
    };

    var parGroup = addNativeSetting(container, i18n._("Pixel aspect"));
    var parEdit = addNativeValueSelector( parGroup, [
        [i18n._("Square Pixels"), null, 1],
        [i18n._("D1/DV NTSC (0.91)"), null, 0.91],
        [i18n._("D1/DV NTSC Widescreen (1.21)"), null, 1.21],
        [i18n._("D1/DV PAL (1.09)"), null, 1.09],
        [i18n._("D1/DV PAL Widescreen (1.46)"), null, 1.46],
        [i18n._("HDV 1080/DVCPRO HD 720 (1.33)"), null, 1.33],
        [i18n._("DVCPRO HD 1080 (1.5)"), null, 1.5],
        [i18n._("Anamorphic 2:1 (2)"), null, 2]
    ]);

    var frameRateGroup = addNativeSetting(container, i18n._("Frame rate"));
    frameRateGroup.onClick = function() {
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        frameRateEdit.text = comp.frameRate;
    };
    var frameRateEdit = addNativeEditText( frameRateGroup, '24.00', " fps" );

    var durationGroup = addNativeSetting(container, i18n._("Duration"));
    durationGroup.onClick = function() {
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        durationEdit.text = timeToCurrentFormat( comp.duration, comp.frameRate, true );
    };
    var durationEdit = addNativeEditText( durationGroup, '00:00:00:00' );

    var displaySection = addNativeSection( container, i18n._("Display") );

    var resolutionGroup = addNativeSetting(displaySection, i18n._("Resolution"));
    var resolutionEdit = addNativeValueSelector( resolutionGroup, [
        [i18n._p("resolution", "Full"), null, [1,1]],
        [i18n._p("resolution", "Half"), null, [2,2]],
        [i18n._p("resolution", "Third"), null, [3,3]],
        [i18n._p("resolution", "Quarter"), null, [4,4]]
    ]);

    var preserveResolutionGroup = addNativeSetting(displaySection, i18n._("Preserve resolution"));
    var preserveResolutionEdit = addNativeCheckBox(
        preserveResolutionGroup,
        i18n._("Preserve") /// TRANSLATORS: for the resolution or the framerate, as in "don't change the resolution or the framerate"
    );

    var bgGroup = addNativeSetting(displaySection, i18n._("Background color"));
    var bgEdit = addNativeColorSelector( bgGroup );

    var shyGroup = addNativeSetting(displaySection, i18n._("Shy layers"));
    var shyEdit = addNativeCheckBox( shyGroup, i18n._("Hide") );

    var renderingSection = addNativeSection( container, i18n._("Rendering") );

    var proxyGroup = addNativeSetting(renderingSection, i18n._("Proxy"));
    var proxyEdit = addNativeCheckBox( proxyGroup, i18n._("Use") );

    var rendererGroup = addNativeSetting(renderingSection, i18n._("Renderer"));
    // Create a temp comp to populate
    var renderers = [];
    var comp = app.project.items.addComp('temp', 4, 4, 1, 1, 24);
    for (var i = 0, n = comp.renderers.length; i < n; i++) {
        renderers.push( [DuAEComp.RendererNames[comp.renderers[i]], null, comp.renderers[i]] );
    }
    comp.remove();
    var rendererEdit = addNativeValueSelector( rendererGroup, renderers );

    var preserveFrameRateGroup = addNativeSetting(renderingSection, i18n._("Preserve frame rate"));
    var preserveFrameRateEdit = addNativeCheckBox( preserveFrameRateGroup, i18n._("Preserve") );

    var frameBlendingGroup = addNativeSetting(renderingSection, i18n._("Frame blending"));
    var frameBlendingEdit = addNativeCheckBox( frameBlendingGroup, i18n._("Enabled") );

    var motionBlurSection = addNativeSection( container, i18n._("Motion blur") );

    var mbGroup = addNativeSetting(motionBlurSection, i18n._("Motion blur"));
    var mbEdit = addNativeCheckBox( mbGroup, i18n._("Enabled") );

    var shutterGroup = addNativeGroup(motionBlurSection, 'row');
    shutterGroup.alignment = ['fill', 'top'];

    var shutterLinkButton = addNativeToggleButton(
        shutterGroup,
        w12_constraints,
        w12_unlink_chain,
        i18n._("Constraint the dimensions together.")
    );
    shutterLinkButton.alignment = ['left', 'center'];

    var shutterValuesGroup = addNativeGroup( shutterGroup, 'column' );
    shutterValuesGroup.alignment = ['fill', 'top'];

    var shutterAngleGroup = addNativeSetting(shutterValuesGroup, i18n._("Shutter angle"));
    shutterAngleGroup.onClick = function() {
        if (shutterPhaseGroup.checked) return;
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        setText(shutterAngleEdit, comp.shutterAngle);
        setText(shutterPhaseEdit, comp.shutterPhase);
    }
    var shutterAngleEdit = addNativeEditText( shutterAngleGroup, '90', " °" );
    keepText(shutterAngleEdit);
    shutterAngleEdit.onChange = function() {
        var prevAngle = parseInt( shutterAngleEdit.previousText );
        keepText(shutterAngleEdit);

        if (shutterLinkButton.checked) return;

        var angle = parseInt(shutterAngleEdit.text);
        if ( isNaN(angle) ) return;
        if ( isNaN(prevAngle) ) return;
        if (prevAngle == 0) return;

        var phase = parseInt(shutterPhaseEdit.text);
        if ( isNaN(phase) ) return;

        phase = angle * phase / prevAngle;
        setText(shutterPhaseEdit, Math.round(phase));
    };

    var shutterPhaseGroup = addNativeSetting(shutterValuesGroup, i18n._("Shutter phase"));
    shutterPhaseGroup.onClick = function() {
        if (shutterAngleGroup.checked) return;
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        setText(shutterAngleEdit, comp.shutterAngle);
        setText(shutterPhaseEdit, comp.shutterPhase);
    }
    var shutterPhaseEdit = addNativeEditText( shutterPhaseGroup, '-45', " °" );
    keepText(shutterPhaseEdit);
    shutterPhaseEdit.onChange = function() {
        var prevPhase = parseInt( shutterPhaseEdit.previousText );
        keepText(shutterPhaseEdit);

        if (shutterLinkButton.checked) return;

        var phase = parseInt(shutterPhaseEdit.text);
        if ( isNaN(phase) ) return;
        if ( isNaN(prevPhase) ) return;
        if (prevPhase == 0) return;

        var angle = parseInt(shutterAngleEdit.text);
        if ( isNaN(angle) ) return;

        angle = phase * angle / prevPhase;
        setText(shutterAngleEdit, Math.round(angle));
    };

    var shutterSamplesGroup = addNativeSetting(motionBlurSection, i18n._("Samples"));
    shutterSamplesGroup.onClick = function() {
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        shutterSamplesEdit.text = comp.motionBlurSamplesPerFrame;
    };
    var shutterSamplesEdit = addNativeEditText( shutterSamplesGroup, '16' );

    var shutterLimitGroup = addNativeSetting(motionBlurSection, i18n._("Adaptive sample limit"));
    shutterLimitGroup.onClick = function() {
        var comp = DuAEProject.getSelectedComp();
        if (!comp) return;
        shutterLimitEdit.text = comp.motionBlurAdaptiveSampleLimit;
    };
    var shutterLimitEdit = addNativeEditText( shutterLimitGroup, '128' );

    addNativeSeparator( container );

    var updatePrecompsButton = addNativeCheckBox( container, i18n._("Update precompositions"), null, '', true );

    var validButton = addNativeValidButton (
        container,
        i18n._("Comp settings"),
        i18n._("Set the current or selected composition(s) settings, also changing the settings of all precompositions.")
    );
    validButton.onClick = function() {
        // Gather options
        var options = {};

        if (widthGroup.checked) {
            var w = widthEdit.text;
            w = parseInt(w);
            if (!isNaN(w) && w >= 4) options.width = w;
        }

        if (heightGroup.checked) {
            var h = heightEdit.text;
            h = parseInt(h);
            if (!isNaN(h) && h >= 4) options.height = h;
        }

        options.anchor = sizeAnchorPopup.anchor;

        if (parGroup.checked) options.pixelAspect = parEdit.getValue();

        if (frameRateGroup.checked) {
            var fr = parseFloat(frameRateEdit.text);
            if (!isNaN(fr) && fr >= 1 && fr <= 999)  options.frameRate = fr;
        }

        if (durationGroup.checked) options.duration = durationEdit.text;

        if (resolutionGroup.checked) options.resolutionFactor = resolutionEdit.getValue();

        if (preserveResolutionGroup.checked) options.preserveNestedResolution = preserveResolutionEdit.value;

        if (bgGroup.checked) options.bgColor = bgEdit.color.floatRGB();

        if (shyGroup.checked) options.hideShyLayers = shyEdit.value;

        if (proxyGroup.checked) options.useProxy = proxyEdit.value;

        if (rendererGroup.checked) options.renderer = rendererEdit.getValue();

        if (preserveFrameRateGroup.checked) options.preserveNestedFrameRate = preserveFrameRateEdit.value;

        if (frameBlendingGroup.checked) options.frameBlending = frameBlendingEdit.value;

        if (mbGroup.checked) options.motionBlur = mbEdit.value;

        if (shutterAngleGroup.checked) {
            var v = shutterAngleEdit.text;
            v = parseInt(v);
            if (!isNaN(v) && v >= 0 && v <= 720) options.shutterAngle = v;
        }

        if (shutterPhaseGroup.checked) {
            var v = shutterPhaseEdit.text;
            v = parseInt(v);
            if (!isNaN(v) && v >= -360 && v <= 360) options.shutterPhase = v;
        }

        if (shutterSamplesGroup.checked) {
            var v = shutterSamplesEdit.text;
            v = parseInt(v);
            if (!isNaN(v) && v >= 2 && v <= 64) options.motionBlurSamplesPerFrame = v;
        }

        if (shutterLimitGroup.checked) {
            var v = shutterLimitEdit.text;
            v = parseInt(v);
            if (!isNaN(v) && v >= 62 && v <= 256) options.motionBlurAdaptiveSampleLimit = v;
        }

        DuAE.beginUndoGroup( i18n._("Comp settings") );

        DuAEComp.updateSettings(options);

        DuAE.endUndoGroup();
    };
}
