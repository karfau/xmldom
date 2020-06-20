/**
 * When this file is required before any tests are executed
 * _and_ the environment variable XMLDOM_COMPAT has been set to _one of the implemented values_,
 * `DOMParser.prototype.parseFromString` is wrapped by additional checks for every call.
 *
 * This can be used to test the serialization compatibility with other libraries.
 * There can be two kind of issues with compatibility:
 * 1. the other parser can not parse the input (doesn't indicate incomp.)
 * 2. the output from the other parser is different which causes an assertion in this code to fail
 *    (can indicate incomp.)
 * If you want to let the testsuite fail in case of assertions,
 * set the env variable `XMLDOM_COMPAT_ASSERT` (it just needs to be present)
 *
 * - Anything that goes wrong is written to `test-compat.$XMLDOM_COMPAT.log` to not clutter the CLI.
 * - `test/parse/big-file-performance.vows.js` will skipp all tests if _any_ XMLDOM_COMPAT is set.
 *
 * The following checks have been implemented (ported from the legacy code):
 *
 * /clone/: The xmldom object is deep cloned and both are serialized and compared
 * /lib/: checks compatibility with https://github.com/libxmljs/libxmljs (ignoring tons of whitespace)
 *        (currently 8 tests breaking when assertions throw)
 * /dom/: checks compatibility with https://www.npmjs.com/package/dom-js
 *        (currently 13 tests breaking when assertions throw)
 *
 **/
var COMPAT = process.env.XMLDOM_COMPAT || ''
var ASSERT_THROWS = 'XMLDOM_COMPAT_ASSERT' in process.env;
if (/dom/.test(COMPAT)) {
  var domjs = require('dom-js')
  COMPAT = 'dom-js'
}
if (/lib/.test(COMPAT)) {
  var libxml = require('libxmljs')
  COMPAT = 'libxmljs'
}
if (/clone/.test(COMPAT)) {
  COMPAT = 'clone'
  ASSERT_THROWS = true;
}
if (domjs || libxml) {
  var assert = require('assert')
  var fs = require('fs')
  var util = require('util')
  var XMLSerializer = require('../lib/dom-parser').XMLSerializer
  var DOMParser = require('../lib/dom-parser').DOMParser
  var logFile = fs.createWriteStream('test-compat.' + COMPAT + '.log', {flags: 'w'})

  function log () {
    logFile.write(util.format.apply(null, arguments) + '\n')
  }

  const handleErr = (err, ...input) => {
    if (!err) return
    log('INPUT', ...input)
    log('  caused', err)
    if (ASSERT_THROWS && err.code === 'ERR_ASSERTION') throw Error('not compatible');
  }

  console.log('RUNNING TESTS WITH COMPAT CHECKS for ', COMPAT)

  var oldParser = DOMParser.prototype.parseFromString

  function format (s) {
    var result = false
    try {
      if (COMPAT === 'clone') {
        result = new XMLSerializer().serializeToString(doc.cloneNode(true))
      }
      if (libxml) {
        return libxml.parseXmlString(s).toString().replace(/^\s+|\s+$/g, '').replace(/>\s+</mg, '><')
      }
      if (domjs) {
        new domjs.DomJS().parse(s, function (err, dom) {
          if (!err) result = dom.toXml()
        })
      }
    } catch (err) {
      handleErr(err, 48, s)
    }
    return result
  }

  function check (data, doc, str) {
    var compatresult = format(data)
    if (compatresult === false) {
      // error with more details is already logged in check
      return
    }
    var xmldomreplaced = str.replace(/^<\?.*?\?>\s*|<!\[CDATA\[\]\]>/g, '')
      .replace(' xmlns="http://www.w3.org/1999/xhtml"', '').replace(/>\s+</mg, '><')
    var compatreplaced = compatresult.replace(/^<\?.*?\?>\s*|<!\[CDATA\[\]\]>/g, '')
    if (xmldomreplaced !== compatreplaced) {
      try {
        assert.equal(str, compatresult, 'compatible to ' + COMPAT)
      } catch (ass) {
        log('REPLACED \nxmldom:[\n' + xmldomreplaced.substr(0, 500))
        log(']\n!==[\n' + compatreplaced.substr(0, 500) + '\n]')
        throw ass;
      }
    }
  }

  DOMParser.prototype.parseFromString = function (data, mimeType) {
    var doc = oldParser.apply(this, arguments)
    // if(!/\/x?html?\b/.test(mimeType)){
    const str = new XMLSerializer().serializeToString(doc)
    try {
      check(data, doc, str)
    } catch (err) {
      handleErr(err, 83, mimeType, '\n+++', data, '\n+++')
    }
    // }
    return doc
  }
}
