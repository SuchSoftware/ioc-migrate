'use strict'

var async = require('async')

module.exports = w

function w(fs) {
  // appAdapter - the object that contains the necessary callbacks for breathing life into this
  // migrationCommand = {
  //   direction: 'up'
  // , targetVersion: '20150101170000'
  // , logger: some function to output with
  // }
  return function runMigrations(appAdapter, log, migrationCommand, cb) {
    appAdapter.getDb(function (err, db) {
      if (err) return cb(err) 
  
      async.waterfall(
        [
          doesMigrationsTableExist(db, appAdapter.doesMigrationsTableExist)
        , createMigrationsTableIfNeeded(db, appAdapter.createMigrationsTable)
        , getPerformedMigrations(db, appAdapter.getPerformedMigrations)
        , loadMigrationFilesFromDisk(appAdapter.migrationsPath)
        ]
      , cb
      )
    })
  
    function createMigrationsTableIfNeeded(db, create) {
      return function _createMigrationsTableIfNeeded(memo, next) {
        if (memo.migrationsTableExists) { 
          log('Migrations table already exists')
  
          return process.nextTick(function () { next(null, memo) } )
        }
  
        log('Creating migrations table')
        create(db, function (err) { next(err, memo) })
      }
    }
    
    function doesMigrationsTableExist(db, checkExists) {
      return function _doesMigrationsTableExist(next) {
        log('Checking for migrations table')
  
        checkExists(db, function(err, tableExists) {
          if (err) return next(err)
    
          var memo = {
            migrationsTableExists: tableExists
          }
    
          next(null, memo)
        })
      }
    }
  
    function getPerformedMigrations(db, getMigrations) {
      return function _getPerformedMigrations(memo, next) {
        log('Retrieving already-performed migrations')
  
        getMigrations(db, function gotMigrations(err, migrations) {
          if (err) return next(err)
  
          log('The following migrations were already executed:', migrations)
  
          memo.alreadyPerformedMigrations = migrations.reduce(function(memo, migration) { memo[migration] = true; return memo }, {})
  
          next(null, memo)
        })
      }
    }
  
    function loadMigrationFilesFromDisk(migrationsDirectory) {
      return function _loadMigrationFilesFromDisk(memo, next) {
        log('Loading migration files from disk')

        fs.readdir(migrationsDirectory, function readFiles(err, files) {
          if (err) {
            if (err.code === 'ENOENT') {
              console.error('OOPS! Your migrationsPath does not exist: %s', err.path)
              process.exit(1)
            } else {
              return next(err)
            }
          }

          process.exit(0)
        })
      }
    }
  }
} 
