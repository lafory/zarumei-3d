// Acabados de macro: oro y acero con grano real, no un color plano amarillo.
// El cristal no usa transmission: ese pase dibuja la escena dos veces y en el iPhone se cae.
import * as THREE from 'three';
import * as TX from './textures.js';
const METAL = { gold: [0xc4a15c, 0xb08c49], rose: [0xd7a48e, 0xc48b76], steel: [0xb7c0c8, 0x9aa3ad] };
const grain = TX.metalGrain();
function brushed(mat, amount, anisotropy) {
  mat.normalMap = grain.normal;
  mat.normalScale = new THREE.Vector2(amount, amount * 0.35);
  mat.roughnessMap = grain.rough;
  if (anisotropy) mat.anisotropy = anisotropy;
  return mat;
}
export function makeMaterials() {
  const cotes = TX.cotesTexture(); cotes.repeat.set(0.28, 0.28);
  const perl = TX.perlageTexture(); perl.repeat.set(7, 7);
  const M = {
    bridge: new THREE.MeshPhysicalMaterial({ color: 0xc5ccd2, metalness: 0.94, roughness: 0.38, map: cotes, envMapIntensity: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.4 }),
    bridgeGilt: new THREE.MeshPhysicalMaterial({ color: 0xcbb888, metalness: 0.92, roughness: 0.36, map: cotes, envMapIntensity: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.4 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xb4bbc2, metalness: 0.86, roughness: 0.46, map: perl, envMapIntensity: 0.5, clearcoat: 0.08, clearcoatRoughness: 0.5 }),
    plateBrass: new THREE.MeshPhysicalMaterial({ color: 0xc6b184, metalness: 0.88, roughness: 0.44, map: perl, envMapIntensity: 0.55, clearcoat: 0.08, clearcoatRoughness: 0.45 }),
    steel: brushed(new THREE.MeshPhysicalMaterial({ color: 0xb5bec6, metalness: 1, roughness: 0.34, envMapIntensity: 0.72, clearcoat: 0.2, clearcoatRoughness: 0.35 }), 0.22, 0.65),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x667078, metalness: 1, roughness: 0.42, envMapIntensity: 0.42 }),
    blueScrew: new THREE.MeshPhysicalMaterial({ color: 0x1e3f9a, metalness: 0.86, roughness: 0.22, envMapIntensity: 0.7, clearcoat: 0.55, clearcoatRoughness: 0.12 }),
    blueSpring: new THREE.MeshStandardMaterial({ color: 0x3a567f, metalness: 0.9, roughness: 0.36, envMapIntensity: 0.45 }),
    goldWheel: new THREE.MeshPhysicalMaterial({ color: 0xb8893a, metalness: 1, roughness: 0.3, envMapIntensity: 0.7, clearcoat: 0.18, clearcoatRoughness: 0.28 }),
    goldChaton: new THREE.MeshPhysicalMaterial({ color: 0xc9a45a, metalness: 1, roughness: 0.22, envMapIntensity: 0.78, clearcoat: 0.35, clearcoatRoughness: 0.16 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0x8e1428, roughness: 0.06, metalness: 0, ior: 1.76, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.85, specularIntensity: 1 }),
    spacer: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.8 }),
    plasticBlack: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.55 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.55, metalness: 0.1 }),
    epoxy: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xa86a38, metalness: 1, roughness: 0.4, envMapIntensity: 0.55 }),
    copperBurnt: new THREE.MeshStandardMaterial({ color: 0x4a2a16, metalness: 0.6, roughness: 0.6 }),
    magnet: new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.4, roughness: 0.5 }),
    battery: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.28, map: TX.batteryTexture(), envMapIntensity: 0.4 }),
    batterySide: new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 1, roughness: 0.32, envMapIntensity: 0.45 }),
    whiteDisc: new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.62, map: TX.dateDiscTexture() }),
    lume: new THREE.MeshStandardMaterial({ color: 0xe7f0dc, roughness: 0.55, emissive: 0x1c2820, emissiveIntensity: 0.22 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fb, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.16, depthWrite: false, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.05 }),
    protector: new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }),
    dirtyOil: new THREE.MeshStandardMaterial({ color: 0x3b2a10, roughness: 0.9, transparent: true, opacity: 0.88 }),
    cleanOil: new THREE.MeshPhysicalMaterial({ color: 0xfff6c8, roughness: 0.04, transparent: true, opacity: 0.38, clearcoat: 1 }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.45, depthWrite: false }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  };
  M.metal = (metal, brush = false) => {
    const k = metal + (brush ? 'B' : ''); if (M['m_' + k]) return M['m_' + k];
    const [c, cb] = METAL[metal];
    const mat = new THREE.MeshPhysicalMaterial({
      color: brush ? cb : c, metalness: 1, roughness: brush ? 0.42 : 0.2,
      clearcoat: brush ? 0.08 : 0.22, clearcoatRoughness: brush ? 0.5 : 0.24, envMapIntensity: brush ? 0.62 : 0.78
    });
    return (M['m_' + k] = brushed(mat, brush ? 0.45 : 0.12, brush ? 0.82 : 0.28));
  };
  return M;
}
