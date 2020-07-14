README
--

This is an example demostrating communication between 2D UI window and a 3D window inside the Looking Glass.  

## Overview

The example does the following:

- Communicates between 2 windows using our `messagebus.js`  
- When changing the values on the first 2 sliders on sidebar (point budget, FOV), the values are synced across both windows
- When clicked on annotation "Annotation Zoom", both windows zoom to a specific location  
- When using orbit controls to pan/zoom/focus on 2D window, the camera in 3D window is synced


## Code Example

First, include the script and define `messageBus` in both windows, like so:
```

<script src="messagebus.js"></script>
<script>
    const messageBus = new MessageBus();
</script>
```

Then on the 2D side define places to send messages, e.g.:
```
let val = viewer.getFOV();
messageBus.postMessage('fov', val);
```

And on 3D side add event handlers, e.g.:
```
messageBus.addEventListener('fov', (e) => {
    viewer.setFOV(e.detail);
});
```

## Details

1. Syncing sidebar slider values

We use event listeners to catch the events fired when user drag the sliders. In the example, we only added for the first 2 sliders, but others are also doable by adding more event listeners. The events can be found in `src/viewer/sidebar.js`. 
```
viewer.addEventListener('point_budget_changed', (e) => {
  let val = viewer.getPointBudget();
  messageBus.postMessage('pointBudget', val);
});
```

2. Syncing annotaion zooms
Clicking on annotations only result in zoom to a pre-defined, specific location when the contructor of the annotaion contains `cameraPosition` and `cameraTarget`. 
We add a customized `click` function on `elTitle` to post message to the 3D scene.
```
// aAbout2 is one of the annotation objects
aAbout2.elTitle.click(() => {
  messageBus.postMessage('focus', 1)
})
```

