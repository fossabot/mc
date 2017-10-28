var Database = require('better-sqlite3');

//create and setup database
function sqliteSetup(name, table_name) {
    var db = new Database(name);
    if (db.open == true) {
        db.pragma('journal_mode=WAL');
        db.pragma('synchronous=1');
        db.prepare('CREATE TABLE IF NOT EXISTS ' + table_name + ' (jobId CHAR(25),status INT,target CHAR(25))').run();
        console.log('Connection with database opened')
        return db;
    }
}

function getJobList(database, shouldUpdate) {
    let response = [],
        Jobs = {
            active: [],
            cancelled: [],
            completed: []
        }
    if (shouldUpdate) {
        response = database.prepare('SELECT jobId,status,target FROM _master_').all();
        response.forEach((e, i) => {
            if (e.status == 0) {
                database.prepare('UPDATE _master_ SET status=? WHERE jobId=?').run(1, e.jobId);
            }
        });
    }

    response = database.prepare('SELECT jobId,status,target FROM _master_').all();
    response.forEach((e, i) => {
        if (e.status == 1) {
            Jobs.cancelled.push({
                'jobId': e.jobId,
                'target': e.target
            })
        }
        if (e.status == 2) {
            Jobs.completed.push({
                'jobId': e.jobId,
                'target': e.target
            })
        }
    })

    return Jobs

}


function getFieldList(database, table_name) {
    let fields = {
        quotes: {
            standalone: {
                fieldList: []
            },
            consolidated: {
                fieldList: []
            }
        },
        balancesheet: {
            standalone: {
                yearList: [],
                fieldList: []
            },
            consolidated: {
                yearList: [],
                fieldList: []
            }
        },
        profitloss: {
            standalone: {
                yearList: [],
                fieldList: []
            },
            consolidated: {
                yearList: [],
                fieldList: []
            }
        },
        quarterlyresults: {
            standalone: {
                yearList: [],
                fieldList: []
            },
            consolidated: {
                yearList: [],
                fieldList: []
            }
        },
        cashflow: {
            standalone: {
                yearList: [],
                fieldList: []
            },
            consolidated: {
                yearList: [],
                fieldList: []
            }
        }
    }
    let response = database.prepare('SELECT type,name FROM ' + table_name + '_fields').all();
    response.forEach((e) => {
        if (e.type == 'quotes_standalone_fields') {
            fields.quotes.standalone.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'quotes_consolidated_fields') {
            fields.quotes.consolidated.fieldList.push({
                value: e.name,
                label: e.name
            });
        }

        if (e.type == 'balancesheet_standalone_fields') {
            fields.balancesheet.standalone.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'balancesheet_standalone_year') {
            fields.balancesheet.standalone.yearList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'balancesheet_consolidated_fields') {
            fields.balancesheet.consolidated.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'balancesheet_consolidated_year') {
            fields.balancesheet.consolidated.yearList.push({
                value: e.name,
                label: e.name
            });
        }

        if (e.type == 'profitloss_standalone_fields') {
            fields.profitloss.standalone.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'profitloss_standalone_year') {
            fields.profitloss.standalone.yearList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'profitloss_consolidated_fields') {
            fields.profitloss.consolidated.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'profitloss_consolidated_year') {
            fields.profitloss.consolidated.yearList.push({
                value: e.name,
                label: e.name
            });
        }

        if (e.type == 'quarterlyresults_standalone_fields') {
            fields.quarterlyresults.standalone.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'quarterlyresults_standalone_year') {
            fields.quarterlyresults.standalone.yearList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'quarterlyresults_consolidated_fields') {
            fields.quarterlyresults.consolidated.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'quarterlyresults_consolidated_year') {
            fields.quarterlyresults.consolidated.yearList.push({
                value: e.name,
                label: e.name
            });
        }

        if (e.type == 'cashflow_standalone_fields') {
            fields.cashflow.standalone.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'cashflow_standalone_year') {
            fields.cashflow.standalone.yearList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'cashflow_consolidated_fields') {
            fields.cashflow.consolidated.fieldList.push({
                value: e.name,
                label: e.name
            });
        }
        if (e.type == 'cashflow_consolidated_year') {
            fields.cashflow.consolidated.yearList.push({
                value: e.name,
                label: e.name
            });
        }
    })
    return fields;
}

module.exports = {
    sqliteSetup: sqliteSetup,
    getFieldList: getFieldList,
    getJobList: getJobList
}