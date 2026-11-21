import {
  CanvasTexture,
  Color,
  DataTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  Shape,
  SRGBColorSpace,
} from 'three';
import { QOFENO_BLADE_PATH, QOFENO_SWEEP_PATH } from '../lib/brand-paths.ts';

const palette = {
  cream: '#fdf4de',
  paperEdge: '#dfcda8',
  cobalt: '#2558be',
  blueEdge: '#183e89',
  mint: '#a8d3bd',
  greenInk: '#214536',
  ink: '#193651',
};

function roundedRectangle(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const right = x + width;
  const top = y + height;
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(right - radius, y);
  shape.quadraticCurveTo(right, y, right, y + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(x + radius, top);
  shape.quadraticCurveTo(x, top, x, top - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function brandShape(path) {
  // The two authored paths use absolute moves, lines and cubic Béziers only.
  const tokens = path.match(/[MLCZ]|-?\d+(?:\.\d+)?/g);
  const shape = new Shape();
  let index = 0;
  const x = () => (Number(tokens[index++]) - 101) / 202;
  const y = () => (101 - Number(tokens[index++])) / 202;
  while (index < tokens.length) {
    switch (tokens[index++]) {
      case 'M': shape.moveTo(x(), y()); break;
      case 'L': shape.lineTo(x(), y()); break;
      case 'C': shape.bezierCurveTo(x(), y(), x(), y(), x(), y()); break;
      case 'Z': shape.closePath(); break;
    }
  }
  return shape;
}

function makeContactShadow() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size * 2 - 1;
      const v = (y + 0.5) / size * 2 - 1;
      const radius = Math.hypot(u, v);
      const alpha = Math.exp(-4.2 * radius * radius) * Math.max(0, 1 - radius);
      const offset = (y * size + x) * 4;
      data.set([28, 47, 78, Math.round(94 * alpha)], offset);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function plaqueTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.strokeStyle = '#8c775261';
  context.lineWidth = 2.25;
  context.beginPath();
  context.roundRect(25, 25, 974, 526, 23);
  context.stroke();
  for (const [x, y] of [[43, 43], [981, 43], [43, 533], [981, 533]]) {
    context.fillStyle = '#957f54';
    context.beginPath();
    context.arc(x, y, 3.5, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = palette.ink;
  context.font = '600 104px Figtree, system-ui, sans-serif';
  context.fillText('Qofeno', 467, 305);
  context.font = '500 43px Figtree, system-ui, sans-serif';
  context.fillStyle = '#4e6280';
  context.fillText('loopproof.me', 475, 374);
  context.strokeStyle = '#9a865c80';
  context.beginPath();
  context.moveTo(475, 415);
  context.lineTo(885, 415);
  context.stroke();

  // A very small deterministic press grain adds paper texture without a texture download.
  context.fillStyle = '#523b2216';
  for (let index = 0; index < 1400; index++) {
    const x = 44 + ((index * 137) % 934);
    const y = 44 + ((index * 283) % 487);
    context.fillRect(x, y, index % 5 === 0 ? 1.3 : 0.8, 0.9);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function ownerTabTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 122;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.strokeStyle = '#35645270';
  context.lineWidth = 2.5;
  context.beginPath();
  context.roundRect(11, 11, 490, 100, 12);
  context.stroke();

  context.fillStyle = palette.greenInk;
  context.beginPath();
  context.arc(51, 61, 9, 0, Math.PI * 2);
  context.fill();
  context.font = '700 48px Figtree, system-ui, sans-serif';
  context.textBaseline = 'middle';
  context.fillText('Owner placement', 77, 62, 400);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

export function createPlacementSculpture() {
  const scene = new Scene();
  const camera = new OrthographicCamera(-2.4, 2.4, 1.6, -1.6, 0.1, 30);
  camera.position.z = 8;
  const pivot = new Group();
  scene.add(pivot);

  const plaque = new Group();
  plaque.position.set(-0.07, 0.02, 0);
  plaque.rotation.set(-0.28, -0.29, 0.13);
  pivot.add(plaque);

  const paper = new MeshStandardMaterial({ color: palette.cream, roughness: 0.85 });
  const paperEdge = new MeshStandardMaterial({ color: palette.paperEdge, roughness: 0.82 });
  const blue = new MeshStandardMaterial({ color: palette.cobalt, roughness: 0.61 });
  const blueEdge = new MeshStandardMaterial({ color: palette.blueEdge, roughness: 0.72 });
  const mint = new MeshStandardMaterial({ color: palette.mint, roughness: 0.8 });
  const green = new MeshStandardMaterial({ color: palette.greenInk, roughness: 0.78 });

  function plate(width, height, depth, radius, front, edge, position, rotate = 0) {
    const geometry = new ExtrudeGeometry(roundedRectangle(width, height, radius), {
      depth, steps: 1, curveSegments: 8, bevelSegments: 2,
      bevelThickness: 0.025, bevelSize: 0.024,
    });
    const mesh = new Mesh(geometry, [front, edge]);
    mesh.position.set(...position);
    mesh.rotation.z = rotate;
    plaque.add(mesh);
    return mesh;
  }

  function print(width, height, texture, position, rotate = 0) {
    if (!texture) return;
    const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, toneMapped: false,
    }));
    mesh.position.set(...position);
    mesh.rotation.z = rotate;
    plaque.add(mesh);
  }

  const shadowTexture = makeContactShadow();
  const shadow = new Mesh(new PlaneGeometry(5.8, 4.7), new MeshBasicMaterial({
    map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadow.position.set(0.17, -0.3, -0.62);
  shadow.rotation.z = -0.08;
  scene.add(shadow);

  plate(3.88, 2.14, 0.11, 0.12, blue, blueEdge, [-0.16, -0.17, -0.31], -0.19);
  plate(3.77, 2.09, 0.05, 0.11, paperEdge, paperEdge, [-0.1, -0.075, -0.16], -0.075);
  plate(3.73, 2.09, 0.13, 0.105, paper, paperEdge, [0, 0, -0.045]);

  // The hero's mint owner label reappears as a printed tab on the physical card.
  plate(1.9, 0.45, 0.045, 0.07, mint, green, [1.19, -0.93, 0.139], -0.08);
  const tabTexture = ownerTabTexture();
  print(1.9, 0.45, tabTexture, [1.19, -0.93, 0.213], -0.08);

  const disk = plate(1.25, 1.25, 0.021, 0.625, paperEdge, paper, [-1.05, 0.02, 0.095]);
  disk.scale.set(0.98, 0.98, 1);
  plate(1.19, 1.19, 0.025, 0.595, paper, paperEdge, [-1.05, 0.02, 0.132]);

  for (const path of [QOFENO_SWEEP_PATH, QOFENO_BLADE_PATH]) {
    const geometry = new ExtrudeGeometry(brandShape(path), {
      depth: 0.105, steps: 1, curveSegments: 10, bevelSegments: 2,
      bevelThickness: 0.009, bevelSize: 0.008,
    });
    const mark = new Mesh(geometry, [blue, blueEdge]);
    mark.position.set(-1.05, 0.017, 0.17);
    mark.scale.setScalar(1.11);
    plaque.add(mark);
  }

  const inkTexture = plaqueTexture();
  print(3.72, 2.08, inkTexture, [0, 0, 0.119]);

  scene.add(new HemisphereLight(new Color('#faf7ed'), new Color('#8ba6d4'), 1.63));
  const key = new DirectionalLight('#fff8e9', 2.25);
  key.position.set(-3.5, 4.1, 5.5);
  scene.add(key);
  const rim = new DirectionalLight('#dce9ff', 0.77);
  rim.position.set(3.5, -1.7, 3.2);
  scene.add(rim);

  function fit(aspect) {
    const height = Math.max(3.18, 4.92 / aspect);
    camera.left = -height * aspect / 2;
    camera.right = height * aspect / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }
  fit(1.66);

  function dispose() {
    const materials = new Set();
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    materials.forEach(material => material.dispose());
    shadowTexture.dispose();
    inkTexture?.dispose();
    tabTexture?.dispose();
    scene.clear();
  }

  return { scene, camera, pivot, fit, dispose };
}
