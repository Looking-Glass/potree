function startRenderer(manifestUrl) {
  const messageBus = new BroadcastChannel('messagebus');

  const viewer =
      new Potree.Viewer(document.getElementById("potree_render_area"), {
        useDefaultRenderLoop : false,
        t8k : true,
      });

  viewer.setEDLEnabled(false);
  viewer.setFOV(60);
  viewer.setPointBudget(1 * 1000 * 1000);
  viewer.loadSettingsFromURL();
  viewer.setBackground("gradient");

  viewer.loadGUI(() => {
    viewer.setLanguage('en');
    $("#menu_scene").next().show();
  });

  let pointCloudMaterial;
  fetch(manifestUrl, {cache : 'no-store'})
      .then((response) => response.json())
      .then((manifest) => {
        // Load and add point cloud to scene
        Potree.loadPointCloud(manifest.pointCloud, "point cloud", function(e) {
          let scene = viewer.scene;
          let pointcloud = e.pointcloud;

          pointcloud.position.copy(
              pointcloud.pcoGeometry.tightBoundingSphere.center.clone()
                  .multiplyScalar(-1));

          pointCloudMaterial = pointcloud.material;
          pointCloudMaterial.size = 1;
          pointCloudMaterial.pointSizeType = Potree.PointSizeType.ADAPTIVE;
          pointCloudMaterial.shape = Potree.PointShape.SQUARE;

          scene.addPointCloud(pointcloud);

          const rad = pointcloud.pcoGeometry.tightBoundingSphere.radius;
          const pos = Math.sqrt(Math.pow(rad, 2) / 2);
          scene.view.position.set(pos, pos, pos);
          scene.view.lookAt(0, 0, 0);

          if (manifest.annotations) {
            manifest.annotations.forEach((a) => {
              const annotationConfig = {
                position : a.position,
                title : a.title,
              };
              if (a.cameraPosition) {
                annotationConfig['cameraPosition'] = a.cameraPosition;
              }
              if (a.cameraTarget) {
                annotationConfig['cameraTarget'] = a.cameraTarget;
              }
              if (a.description) {
                annotationConfig['description'] = a.description;
              }
              scene.annotations.add(new Potree.Annotation(annotationConfig));
            });
          }
        });
      });

  const curtain = document.createElement('div');
  curtain.style.cssText = `
    background-color: black;
    display: none;
    height: 100%;
    left: 0px;
    position: fixed;
    top: 0px;
    width: 100%;
    z-index: 1;
  `;
  document.body.appendChild(curtain);

  const renderButton = document.createElement('button');
  renderButton.textContent = 'render';
  renderButton.style.cssText = `
    bottom: 32px;
    font-size: 2em;
    position: fixed;
    right: 32px;
    z-index: 2;
  `;
  document.body.appendChild(renderButton);

  let rendering = false;
  renderButton.addEventListener('click', () => {
    rendering = true;
    curtain.style.display = '';
    pointCloudMaterial.size = 8;

    const renderTasks = [];
    for (let i = 0; i < viewer.gridSize; i++) {
      renderTasks.push(() => new Promise((resolve) => {
                         viewer.render(true, i);
                         viewer.renderer.domElement.toBlob((blob) => {
                           messageBus.postMessage({id : i, image : blob});
                           resolve();
                         });
                       }));
    }

    runTasksSequentially(renderTasks).then(() => {
      rendering = false;
      curtain.style.display = 'none';
      pointCloudMaterial.size = 1;
    });
  });

  function update(time) {
    requestAnimationFrame(update);

    if (rendering) {
      return;
    }

    viewer.update(viewer.clock.getDelta(), time);
    viewer.render(false);
  }
  requestAnimationFrame(update);
}

function runTasksSequentially(tasks) {
  return tasks.reduce((current, next) => current.then(() => next()),
                      Promise.resolve());
}

function startUi() {
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    left: 0px;
    margin-left: calc(12.5%);
    margin-top: 128px;
    position: fixed;
    top: 0px;
    width: 75%;
    z-index: 9;
  `;
  document.body.appendChild(inputContainer);

  const input = document.createElement('input');
  input.placeholder = 'Point cloud manifest URL (json format)';
  input.style.cssText = `
    font-family = monospace;
    font-size: 1.5em;
    width: 100%;
  `;
  inputContainer.appendChild(input);

  const startButton = document.createElement('button');
  startButton.textContent = 'load';
  startButton.style.cssText = `
    margin-top: 8px;
  `;
  inputContainer.appendChild(startButton);

  const scrim = document.createElement('div');
  scrim.style.cssText = `
    background-color: white;
    height: 100%;
    left: 0px;
    position: fixed;
    top: 0px;
    width: 100%;
    z-index: 1;
  `;
  document.body.appendChild(scrim);

  startButton.addEventListener('click', () => {
    if (input.value != '') {
      startRenderer(input.value);
      document.body.removeChild(inputContainer);
      document.body.removeChild(scrim);
    }
  });
}

window.addEventListener('load', startUi);
