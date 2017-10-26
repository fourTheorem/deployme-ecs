'use strict'

const cloneDeep = require('lodash').cloneDeep


module.exports = function (AWS, service) {
  var ecs = new AWS.ECS({apiVersion: '2014-11-13'})

  function buildName () {
    return `${service.name}-${service.svcname}-task-${service.env}`
  }


  function cloneAndModify (cb) {
    ecs.listTaskDefinitions({status: 'ACTIVE'}, function (err, data) {
      if (err) return cb(err)

      var tdName = buildName()
      var tdArn = data.taskDefinitionArns.find(function (element) { return element.indexOf(tdName) !== -1 })
      ecs.describeTaskDefinition({taskDefinition: tdArn}, function (err, data) {
        if (err) return cb(err)

        var cdefs = cloneDeep(data.taskDefinition.containerDefinitions)
        cdefs[0].image = `${service.awsAccountId}.dkr.ecr.${service.awsRegion}.amazonaws.com/${service.imageRepoName}:${service.codebuildResolvedSourceVersion}`

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

