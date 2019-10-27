const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
});

const bookshelf = require('bookshelf')(knex);

this.transaction = bookshelf.model('Transaction', {
  tableName: 'transactions'
});

this.statement = bookshelf.model('Statement', {
  tableName: 'statements'
});

const InitDatabase = require('./app/InitDatabase')

const initDatabase = new InitDatabase(knex)

const Imports = require('./app/Imports')
const imports = new Imports(bookshelf);

const Output = require('./app/Output')
const output = new Output(bookshelf);

const program = require('commander')

program
  .command('import <transactions> <statement>')
  .action((transactions, statement) => {
    let promises = [];

    promises.push(imports.importTransactions(transactions));
    promises.push(imports.importStatement(statement));

    Promise.all(promises).then(
      () => {
        console.log("Destroying");
        knex.destroy((res) => {
          console.log(res);
        });
      }
    )
  });

program
  .command('export <peroid>')
  .action((period) => {
    output.format(period);
  });

initDatabase.createTables().then(
  () => {
    program
      .parse(process.argv)
  }
)
