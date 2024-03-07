// 进行打包  monerepo

const fs = require('fs')
const execa = require('execa')
// 获取打包目录

const dir = fs.readdirSync('./packages').filter((f) => {
  return fs.statSync(`packages/${f}`).isDirectory()
})
console.log(dir)
// 进行打包


async function build(target){
  // execa 执行命令 
  // -c 执行rollup 配置文件， 环境变量env
  return execa('rollup', ['-c', '--environment', `TARGET=${target}`], {
    stdio: 'inherit'
  })
}

async function runParallel(dirs, fn){
  const ret = []
  dirs.forEach((dir) => {
    ret.push(fn(dir))
  })
  return Promise.all(ret)
}


runParallel(dir, build).then(() => {
  console.log('构建成功')
})