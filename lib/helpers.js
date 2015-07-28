'use strict'

module.exports = {
  filenameToMigration: filenameToMigration
}

// filenames are of the format 20120101170000_someMigration.js
function filenameToMigration(filename) {
  var splitFile = filename.split('_')

  return { path: filename, version: parseInt(splitFile[0]) }
}
