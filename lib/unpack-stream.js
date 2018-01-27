'use strict'
const crypto = require('crypto')
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
    var filehash = fnp[1]

    // Create hasher and pass on errors
    var hasher = crypto.createHash('sha256')
    hasher.on('error', (err) => {
      stream.emit('error', err)
    })

    createDecipher(secret, filehash, false, (err, filenameDecipher) => {
      if (err) {
        return next(err)
      }

      // Handle decipher errors
      filenameDecipher.on('error', (err) => {
        stream.emit('error', err)
      })

      createDecipher(secret, filehash, true, (err, contentDecipher) => {
        if (err) {
          return next(err)
        }

        // Concat the stream
        var bufs = []
        pump(entryStream, contentDecipher, through2((d, enc, done) => {
          // Hash file contents
          hasher.update(d, enc)

          // Buffer file contents
          bufs.push(d)

          done()
        }), (err) => {
          if (err) {
            return stream.emit('error', err)
          }

          // Finish hashing
          var hash = hasher.digest('hex')
          if (hash !== filehash) {
            return next(new Error('File contents does not match hash.'))
          }

          var filename = Buffer.concat([
            filenameDecipher.update(Buffer.from(fnp[0], 'hex')),
            filenameDecipher.final()
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
