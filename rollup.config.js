// 通过rollup进行打包
import { createRequire } from 'node:module'
// 解析第三方插件
import pluginResolve from '@rollup/plugin-node-resolve'
// 解析json格式的
import json from '@rollup/plugin-json'
// 解析 ts 格式的
import typescript from 'rollup-plugin-typescript2'
import { fileURLToPath } from 'url';
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const readConfig = (dir) => require(`${dir}/package.json`);

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = (/** @type {string} */ p) => path.resolve(packageDir, p)

const packageConfig = readConfig(packageDir)
const buildOptions = packageConfig.buildOptions
const name = path.basename(packageDir)



const outputConfigs = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es',
  },
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife',
  },
  // runtime-only builds, for main "vue" package only
  'esm-bundler-runtime': {
    file: resolve(`dist/${name}.runtime.esm-bundler.js`),
    format: 'es',
  },
  'esm-browser-runtime': {
    file: resolve(`dist/${name}.runtime.esm-browser.js`),
    format: 'es',
  },
  'global-runtime': {
    file: resolve(`dist/${name}.runtime.global.js`),
    format: 'iife',
  },
}

// 导出配置文件
function createConfig(format, outPut) {
  // 打包配置
  outPut.name = buildOptions.name
  outPut.sourcemap = true
  // 生成rollup配置
  return {
    // 导入地址
    input: resolve('src/index.ts'),//导入文件
    output:[outPut],//导出配置
    plugins: [
      json(),
      // 解析ts语法
      typescript({
        tsconfig: path.relative(__dirname, 'tsconfig.json'),
      }),
      // 解析第三方插件
      pluginResolve(),
    ]
  }
}

let obj =  buildOptions.format.map((format) => createConfig(format, outputConfigs[format]))

export default obj