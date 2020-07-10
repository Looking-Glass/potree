README
--

This example demonstrates simple usage of Potree with the Looking Glass.

## Overview

To use a Potree scene with Looking Glass, just pass in the `lkg` flag in the constructor of Potree.Viewer, like so:

```
window.viewer = new Potree.Viewer(document.getElementById("potree_render_area"), {
    lkg: true
});
```

Additionally, you need to set the `lkgCamera` target to the same as `scene.view`: 
```
// if scene.view.lookAt(5.50, 6.86, 8.75);
viewer.lkgCamera.lookAt(new THREE.Vector3(5.50, 6.86, 8.75));
```

## Fullscreen Helper

For better user experience, we provide fullscreen helper that displays instructions on the window to show that users that they need to drag the window into the Looking Glass and click to fullscreen. 
