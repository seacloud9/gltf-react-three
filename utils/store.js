import { saveAs } from 'file-saver'
import create from 'zustand'
import { createZip } from '../utils/createZip'
import { parse } from 'gltfjsx'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import prettier from 'prettier/standalone'
import parserBabel from 'prettier/parser-babel'
import parserTS from 'prettier/parser-typescript'
import { REVISION } from 'three'
import { WebGLRenderer } from 'three'
import { IS_DEBUG } from './Globals'

let gltfLoader
if (typeof window !== 'undefined') {
  const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`
  const dracoloader = new DRACOLoader().setDecoderPath(`${THREE_PATH}/examples/js/libs/draco/gltf/`)
  const ktx2Loader = new KTX2Loader().setTranscoderPath(`${THREE_PATH}/examples/js/libs/basis/`)

  gltfLoader = new GLTFLoader()
    .setCrossOrigin('anonymous')
    .setDRACOLoader(dracoloader)
    .setKTX2Loader(ktx2Loader.detectSupport(new WebGLRenderer()))
    .setMeshoptDecoder(MeshoptDecoder)
}

const useStore = create((set, get) => ({
  fileName: '',
  buffer: null,
  textOriginalFile: '',
  animations: false,
  code: '',
  scene: null,
  model: null,
  setModel: (model) => set((state) => ({ ...state, model })),
  createZip: async ({ sandboxCode }) => {
    await import('../utils/createZip').then((mod) => mod.createZip)
    const { fileName, textOriginalFile, buffer } = get()
    console.log('createZip: ', textOriginalFile)
    const blob = await createZip({ sandboxCode, fileName, textOriginalFile, buffer })

    saveAs(blob, `${fileName.split('.')[0]}.zip`)
  },
  updateScene: async (propertiesToUpdate) => {
    let currentScene = get().scene
    if (IS_DEBUG) {
      console.log('updateScene: preupdate ', currentScene)
    }
    if (currentScene) {
      currentScene.traverse((child) => {
        if (currentScene) {
          const name = child.name ? child.name : `${child.type}: ${child.uuid}`
          if (!child.name) {
            child.name = name
          } else {
            for (let updatedProperty in propertiesToUpdate) {
              let newData = updatedProperty.replace(`:${child.name}`, '')
              if(!newData.match(':')){
                child[newData] = propertiesToUpdate[updatedProperty];
              }
            }
          }
        }
      })
      if (IS_DEBUG) {
        console.log('currentScene', currentScene)
      }
      set({ scene: currentScene })
    }
  },
  generateScene: async (config) => {
    const { fileName, buffer } = get()
    let result = await new Promise((resolve, reject) => gltfLoader.parse(buffer, '', resolve, reject))

    if (IS_DEBUG) {
      let sceneRaw = get().scene
      console.log('parse generateScene: ', result)
      if (sceneRaw?.traverse) {
        result['scene'] = sceneRaw
        result['scenes'] = [result['scene']]
        result['animations'] = result.animations || []
      }
    }
    if (IS_DEBUG) {
      console.log("parse before sending to gltfx", result);
    }
    const code = parse(fileName, result, { ...config, printwidth: 100 })

    try {
      const prettierConfig = config.types
        ? { parser: 'typescript', plugins: [parserTS] }
        : { parser: 'babel', plugins: [parserBabel] }

      set({
        code: prettier.format(code, prettierConfig),
      })
    } catch {
      set({
        code: code,
      })
    }
    set({
      animations: !!result.animations.length,
    })
    if (!get().scene) set({ scene: result.scene })
  },
}))

export default useStore
