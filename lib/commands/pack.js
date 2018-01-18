'use strict'
const fs = require('fs')
const path = require('path')
const tar = require('tar-stream')
const parallel = require('run-parallel')
const pump = require('pump')
const once = require('once')
const mkdirp = require('mkdirp')
const createPackEntryStream = require('../pack-entry-stream')
const filesToPack = require('../files-to-pack')

module.exports = function pack (opts = {}) {
  // Unpack opts
  var {logger, cwd, secret, input, output} = opts

  // Build array of input files
  var inFiles = [].concat(input || [], opts._, opts['--'])

  // Default to the full current working directory
  // if no input files were specified
  inFiles[0] = inFiles[0] || cwd

  // Build flat array of files to pack, recursing into directories
  filesToPack(cwd, inFiles, function (err, inputFiles) {
    if (err) {
      return logger.error(err)
    }
    // Create tar pack
    var pack = tar.pack()

    // Create input streams from files
    var tasks = inputFiles.map(({key, filepath, stats}) => {
      return (cb) => {
        // Wrap cb so it is only called once even if an
        // error occurs after the entry is
        var done = once(cb)

        // The input stream
        var inStream = fs.createReadStream(filepath)

        // Pipe the input to the pack processor, then create entries
        var s = createPackEntryStream(key, secret)
          .on('data', (d) => {
            // Create pack entry
            pack.entry({
              name: `${d.filename}.${d.hash}`,
              size: d.size,
              mode: (stats.mode & parseInt('777', 8)).toString(8),
              mtime: stats.mtime,
              uid: stats.uid,
              gid: stats.gid
            }, d.content, done)
          })

        // Pump from the input path to the entry, calling done when complete
        pump(inStream, s, (err) => {
          if (err) {
            // Calling done here in case the error
            // happens before the entry is written
            // resulting in done never getting called
            done(err)
          }
        })
      }
    })

    // Create output directory and pipe tar to output stream
    if (typeof output === 'string') {
      var outfile = path.resolve(cwd, output)
      mkdirp(path.dirname(outfile), (err) => {
        if (err) {
          return logger.error(err)
        }

        pump(pack, fs.createWriteStream(outfile), (err) => err && logger.error(err))
      })
    } else {
      pump(pack, process.stdout, (err) => err && logger.error(err))
    }

    // Run input files in series
    parallel(tasks, (err) => {
      if (err) {
        return logger.error(err)
      }
      pack.finalize()
    })
  })
}

module.exports.help = function packHelp () {
  return `
    Encrypt one or many files to an encrypted shush file

    Usage:
      shush pack [<options>] --output=<output file> <input files...>
      shush pack [<options>] --output=<output file> -- <input files...>
      shush pack [<options>] <input files...> > <output file> 

    Options:
      -h, --help              Display This help text
      -c, --cwd=.             Set current working directory
      -l, --logLevel="info"   Set the log level
      -s, --secret=""         Set the secret from the command line
      -o, --output=<path>     Output path for shush file
      -i, --input=<paths...>  Input paths to pack into the shush file

    Examples:
      
      Pack the .ssh directory into ssh.shush

        shush pack --ouput="ssh.shush" .ssh

      Save the two files foo.md and bar.md to the file out.shush

        shush pack foo.md bar.md > out.shush
  `
}
