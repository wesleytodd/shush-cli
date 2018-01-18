'use strict'
const crypto = require('crypto')
const through2 = require('through2')
const {createCipher} = require('./cipher')

module.exports = function createPackEntryStream (filename, secret) {
  var contents = []
  var hasher = crypto.createHash('sha256')

  var stream = through2.obj((d, enc, done) => {
    // Hash file contents
    hasher.update(d, enc)

    // Buffer file contents
    contents.push(d)

    done()
  }, function (done) {
    // Finish hashing
    var hash = hasher.digest('hex')

    // Create the PBKDF2 for the filename
    createCipher(secret, hash, false, (err, filenameCipher) => {
      if (err) {
        return stream.emit('error', err)
      }

      // Create the PBKDF2 for the content
      createCipher(secret, hash, true, (err, contentCipher) => {
        if (err) {
          return stream.emit('error', err)
        }

        // Bundle up encrypted contents and file
        var encryptedFilename = Buffer.concat([filenameCipher.update(filename), filenameCipher.final()])
        var encrypted = Buffer.concat([...contents.map((b) => contentCipher.update(b)), contentCipher.final()])

        // Push accumulated data downstream
        this.push({
          hash: hash,
          filename: encryptedFilename.toString('hex'),
          size: encrypted.length,
          content: encrypted
        })
        done()
      })
    })
  })

  // Pass on errors from the hasher
  hasher.on('error', (err) => {
    stream.emit('error', err)
  })

  return stream
}
