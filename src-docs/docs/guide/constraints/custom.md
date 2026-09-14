# ![](../../img/duik/icons/custom_constraints.svg){style="width:1em;"} Custom Constraints

The custom constraints are After Effects versions of [Blender's constraints](https://docs.blender.org/manual/en/latest/animation/constraints/index.html). They work the way they do in Blender, as far as After Effects allows; each one lists its differences with Blender.

Select the layers to constrain then click the **![](../../img/duik/icons/custom_constraints.svg){style="width:1em;"} *Custom Constraints...*** button to select the constraint to apply to the selection.

## ![](../../img/duik/icons/con_loclike.svg){style="width:1em;"} Copy Location

This is an After Effects version of [Blender's *Copy Location* constraint](https://docs.blender.org/manual/en/latest/animation/constraints/transform/copy_location.html). Where the [position constraint](transform.md#position-constraint) *adds* the movement of the master layers to the layer's own position, the copy location constraint *replaces* the location of the layer with the location of its target, one axis at a time.

Select the layers to constrain and click ![](../../img/duik/icons/con_loclike.svg){style="width:1em;"} ***Copy Location***, then set its target in the ***Constraint settings***. The effect is named `Copy Location`, and `Copy Location.001`, `Copy Location.002`... for the next ones on the same layer.

- **Target**: picked in the Duik panel, not in the effect — see [choosing the target](#choosing-the-target). It can be a layer of any composition of the project.
- **Transform units**: how the coordinates of the target composition are read into this one.
    - ***Pixels*** uses them as they are, one pixel for one pixel.
    - ***Percentage*** reads the target's position as a share of its own composition and applies it to this one, so the centre of a `960 x 540` comp lands on the centre of a `1920 x 1080` one. Resolution stops mattering.
    - ***Custom ratio*** multiplies the coordinates by the **Custom ratio** value — set it to `4` for one pixel in the target composition to become four here.
- **Axis**: check **X**, **Y** and **Z** to choose which axis are copied; the others keep the value of the layer. **Invert X**, **Invert Y** and **Invert Z** negate the copied coordinate, mirroring the target around the origin of the space.
- **Offset**: when checked, the location of the layer is added to the copied location instead of being replaced by it. This is what keeps the relative placement of a layer while it follows its target.
- **Target space** and **Owner space**: the space the location of the target is read in, and the space it is written to.
    - ***World Space*** is the composition, with every parent transformation applied.
    - ***Custom Space*** is relative to the layer set in **Custom space**, so a layer can be constrained inside the coordinates of any other layer.
    - ***Local Space*** is relative to the parent of the layer (of the target for the target space, of the constrained layer for the owner space). A layer without a parent is already in world space.
- **Influence**: blends between the original location of the layer and the constrained one, in world space. At `0 %` the constraint does nothing, at `100 %` it fully applies.

You can duplicate the effect to stack several copy location constraints on the same layer: they're evaluated from top to bottom, each one starting from the result of the previous one, exactly like the constraint stack of Blender.

!!! note
    The constraint is computed live by an expression: it doesn't need any keyframe, neither on the layer nor on its target, and updates as soon as anything moves.

!!! tip
    Axis are the axis of After Effects, not of Blender: **Y** goes *down* the composition and **Z** goes *away* from the camera. On a 2D layer, the **Z** options are simply ignored.

### Choosing the target

The target is set in the ***Constraint settings***, opened with the ![](../../img/duik/icons/settings.svg){style="width:1em;"} gear button in the toolbar at the top of the panel. Select the constrained layers, pick a **Target Composition** and a **Target Layer**, and click ***Set target***. The same panel shows what each constraint of the selection currently points at, so you can check a rig without opening the expressions.

A newly created constraint has no target and does nothing until you set one.

!!! tip
    The constraint settings can also live in their own panel, docked anywhere in the After Effects interface: click ![](../../img/duik/icons/dock.svg){style="width:1em;"} ***Pop out*** at the top of the settings, or `[Alt] + [Click]` the gear button. This launches the *Duik Constraint Settings* panel, which has to be [installed](../../getting-started/install.md) like the other Duik panels.  
    After Effects doesn't tell scripts when the selection changes, so click ***Refresh*** to show the targets of the newly selected layers.

!!! note "Why the target isn't in the effect"
    Because After Effects can't put it there. No effect parameter type holds a name — the whole set is layer, slider, angle, checkbox, colour, point, drop down, group and button — and effect parameters can't be renamed, so a parameter can't display one either. A layer control would be no help: it only ever lists the layers of its own composition. A name can live in one place only, the expression, so that's where Duik writes it, in a `DUIK_TARGETS` line keyed by the name of the effect:

    ```js
    var DUIK_TARGETS = {"Copy Location":["Character","Head"],"Copy Location.001":["Props","Hat"]};
    ```

    That line is plain enough to edit by hand if you'd rather retarget that way.

!!! warning
    The target is found by name, and the key is the name of the effect. So: don't rename the constraint effects, and set the target again after renaming a target composition or a target layer. Give your compositions unique names too — an expression reaches a composition only by name.

!!! note
    When the target is in another composition, its position and rotation are read in *that composition's* space; the constraint doesn't know how, or whether, that composition is nested into this one. **Transform units** on the copy location constraint is there to map the coordinates the way you want. If you need a layer to follow a precomp's content through the precomp layer's own transform, use [parent across compositions](parent.md) instead, which is built for that.

## ![](../../img/duik/icons/con_rotlike.svg){style="width:1em;"} Copy Rotation

This is an After Effects version of [Blender's *Copy Rotation* constraint](https://docs.blender.org/manual/en/latest/animation/constraints/transform/copy_rotation.html), the companion of the [copy location constraint](#copy-location) above. Where the [orientation constraint](transform.md#orientation-constraint) adds a weighted share of the master layers' orientation, this one combines the rotation of the layer with the rotation of a single target using Blender's mix modes.

Select the layers to constrain and click ![](../../img/duik/icons/con_rotlike.svg){style="width:1em;"} ***Copy Rotation***, then set its target in the ***Constraint settings***. The effect is named `Copy Rotation`, and `Copy Rotation.001`, `Copy Rotation.002`... for the next ones on the same layer.

- **Target**: picked in the Duik panel, not in the effect — see [choosing the target](#choosing-the-target). It can be a layer of any composition of the project.
- **Invert**: negates the copied rotation.
- **Mix mode**: how the copied rotation is combined with the layer's own rotation.
    - ***Replace*** discards the rotation of the layer and uses the target's.
    - ***Add*** adds the two rotations together.
    - ***Before Original*** and ***After Original*** apply the copied rotation as if the target were respectively a parent or a child of the layer.
    - ***Offset (Legacy)*** reproduces Blender's old *Offset* checkbox: it adds the two rotations and then inverts the total, instead of inverting only the copy.
- **Target space** and **Owner space**: the space the rotation of the target is read in, and the space it is written to — ***World Space*** (the composition, every parent applied), ***Custom Space*** (relative to the layer set in **Custom space**) or ***Local Space*** (relative to the parent of the layer; a layer without a parent is already in world space).
- **Influence**: blends between the original rotation of the layer and the constrained one. At `0 %` the constraint does nothing, at `100 %` it fully applies.

You can duplicate the effect to stack several copy rotation constraints on the same layer: they're evaluated from top to bottom, each one starting from the result of the previous one, exactly like the constraint stack of Blender.

!!! note
    The constraint is computed live by an expression: it doesn't need any keyframe, neither on the layer nor on its target, and updates as soon as anything moves.

!!! tip
    Negatively scaled parents are handled: a layer under a mirrored parent copies the rotation as seen on screen, and a vertically flipped parent turns it the right way up.

### Differences with Blender

- **Only the Z axis.** After Effects drives each rotation axis as a separate property, and the whole rotation model of Duik works around the Z axis — the *Rotation* property of a layer, which is *Z Rotation* on a 3D layer. Blender's **Copy X**, **Copy Y** and **Copy Z** checkboxes are therefore not offered; unchecking Z would only disable the constraint, which the **Influence** does better. The *Orientation* of a 3D layer is read as part of its rotation, but is left untouched — the constraint writes to *Z Rotation* only.
- Because rotations around a single axis add up, **Add**, **Before Original** and **After Original** give exactly the same result here. They're all listed anyway, so a rig ported from Blender can keep the mode it was built with. **Replace** and **Offset (Legacy)** do differ.
- There's no **Transform units** here: a rotation is an angle, so it carries over between compositions of any size unchanged.
- The influence blends the two angles **linearly**, where Blender interpolates the rotation matrices and so always takes the shortest way round. Linear blending keeps the winding of the angle, which is what an After Effects rig needs — a wheel that has turned three times keeps its three turns instead of snapping back.

## ![](../../img/duik/icons/con_armature.svg){style="width:1em;"} Armature

This is an After Effects version of [Blender's *Armature* constraint](https://docs.blender.org/manual/en/latest/animation/constraints/relationship/armature.html), with a single target. The layer moves the way Blender's armature modifier moves what's bound to a bone: everything the target layer has done since its **rest pose** — moving, turning, scaling — is done to the layer too, around the target. Where the [parent constraint](parent.md#parent-constraint) inherits the movements of its parents step by step from the beginning of the composition, the armature constraint compares the target with its rest pose, so it doesn't depend on what happened before the current time.

Select the layers to constrain, click ![](../../img/duik/icons/con_armature.svg){style="width:1em;"} ***Armature*** in the ***Custom Constraints...*** menu, then set its target in the ***Constraint settings***, as for the [copy location constraint](#choosing-the-target). The effect is named `Armature`, and `Armature.001`, `Armature.002`... for the next ones on the same layer.

- **Preserve Volume**: Blender's dual quaternion blending. With a single target it gives exactly the same result; it's there so a rig ported from Blender can keep its setting.
- **Target**: picked in the Duik panel, not in the effect. It can be a layer of any composition of the project.
- **Weight**: the weight of the target. Blender divides by the total weight of the targets, so with a single one, any weight above `0 %` applies the whole transformation, and `0 %` turns the target off.
- **Influence**: blends between the original transformation of the layer and the constrained one. At `0 %` the constraint does nothing, at `100 %` it fully applies.

The constraint drives the position, the rotation and the scale of the layer. You can duplicate the effect to stack several armature constraints on the same layer: they're evaluated from top to bottom, each one starting from the result of the previous one, like the constraint stack of Blender.

!!! note
    The constraint is computed live by expressions: it doesn't need any keyframe, neither on the layer nor on its target, and updates as soon as anything moves.

### The rest pose

In Blender, the rest pose of a bone is set in edit mode, and the armature constraint moves its owner by as much as the bone moved away from it. After Effects layers have no rest pose, so Duik takes one: when you set the target, its current pose becomes the rest pose, and the layer doesn't move.

To bind the layer to another pose of the target, put the target in that pose and click ***Set rest pose*** in the ***Constraint settings***. The layer goes back to its own position, rotation and scale, and follows the target from there. Set the rest pose again after re-parenting the constrained layer too.

The rest pose is stored relative to the **parent of the constrained layer**, which plays the part of Blender's armature object: the layer already inherits what its parent does, so the constraint only adds what the target does relative to that parent. Parent the layer to the root of the rig, as you'd parent it to the armature object in Blender, and it won't move twice. A layer without a parent follows everything that moves the target.

### Differences with Blender

- **A single target.** A Blender armature constraint blends several bones, each with its own weight. An After Effects effect can't hold a growing list of targets, so each effect has one; stacked effects are applied one after the other instead of being blended together. That's also why **Preserve Volume** changes nothing, and the **Weight** can only turn the target on or off.
- **No envelopes.** **Use Envelopes** reads the envelope of the bone — its head, tail and radii — which a layer doesn't have. With a single target, the envelope could only switch the whole constraint on or off anyway. **Use Current Location** only exists for bones, and isn't needed either.
- **The rest pose is taken** by Duik instead of being set in edit mode, and it's relative to the parent of the layer instead of an armature object — see [the rest pose](#the-rest-pose).
- **In the plane of the composition.** Like the rest of Duik, the constraint works on the position, the *Z Rotation* and the *X* and *Y* scale of the layer. A 3D layer follows the depth of its target, but not its *X* and *Y* rotations.
- **No skew.** When the target is scaled unevenly and turned, Blender's result is skewed, which a layer can't be. The layer's *X* axis goes where Blender puts it, its area is kept, and the skew is left out.
- The influence blends the rotation **linearly**, where Blender always takes the shortest way round, so that a layer following a spinning target keeps its turns, as with the [copy rotation constraint](#copy-rotation).
