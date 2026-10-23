// Acabados de macro: oro y acero con grano real, no un color plano amarillo.
// El cristal no usa transmission: ese pase dibuja la escena dos veces y en el iPhone se cae.
import * as THREE from 'three';
import * as TX from './textures.js';
const METAL = { gold: [0xe0c078, 0xc6a24a], rose: [0xe4b49a, 0xc8927c], steel: [0xd2dbe4, 0xaeb8c2] };
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
  const cotesR = TX.cotesRough(); cotesR.repeat.set(0.28, 0.28); cotesR.rotation = cotes.rotation;
  const perl = TX.perlageTexture(); perl.repeat.set(7, 7);
  const perlR = TX.perlageRough(); perlR.repeat.set(7, 7);
  const M = {
    bridge: new THREE.MeshPhysicalMaterial({ color: 0xd7dee6, metalness: 1, roughness: 0.34, map: cotes, roughnessMap: cotesR, envMapIntensity: 0.92, clearcoat: 0.1, clearcoatRoughness: 0.4, anisotropy: 0.72, anisotropyRotation: 0.45 }),
    bridgeGilt: new THREE.MeshPhysicalMaterial({ color: 0xe0c078, metalness: 1, roughness: 0.28, map: cotes, roughnessMap: cotesR, envMapIntensity: 0.95, clearcoat: 0.08, clearcoatRoughness: 0.34, anisotropy: 0.72, anisotropyRotation: 0.45 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xc5ced6, metalness: 1, roughness: 0.5, map: perl, roughnessMap: perlR, envMapIntensity: 0.62, clearcoat: 0.04, clearcoatRoughness: 0.5 }),
    plateBrass: new THREE.MeshPhysicalMaterial({ color: 0xd4a85a, metalness: 1, roughness: 0.34, map: perl, roughnessMap: perlR, envMapIntensity: 0.82, clearcoat: 0.05, clearcoatRoughness: 0.4 }),
    steel: brushed(new THREE.MeshPhysicalMaterial({ color: 0xc5ced6, metalness: 1, roughness: 0.3, envMapIntensity: 0.82, clearcoat: 0.08, clearcoatRoughness: 0.35 }), 0.2, 0.55),
    darkSteel: brushed(new THREE.MeshPhysicalMaterial({ color: 0x8e98a2, metalness: 1, roughness: 0.4, envMapIntensity: 0.85, clearcoat: 0.08, clearcoatRoughness: 0.45 }), 0.28, 0.7),
    blueScrew: new THREE.MeshPhysicalMaterial({ color: 0x16367a, metalness: 1, roughness: 0.16, envMapIntensity: 1.25, clearcoat: 0.85, clearcoatRoughness: 0.08 }),
    blueSpring: new THREE.MeshPhysicalMaterial({ color: 0x2c4d78, metalness: 1, roughness: 0.28, envMapIntensity: 0.9, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
    goldWheel: new THREE.MeshPhysicalMaterial({ color: 0xc4922e, metalness: 1, roughness: 0.3, envMapIntensity: 0.78, clearcoat: 0.12, clearcoatRoughness: 0.28 }),
    goldChaton: new THREE.MeshPhysicalMaterial({ color: 0xe6c56a, metalness: 1, roughness: 0.16, envMapIntensity: 1.25, clearcoat: 0.45, clearcoatRoughness: 0.1 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0x9a1830, roughness: 0.04, metalness: 0, ior: 1.76, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.15, specularIntensity: 1 }),
    spacer: new THREE.MeshStandardMaterial({ color: 0x2a292c, roughness: 0.72, metalness: 0.15 }),
    plasticBlack: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.48 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x1c5c34, roughness: 0.55, metalness: 0.08 }),
    epoxy: new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.32 }),
    copper: new THREE.MeshPhysicalMaterial({ color: 0xc47a42, metalness: 1, roughness: 0.32, envMapIntensity: 0.9 }),
    copperBurnt: new THREE.MeshStandardMaterial({ color: 0x4a2a16, metalness: 0.7, roughness: 0.55 }),
    magnet: new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.45, roughness: 0.46 }),
    battery: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.22, map: TX.batteryTexture(), envMapIntensity: 0.7 }),
    batterySide: new THREE.MeshPhysicalMaterial({ color: 0xc5ccd2, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 }),
    whiteDisc: new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.55, map: TX.dateDiscTexture() }),
    lume: new THREE.MeshStandardMaterial({ color: 0xe7f0dc, roughness: 0.48, emissive: 0x1a2620, emissiveIntensity: 0.16 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.1, depthWrite: false, ior: 1.77, reflectivity: 1, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 }),
    protector: new THREE.MeshPhysicalMaterial({ color: 0xcfe9ff, roughness: 0.12, transparent: true, opacity: 0.28, depthWrite: false }),
    dirtyOil: new THREE.MeshStandardMaterial({ color: 0x3b2a10, roughness: 0.9, transparent: true, opacity: 0.88 }),
    cleanOil: new THREE.MeshPhysicalMaterial({ color: 0xfff6c8, roughness: 0.04, transparent: true, opacity: 0.38, clearcoat: 1 }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.45, depthWrite: false }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  };
  M.metal = (metal, brush = false) => {
    const k = metal + (brush ? 'B' : ''); if (M['m_' + k]) return M['m_' + k];
    const [c, cb] = METAL[metal];
    const mat = new THREE.MeshPhysicalMaterial({
      color: brush ? cb : c, metalness: 1, roughness: brush ? 0.36 : 0.15,
      clearcoat: brush ? 0.06 : 0.16, clearcoatRoughness: brush ? 0.46 : 0.22,
      envMapIntensity: brush ? 0.82 : 0.96, reflectivity: 1
    });
    return (M['m_' + k] = brushed(mat, brush ? 0.42 : 0.08, brush ? 0.88 : 0.2));
  };
  return M;
}
