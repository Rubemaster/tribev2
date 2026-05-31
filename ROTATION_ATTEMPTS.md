# Rotation Attempts — All Failed

Goal: Apply X/Y/Z Euler angles to a 3D brain mesh in a react-three-fiber Canvas.

## Attempts

| # | Library / Method | Approach | Result |
|---|-----------------|----------|--------|
| 1 | Three.js `useMemo` `group.rotation.set()` | Declarative R3F rotation prop | No Z rotation, shading glitches |
| 2 | Three.js `useEffect` `group.rotation.order = 'YXZ'` | Change Euler order before setting | Shading glitches, rotation order reset |
| 3 | Three.js `camera.up` axis-angle | Rotate camera up vector for Z roll | Camera orbit breakage |
| 4 | Three.js `Euler` → `quaternion.setFromEuler` + matrix manual set | Quaternion bypass of `.rotation` | Gimbal lock / axis confusion |
| 5 | `gl-matrix` `quat.fromEuler` → `mat4.fromQuat` v1 | Industry-standard WebGL math | Matrix transform didn't propagate to children |
| 6 | `euler` npm package | Standalone euler→matrix converter | Package broken (invalid main entry) |
| 7 | `euler-angles`, `euler-rot`, `rotation-matrix`, `euler-mat`, `eul` | Various npm euler packages | All 404 — don't exist |
| 8 | `threejs-math` | Official Three.js math standalone | Still Three.js under hood (wanted non-3js) |
| 9 | `mathjs` `matrix().multiply()` | Manual Rx/Ry/Rz, multiply in mathjs | Matrix index mapping wrong |
| 10 | `quaternion` npm package v1 | Pure JS quat → axis-angle → toMatrix | `toMatrix()` returns flat 9 array, brain disappeared |
| 11 | Three.js `useFrame` + `group.rotation.set()` | R3F per-frame rotation update | Same shading/wobble issues |
| 12 | `ogl` `Mat4.rotate()` | Independent WebGL framework | Need matrix decomposition for Three.js |
| 13 | `attitude` npm package | Spherical rotations | Dead package |
| 14 | `transformation-matrix` npm package | 2D/3D transform matrices | 2D only |
| 15 | `gl-matrix` v2 (column-major fix) `mat4.fromQuat` → direct `matrix.set` | Same as #5 with correct layout | World matrix not propagated |
| 16 | Three.js `g.quaternion.set(qx,qy,qz,qw)` from gl-matrix | gl-matrix quat → Three.js quaternion bypass | Still wobble/shading |
| 17 | Three.js world-axis quaternions (fresh each frame) | qx/qy/qz from immutable world axes, compose: qz·qy·qx | Wobble + shading only |
| 18 | Three.js `rotation.order = 'ZYX'` set once, then `.x/.y/.z` updates | Order set on mount, individual axis updates | Same wobble/shading |
| 19 | Vertex-level rotation: `rotateVertices()` + `computeVertexNormals()` | Apply Euler rotation matrix to each vertex, recompute normals | Not working |

## Root Cause Hypothesis

The `ColoredMesh` component uses `useMemo` to create a `BufferGeometry`. When the parent group rotates via `.rotation`, Three.js transforms the mesh position but the vertex normals (computed once in local space) don't get transformed through the model matrix on the GPU — causing the shading to break. All attempts to rotate via scene graph (group.rotation, quaternion, matrix) hit the same normals issue.

The vertex-level rotation attempt (#19) should theoretically fix this by pre-rotating the vertices and recomputing normals, but it apparently still doesn't work — possibly because `useMemo` isn't re-running, or the rotation math is applied to a copy that isn't used by the actual geometry.

## Next Ideas

- Use `geometry.attributes.position.needsUpdate = true` after rotation
- Use `useFrame` to apply vertex rotation each frame instead of useMemo
- Switch to a completely different rendering approach (raw WebGL, regl, etc.)
- Use `@react-three/drei` TransformControls gizmo for visual rotation
- Abandon Euler and use spherical coordinates (theta/phi/roll) directly on camera
