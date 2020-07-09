README
--


## Overview 

This is an example demostrating communication between 2D UI window and a 3D window inside the Looking Glass.  
The example does the following:
- Communicates between 2 windows using our `messagebus.js`  
- When change the values on the first 2 sliders on sidebar (point budget, FOV), the values are synced across both windows
- When clicked on annotation "Annotation Zoom", both windows zoom to a specific location  
- When use orbit controls to pan/zoom/focus on 2D window, the camera in 3D window is synced


## Code Snippets

First, include the script and define `messageBug` in both windows, like so:
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


