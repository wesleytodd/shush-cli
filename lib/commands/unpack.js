'use strict'
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const createUnpackStream = require('../unpack-stream')

module.exports = function pack (opts = {}) {
  // Unpack opts
  var {logger, cwd, secret, input, output} = opts

  // Input tarbal
  var inputFile = input || opts._[0]

  // Output directory
  var outputFile = path.resolve(cwd, output || opts._[1] || '.')

  var unpackStream = createUnpackStream(secret)
    .on('data', (d) => {
      var f = path.join(outputFile, d.name)
      mkdirp(path.dirname(f), (err) => {
        if (err) {
          return logger.error(err)
        }

        fs.writeFile(f, d.contents, (err) => {
          if (err) {
            logger.error(err)
          }
        })
      })
    })

  // Pipe input file to the extraction stream
  if (inputFile) {
    // Input is a file, write it
    fs.createReadStream(path.resolve(cwd, inputFile)).on('data', (d) => unpackStream.write(d))
  } else {
    process.stdin.on('data', (d) => unpackStream.write(d))
  }
}

module.exports.help = function packHelp () {
  return `
    Unpack a shush file back to the original unencrypted files

    Usage:
      shush unpack [<options>] [--output=<output file>] <input file>
      shush unpack [<options>] <input file> <output file>

    Options: 
      -h, --help              Display This help text
      -c, --cwd=.             Set current working directory
      -l, --logLevel="info"   Set the log level
      -s, --secret=""         Set the secret from the command line
      -o, --output=<path>     The output location to unpack into 
      -i, --input=<path>      Input shush file
  `
}
