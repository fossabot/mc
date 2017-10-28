var Excel = require('exceljs');
const database = require('./database.js');
var db = database.sqliteSetup('scraper.sqlite3', '_master_');


var style = {
    year: {
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: 'c0c0c0'
            },
            bgColor: {
                argb: 'c0c0c0'
            }
        },
        font: {
            name: 'Calibri',
            bold: true,
            size: 8
        }
    },
    fieldName: {
        fill: {
            type: 'none'
        },
        font: {
            name: 'Calibri',
            bold: true,
            size: 8
        }

    }
}


function getCompanyData(table_name, database, limit) {
    let response = database.prepare('SELECT name,data FROM ' + table_name + '_company_data LIMIT ' + limit).all();
    return response;
}

function addHeaders(cat, type, field) {
    field[cat][type].year.forEach((year) => {
        fieldProp.push({
            header: 'Year',
            key: year + '_year_' + cat + '_' + type
        });

        field[cat][type].field.forEach((e) => {
            fieldProp.push({
                header: e,
                key: e + '_' + year + '_' + cat + '_' + type
            });
        })

    });
}



function prepareColumns(sheet, field) {
    fieldProp = []
    sectionMarker = []
    let rowone = ['Company', 'BSE', 'NSE']



    //add basic fields
    fieldProp.push({
        header: 'Name',
        key: 'Name',
        width: 40
    })
    sectionMarker.push({
        id: 'Company',
        location: 1
    })
    fieldProp.push({
        header: 'Price',
        key: 'bsePrice'
    })
    sectionMarker.push({
        id: 'BSE',
        location: 2
    })

    fieldProp.push({
        header: 'Price',
        key: 'nsePrice'
    })
    sectionMarker.push({
        id: 'NSE',
        location: 3
    })

    //add quote fields
    sectionMarker.push({
        id: 'QUOTES (Standalone)',
        location: 4
    })
    field.quote.qfs.forEach((e) => {
        fieldProp.push({
            header: e,
            key: e + '_qfs'
        })
    })
    sectionMarker.push({
        id: 'QUOTES (Consolidated)',
        location: fieldProp.length + 1
    })
    field.quote.qfc.forEach((e) => {
        fieldProp.push({
            header: e,
            key: e + '_qfc'
        })

    })

    sectionMarker.push({
        id: 'BALANCESHEET (Standalone)',
        location: fieldProp.length + 1
    })
    addHeaders('balancesheet', 'standalone', field);
    sectionMarker.push({
        id: 'BALANCESHEET (Consolidated)',
        location: fieldProp.length + 1
    })
    addHeaders('balancesheet', 'consolidated', field);
    sectionMarker.push({
        id: 'PROFITLOSS (Standalone)',
        location: fieldProp.length + 1
    })
    addHeaders('profitloss', 'standalone', field);
    sectionMarker.push({
        id: 'PROFITLOSS (Consolidated)',
        location: fieldProp.length + 1
    })
    addHeaders('profitloss', 'consolidated', field);
    sectionMarker.push({
        id: 'QUARTERLY RESULTS (Standalone)',
        location: fieldProp.length + 1
    })
    addHeaders('quarterlyresults', 'standalone', field);
    sectionMarker.push({
        id: 'QUARTERLY RESULTS (Consolidated)',
        location: fieldProp.length + 1
    })
    addHeaders('quarterlyresults', 'consolidated', field);
    sectionMarker.push({
        id: 'CASHFLOW (Standalone)',
        location: fieldProp.length + 1
    })
    addHeaders('cashflow', 'standalone', field);
    sectionMarker.push({
        id: 'CASHFLOW (Consolidated)',
        location: fieldProp.length + 1
    })
    addHeaders('cashflow', 'consolidated', field);

    sheet.columns = fieldProp;
    sheet.getRow(1).hidden = true;


    let topHeaderRow = []
    sectionMarker.forEach((e) => {
        topHeaderRow[e.location] = e.id
    })
    sheet.addRow(topHeaderRow)
    sheet.getRow(2).style = {
        font: style.fieldName.font,
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: 'c0c0c0'
            },
            bgColor: {
                argb: 'c0c0c0'
            }
        }
    }


    let bottomHeaderRow = [];
    fieldProp.forEach((e) => {
        bottomHeaderRow.push(e.header)
    })
    sheet.addRow(bottomHeaderRow)

    sheet.getRow(3).font = style.fieldName.font;
    sheet.getRow(3).eachCell((c, n) => {
        if (c.value == 'Year') {
            c.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: 'c0c0c0'
                },
                bgColor: {
                    argb: 'c0c0c0'
                }
            }
        }
    })


    return fieldProp;

}



function populateRowSection(data, cols, field, camelCat, cat, type) {
    let ob = {};
    data[camelCat][type].forEach((pg) => {
        pg.year.forEach((e, i) => {
            field[cat][type].year.forEach((year) => {
                yi = 0;
                if (e == year) {
                    yi = i;
                    ob[year + '_year_' + cat + '_' + type] = year;
                    pg.data.forEach((e, index) => {
                            field[cat][type].field.forEach((k) => {
                                if (e[k]) {
                                    var val = e[k][yi];
                                    ob[k + '_' + year + '_' + cat + '_' + type] = val;
                                }
                            })
                        }

                    )
                }
            })

        })

    })
    return ob;
}


function fillRow(data, cols, sheet, field) {
    let d = JSON.parse(data.data)
    let ob = {};
    ob['Name'] = d.basic.companyName;
    ob['bsePrice'] = d.basic.price.bse || 0;
    ob['nsePrice'] = d.basic.price.nse || 0;



    d.quote.standalone.header.forEach((h, i) => {
        field.quote.qfs.forEach((k) => {
            if (h == k) {
                ob[k + '_qfs'] = d.quote.standalone.value[i]
            }
        })
    })

    d.quote.consolidated.header.forEach((h, i) => {
        field.quote.qfc.forEach((k) => {
            if (h == k) {
                ob[k + '_qfc'] = d.quote.consolidated.value[i]
            }
        })
    })


    prsbs = populateRowSection(d, cols, field, 'balanceSheet', 'balancesheet', 'standalone')
    prsbc = populateRowSection(d, cols, field, 'balanceSheet', 'balancesheet', 'consolidated')
    prsps = populateRowSection(d, cols, field, 'profitLoss', 'profitloss', 'standalone')
    prspc = populateRowSection(d, cols, field, 'profitLoss', 'profitloss', 'consolidated')
    prsqs = populateRowSection(d, cols, field, 'quarterlyResults', 'quarterlyresults', 'standalone')
    prsqc = populateRowSection(d, cols, field, 'quarterlyResults', 'quarterlyresults', 'consolidated')
    prscs = populateRowSection(d, cols, field, 'cashFlow', 'cashflow', 'standalone')
    prscc = populateRowSection(d, cols, field, 'cashFlow', 'cashflow', 'consolidated')


    ob = { ...ob,
        ...prsbs,
        ...prsbc,
        ...prsps,
        ...prspc,
        ...prsqs,
        ...prsqc,
        ...prscs,
        ...prscc
    }

    cols.forEach((c) => {
        if (!ob[c.key]) {
            ob[c.key] = '-'
        }
    })


    let tempRow = sheet.addRow(ob)
    tempRow.style = {
        font: {
            size: 8
        },
        alignment: {
            horizontal: 'right'
        }
    }
    tempRow.eachCell((c, n) => {

        if (sheet.getColumn(n).header == 'Year') {
            c.style = {
                font: {
                    font: 'Calibri',
                    size: 8,
                    bold: true
                },
                alignment: {
                    horizontal: 'right'
                },
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {
                        argb: 'c0c0c0'
                    },
                    bgColor: {
                        argb: 'c0c0c0'
                    }
                }
            }
        }
        if (sheet.getColumn(n).header == 'Name') {
            c.style = {
                font: {
                    font: 'Calibri',
                    size: 8
                },
                alignment: {
                    horizontal: 'left'
                }
            }
        }

    })
    tempRow.commit()
}


function excelexport(payload, db, jobId) {

    var options = {
        filename: './' + jobId + '.xlsx',
        useStyles: true,
        useSharedStrings: true
    };
    var workbook = new Excel.stream.xlsx.WorkbookWriter(options)
    var sheet = workbook.addWorksheet('Sheet', {
        views: [{
            width: 20,
            state: 'frozen',
            xSplit: 1,
            ySplit: 3
        }]
    });

    let cols = prepareColumns(sheet, payload)

    let r = getCompanyData(jobId, db, 10000);

    let last = 0;
    process.send({
        'progress': '0%'
    })
    r.forEach((row, i) => {
        fillRow(row, cols, sheet, payload)
        p = Math.floor((i / r.length) * 100);
        if (p >= last + 5) {
            process.send({
                'progress': p + '%'
            })
            last = p
        }
    })

    process.send({
        'progress': '100%'
    })

    workbook.commit().then(console.log("saved"));
    process.removeAllListeners();
    return 0;
}


process.on('message', (msg) => {
    if (msg.cmd == 'export') {
        console.log("REQUEST RECEIVED FOR EXPORT############")
        excelexport(msg.fields, db, msg.jobId)
    }
});