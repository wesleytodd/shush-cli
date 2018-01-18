'use strict'
const fs = require('fs')
const path = require('path')
const readDir = require('recursive-readdir')
const parallel = require('run-parallel')

module.exports = filesToPack
function filesToPack (cwd, paths = [], done) {
  // For each file, recursivly read down
  var tasks = paths.reduce((tasks, p) => {
    // Filter out anything empty or falsy
    if (p) {
      tasks.push((_done) => {
        var relPath = path.resolve(cwd, p) || '.'
        fs.stat(relPath, (err, stats) => {
          if (err) {
            return _done(err)
          }

          // If its a directory, recurse
          if (stats.isDirectory()) {
            readDir(relPath, (err, files) => {
              if (err) {
                return _done(err)
              }
              filesToPack(cwd, files, _done)
            })
            return
          }

          // Done
          _done(null, {
            filepath: relPath,
            key: path.relative(cwd, relPath),
            stats: stats
          })
        })
      })
    }

    return tasks
  }, [])

  parallel(tasks, (err, result) => {
    if (err) {
      return done(err)
    }

    // Flatten array
    done(null, flatten(result))
  })
}

function flatten (array, result = []) {
  array.forEach((value) => {
    if (Array.isArray(value)) {
      flatten(value, result)
    } else {
      result.push(value)
    }
  })
  return result
}
