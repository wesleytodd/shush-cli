'use strict'
const through2 = require('through2')
const tar = require('tar-stream')
const pump = require('pump')
const {createDecipher} = require('./cipher')

module.exports = function createUnpackStream (secret, onEntry) {
  // Create the tar extractor
  var extract = tar.extract()

  // The transform stream
  var stream = through2.obj((d, enc, done) => {
    extract.write(d, enc, done)
  })

  // On extract entry
  extract.on('entry', (header, entryStream, next) => {
    // Pull apart filename
    var fnp = header.name.split('.')

    createDecipher(secret, fnp[1], false, (err, filenameDeciper) => {
      if (err) {
        return next(err)
      }

      createDecipher(secret, fnp[1], true, (err, contentDeciper) => {
        if (err) {
          return next(err)
        }

        // Concat the stream
        var bufs = []
        pump(entryStream, contentDeciper, through2((d, enc, done) => {
          bufs.push(d)
          done()
        }), (err) => {
          if (err) {
            return next(err)
          }

          var filename = Buffer.concat([
            filenameDeciper.update(Buffer.from(fnp[0], 'hex')),
            filenameDeciper.final()
          ]).toString('utf8')

          // Push to outgoing stream
          stream.push({
            name: filename,
            size: header.size,
            mode: header.mode,
            mtime: header.mtime,
            uid: header.uid,
            gid: header.gid,
            contents: Buffer.concat(bufs).toString('utf8')
          })

          // We have consumed all the entry data, continue
          next()
        })
      })
    })
  })

  return stream
}
