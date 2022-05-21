class InitDatabase {
    constructor(knex) {
        this.knex = knex;
    }

    createTables() {
        let that = this;

        let promises = [];

        promises.push(new Promise((resolve, reject) => {
            that.knex.schema.hasTable('transactions').then((exists) => {
                if (!exists) {
                    return that.knex.schema.createTable('transactions', (table) => {
                        table.increments('id').primary();
                        table.integer('receiptId');
                        table.string('name');
                        table.integer('price');
                    }).then(() => {
                        resolve()
                    });
                } else {
                    resolve()
                }
            });
        }));

        promises.push(new Promise((resolve, reject) => {
            that.knex.schema.hasTable('statements').then((exists) => {
                if (!exists) {
                    return that.knex.schema.createTable('statements', (table) => {
                        table.increments('id').primary();
                        table.integer('receiptIdFrom');
                        table.integer('receiptIdTo');
                        table.string('date');
                        table.integer('price');
                    }).then(() => {
                        resolve()
                    });
                } else {
                    resolve()
                }
            });
        }));

        promises.push(new Promise((resolve, reject) => {
            that.knex.schema.hasTable('receipts').then((exists) => {
                if (!exists) {
                    return that.knex.schema.createTable('receipts', (table) => {
                        table.increments('id').primary();
                        table.integer('receiptId');
                    }).then(() => {
                        resolve()
                    });
                } else {
                    resolve()
                }
            });
        }));

        return Promise.all(promises)
    }
}


module.exports = InitDatabase