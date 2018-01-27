'use strict'
const path = require('path')
const fs = require('fs')
const tap = require('tap')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const {pack, unpack, secret} = require('./util/run')

const FIXTURES = path.join(__dirname, 'fixtures')
const TMP = path.join(__dirname, 'tmp')

tap.beforeEach(function (done) {
  rimraf(TMP, function (err) {
    if (err) {} // ignore, first run it wont exist
    mkdirp(TMP, done)
  })
})

tap.test('pack and unpack a file', function (t) {
  pack(FIXTURES, ['-o', path.join(TMP, 'test.tar'), 'foo.md', 'bar.md'], function (err, out, code) {
    t.error(err, out)
    t.equal(code, 0, out)

    unpack(FIXTURES, [path.join(TMP, 'test.tar'), TMP], function (err, out, code) {
      t.error(err, out)
      t.equal(code, 0, out)

      fs.readFile(path.join(FIXTURES, 'foo.md'), 'utf8', function (err, original) {
        t.error(err)

        fs.readFile(path.join(TMP, 'foo.md'), 'utf8', function (err, unpacked) {
          t.error(err)
          t.equal(original, unpacked)
          t.end()
        })
      })
    })
  })
})

tap.test('NOTCI should set a secret in a .env file', function (t) {
  var p = secret(TMP, [], function (err, out, code) {
    t.error(err)
    fs.readFile(path.join(TMP, '.env'), 'utf8', function (err, content) {
      t.error(err)
      t.equal(content, 'SHUSH_SECRET=test')
      t.end()
    })
  })
  var sent = false
  p.stderr.on('data', function (d) {
    if (!sent && d.toString().indexOf('secret:') !== -1) {
      sent = true
      p.stdin.write('test\n')
    }
  })
})
