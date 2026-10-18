// Materiales PBR compartidos (metales, rubíes, acabados de relojería)
import * as THREE from 'three';
import * as TX from './textures.js';
const METAL = { gold: [0xf0c25a, 0xe8b850], rose: [0xf0b49c, 0xe2a48c], steel: [0xdfe3e8, 0xc4cad1] };
export function makeMaterials() {
  const cotes = TX.cotesTexture(); cotes.repeat.set(0.28, 0.28);
  const perl = TX.perlageTexture(); perl.repeat.set(7, 7);
  const M = {
    bridge: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.92, roughness: 0.3, map: cotes }),
    bridgeGilt: new THREE.MeshStandardMaterial({ color: 0xf2dca8, metalness: 0.9, roughness: 0.34, map: cotes }),
    plate: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.4, map: perl }),
    plateBrass: new THREE.MeshStandardMaterial({ color: 0xe9d3a0, metalness: 0.85, roughness: 0.45, map: perl }),
    steel: new THREE.MeshStandardMaterial({ color: 0xd4d9df, metalness: 1, roughness: 0.18, envMapIntensity: 1.2 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x8a9099, metalness: 1, roughness: 0.32, envMapIntensity: 1.05 }),
    blueScrew: new THREE.MeshStandardMaterial({ color: 0x2d55c8, metalness: 0.85, roughness: 0.25 }),
    blueSpring: new THREE.MeshStandardMaterial({ color: 0x4b6c9c, metalness: 1, roughness: 0.3 }),
    goldWheel: new THREE.MeshStandardMaterial({ color: 0xe2b35a, metalness: 1, roughness: 0.24, envMapIntensity: 1.25 }),
    goldChaton: new THREE.MeshStandardMaterial({ color: 0xe9c070, metalness: 1, roughness: 0.2, envMapIntensity: 1.3 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xd01836, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0.35, sheenColor: new THREE.Color(0xff6680), emissive: 0x3a0008, envMapIntensity: 1.35 }),
    spacer: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.8 }),
    plasticBlack: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.55 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.55, metalness: 0.1 }),
    epoxy: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc8743a, metalness: 1, roughness: 0.35 }),
    copperBurnt: new THREE.MeshStandardMaterial({ color: 0x4a2a16, metalness: 0.6, roughness: 0.6 }),
    magnet: new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.4, roughness: 0.5 }),
    battery: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.2, map: TX.batteryTexture() }),
    batterySide: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 1, roughness: 0.25 }),
    whiteDisc: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, map: TX.dateDiscTexture() }),
    lume: new THREE.MeshStandardMaterial({ color: 0xf2ffe6, roughness: 0.5, emissive: 0x334433, emissiveIntensity: 0.4 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: 0xeef6ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8, reflectivity: 1 }),
    protector: new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }),
    dirtyOil: new THREE.MeshStandardMaterial({ color: 0x3b2a10, roughness: 0.9, transparent: true, opacity: 0.88 }),
    cleanOil: new THREE.MeshPhysicalMaterial({ color: 0xfff6c8, roughness: 0.02, transparent: true, opacity: 0.45, clearcoat: 1 }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.45, depthWrite: false }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  };
  M.metal = (metal, brushed = false) => {
    const k = metal + (brushed ? 'B' : ''); if (M['m_' + k]) return M['m_' + k];
    const [c, cb] = METAL[metal];
    return (M['m_' + k] = new THREE.MeshPhysicalMaterial({
      color: brushed ? cb : c, metalness: 1, roughness: brushed ? 0.36 : 0.14,
      clearcoat: brushed ? 0.2 : 0.55, clearcoatRoughness: brushed ? 0.35 : 0.12, envMapIntensity: 1.28
    }));
  };
  return M;
}
