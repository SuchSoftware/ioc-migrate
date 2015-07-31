'use strict'

module.exports = {
  generate: generate
}

var path = require('path')
var sprintf = require('sprintf-js').sprintf

// migrationConfig - (Object) the migration config clients specify
// migrationName - (String) name to give the migration
// log - (function) function for logging output
// fs - Node's `fs` module or something with a similar interface
// now - (Date) the current time
// cb - callback function(err)
function generate(migrationConfig, migrationName, log, fs, now, cb) {
  var filename = sprintf(
    "%d%'02d%'02d%'02d%'02d%'02d_%s.js"
  , now.getFullYear()
  , now.getMonth() + 1
  , now.getDate()
  , now.getHours()
  , now.getMinutes()
  , now.getSeconds()
  , migrationName
  )

  filename = path.join(migrationConfig.migrationsPath, filename)

  fs.writeFile(filename, getMigrationContents(), function(err) {
    cb(err, filename) 
  })
}

function getMigrationContents() {
  var content = ''
  content += "'use strict'\n" +
         '\n' +
         'exports.up = function(db, done) {\n' +
         '  done()\n' +
         '}\n' +
         '\n' +
         'exports.down = function(db, done) {\n' +
         '  done()\n' +
         '}\n'

  return content
}
