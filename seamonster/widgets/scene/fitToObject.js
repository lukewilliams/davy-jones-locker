import { Box3, Sphere, Vector3 } from 'three'

/**
 * Moves `camera` so that `object`'s bounds fill the frame, keeping the current
 * viewing direction — only the distance and what is centred change.
 *
 * Mutates the camera (position, near, far, projection matrix) and returns the
 * point it now looks at, so the caller can move its controls' target there.
 * Returns null when there is nothing to frame.
 *
 * @param {import('three').PerspectiveCamera} camera
 * @param {import('three').Object3D} object
 * @param {{ padding?: number, pivot?: Vector3 }} [options]
 *   `padding` is the fraction of extra room left around the bounding sphere.
 *   `pivot` is the point the camera currently orbits, used to derive the
 *   viewing direction; defaults to the camera's own forward axis.
 */
export function fitToObject(camera, object, { padding = 1.1, pivot = null } = {}) {
  if (!camera || !object) return null

  const box = new Box3().setFromObject(object)
  if (box.isEmpty()) return null

  // The bounding SPHERE, not the box: a box's projected size depends on the
  // viewing angle — seen cornerwise it spans its diagonal — so fitting the
  // largest box axis leaves corners outside the frustum from oblique angles.
  // A sphere looks the same from everywhere, so this fits from any direction.
  const { center, radius } = box.getBoundingSphere(new Sphere())
  if (radius === 0) return null

  const vFov = (camera.fov * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
  const distance =
    padding * Math.max(radius / Math.sin(vFov / 2), radius / Math.sin(hFov / 2))

  const direction = pivot
    ? camera.position.clone().sub(pivot)
    : camera.getWorldDirection(new Vector3()).negate()
  if (direction.lengthSq() === 0) direction.set(0, 0, 1)
  direction.normalize()

  camera.position.copy(center).addScaledVector(direction, distance)
  // Clip planes sit just outside the sphere, keeping depth precision usable.
  camera.near = Math.max((distance - radius) / 10, 0.01)
  camera.far = (distance + radius) * 2
  camera.updateProjectionMatrix()

  return center
}
