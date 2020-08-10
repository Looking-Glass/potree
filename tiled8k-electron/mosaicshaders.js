export const MOSAIC_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

export const MOSAIC_FRAGMENT_SHADER = `
  uniform sampler2D quilt;
  uniform vec3 cal;
  uniform float subp; 
  uniform vec2 tileCount;
  uniform vec2 quiltViewPortion;
  uniform bool bShowQuilts;
  uniform bool bShouldAngularFilter;
  uniform float fTime;

  varying vec2 vUv;

  vec2 texArr(vec3 uvz) {
    // float z = floor(uvz.z * tileCount.x * tileCount.y);
    float z = uvz.z;
    float x = (mod(z, tileCount.x) + uvz.x) / tileCount.y;
    float y = (floor(z / tileCount.x) + uvz.y) / tileCount.y;
    return vec2(x, y) * quiltViewPortion;
  }

  void main() {
  /*
    vec2 uv = fract(vUv + vec2(fTime / 1000.0, 0.0));
    gl_FragColor = vec4(uv, 0.0, 1.0);
    */

    if (bShowQuilts) {
      gl_FragColor = texture2D(quilt, vUv);
    } else {
      vec4 rgb[3];
      vec3 nuv = vec3(vUv.xy, 0.0);
      for (int i = 0; i < 3; i++) {
        nuv.z = (vUv.x + float(i) * subp + vUv.y * cal.y) * cal.x - cal.z;
        nuv.z = 1.0 - mod(nuv.z + ceil(abs(nuv.z)), 1.0);

        float viewIndex = nuv.z * tileCount.x * tileCount.y;
        float t = fract(viewIndex);

        float leftViewIndex = floor(viewIndex);
        float rightViewIndex = ceil(viewIndex);

        if (bShouldAngularFilter) {
          vec4 leftSample = texture2D(quilt, texArr(vec3(vUv, leftViewIndex)));
          vec4 rightSample = texture2D(quilt, texArr(vec3(vUv, rightViewIndex)));
          rgb[i] = (1.0 - t) * leftSample + t * rightSample;
        } else {
          rgb[i] = texture2D(quilt, texArr(vec3(vUv, t < 0.5 ? leftViewIndex : rightViewIndex)));
        }
      }
      gl_FragColor = vec4(rgb[0].r, rgb[1].g, rgb[2].b, 1);
    }
  }
`;

export const MOSAIC_SHADER_PROPERTIES = {
  uniforms : {
    quilt : {value : null},
    // cal x,y,z is pitch,tilt,center
    cal : {value : new THREE.Vector3()},
    subp : {value : 0},
    tileCount : {value : new THREE.Vector2(0, 0)},
    quiltViewPortion : {value : new THREE.Vector2(1, 1)},
    bShowQuilts : {value : false},
    bShouldAngularFilter : {value : true},
    fTime : {value : 0},
  },
  vertexShader : MOSAIC_VERTEX_SHADER,
  fragmentShader : MOSAIC_FRAGMENT_SHADER,
};
