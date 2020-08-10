const optimalViewingDistance = 2;
const displayAngle = 0.175;

export default class CameraRig extends THREE.Camera {
  constructor(quiltResolution, tileCount, displayCount) {
    super();

    this.near = 0.05;
    this.far = 2000;

    const lkgFov = 35 * Math.PI / 180;

    const lkgGeometry = new THREE.PlaneGeometry(0.698, 0.392);

    const displayPositions = displayCount == 4 ? [
      new THREE.Vector3(-0.362, 0.215, -optimalViewingDistance + 0.0606),
      new THREE.Vector3(0.362, 0.215, -optimalViewingDistance + 0.0606),
      new THREE.Vector3(-0.362, -0.215, -optimalViewingDistance + 0.0606),
      new THREE.Vector3(0.362, -0.215, -optimalViewingDistance + 0.0606),
    ] : [
      new THREE.Vector3(-0.362, 0, -optimalViewingDistance + 0.0606),
      new THREE.Vector3(0.362, 0, -optimalViewingDistance + 0.0606),
    ];

    this.devices = [];
    for (let i = 0; i < displayPositions.length; i++) {
      const color =
          new THREE.Color().setHSL(i / displayPositions.length, 1, 0.5);

      const lkgDisplay =
          new THREE.Mesh(lkgGeometry.clone(), new THREE.MeshBasicMaterial({
            color,
            side : THREE.DoubleSide,
          }));
      lkgDisplay.position.copy(displayPositions[i]);
      lkgDisplay.rotation.y =
          lkgDisplay.position.x > 0 ? -displayAngle : displayAngle;
      lkgDisplay.updateMatrixWorld();
      this.add(lkgDisplay);

      const device = {
        display : lkgDisplay,
        arrayCamera : new THREE.ArrayCamera(),
        localCameraPoses : [],
      };
      this.devices.push(device);

      const tileSize =
          new THREE.Vector2(Math.floor(quiltResolution / tileCount.x),
                            Math.floor(quiltResolution / tileCount.y));

      const numCameras = tileCount.x * tileCount.y;
      for (let j = 0; j < numCameras; j++) {
        const midAngle =
            Math.PI / 2 + Math.sign(lkgDisplay.position.x) * displayAngle;
        const vy = -lkgDisplay.position.y;
        const vz = -lkgDisplay.position.z;
        const normalizedIndex = (j / (numCameras - 1) - 0.5) || 0;
        const cameraAngle = midAngle - normalizedIndex * lkgFov;
        const cx = lkgDisplay.position.x +
                   Math.sqrt(vz * vz + vy * vy) / Math.tan(cameraAngle);
        const viewDot =
            new THREE.Mesh(new THREE.CylinderBufferGeometry(0.002, 0.002, 0.03),
                           new THREE.MeshBasicMaterial({color}));
        viewDot.rotation.z = (i + 1) * Math.PI / 5;
        viewDot.position.set(cx, 0, 0);
        this.add(viewDot);

        device.localCameraPoses.push(viewDot);

        const tileGridPos =
            new THREE.Vector2(j % tileCount.x, Math.floor(j / tileCount.x));
        const subcamera = new THREE.PerspectiveCamera();
        subcamera.viewport = new THREE.Vector4(tileGridPos.x * tileSize.x,
                                               tileGridPos.y * tileSize.y,
                                               tileSize.x, tileSize.y);
        device.arrayCamera.cameras.push(subcamera);

        const lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(
            viewDot.position,
            lkgDisplay.localToWorld(lkgDisplay.geometry.vertices[0].clone()),
            viewDot.position,
            lkgDisplay.localToWorld(lkgDisplay.geometry.vertices[1].clone()),
            viewDot.position,
            lkgDisplay.localToWorld(lkgDisplay.geometry.vertices[2].clone()),
            viewDot.position,
            lkgDisplay.localToWorld(lkgDisplay.geometry.vertices[3].clone()));
        this.add(new THREE.LineSegments(
            lineGeometry, new THREE.LineBasicMaterial({color, linewidth : 4})));
      }
    }
  }

  lookAt(x, y, z) {
    // super.lookAt(x, y, z);

    let target;
    if (x.isVector3) {
      target = x;
    } else {
      target = new THREE.Vector3(x, y, z);
    }

    const targetDistance = this.position.distanceTo(target);
    this.scale.setScalar(targetDistance / optimalViewingDistance);
  }

  update() {
    this.updateMatrixWorld();

    this.devices.forEach((device) => {
      const display = device.display;

      const pa = display.localToWorld(display.geometry.vertices[2].clone());
      const pb = display.localToWorld(display.geometry.vertices[3].clone());
      const pc = display.localToWorld(display.geometry.vertices[0].clone());

      const vr = pb.clone().sub(pa).divideScalar(pb.clone().sub(pa).length());
      const vu = pc.clone().sub(pa).divideScalar(pc.clone().sub(pa).length());
      const vn =
          vr.clone().cross(vu).divideScalar(vr.clone().cross(vu).length());

      const arrayCamera = device.arrayCamera;
      arrayCamera.position.copy(this.position);
      arrayCamera.rotation.copy(this.rotation);
      arrayCamera.updateProjectionMatrix();

      const localCameraPoses = device.localCameraPoses;
      arrayCamera.cameras.forEach((subcamera, index) => {
        const localCameraPose = localCameraPoses[index].position;
        const worldCameraPose = this.localToWorld(localCameraPose.clone());
        subcamera.position.copy(worldCameraPose);
        display.getWorldQuaternion(subcamera.quaternion);
        subcamera.updateMatrixWorld();

        const pe = worldCameraPose;

        const va = pa.clone().sub(pe);
        const vb = pb.clone().sub(pe);
        const vc = pc.clone().sub(pe);

        const d = -1 * vn.clone().dot(va);
        const n = this.near;
        const f = this.far;

        const nd = n / d;
        const l = vr.clone().dot(va) * nd;
        const r = vr.clone().dot(vb) * nd;
        const b = vu.clone().dot(va) * nd;
        const t = vu.clone().dot(vc) * nd;

        subcamera.projectionMatrix.makePerspective(l, r, t, b, n, f);
        subcamera.up = vu;
        // subcamera.lookAt(vn.clone().multiplyScalar(-1));
      });
    });
  }
}
