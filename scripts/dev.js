// 进行打包  monerepo
import fs from 'fs'
// const fs = require('fs');
// execa 的版本不能太高，最好是当前版本，否则会出现导入问题
// const execa = require('execa');
import { execa } from 'execa'

// 获取打包目录
const dir = fs.readdirSync('./packages').filter((f) => {
  return fs.statSync(`packages/${f}`).isDirectory()
})

// 进行打包
async function build(target){
  // execa 执行命令 
  // -c 执行rollup 配置文件， 环境变量env
   await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    // 在终端打印子进程的输出
    stdio: 'inherit'
  })
}

async function runParallel(dirs, fn){
  console.log('开始构建')
  const ret = []
  dirs.forEach((dir) => {
    ret.push(fn(dir))
  })
  return Promise.all(ret)
}


runParallel(dir, build).then(() => {
  console.log('构建成功')
})