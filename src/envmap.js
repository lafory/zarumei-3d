// Mapa de entorno de estudio (paneles de luz cálida sobre sala oscura): banco y boutique comparten el mismo reflejo.
import * as THREE from 'three';

export function makeStudioEnv(renderer) {
  const env = new THREE.Scene();
  const geo = new THREE.BoxGeometry(); geo.deleteAttribute('uv');
  const room = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x161310, side: THREE.BackSide }));
  room.scale.set(48, 26, 48); room.position.y = 1; env.add(room);
  const floor = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x090807 }));
  floor.position.set(0, -8, 0); floor.scale.set(40, 0.4, 40); env.add(floor);
  const panel = (hex, gain, x, y, z, sx, sy, sz) => {
    const m = new THREE.MeshBasicMaterial();
    m.color.setHex(hex).multiplyScalar(gain);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); env.add(mesh);
  };
  panel(0xfff6ec, 1.0, 0, 13, 2, 26, 0.28, 18);
  panel(0xfffaf4, 2.4, 1.2, 9.2, 4.2, 8, 0.1, 2.2);
  panel(0xfff1df, 2.5, 10, 6.5, 8, 0.16, 9, 5.5);
  panel(0xd5e2f2, 1.25, -12, 5, 2, 0.16, 6, 4);
  panel(0xe7eef8, 1.5, 0, 5.2, -14, 9, 2.4, 0.12);
  const prev = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(env, 0.012).texture;
  pmrem.dispose();
  renderer.toneMapping = prev;
  return map;
}
