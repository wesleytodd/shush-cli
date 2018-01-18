'use strict'
const fs = require('fs')
const path = require('path')
const prompt = require('password-prompt')

module.exports = function (opts) {
  prompt('secret:', {method: 'hide'}).then((secret) => {
    if (!secret) {
      return opts.logger.info('No password set')
    }
    var p = path.join(opts.cwd, '.env')
    fs.writeFile(p, `SHUSH_SECRET=${secret}`, (err) => {
      if (err) {
        return opts.logger.error(err)
      }
      opts.logger.info(`Secret saved to ${p}`)
    })
  })
}

module.exports.help = function (args) {
  return `
    Set your secret in an .env file

    Usage:
      shush secret [<options>]

    Options:
      -h, --help              Display This help text
      -c, --cwd=.             Set current working directory
      -l, --logLevel="info"   Set the log level
  `
}
