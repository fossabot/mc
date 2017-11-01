var Excel = require('exceljs');
const database = require('./database.js');
var db = database.sqliteSetup('scraper.sqlite3', '_master_');

var numeral = require('numeral');

var style = {
    headerFontSize: 9,
    headerColor: 'c0c0c0',
    rowFontSize: 8,
    emptyCellChar: '-',
    firstColWidth: 40,
    otherColWidth: 12
}


function getCompanyData(table_name, database, limit) {
    let response = database.prepare('SELECT name,data FROM ' + table_name + '_company_data LIMIT ' + limit).all();
    return response;
}

function addHeaders(cat, type, field) {
    field[cat][type].year.forEach((year) => {
        fieldProp.push({
            header: 'Year',
            key: year + '_year_' + cat + '_' + type,
            width: style.otherColWidth
        });

        field[cat][type].field.forEach((e) => {
            fieldProp.push({
                header: e,
                key: e + '_' + year + '_' + cat + '_' + type,
                width: style.otherColWidth
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
        width: style.firstColWidth
    })
    sectionMarker.push({
        id: 'Company',
        location: 1
    })
    fieldProp.push({
        header: 'Price',
        key: 'bsePrice',
        width: style.otherColWidth
    })
    sectionMarker.push({
        id: 'BSE',
        location: 2
    })

    fieldProp.push({
        header: 'Price',
        key: 'nsePrice',
        width: style.otherColWidth
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
            key: e + '_qfs',
            width: style.otherColWidth
        })
    })

    sectionMarker.push({
        id: 'QUOTES (Consolidated)',
        location: fieldProp.length + 1
    })
    field.quote.qfc.forEach((e) => {
        fieldProp.push({
            header: e,
            key: e + '_qfc',
            width: style.otherColWidth
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
    sheet.getRow(2).font = {
        name: 'Calibri',
        size: style.headerFontSize,
        bold: true
    }
    sheet.getRow(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: style.headerColor
        },
        bgColor: {
            argb: style.headerColor
        }
    }



    let bottomHeaderRow = [];
    fieldProp.forEach((e) => {
        bottomHeaderRow.push(e.header)
    })
    sheet.addRow(bottomHeaderRow)
    sheet.getRow(3).font = {
        name: 'Calibri',
        size: style.headerFontSize,
        bold: true
    }

    sheet.getRow(3).eachCell((e) => {
        if (e.value == "Year") {
            e.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: style.headerColor
                },
                bgColor: {
                    argb: style.headerColor
                }
            }
        }
    })

    return fieldProp;

}

var workbook = new Excel.Workbook()
var sheet = workbook.addWorksheet('Sheet');



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
                                    var val = numeral(e[k][yi]);
                                    ob[k + '_' + year + '_' + cat + '_' + type] = val.value() || 0;
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
    ob['bsePrice'] = numeral(d.basic.price.bse).value() || 0;
    ob['nsePrice'] = numeral(d.basic.price.nse).value() || 0;



    d.quote.standalone.header.forEach((h, i) => {
        field.quote.qfs.forEach((k) => {
            if (h == k) {
                ob[k + '_qfs'] = numeral(d.quote.standalone.value[i]).value()
            }
        })
    })

    d.quote.consolidated.header.forEach((h, i) => {
        field.quote.qfc.forEach((k) => {
            if (h == k) {
                ob[k + '_qfc'] = numeral(d.quote.consolidated.value[i]).value()
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


    ob = {
        ...ob,
        ...prsbs,
        ...prsbc,
        ...prsps,
        ...prspc,
        ...prsqs,
        ...prsqc,
        ...prscs,
        ...prscc
    }

    //fill empty cells
    cols.forEach((c) => {
        if (!ob[c.key]) {
            ob[c.key] = style.emptyCellChar
        }
    })


    let tempRow = sheet.addRow(ob)
    tempRow.font = {
        font: 'Calibri',
        size: style.rowFontSize,
        bold: false
    }
    tempRow.alignment = {
        horizontal: 'right'
    }

    tempRow.eachCell((c, n) => {

        if (sheet.getColumn(n).header == 'Year') {
            c.font = {
                font: 'Calibri',
                size: style.rowFontSize,
                bold: true
            }
            c.alignment = {
                horizontal: 'left'
            }
            c.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: style.headerColor
                },
                bgColor: {
                    argb: style.headerColor
                }
            }
        }
        if (sheet.getColumn(n).header == 'Name') {
            c.font = {
                font: 'Calibri',
                size: style.rowFontSize
            }
            c.alignment = {
                horizontal: 'left'
            }
        }
    })

    tempRow.commit()
}


function excelexport(payload, db, jobId) {
    //set global style
    style.headerFontSize = payload.style.headerFontSize;
    style.headerColor = payload.style.headerColor.toString().replace('#','')
    style.rowFontSize = payload.style.rowFontSize;
    style.emptyCellChar = payload.style.emptyCellChar;
    style.firstColWidth = payload.style.firstColWidth;
    style.otherColWidth = payload.style.otherColWidth;

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

    let r = getCompanyData(jobId, db, 5000);

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