'use strict'

const path = require('path')

module.exports = function (service) {
  const configPath = path.join(process.cwd(), `ecs-container-${service.env}.json`)
  try {
    return require(configPath)
  } catch (e) {
    console.info(`No task config found at ${configPath}`)
    return {}
  }
}
