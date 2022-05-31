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

this.statement = bookshelf.model('Receipt', {
  tableName: 'receipts'
});


const InitDatabase = require('./app/InitDatabase')

const initDatabase = new InitDatabase(knex)

const Imports = require('./app/Imports')
const imports = new Imports(bookshelf);

const Output = require('./app/Output')
const output = new Output(bookshelf);

const program = require('commander')

program
  .command('import <transactions> <statement> <receipt>')
  .action(async (transactions, statement, receipt) => {

  await imports.importTransactions(transactions);
  await imports.importStatement(statement);
  await imports.importReceipts(receipt);

  console.log("Destroying");
  knex.destroy((res) => {
    console.log(res);
  });
    

});

program
  .command('export <period>')
  .action((period) => {
    output.format(period);
  });

initDatabase.createTables().then(
  () => {
    program
      .parse(process.argv)
  }
)
