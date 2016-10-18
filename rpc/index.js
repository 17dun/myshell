'use strict'

const rp = require('request-promise');

const apiBase = 'http://phi.baidu.com:9001/api/';

function getSuitList(){
    return new Promise(function(resolve, reject){
        var options = {
            uri: apiBase+'addon/list',
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true
        };
        resolve(11);
        rp(options).then(function(res){
            resolve(res);
        }).catch(function(e){
            reject(e);
        })
    })
}

module.exports = {
    getSuitList: getSuitList
}