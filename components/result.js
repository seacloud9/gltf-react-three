import React, { useEffect, useMemo, useCallback } from 'react'
import copy from 'clipboard-copy'
import saveAs from 'file-saver'
import { Leva, useControls, button, folder } from 'leva'
import toast from 'react-hot-toast'
import { isGlb } from '../utils/isExtension'
import useSandbox from '../utils/useSandbox'
import Viewer from './viewer'
import Code from './code'
import useStore from '../utils/store'
import PropTypes from 'prop-types'
import { IS_DEBUG } from '../utils/Globals'

const LevaContainer = ({ generateScene, children, config, exports }) => {
  const { scene, updateScene } = useStore()
  const setDefaults = () => {
    let folderData = {}
    let dataToReturn = {}
    const defaults = {
      bool: {
        frustumCulled: true,
        visible: true,
        castShadow: true,
        receiveShadow: true,
      },
      number: {
        renderOrder: {
          value: 0,
          min: 0,
          max: 1000,
          step: 1.0,
        },
      },
    }
    if (scene) {
      const setProperties = (scene) => {
        if (scene.children) {
          scene.children.map((index) => setProperties(index))
        }
        const setData = (sceneObj) => {
          for (let child in sceneObj) {
            if (IS_DEBUG) {
              console.log('setProperties of child:', child)
            }
            // handle boolean
            for (let property in defaults.bool) {
              folderData[`${property}:${sceneObj.name}`] = {
                label: property,
                hint: `${property}:${sceneObj.name}`,
                value: sceneObj[property],
              }
              dataToReturn[sceneObj.name] = folder(folderData, { collapsed: true })
            }
            // handle number
            for (let property in defaults.number) {
              folderData[`${property}:${sceneObj.name}`] = {
                label: property,
                hint: `${property}:${sceneObj.name}`,
                value: sceneObj[property],
                min: property.min,
                max: property.max,
                step: property.step,
              }
              dataToReturn[sceneObj.name] = folder(folderData, { collapsed: true })
            }
            folderData = {}
          }
        }
        setData(scene)
      }
      setProperties(scene)
      if (IS_DEBUG) {
        console.log('dataToReturn ', dataToReturn)
      }
      return dataToReturn
    }
  }
  let initialData = setDefaults()

  const [sceneMap, setSceneMap] = useControls(() => ('scene', { scene: folder(initialData) }))
  useControls('exports', exports, { collapsed: true }, [exports])
  useEffect(() => {
    if ((scene && !sceneMap) || (scene && scene !== sceneMap)) {
      updateScene(sceneMap)
      setSceneMap(sceneMap)
      generateScene(config)
    }
  }, [sceneMap, scene])

  return <>{children}</>
}

LevaContainer.propTypes = {
  children: PropTypes.element.isRequired,
  config: PropTypes.any.isRequired,
  generateScene: PropTypes.func.isRequired,
  exports: PropTypes.any.isRequired,
}

const Result = () => {
  const { buffer, fileName, textOriginalFile, scene, code, createZip, generateScene, animations } = useStore()
  const [config, setConfig] = useControls(() => ({
    types: { value: false, hint: 'Add Typescript definitions' },
    instanceall: { label: 'instance all', value: false, hint: 'Instance every geometry (for cheaper re-use)' },
    instance: { value: false, hint: ' Instance re-occuring geometry' },
    verbose: { value: false, hint: 'Verbose output w/ names and empty groups' },
    keepnames: { value: false, label: 'keep names', hint: 'Keep original names' },
    keepgroups: { value: false, label: 'keep groups', hint: 'Keep (empty) groups' },
    aggressive: { value: false, hint: 'Aggressively prune the graph (empty groups, transform overlap)' },
    meta: { value: false, hint: 'Include metadata (as userData)' },
    precision: { value: 2, min: 1, max: 8, step: 1, hint: 'Number of fractional digits (default: 2)' },
  }))

  const preview = useControls(
    'preview',
    {
      autoRotate: true,
      contactShadow: true,
      intensity: { value: 1, min: 0, max: 2, step: 0.1, label: 'light intensity' },
      preset: {
        value: 'rembrandt',
        options: ['rembrandt', 'portrait', 'upfront', 'soft'],
      },
      environment: {
        value: 'city',
        options: ['', 'sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
      },
    },
    { collapsed: true }
  )

  const [loading, sandboxId, error, sandboxCode] = useSandbox({
    fileName,
    textOriginalFile,
    code,
    config: { ...config, ...preview },
  })

  useEffect(() => {
    setConfig({ verbose: animations })
  }, [animations])

  useEffect(() => {
    generateScene(config)
  }, [config])

  const download = useCallback(async () => {
    createZip({ sandboxCode })
  }, [sandboxCode, fileName, textOriginalFile, buffer])

  const exports = useMemo(() => {
    const temp = {}
    temp['copy to clipboard'] = button(() =>
      toast.promise(copy(code), {
        loading: 'Loading',
        success: () => `Successfully copied`,
        error: (err) => err.toString(),
      })
    )
    temp['download zip'] = button(() =>
      toast.promise(download(), {
        loading: 'Loading',
        success: () => `Ready for download`,
        error: (err) => err.toString(),
      })
    )

    if (!isGlb(fileName) && !error) {
      const name = 'codesandbox' + (loading ? ' loading' : '')
      temp[name] = button(() => {
        location.href = sandboxId
          ? `https://codesandbox.io/s/${sandboxId}?file=/src/Model.${config.types ? 'tsx' : 'js'}`
          : '#'
      })
    }

    temp['download image'] = button(() => {
      var image = document
        .getElementsByTagName('canvas')[0]
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')

      saveAs(image, `${fileName.split('.')[0]}.png`)
    })

    return temp
  }, [fileName, loading, error, sandboxCode, sandboxId, config.types])

  return (
    <div className="h-full w-screen">
      {!code && !scene ? (
        <p className="text-4xl font-bold w-screen h-screen flex justify-center items-center">Loading ...</p>
      ) : (
        <div className="grid grid-cols-5 h-full">
          {code && <Code>{code}</Code>}
          <section className="h-full w-full col-span-2">
            {scene && <Viewer scene={scene} {...config} {...preview} />}
          </section>
        </div>
      )}
      {scene?.children && (
        <LevaContainer generateScene={generateScene} config={config} exports={exports}>
          <Leva hideTitleBar collapsed />
        </LevaContainer>
      )}
    </div>
  )
}

export default Result
