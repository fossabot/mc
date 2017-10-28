const Xray = require('x-ray');
const rp = require('request-promise');
const sizeof = require('sizeof');
const Bottleneck = require("bottleneck");
const {
    URL
} = require('url');


async function cleanFinData(obj) {
    var colWidth = obj.year.length,
        result = {
            year: obj.year,
            data: []
        };

    obj.rows.detHeader.forEach((e, i) => {
        if (e == '') {
            obj.rows.detData.splice(0, colWidth)
        } else {
            result.data.push({
                [e]: obj.rows.detData.splice(0, colWidth)
            })
        }
    })

    obj.rows.hedHeader.forEach((e, i) => {
        if (e == '') {
            obj.rows.hedData.splice(0, colWidth)
        } else {
            result.data.push({
                [e]: obj.rows.hedData.splice(0, colWidth)
            })
        }
    })
    return result;
}


async function recurseFinPage(next_page, row_pos, url_path, x) {
    var html, resp, rp_opt, obj = [];

    try {

        //check if next page is available
        while (next_page.button.length > 1) {
            rp_opt = {
                url: 'http://www.moneycontrol.com' + next_page.action,
                method: 'post',
                formData: {
                    end_year: next_page.end_year,
                    max_year: next_page.max_year,
                    nav: next_page.nav,
                    sc_did: next_page.sc_did,
                    start_year: next_page.start_year,
                    type: next_page.type
                },
                timeout: 25000
            }
            //send POST request to server (which responds with html document if successful)
            rp_opt.formData.nav = 'next'

            html = await rp(rp_opt)
            //collect data from table on the page
            resp = await x(html, {
                page: {
                    year: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) tr:nth-child(' + row_pos + ') td:not(:first-child)'],
                    rows: {
                        detHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].det'],
                        detData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td:not([colspan="1"]).det'],
                        hedHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].hed'],
                        hedData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[align="right"].hed'],
                    }
                },
                next_page: {
                    action: '#finyear_frm@action',
                    nav: '',
                    type: '#finyear_frm #type@value',
                    sc_did: '#finyear_frm #sc_did@value',
                    start_year: '#finyear_frm #start_year@value',
                    end_year: '#finyear_frm #end_year@value',
                    max_year: '#finyear_frm #max_year@value',
                    button: ['#finyear_frm a@onclick']
                }
            })


            //push result of the page to array
            obj.push(resp.page);
            next_page = resp.next_page;
            if (resp.next_page.action == null) {
                next_page.action = url_path;
            }
        }
    } catch (e) {
        return 'Error from recurse ' + e;
    }

    return obj;
}

async function crawlFinPg(link, row_pos, x) {
    var firstResponse, standaloneStore = [],
        consolidatedStore = [],
        mainStore = {
            standalone: [],
            consolidated: []
        };
    var action_link_path = new URL(link);

    //load first standalone and consolidated page and collect data
    firstResponse = await x(link, {
        standalone: {
            page: {
                year: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) tr:nth-child(' + row_pos + ') td:not(:first-child)'],
                rows: {
                    detHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].det'],
                    detData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td:not([colspan="1"]).det'],
                    hedHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].hed'],
                    hedData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[align="right"].hed'],
                }
            },
            next_page: {
                action: '#finyear_frm@action',
                val: '',
                type: '#finyear_frm #type@value',
                sc_did: '#finyear_frm #sc_did@value',
                start_year: '#finyear_frm #start_year@value',
                end_year: '#finyear_frm #end_year@value',
                max_year: '#finyear_frm #max_year@value',
                button: '#finyear_frm a@onclick'
            },

        },
        consolidated: x('#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > div > ul > li:nth-child(2) > a@href', {
            page: {
                year: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) tr:nth-child(' + row_pos + ') td:not(:first-child)'],
                rows: {
                    detHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].det'],
                    detData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td:not([colspan="1"]).det'],
                    hedHeader: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[colspan="1"].hed'],
                    hedData: ['#mc_mainWrapper > div.PA10 > div.content.FL.PA5 > div.pcContainer > div.FL.rightCont > div:nth-child(2) > div.boxBg > div.boxBg1 > table:nth-child(3) td[align="right"].hed'],
                }
            },
            next_page: {
                action: '#finyear_frm@action',
                val: '',
                type: '#finyear_frm #type@value',
                sc_did: '#finyear_frm #sc_did@value',
                start_year: '#finyear_frm #start_year@value',
                end_year: '#finyear_frm #end_year@value',
                max_year: '#finyear_frm #max_year@value',
                button: '#finyear_frm a@onclick'
            }

        })

    })



    //check if standalone.next_page.action is empty 
    if (firstResponse.standalone.next_page.action == null) {
        firstResponse.standalone.next_page.action = action_link_path.pathname;
    }

    //check if additonal standalone page is available and collate data
    if (Object.keys(firstResponse.standalone.next_page).length && firstResponse.standalone.next_page.button != undefined) {
        standaloneStore = await recurseFinPage(firstResponse.standalone.next_page, row_pos, action_link_path.pathname, x);
        mainStore.standalone.push(firstResponse.standalone.page);
        standaloneStore.forEach((e) => {
            mainStore.standalone.push(e)
        });
    } else {
        mainStore.standalone.push(firstResponse.standalone.page);
    }
    //check if additonal consolidated page is available and collate data
    if (Object.keys(firstResponse.consolidated.next_page).length && firstResponse.consolidated.next_page.button != undefined) {
        mainStore.consolidated.push(firstResponse.consolidated.page)
        consolidatedStore = await recurseFinPage(firstResponse.consolidated.next_page, row_pos, '', x);
        consolidatedStore.forEach((e) => {
            mainStore.consolidated.push(e)
        })
    } else {
        mainStore.consolidated.push(firstResponse.consolidated.page)

    }

    //clean the collated data
    for (let i = 0; i < mainStore.standalone.length; i++) {
        let r = await cleanFinData(mainStore.standalone[i]);
        mainStore.standalone[i] = r;
    }
    for (let i = 0; i < mainStore.consolidated.length; i++) {
        let r = await cleanFinData(mainStore.consolidated[i]);
        mainStore.consolidated[i] = r;
    }

    return mainStore;
}


async function getCompanyData(companyUrl, jobId, db, ih, Emitter, p) {
    var x = Xray();
    var pageLinks, basicQuotePrice, balanceSheet, profitLoss, quarterlyResults, cashFlow;
    try {


        basicQuotePrice = await x(companyUrl, {
            companyName: '#nChrtPrc > div.b_42.PT5.PR > h1',
            price: {
                bse: '#b_prevclose > strong',
                nse: '#n_prevclose > strong'
            },
            quote: {
                standalone: {
                    header: ['#mktdet_1 .FL.gL_10.UC'],
                    value: ['#mktdet_1  .FR.gD_12']
                },
                consolidated: {
                    header: ['#mktdet_2 .FL.gL_10.UC'],
                    value: ['#mktdet_2  .FR.gD_12']
                }
            },
            finSectionUrl: '#slider > dt:nth-child(9) > a@href'
        })


        if (basicQuotePrice.finSectionUrl != null) {
            pageLinks = await x(basicQuotePrice.finSectionUrl, {
                balanceSheet: '#slider > dd:nth-child(10) > ul > li.act > a@href',
                profitLoss: '#slider > dd:nth-child(10) > ul > li:nth-child(2) > a@href',
                quarterlyResults: '#slider > dd:nth-child(10) > ul > li:nth-child(3) > a@href',
                cashFlow: '#slider > dd:nth-child(10) > ul > li:nth-child(7) > a@href'
            });


            balanceSheet = await crawlFinPg(pageLinks.balanceSheet, 1, x);
            //console.log(balanceSheet)
            //console.log('OBJECT SIZE [balanceSheet] : ' + sizeof.sizeof(balanceSheet, true));

            profitLoss = await crawlFinPg(pageLinks.profitLoss, 1, x);
            //console.log('OBJECT SIZE [profitLoss] : ' + sizeof.sizeof(profitLoss, true));

            quarterlyResults = await crawlFinPg(pageLinks.quarterlyResults, 3, x);
            // console.log(quarterlyResults)
            //console.log('OBJECT SIZE [quarterlyResults] : ' + sizeof.sizeof(quarterlyResults, true));

            cashFlow = await crawlFinPg(pageLinks.cashFlow, 1, x);
            //console.log(cashFlow)
            //console.log('OBJECT SIZE [cashFlow] : ' + sizeof.sizeof(cashFlow, true));


            /* extract unique fields from quotes data */
            basicQuotePrice.quote.standalone.header.forEach((e) => {
                let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(e, 'quotes_standalone_fields')
                if (!l) {
                    db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, 'quotes_standalone_fields', e);
                }
            });

            basicQuotePrice.quote.consolidated.header.forEach((e) => {
                let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(e, 'quotes_consolidated_fields')
                if (!l) {
                    db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, 'quotes_consolidated_fields', e);
                }
            });

            await extractUniqueFields(db, balanceSheet, jobId, 'balancesheet');
            await extractUniqueFields(db, profitLoss, jobId, 'profitloss');
            await extractUniqueFields(db, quarterlyResults, jobId, 'quarterlyresults');
            await extractUniqueFields(db, cashFlow, jobId, 'cashflow');



            payload = {
                basic: {
                    companyName: basicQuotePrice.companyName,
                    price: basicQuotePrice.price
                },
                quote: basicQuotePrice.quote,
                balanceSheet: balanceSheet,
                profitLoss: profitLoss,
                quarterlyResults: quarterlyResults,
                cashFlow: cashFlow,
            }

            db.prepare('INSERT INTO ' + jobId + '_company_data ' + 'VALUES(?,?,?)').run(ih, basicQuotePrice.companyName, JSON.stringify(payload));

            console.log('Company data retreived for Job :' + ih + ' Company Name:' + basicQuotePrice.companyName + ' Size:' + sizeof.sizeof(payload, true));
            Emitter.emit('jobProgress', {
                'jobId': jobId,
                'mro': 'Retrieval for ' + basicQuotePrice.companyName + ' completed',
                'progress': Math.floor(((p.tot - p.l.nbQueued()) / p.tot) * 100) + '%'
            });
        }
    } catch (e) {
        console.log('error occured while retreival ' + basicQuotePrice.companyName || 'unknown' + e)
        return 1;
    }

}


async function extractUniqueFields(db, data, jobId, type) {
    data.standalone.forEach((e) => {
        e.year.forEach((y) => {
            if (y != null) {
                let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(y, type + '_standalone_year')
                if (!l) {
                    db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, type + '_standalone_year', y);
                }
            }

        });
        e.data.forEach((f) => {
            let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(Object.keys(f)[0], type + '_standalone_fields')
            if (!l) {
                db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, type + '_standalone_fields', Object.keys(f)[0]);
            }
        });
    });

    data.consolidated.forEach((e) => {
        e.year.forEach((y) => {
            if (y != null) {
                let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(y, type + '_consolidated_year')
                if (!l) {
                    db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, type + '_consolidated_year', y);
                }
            }

        });
        e.data.forEach((f) => {
            let l = db.prepare('SELECT name FROM ' + jobId + '_fields WHERE name=? AND type=?').get(Object.keys(f)[0], type + '_consolidated_fields')
            if (!l) {
                db.prepare('INSERT INTO ' + jobId + '_fields ' + 'VALUES(?,?,?)').run(0, type + '_consolidated_fields', Object.keys(f)[0]);
            }
        });
    });

}



async function getCompanyList(type, filter) {
    const x = new Xray();
    /*categories = await x('http://www.moneycontrol.com/india/stockpricequote/', {
        name: ['#mc_mainWrapper > div.PA10 > div.FL > div.PT15 > div.MT2.PA10.brdb4px.alph_pagn > a'],
        links: ['#mc_mainWrapper > div.PA10 > div.FL > div.PT15 > div.MT2.PA10.brdb4px.alph_pagn > a@href']
    });*/

    let link = await x('http://www.moneycontrol.com/india/stockpricequote/A', {
        l: ['.pcq_tbl.MT10 a@href']
    })
    return link.l;
}


/*Params 
[jobDescriptor] = {
    jobId - string
    rateLimiter - { }
    scope -{type :  all | alphabet | others, filter:[]}
}
[DB] - SQLITE instance
[Event Emitter] - Event Emitter Instance
*/
async function run(jD, db, Emitter) {

    let limiter = new Bottleneck(jD.concurrentSU, null, null, null,false)
        companyList = [];
    var isTerminated = false;

    //create and setup required tables [jobid_fields,jobid_company_repo,jobid_company_data] for new job
    db.prepare('CREATE TABLE IF NOT EXISTS ' + jD.jobId + '_company_repo ' + '(id INT,name CHAR(1000),status INT)').run();
    db.prepare('CREATE TABLE IF NOT EXISTS ' + jD.jobId + '_company_data ' + '(id INT,name CHAR(1000),data CHAR(500000))').run();
    db.prepare('CREATE TABLE IF NOT EXISTS ' + jD.jobId + '_fields ' + '(id INT,type CHAR(100),name CHAR(200))').run();


    //get company list , store it into db table 
    companyList = await getCompanyList();



    //insert list of companies into company_repo table
    if (companyList != undefined || companyList != null) {
        for (var i = 0; i < companyList.length; i++) {
            db.prepare('INSERT INTO ' + jD.jobId + '_company_repo ' + 'VALUES(?,?,?)').run(i, companyList[i], 0);
        }
        db.prepare('INSERT INTO _master_ VALUES(?,?,?)').run(jD.jobId, 0, "moneycontrol");
        Emitter.emit('jobCreated', {
            'jobId': jD.jobId
        })
        Emitter.emit('jobProgress', {
            'jobId': jD.jobId,
            'message': 'Target company list created'
        })

        console.log('SQlite tables prepared.');
    }

    //schedule scraping or add tasks to bottleneck queue
    for (var i = 0; i <= companyList.length; i++) {
        limiter.schedule(getCompanyData, companyList[i], jD.jobId, db, i, Emitter, {
            tot: companyList.length,
            l: limiter
        });
    }

  

    Emitter.emit('jobProgress', {
        'jobId': jD.jobId,
        'mro': 'Scheduler started',
        'progress': '0%'
    })

    limiter.on('idle', function () {
        console.log('idle mode ');
        Emitter.emit('jobProgress', {
            'jobId': jD.jobId,
            'mro': 'Termination sequence complete',
            'progress': '100%'
        });
        if (isTerminated) {
            db.prepare('UPDATE _master_ SET status=? WHERE jobId=?').run(1, jD.jobId);
        } else {
            db.prepare('UPDATE _master_ SET status=? WHERE jobId=?').run(2, jD.jobId);
        }
        Emitter.emit('jobCompletion', jD.jobId)
        limiter.removeAllListeners();
    })



    Emitter.once('terminate_' + jD.jobId, () => {
        console.log("terminated " + jD.jobId);
        limiter.stopAll(true);
        isTerminated = true;
        Emitter.emit('jobProgress', {
            'jobId': jD.jobId,
            'mro': 'Termination sequence started'
        })
    })

}


// export the module
module.exports = run
