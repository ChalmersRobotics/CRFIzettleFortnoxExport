
const accounts = require("../accounts.json");

class Output {
    constructor(bookshelf) {
        this.bookshelf = bookshelf;
    }

    format(period) {
        let transactionDao = this.bookshelf.model("Transaction");
        let statementDao = this.bookshelf.model("Statement");
        let statementTable = {};

        statementDao
            .where('date', 'like', period + "%")
            .fetchAll()
            .then((statements) => {

                let promises = [];

                statements.forEach((statement) => {

                    promises.push(new Promise((resolve, reject) => {
                        transactionDao
                            .query((qb) => {
                                qb.where("receiptId", ">=", statement.attributes.receiptIdFrom)
                                    .andWhere("receiptId", "<=", statement.attributes.receiptIdTo)
                            })
                            .fetchAll()
                            .then((transactions) => {
                                let table = {};

                                transactions.forEach((transaction) => {
                                    let account = "Unknown"

                                    if (accounts.hasOwnProperty(transaction.attributes.name)) {
                                        account = accounts[transaction.attributes.name];
                                    }

                                    if (table.hasOwnProperty(account)) {
                                        table[account].price += transaction.attributes.price
                                    } else {
                                        table[account] = {
                                            price: transaction.attributes.price
                                        }
                                    }
                                })

                                statementTable[statement.attributes.date] = table;

                                resolve();
                            });
                    }));
                });

                return Promise.all(promises);
            }).then((res) => {
                console.log(statementTable);
            });

    }
}

module.exports = Output
