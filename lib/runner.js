'use strict'

var async = require('async')
var path = require('path')

var helpers = require('./helpers')

module.exports = w

function w(fs) {
  // appAdapter - the object that contains the necessary callbacks for breathing life into this
  // migrationCommand = {
  //   direction: 'up'
  // , targetVersion: '20150101170000'
  // }
  return {
    run: run
  , commit: commit
  , createMigrationsTableIfNeeded: createMigrationsTableIfNeeded
  , doesMigrationsTableExist: doesMigrationsTableExist
  , filterMigrationsToRunList: filterMigrationsToRunList
  , getPerformedMigrations: getPerformedMigrations
  , loadMigrationFilesFromDisk: loadMigrationFilesFromDisk
  , runMigration: runMigration
  , runMigrations: runMigrations
  }

  function run(appAdapter, log, migrationCommand, cb) {
    log('Migrating %s', migrationCommand.direction)

    appAdapter.getDb(function (err, db) {
      if (err) return cb(err) 

      var afterMigration = 'up' === migrationCommand.direction ? appAdapter.insertAMigrationIntoMigrationsTable : appAdapter.deleteAMigrationFromMigrationsTable
  
      async.waterfall(
        [
          doesMigrationsTableExist(log, db, appAdapter.doesMigrationsTableExist)
        , createMigrationsTableIfNeeded(log, db, appAdapter.createMigrationsTable)
        , getPerformedMigrations(log, db, appAdapter.getPerformedMigrations)
        , loadMigrationFilesFromDisk(log, appAdapter.migrationsPath)
        , filterMigrationsToRunList(log, migrationCommand.direction, migrationCommand.targetVersion)
        , runMigrations(log, db, migrationCommand.direction, afterMigration)
        , commit(log, db, appAdapter.commit)
        ]
      , cb
      )
    })
  }
  
  function createMigrationsTableIfNeeded(log, db, create) {
    return function _createMigrationsTableIfNeeded(memo, next) {
      if (memo.migrationsTableExists) {
        log('Migrations table already exists')
  
        return process.nextTick(function () { next(null, memo) } )
      }
  
      log('Creating migrations table')
      create(db, function (err) { next(err, memo) })
    }
  }

  function doesMigrationsTableExist(log, db, checkExists) {
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

  function filterMigrationsToRunList(log, direction, targetVersion) {
    return function _filterMigrationsToRunList(memo, next) {
      var highestVersion = memo.alreadyPerformedMigrations[0] || 0
      var lowestVersion = memo.alreadyPerformedMigrations[memo.alreadyPerformedMigrations.length - 1] || 99999999999999
      var filterFunc

      if (direction === 'up') {
        filterFunc = function (m) { return m.version > highestVersion && m.version <= targetVersion} 
      } else if (direction === 'down') {
        filterFunc = function (m) { return m.version >= targetVersion && m.version >= lowestVersion } 
      } else {
        return next(new Error('Invalid migration direction'))
      }

      memo.migrationsToRun = memo.availableMigrations.filter(filterFunc)

      next(null, memo)
    }
  }
  
  function getPerformedMigrations(log, db, getMigrations) {
    return function _getPerformedMigrations(memo, next) {
      log('Retrieving already-performed migrations')
  
      getMigrations(db, function gotMigrations(err, migrations) {
        if (err) return next(err)

        migrations.sort(function (a,b) { return b - a })
  
        log('The following migrations were already executed:', migrations)
  
        memo.alreadyPerformedMigrations = migrations
  
        next(null, memo)
      })
    }
  }
  
  function loadMigrationFilesFromDisk(log, migrationsDirectory, direction) {
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

        var sortFunc = 'up' === direction ? sortForUp : sortForDown

        memo.availableMigrations = files.sort(sortFunc).map(function (file) { return helpers.filenameToMigration(file) })
        memo.availableMigrations = memo.availableMigrations.map(function (m) { m.path = path.join(migrationsDirectory, m.path); return m } )

        next(null, memo)
      })
    }
  }

  function runMigration(log, db, direction, migration, afterMigration, next) {
    process.stdout.write('Running migration ' + path.basename(migration.path) + '... ')

    var m = require(migration.path)

    m[direction](db, function ranTheMigration(err) {
      if (err) {
        console.log('\n')
        return next(err)
      }

      console.log('done.')

      log('Updating migrations table')

      afterMigration(db, migration.version, next)
    })
  }

  function runMigrations(log, db, direction, afterMigration) {
    return function _runMigrations(memo, next) {
      log('Running migrations')

      async.eachSeries(
        memo.migrationsToRun
      , function iterator(migration, next) {
          runMigration(log, db, direction, migration, afterMigration, next)
        }
      , function allDone(err) {
          return next(err, memo)
        }
      )
    }
  }

  function commit(log, db, commitChanges) {
    return function _commit(memo, next) {
      log('Committing changes')

      commitChanges(db, function (err) {
        next(err, memo)
      })
    }
  }
} 

function sortForDown(a,b) {
  return b - a
}

function sortForUp(a,b) {
  return a - b
}
