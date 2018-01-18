'use strict'
const path = require('path')
const {spawn} = require('child_process')
const BIN_PATH = path.resolve(__dirname, '..', '..', 'bin', 'shush')

var run = module.exports = function run (cmd, dir, args, done) {
  // Close the child if this process closes
  function onExit () {
    p && p.kill && p.kill()
  }
  process.on('exit', onExit)

  var p = spawn(BIN_PATH, [cmd, '-c', dir, ...args], {
    env: {
      ...process.env
    }
  })
  var out = ''
  p.stdout.on('data', function (d) {
    out += d.toString('utf8')
  })
  p.stderr.on('data', function (d) {
    out += d.toString('utf8')
  })
  p.on('error', function (err) {
    process.removeListener('exit', onExit)
    done(err)
  })
  p.on('close', function (code) {
    process.removeListener('exit', onExit)
    done(null, out, code)
  })

  return p
}

// Run specific commands
module.exports.pack = run.bind(null, 'pack')
module.exports.unpack = run.bind(null, 'unpack')
module.exports.secret = run.bind(null, 'secret')
