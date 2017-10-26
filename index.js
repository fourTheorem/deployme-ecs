'use strict'

var service = {
  name: process.env.SYSTEM_NAME,
  svcname: process.env.SERVICE_NAME,
  env: process.env.SERVICE_ENV,
  awsAccountId: process.env.AWS_ACCOUNT_ID,
  awsRegion: process.env.AWS_REGION,
  imageRepoName: process.env.IMAGE_REPO_NAME,
  placement: process.env.SERVICE_PLACEMENT,
  codebuildResolvedSourceVersion: process.env.CODEBUILD_RESOLVED_SOURCE_VERSION
}

const AWS = require('aws-sdk')
AWS.config.update({region: service.awsRegion})
const task = require('./task')(AWS, service)
const svc = require('./service')(AWS, service)

task.cloneAndModify(function (err, taskArns) {
  if (err) { return console.log(err) }
  svc.updateTaskDef(taskArns.newArn, function (err, svcArn) {
    if (err) { return console.log(err) }
    task.deregister(taskArns.oldArn, function (err) {
      if (err) { return console.log(err) }
      console.log(`replaced: ${taskArns.oldArn} with: ${taskArns.newArn}, in service: ${svcArn}`)
    })
  })
})

