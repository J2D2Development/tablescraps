'use strict';

//pass a url and get back data within table rows from the page.  UNDER CONSTRUCTION
/*
0) before stripping whitespace, need to split into column data (right now, each element in the array is all text from every row of the table- not super useful).  Instead, add a 'tableCol' bool flag set to true if <td and not </td> and push to string- then push to intermediate array.  When </tr> is reached, push intermediate array to final array and clear to start over.
1) each row should be an object?  could be easier for search/data manip?
    or maybe just get the data to json then export using json2csv lib?

test using: http://www.tradingeconomics.com/country-list/personal-income-tax-rate
-we want to be able to get all data from a <table> element and then sort or export to csv
*/

const fs = require('fs');
const http = require('http');
const submittedUrl = process.argv[2].split('\\');
const submittedHost = submittedUrl[0];
const submittedPath = '/' + submittedUrl.slice(1).join('/');

const scrapr = (host, path) => {
    http.get({ host,  path }, 
        response => {
            let dataDump = '';
            response.on('data', d => {
                dataDump += d;
            });
            response.on('end', () => {
                if(response.statusCode === 200) {
                    const date = new Date().getTime();
                    let final = [];
                    let str = '', start = false;
                    for(let i = 0, l = dataDump.length; i < l; i += 1) {
                        if(dataDump.slice(i, i + 3) === '<tr') {
                            start = true;
                        }
                        if(dataDump.slice(i, i + 5) === '</tr>') {
                            start = false;
                        }

                        if(start) {
                            str += dataDump[i];
                        } else {
                            final.push(str.replace(/(<([^>]+)>)/gi, '').replace(/\s+/g, ',').split(','));
                            str = '';
                        }
                    }

                    const finalData = JSON.stringify(final.filter(ele => ele.length > 1));
                    fs.writeFile(`./${date}-${host}.json`, finalData);
                } else if(response.statusCode === 301) {
                    const newUrlArray = dataDump.toLowerCase().split('href')[1].split('"')[1].split('/').slice(2);
                    scrapr(newUrlArray[0], '/' + newUrlArray.slice(1).join('/'));
                } else {
                    console.log('unhandled code:', response.statusCode);
                }
            });
        });
    };

scrapr(submittedHost, submittedPath);