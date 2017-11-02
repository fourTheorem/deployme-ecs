'use strict'

const lodash = require('lodash')
const cloneDeep = lodash.cloneDeep
const findIndex = lodash.findIndex
const merge = lodash.merge

module.exports = function (AWS, service) {
  var ecs = new AWS.ECS({apiVersion: '2014-11-13'})

  function buildName () {
    return `${service.name}-${service.svcname}-task-${service.env}`
  }


  function cloneAndModify (containerConfig, cb) {
    ecs.listTaskDefinitions({status: 'ACTIVE'}, function (err, data) {
      if (err) return cb(err)

      var tdName = buildName()
      var tdArn = data.taskDefinitionArns.find(function (element) { return element.indexOf(tdName) !== -1 })
      ecs.describeTaskDefinition({taskDefinition: tdArn}, function (err, data) {
        if (err) return cb(err)

        var cdefs = cloneDeep(data.taskDefinition.containerDefinitions)
        cdefs[0].image = `${service.awsAccountId}.dkr.ecr.${service.awsRegion}.amazonaws.com/${service.imageRepoName}:${service.codebuildResolvedSourceVersion}`
        mergeDef(cdefs[0], containerConfig)
        ecs.registerTaskDefinition({family: tdName, containerDefinitions: cdefs}, function (err, data) {
          if (err) return cb(err)
          cb(null, {oldArn: tdArn, newArn: data.taskDefinition.taskDefinitionArn})
        })
      })
    })
  }


  function deregister (oldTaskDefArn, cb) {
    ecs.deregisterTaskDefinition({taskDefinition: oldTaskDefArn}, function (err, data) {
      if (err) return cb(err)
      return cb(null)
    })
  }


  return {
    cloneAndModify,
    deregister
  }
}

/**
 * Merge container definitions including array properties with object entries
 */
function mergeDef (target, src) {
  const merged = merge(target, src)
  removeReplacedElements(merged, src, 'environment', 'name')
  return merged
}

/**
 * Removes obsolete objects from an array within a container config
 */
function removeReplacedElements (obj, src, key, idProperty) {
  if (Array.isArray(obj[key])) {
    obj[key] = obj[key].filter(function (item) {
      return findIndex(src[key], { [idProperty]: item[idProperty] }) === -1
    })
    obj[key] = obj[key].concat(src[key])
  }
}
