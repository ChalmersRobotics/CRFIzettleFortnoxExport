const XLSX = require("xlsx");
const prompt = require('prompt');


class Imports {
  constructor(bookshelf) {
    this.bookshelf = bookshelf;
  }

  importStatement(statementFile) {
    let dateColumn = 'A';
    let receiptColumn = 'C';
    let typeColumn = 'D';
    let priceColumn = 'E';
    let startRow = 2;
    let transactionDao = this.bookshelf.model("Transaction");
    let statementDao = this.bookshelf.model("Statement");

    let paymentType = "Utbetalning till bankkonto";
    let feeType = "Avgift";

    let statementBook = XLSX.readFile(statementFile);
    let statement = statementBook.Sheets[statementBook.SheetNames[0]];

    let currentPaymentRow = -1;

    let promises = [];

    let receiptNumbers = [];


    for (let row = startRow; statement[dateColumn + row]; row++) {
      promises.push(new Promise((resolve, reject) => {

        // iZettle apparently cannot guarantee chronological order of receipt
        // numbers in the statement
        try {
          receiptNumbers.push(statement[receiptColumn + (row )].v);
        } catch (e) {
          // Row that is not a receipt number
        }

        if (statement[typeColumn + row].v === paymentType) {
          if (currentPaymentRow !== -1) {
            let receiptFrom = Math.min(...receiptNumbers);
            let receiptTo = Math.max(...receiptNumbers);
            let price = statement[priceColumn + (currentPaymentRow)].v;
            let date = statement[dateColumn + (currentPaymentRow)].w;

            receiptNumbers = [];

            let statementObj = {
              receiptIdFrom: receiptFrom,
              receiptIdTo: receiptTo,
              date: date,
              price: price * 100
            };

            statementDao.forge(statementObj)
            .fetch()
            .then((res) => {
              console.log("Statement " + res.attributes.receiptIdFrom
                  + " already imported")
              resolve();
            })
            .catch((err) => {
              statementDao.forge(statementObj)
              .save()
              .then((res) => {
                console.log(
                    "Statement " + res.attributes.receiptIdFrom + " saved")
                resolve();
              })
              .catch((err) => {
                console.log("Statement couldn't be saved");
                reject(err);
              });
            });
          }
          
          currentPaymentRow = row;

          // reset now that we found first payment, so we discard the receipts that have not yet been paid
          receiptNumbers = [];

          resolve();
        } else if (statement[typeColumn + row].v === feeType) {
          let transaction = {
            receiptId: statement[receiptColumn + row].v,
            name: "Avgift",
            price: statement[priceColumn + row].v * 100
          };

          transactionDao.forge(transaction)
          .fetch()
          .then((res) => {
            console.log("Fee transaction " + res.attributes.receiptId
                + " already imported")
            resolve();
          })
          .catch((err) => {
            transactionDao.forge(transaction)
            .save()
            .then((res) => {
              console.log(
                  "Fee transaction " + res.attributes.receiptId + " saved");
              resolve();
            })
            .catch((err) => {
              console.log("Fee transaction couldn't be saved");
              reject(err);
            });
          });
        } else {
          resolve();
        }
      }));
    }

    return Promise.all(promises);
  }

  importTransactions(transactionsFile) {
    let dateColumn = 'A';
    let receiptColumn = 'D';
    let priceColumn = 'K';
    let nameColumn = 'E';
    let startRow = 7;
    let transactionDao = this.bookshelf.model("Transaction");
    let promises = [];

    let transactionBook = XLSX.readFile(transactionsFile);
    let transactions = transactionBook.Sheets[transactionBook.SheetNames[0]];

    for (let row = startRow; transactions[dateColumn + row]; row++) {
      promises.push(new Promise((resolve, reject) => {
        let name = "Custom";

        try {
          name = transactions[nameColumn + row].v;
        } catch (e) {
          // Custom transaction with no name, why?!?!?
        }

        let transaction = {
          receiptId: transactions[receiptColumn + row].v,
          name: name,
          price: transactions[priceColumn + row].v * 100
        };

        transactionDao.forge(transaction)
        .fetch()
        .then((res) => {
          console.log(
              "Transaction " + res.attributes.receiptId + " already imported")
          resolve();
        })
        .catch((err) => {
          transactionDao.forge(transaction)
          .save()
          .then((res) => {
            console.log("Transaction " + res.attributes.receiptId + " saved");
            resolve();
          })
          .catch((err) => {
            console.log("Transaction couldn't be saved");
            reject(err);
          });
        });
      }));
    }

    return Promise.all(promises);
  }

  async importReceipts(receiptsFile) {
    let receiptNoColumn = "C";
    let paymentTypeColumn = "H";
    let lastFourColumn = "J";
    let totalColumn = "E";
    let startRow = 18;
    let receiptDao = this.bookshelf.model("Receipt");
    let promises = [];

    let receiptBook = XLSX.readFile(receiptsFile);
    let receipts = receiptBook.Sheets[receiptBook.SheetNames[0]];

    for (let row = startRow; receipts[receiptNoColumn + row]; row++) {
      promises.push(new Promise(async (resolve, reject) =>  {

        if ( receipts[lastFourColumn + row].v != "") {
          resolve();
          return;
        }

        let price = 0;

        if ( receipts[paymentTypeColumn + row].v != "Presentkort" && receipts[lastFourColumn + row].v == "") {
          price = (await prompt.get(
            {
              name: "price",
              description: "Enter gift card amount used for receipt " + receipts[receiptNoColumn + row].v
            }
            
            )).price;
        } else {
          price = (receipts[totalColumn + row].v + "").replace(" kr", "");
        }

        price *= 100;

        let giftcardReceipt = {
          receiptId: receipts[receiptNoColumn + row].v,
          price: price
        }

        receiptDao.forge(giftcardReceipt)
        .fetch()
        .then((res) => {
          console.log(
              "Receipt " + res.attributes.receiptId + " already imported")
          resolve();
        }).catch((err) => {
          receiptDao.forge(giftcardReceipt)
          .save()
          .then((res) => {
            console.log("Giftcard receipt " + res.attributes.receiptId + " saved");
            resolve();
          })
          .catch((err) => {
            console.log("Giftcard receipt couldn't be saved");
            reject(err);
          });
        });
    
      }));
    }

    return Promise.all(promises);
  }
}

module.exports = Imports;
