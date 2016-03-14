# ioc-migrate

The flow of migrations.  You supply the details.  Works for any database, be it relational, NoSQL, or whatever.

Most migration frameworks are limited by the database adapters they can provide.  If you're not running one of the popular databases, there's a good chance the existing migration tools won't have an adapter for you.

But you've built an app, and you've figured out how to work with your database.  Why should a migration layer duplicate all that effort?

Just like how Passport abstracted out the flow of user authentication leaving you to supply the details specific to your app, `ioc-migrate` does the same for managing data migrations.

## Installation

`npm install --save ioc-migrate`

## Use

To use `ioc-migrate` you define what it means to perform a few operations on your database.  You'll provide a file with a few definitions. The file looks something like this:

    module.exports = configFunction

    function configFunction() {
      return {
         // ... values we'll discuss in just a moment
      }
    }

You provide a function `ioc-migrate` will call.  That function returns an object with your app-specific details.  Here are the details you need:

```javascript
{
  getDb: function (cb) { } // A function the gets a database connection.  How does your app get a connection to its database?
, doesMigrationsTableExist: function (db, cb) { } // Given a connection to your database, how would you tell if the table/collection that keeps track of which migrations you've run exists?
, createMigrationsTable: function (db, cb) { } // Given a connection to your database, how do you create a table/collection to keep track of which migrations you've run?
, getPerformedMigrations: function (db, cb) { } // Given a connection to your databse, how do ask the table/collection that keeps track of which migrations you've run which migrations you've run?
, migrationsPath: 'path/to/your/migration/files' // where on your filesystem do you store your migration files?
, insertAMigrationIntoMigrationsTable: function (db, version, cb) { } // given a connection to your database, how would you insert into your table/collection that keeps track of which migrations you've run that you've run another one?
, deleteAMigrationFromMigrationsTable: function (db, version, cb) { } // given a connection to your database, if you had roled back a migration, how would you remove a record of that migration from your table/collection that keeps track of which migrations you've run?
}
```

You then have some directory full of migration files located at the path you specified in `migrationsPath` above.  Their filenames should be of the format:

    <some increasing number>_<some human-readable name for the file>.js

There's a command-line tool documented below that you can use to help you generate those files.  The files should set 2 functions on `exports`.  For example:

```
exports.up = function (db, cb) {

}

exports.down = function (db, cb) {

}
```

Each function receives a database connection (which your code supplied).  It then does its business and calls its callback, passing in any errors.

### The command line tools

#### The migrate tool

`ioc-migrate` provides a few command-line utilities to help you out.  Assuming you've defined your configuration file as mentioned above, you can then run your migrations using the `migrate` script found in `bin/migrate`.  For example:

    ./node_modules/ioc-migrate/bin/migrate

By default, `ioc-migrate` will look for your config file at `your/app/root/schema/iocmigrateConfig.js`. You can give it a different location via the `-c` option,  For example:

    ./node_modules/ioc-migrate/bin/migrate -c some/other/path.js

#### Generating a new migration

Coming up with filenames for your migrations could be tedious, so `ioc-migrate` ships with a command-line tool to help you do that.  To use it, run:

    ./node_modules/ioc-migrate/bin/generate humanReadableName

Note that you don't supply `.js` on the end of that human-readable name.  What you use in the place of humanReadableName becomes part of the file's name, so only use alphanumeric characters.

`generate` also accepts the same `-c` option to specify the location of your config file if you don't like the default.

#### Creating your config file

// TODO: This is not done yet

To lay down a placeholder for your config file, you can run:

    ./node_modules/ioc-migrate/bin/init

This will lay down a skeleton config file in the default location.  Again, if you prefer a different location, use the `-c` option.

## Want to contribute?

Open an issue, and let's talk about it.  We'll likely accept PRs.

## Tests

`npm test`

## License

MIT
