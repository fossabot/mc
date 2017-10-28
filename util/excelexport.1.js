var Excel = require('exceljs');

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


async function getCompanyData(table_name, database, limit) {
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



async function prepareColumns(sheet, field) {
    fieldProp = []

    //add basic fields
    fieldProp.push({
        header: 'Name',
        key: 'Name',
        width: 40
    })
    fieldProp.push({
        header: 'Price',
        key: 'bsePrice'
    })
    fieldProp.push({
        header: 'Price',
        key: 'nsePrice'
    })

    //add quote fields
    field.quote.qfs.forEach((e) => {
        fieldProp.push({
            header: e,
            key: e
        })
    })
    field.quote.qfc.forEach((e) => {
        fieldProp.push({
            header: e,
            key: e
        })
        //add balancesheet fields
    })


    addHeaders('balancesheet', 'standalone', field);
    addHeaders('balancesheet', 'consolidated', field);
    addHeaders('profitloss', 'standalone', field);
    addHeaders('profitloss', 'consolidated', field);
    addHeaders('quarterlyresults', 'standalone', field);
    addHeaders('quarterlyresults', 'consolidated', field);
    addHeaders('cashflow', 'standalone', field);
    addHeaders('cashflow', 'consolidated', field);

    sheet.columns = fieldProp;
    rowone = ['Company', 'BSE', 'NSE']




    //sheet.spliceRows(1, 0, rowone)
    /*sheet.getRow(1).font = style.fieldName.font;
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'c0c0c0'
        },
        bgColor: {
            argb: 'c0c0c0'
        }
    }*/

    sheet.getRow(1).font = style.fieldName.font;
    sheet.getRow(1).eachCell((c, n) => {
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
                                    var val = parseFloat(e[k][yi]);
                                    if (isNaN(val)) {
                                        val = 0
                                    }
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


async function fillRow(data, cols, sheet, field) {
    let d = JSON.parse(data.data)
    let ob = {};
    ob['Name'] = d.basic.companyName;
    ob['bsePrice'] = d.basic.price.bse;
    ob['nsePrice'] = d.basic.price.nse;


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
                    size: 8
                },
                alignment: {
                    horizontal: 'left'
                }
            }
        }

    })
    tempRow.commit()

    /* sheet.getRow(sheet.rowCount).font = {
         name: 'Calibri',
         size: 8
     }



     sheet.getRow(2).eachCell((c, n) => {
         if (c.value == 'Year') {
             sheet.getRow(sheet.rowCount).getCell(n).fill = {
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
     })*/




}


async function excelexport(payload, db, jobId, Emitter) {
    var options = {
        filename: './streamed-workbook.xlsx',
        useStyles: true,
        useSharedStrings: true
    };
    var workbook = new Excel.stream.xlsx.WorkbookWriter(options)
    var sheet = workbook.addWorksheet('Sheet', {
        views: [{
            width: 20,
            state: 'frozen',
            xSplit: 1,
            ySplit: 1
        }]
    });


    

    /*sheet.views = [{
        state: 'frozen',
        xSplit: 1,
        ySplit: 1
    }];*/


    let cols = await prepareColumns(sheet, payload)

    let r = await getCompanyData(jobId, db, 2000);
    let last = 0;
   

    r.forEach((row, i) => {
        fillRow(row, cols, sheet, payload)
        
    })


    var run = new Worker(function(row,cols,sheet,payload,r,fillRow) {
        
        this.onmessage = function(event) {
            postMessage('Hi ' + event.data);
            self.close();
          };
      });

      run.onmessage = function (event) {
        console.log('progress = ' + event.data);
      };

    
      





    workbook.commit().then(console.log("saved"))

    /*  workbook.xlsx.writeFile('./excel.xlsx').then(() => {
          console.log('excel export complete');
      })*/


}


/*async function excelexport() {
    var options = {
        filename: './streamed-workbook.xlsx',
        useStyles: true,
        useSharedStrings: true
    };
    var workbook = new Excel.Workbook();

    workbook.addWorksheet('My Sheet');

    worksheet = workbook.getWorksheet('My Sheet')

    worksheet.addRow([1, 2, 3]);
    worksheet.addRow([4, 5, 6]);

    console.log(worksheet)
    var newRowValues = [1, 2, 3, 4, 5];
    worksheet.spliceRows(1, 1, newRowValues);

    workbook.commit()
}*/


module.exports = excelexport