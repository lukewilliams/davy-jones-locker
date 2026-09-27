// Material handling for loaded glTF scenes.

// True when every vertex colour is pure black. Some exporters (Houdini among
// them) write a COLOR_0 attribute whether or not colours were ever assigned;
// three then enables vertexColors, and white × black leaves the mesh unlit black.
// Alpha is ignored — only RGB decides.
function hasOnlyBlackVertexColors(geometry) {
  const attr = geometry?.getAttribute?.('color')
  if (!attr) return false
  const { array, itemSize, count } = attr
  for (let v = 0; v < count; v++) {
    const i = v * itemSize
    if (array[i] !== 0 || array[i + 1] !== 0 || array[i + 2] !== 0) return false
  }
  return true
}

/**
 * Merges `properties` into every mesh material of `root`, in place.
 *
 * Materials are cloned first: glTF loaders cache and share materials (the
 * default one especially), so mutating them would leak across models. Merging
 * rather than replacing keeps whatever the model brought — textures, normal
 * maps, transparency.
 *
 * @param {object} root  an Object3D
 * @param {object} properties  material properties, e.g. { roughness, metalness }
 * @param {boolean} dropBlackVertexColors  ignore an all-black COLOR_0 attribute
 */
export function applyMaterial(root, properties = {}, dropBlackVertexColors = true) {
  const { color, ...rest } = properties

  root.traverse((child) => {
    if (!child.isMesh || !child.material) return

    const material = child.material.clone()
    Object.assign(material, rest)
    // Colours go through .set() so strings and hex numbers both work.
    if (color != null && material.color) material.color.set(color)

    if (dropBlackVertexColors && material.vertexColors && hasOnlyBlackVertexColors(child.geometry)) {
      material.vertexColors = false
    }

    material.needsUpdate = true
    child.material = material
  })
}
