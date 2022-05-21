
const accounts = require("../accounts.json");

class Output {
    constructor(bookshelf) {
        this.bookshelf = bookshelf;
    }

    format(period) {
        let transactionDao = this.bookshelf.model("Transaction");
        let statementDao = this.bookshelf.model("Statement");
        let receiptDao = this.bookshelf.model("Receipt");

        let statementTable = {};

        statementDao
            .where('date', 'like', period + "%")
            .fetchAll()
            .then((statements) => {

                let promises = [];
                let prom = [];

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
                                statementTable[statement.attributes.date] = table;

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


                                    prom.push(new Promise((res, rej) => {
                                        receiptDao
                                        .query((qb) => {
                                            qb.where("receiptId", "=", transaction.attributes.receiptId)
                                        })
                                        .fetch()
                                        .then((receipt) => {
                                            if (table.hasOwnProperty("Presentkort Inlösen (2421)")) {
                                                table["Presentkort Inlösen (2421)"].price += transaction.attributes.price
                                            } else {
                                                table["Presentkort Inlösen (2421)"] = {
                                                    price: transaction.attributes.price
                                                }
                                            }
                                            res();
    
                                        })
                                        .catch((err) => {
                                            res();
                                        });       
                                    }));

                                });

                                Promise.all(prom).then(a => {
                                    resolve();
                                });

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
