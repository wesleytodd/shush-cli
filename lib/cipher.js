'use strict'
const crypto = require('crypto')

module.exports.createCipher = create.bind(null, 'createCipher')
module.exports.createDecipher = create.bind(null, 'createDecipher')

function createPbkdf2Key (secret, salt, strong, done) {
  var rounds = strong ? 10000 : 100
  var length = strong ? 512 : 256
  crypto.pbkdf2(secret, salt, rounds, length, 'sha256', done)
}

function create (type, secret, salt, strong, done) {
  createPbkdf2Key(secret, salt, strong, (err, key) => {
    if (err) {
      return done(err)
    }
    done(null, crypto[type]('aes-256-cbc', key))
  })
}
