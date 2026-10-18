// Materiales PBR compartidos. El brillo viene del foco, no de un relleno plano:
// metal más oscuro y menos reflejo para que el interior no se queme.
import * as THREE from 'three';
import * as TX from './textures.js';
const METAL = { gold: [0xd7b15a, 0xc49a48], rose: [0xe0a890, 0xc98b78], steel: [0xc5ccd3, 0xaeb6bf] };
export function makeMaterials() {
  const cotes = TX.cotesTexture(); cotes.repeat.set(0.28, 0.28);
  const perl = TX.perlageTexture(); perl.repeat.set(7, 7);
  const M = {
    bridge: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.92, roughness: 0.42, map: cotes, envMapIntensity: 0.55 }),
    bridgeGilt: new THREE.MeshStandardMaterial({ color: 0xd7c08a, metalness: 0.9, roughness: 0.4, map: cotes, envMapIntensity: 0.6 }),
    plate: new THREE.MeshStandardMaterial({ color: 0xb7bdc4, metalness: 0.82, roughness: 0.5, map: perl, envMapIntensity: 0.45 }),
    plateBrass: new THREE.MeshStandardMaterial({ color: 0xcbb98a, metalness: 0.84, roughness: 0.48, map: perl, envMapIntensity: 0.5 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb7bec6, metalness: 1, roughness: 0.28, envMapIntensity: 0.7 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x6e747c, metalness: 1, roughness: 0.4, envMapIntensity: 0.45 }),
    blueScrew: new THREE.MeshStandardMaterial({ color: 0x2a4cb0, metalness: 0.8, roughness: 0.32, envMapIntensity: 0.6 }),
    blueSpring: new THREE.MeshStandardMaterial({ color: 0x3e5c88, metalness: 0.9, roughness: 0.34, envMapIntensity: 0.5 }),
    goldWheel: new THREE.MeshStandardMaterial({ color: 0xc4923c, metalness: 1, roughness: 0.32, envMapIntensity: 0.72 }),
    goldChaton: new THREE.MeshStandardMaterial({ color: 0xd4ae58, metalness: 1, roughness: 0.26, envMapIntensity: 0.8 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xb01028, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.2, sheenColor: new THREE.Color(0xff6680), emissive: 0x1a0004, envMapIntensity: 0.7 }),
    spacer: new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.8 }),
    plasticBlack: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.55 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.55, metalness: 0.1 }),
    epoxy: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb86832, metalness: 1, roughness: 0.38, envMapIntensity: 0.6 }),
    copperBurnt: new THREE.MeshStandardMaterial({ color: 0x4a2a16, metalness: 0.6, roughness: 0.6 }),
    magnet: new THREE.MeshStandardMaterial({ color: 0x3a3a40, metalness: 0.4, roughness: 0.5 }),
    battery: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.2, map: TX.batteryTexture(), envMapIntensity: 0.5 }),
    batterySide: new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 1, roughness: 0.3, envMapIntensity: 0.5 }),
    whiteDisc: new THREE.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.55, map: TX.dateDiscTexture() }),
    lume: new THREE.MeshStandardMaterial({ color: 0xf2ffe6, roughness: 0.5, emissive: 0x243028, emissiveIntensity: 0.28 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: 0xdfe8f2, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.85 }),
    protector: new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }),
    dirtyOil: new THREE.MeshStandardMaterial({ color: 0x3b2a10, roughness: 0.9, transparent: true, opacity: 0.88 }),
    cleanOil: new THREE.MeshPhysicalMaterial({ color: 0xfff6c8, roughness: 0.02, transparent: true, opacity: 0.4, clearcoat: 1 }),
    ghost: new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.45, depthWrite: false }),
    hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  };
  M.metal = (metal, brushed = false) => {
    const k = metal + (brushed ? 'B' : ''); if (M['m_' + k]) return M['m_' + k];
    const [c, cb] = METAL[metal];
    return (M['m_' + k] = new THREE.MeshPhysicalMaterial({
      color: brushed ? cb : c, metalness: 1, roughness: brushed ? 0.46 : 0.22,
      clearcoat: brushed ? 0.12 : 0.28, clearcoatRoughness: brushed ? 0.45 : 0.22, envMapIntensity: 0.7
    }));
  };
  return M;
}
