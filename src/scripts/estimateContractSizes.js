const fs = require('fs')

module.exports = async function (cb) {
  const LIMIT = 1024

  function sizes(name) {
    const abi = artifacts.require(name)
    const size = (abi.bytecode.length / 2) - 1
    const deployedSize = (abi.deployedBytecode.length / 2) - 1
    return {name, size, deployedSize}
  }

  function fmt(obj) {
    return `${obj.name} -  compiled bytecode: ${obj.size} deployed bytecode: ${obj.deployedSize}`
  }

  const file = fs.readdirSync("build/contracts")
  file.forEach(function (f) {
    const name = f.replace(/.json/, '')
    const sz = sizes(name)
    if (sz.size >= LIMIT || sz.deployedSize >= LIMIT) {
      console.log(fmt(sz))
    }
  })
}