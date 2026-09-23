# ![](../../img/duik/icons/shapekey_data.svg){style="width:1em;"} Pose Shape Interpolator

The pose shape interpolator is a **modifier**, like the [armature deform](armature-deform.md): it drives the *geometry* of a layer — the Bézier path of a mask or of a shape — not its transformation.

It morphs a path between the shapes of a set of **poses**. Each pose is a point in a 2D space, and a **target position** layer moves around that space: the shape becomes the pose whose point it's on, and a smooth blend of the poses around it when it's in between them.

Picture a Star, a Circle, a Triangle and a Square drawn as points on a grid, and a controller moving among them. On the Star's point, the path is the Star. Halfway to the Circle, it's half Star and half Circle. In the middle of the Star, the Circle and the Triangle, it's a third of each.

It's the After Effects version of a *blend space*: a head turn drawn at 37 angles, a mouth drawn for every vowel, a hand drawn in a few poses, all driven by one controller.

## The three layers

The modifier reads three layers, all set in its effect:

| Layer | What it holds |
|---|---|
| **Pose Points Layer** | A **Point Control** for each pose, named after the pose, set where the pose sits in the space. Usually a path joins the points up too, so they can be seen. |
| **Target Poses Layer** | The **shape of each pose**: a path, or a group, named *exactly* like its Point Control. |
| **Target Position Layer** | Any layer. Its **position in the composition** tells which poses to blend. |

One point = one pose = one shape, and the three are tied together **by name only**.

```
 Pose Points Layer               Target Poses Layer
 ┌─────────────────────────┐     ┌─────────────────────────────────────┐
 │ fx Head Moon Basis      │     │ ▾ Head Moon Basis        ◄── group   │
 │ fx Head Moon Rot (-45…) ├──┐  │     Path 1               ◄── its path│
 │ fx Head Moon Rot (-80…) │  └──┼─► ▾ Head Moon Rot (-45…)             │
 │ ...                     │     │     Path 1                           │
 │ ◇ Pose Points (path)    │     │ ...                                  │
 └─────────────────────────┘     └─────────────────────────────────────┘
```

This is the layout the *PinkCity* importers build from Blender: `Load_Pose_Points.jsx` makes the Pose Points Layer from the pose points mesh, and `Load_GreasePencil_from_json.jsx` makes a layer with a group per Grease Pencil layer, named after it, which can be the Target Poses Layer as it is.

## Using it

1. Draw the path to deform: its **own shape is the rest shape** (see [missing poses](#missing-poses)). Every pose needs **as many vertices** as this path.
2. Select the path — the *Mask Path* of a mask, or the *Path* of a shape — in the timeline. Several paths at once is fine.
3. Click ![](../../img/duik/icons/shapekey_data.svg){style="width:1em;"} ***Pose Shape Interpolator...*** in the Links and constraints panel.
4. Pick the **Pose Points Layer**, the **Target Poses Layer** and the **Target Position Layer** — the eyedroppers pick the selected layer — and click ***Pose shape interpolator***.

A `Pose Shape Interpolator` effect is added to the layer, and the path gets the expression doing the blend. The selected paths of a same layer **share one effect**. Its settings:

- **Pose Points Layer**, **Target Poses Layer**, **Target Position Layer**: the three layers. They can be changed right there at any time; a layer left to *None* in the panel is left as it is in the effect, to be set there.
- **Interpolation**: how the poses are blended, see below.
- **Influence**: blends between the path as it was drawn and the interpolated one. At `0 %` the modifier does nothing, at `100 %` it fully applies.

Removing the effect removes the modifier: the path goes back to the shape it was drawn with.

!!! note
    The modifier is computed live by an expression on the path: it doesn't need any keyframe, and updates as soon as the target position, a pose point or a pose shape changes. The poses can even be animated.

### Checking the layers

Select a deformed path and click ***Refresh*** at the top of the panel: the three layers its modifier reads are shown in the lists. Changing them and clicking ***Pose shape interpolator*** again sets them on the same effect.

## How the poses are blended

The pose points are joined into **triangles** — a [Delaunay triangulation](https://en.wikipedia.org/wiki/Delaunay_triangulation), the one making the triangles as even as possible. Wherever the target position is, it's inside one triangle, and the shape is the blend of the **three poses at its corners**, weighted by how close it is to each one (its [barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system)).

That makes the blend:

- **exact on the points**: on a pose's point, the shape is that pose and nothing else;
- **smooth**: the shape never jumps, however the target moves — along an edge between two points, only these two poses are blended;
- **local**: only up to three poses at a time, so a pose on the other side of the space never leaks in.

**Outside of the points**, the target is brought back onto the outline of the triangles: past the last pose on the right, the shape stays the blend of the poses along that outline.

The **Interpolation** menu of the effect has three modes:

| Mode | Blend |
|---|---|
| **Triangles** | The blend described above: the shape follows the target at an even pace. |
| **Smooth triangles** | The same poses, eased: the shape settles on each pose around its point, and moves between poses faster in the middle. |
| **Nearest pose** | No blend: the shape snaps to the pose nearest to the target. Handy to check which point is which pose. |

Points can be laid out any way: a grid, a ring, scattered. If they're all on a line — a mouth going from closed to open, say — the poses are blended along that line, two at a time.

## Finding the shapes

The Point Controls are the poses: **every Point Control of the Pose Points Layer** is a pose, at the point it's set to, read in the composition's space. Other effects there, like the separators the PinkCity importer adds, are skipped. A Point Control at the very same place as one above it is left out.

For each pose, the modifier looks in the **Target Poses Layer** for, in this order in the Contents, top to bottom and inside groups:

- a **path** named exactly like the Point Control, or
- a **group** named exactly like it. The group stands for the path inside it with the **same name as the deformed path**, or else for its first path. So, when the deformed layer has a `Path 1` and a `Path 2` and each pose group has a `Path 1` and a `Path 2` too, both paths get their own poses.

Masks of the Target Poses Layer are looked at too, by their name.

The pose shapes are copied as they are, in the coordinates they're drawn in: draw the poses where the deformed path is drawn, relative to their own layer. The transforms of their layer and of their groups aren't applied.

### Missing poses

A pose whose shape can't be found, or whose shape hasn't as many vertices as the deformed path, **holds the shape the path was drawn with**. That's how a *Basis* point with no drawing works: its point blends back to the rest shape.

!!! warning
    The names have to match **exactly**, spaces and signs included: `Head Moon Rot (-45, 0, 0)` isn't `Head Moon Rot (-45,0,0)`. Renaming a pose means renaming its Point Control and its shape.

## Tips

- Give every pose the same number of vertices, in the same order, starting at the same place. A blend moves each vertex from its place in one pose to its place in the other: vertices that don't match up make the shape twist.
- The Target Position Layer is often a controller, but any layer works: a null parented to a head, or the head's rotation driving a null with an expression.
- Hide the Target Poses Layer and the Pose Points Layer, or make them guide layers: they only need to exist.
- Don't give the deformed path the name of a pose if it lives in the Target Poses Layer: it would read itself.
