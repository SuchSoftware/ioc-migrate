'use strict'

module.exports = getAppAdapter

function getAppAdapter(migrateConfigPath) {
  var appAdapter

  try {
    appAdapter = require(migrateConfigPath)()
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      if (e.toString().indexOf(migrateConfigPath) >= 0) {
        console.error('OOPS! Your migrate config file could not be found at: %s', migrateConfigPath)
      } else {
        console.error('Your config file seems to be requiring a file that does not exist. %s', e.toString())
      }
    } else {
      throw e
    }

    process.exit(1)
  }

  return appAdapter
}
