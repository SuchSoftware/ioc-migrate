'use strict'

var fakeFs = {
  writeFile: function writeFile(filename, data, cb) {
    process.nextTick(cb) 
  }
}

var generator = require('../lib/generator')

require('./testHelper')(function(assert) {
  describe('Generator:', function () {
    it('should generate the correct filename', function(done) {
      var now = new Date('2012-01-01 17:00:00')  
  
      var migrateConfig = {
        migrationsPath: 'foo'
      }
  
      function noop() {}
  
      generator.generate(migrateConfig, 'testMigration', noop, fakeFs, now, function(err, filename) {
        assert.ifError(err) 
  
        assert.equal(filename, 'foo/20120101170000_testMigration.js')
        done()
      })
    })
  })
})
