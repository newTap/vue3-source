// 进行打包  monerepo
const fs = require('fs')

const dir = fs.readdirSync('./packages').filter((f) => {
  return fs.statSync(`packages/${f}`).isDirectory()
})
console.log(dir)