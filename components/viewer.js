import React, { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas, extend } from '@react-three/fiber'
import { OrbitControls, Stage, Effects } from '@react-three/drei'
import { FilmPass, WaterPass, UnrealBloomPass, LUTPass } from 'three-stdlib'
import PropTypes from 'prop-types'
import useStore from '../utils/store'
extend({ WaterPass, UnrealBloomPass, FilmPass, LUTPass })

export default function Viewer({ shadows, contactShadow, autoRotate, environment, preset, intensity, useGlobalBloom }) {
  const scene = useStore((store) => store.scene)
  const ref = useRef()
  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = obj.receiveShadow = shadows
        obj.material.envMapIntensity = 0.8
      }
    })
  }, [scene, shadows])

  return (
    <Canvas gl={{ preserveDrawingBuffer: true }} shadows dpr={[1, 1.5]} camera={{ position: [0, 0, 150], fov: 50 }}>
      <Suspense fallback={null}>
        <Stage
          controls={ref}
          preset={preset}
          intensity={intensity}
          contactShadow={contactShadow}
          shadows
          adjustCamera
          environment={environment}
        >
          <>
            <ambientLight intensity={0.25} />
            <primitive object={scene} />
            <OrbitControls ref={ref} autoRotate={autoRotate} />
          </>
          {useGlobalBloom && (
            <Effects>
              <unrealBloomPass args={[undefined, 1.25, 1, 0]} />
            </Effects>
          )}
        </Stage>
      </Suspense>
    </Canvas>
  )
}

Viewer.propTypes = {
  shadows: PropTypes.bool.isRequired,
  contactShadow: PropTypes.bool.isRequired,
  autoRotate: PropTypes.bool.isRequired,
  environment: PropTypes.any.isRequired,
  preset: PropTypes.any.isRequired,
  intensity: PropTypes.any.isRequired,
}
