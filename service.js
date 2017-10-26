'use strict'


module.exports = function (AWS, service) {
  var ecs = new AWS.ECS({apiVersion: '2014-11-13'})

  function buildClusterName () {
    return `${service.name}-${service.placement}-cluster-${service.env}`
  }


  function buildServiceName () {
    return `${service.name}-${service.svcname}-service-${service.env}`
  }


  function updateTaskDef (tdArn, cb) {
    ecs.listServices({cluster: buildClusterName()}, function (err, data) {
      if (err) return cb(err)

      var svcName = buildServiceName()
      var svcArn = data.serviceArns.find(function (element) { return element.indexOf(svcName) !== -1 })

      ecs.updateService({cluster: buildClusterName(), service: svcArn, taskDefinition: tdArn}, function (err, data) {
        if (err) return cb(err)
        cb(null, svcArn)
      })
    })
  }


  return {
    updateTaskDef
  }
}

