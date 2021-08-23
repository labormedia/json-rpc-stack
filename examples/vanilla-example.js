import { WebSocket } from 'ws';
import StackImplementation from '../lib/stack-implementation.js';
import { config as Dotenv_Config } from 'dotenv';
import dotenv_expand from 'dotenv-expand';
dotenv_expand(Dotenv_Config());

// var wsConnection;
var wsTries = 5;
var timeout = 1000;
const limit = 1000;
var wsSessionID;
const user = process.env.WEB3_USERNAME; // username
const password = process.env.WEB3_PASSWORD; // password
const web3_type = process.env.WEB3_TYPE; // wss:// or ws://
const provider = process.env.WEB3_PROVIDER // provider's @url (AT URL)
const url = web3_type+user+':'+password+provider;
const init_message = JSON.stringify({
    "jsonrpc": "2.0",
    "method": "eth_newBlockFilter",
    "params": [],
    "id": 0
})

initWS(url, init_message); // initialize implementation

function initWS(url, initMessage){

    const stack = new StackImplementation([], limit);
    console.log('tries', wsTries);
    if (wsTries <= 0){
        console.error('unable to estabilish WS after 5 tries!');
        wsConnection = null;
        wsTries = 5;
        return;
    }
    let wsConnection = new WebSocket(url);
    
    wsConnection.onopen = function () {
        wsConnection.send(initMessage);
    };

    // Log errors
    wsConnection.onerror = function (error) {
        wsTries--;
        console.error('WebSocket Error ', error);
    };

    // Log messages from the server
    let filterHash;

    const async_buffer_length = 15000; 
    wsConnection.onmessage = function (d) {
        try {
            var data = JSON.parse(d.data);
            if (data.result){
                if (data.result == 'Geth/v1.1.0-beta-032970b2/linux-amd64/go1.15.5' || data.jsonrpc == '2.0'){  // this could be abstracted as "protocol version data type"
                    console.log('Received: ', data);
                    const expect_array_size = 20;
                    const flow_delay = 1000;
                    filterHash = data.result ?
                        typeof data.result == 'string' && data.result.length == 34 && data.result.startsWith('0x') ? // this could be abstracted as "type filter = [ conditions ]"
                            eth_filter(wsConnection, async_buffer_length, data.result) 
                        :
                        Array.isArray(data.result) && data.result[0] && typeof data.result[0] == 'string' && data.result[0].length == 66 && data.result[0].startsWith('0x') ?  // "type blockHash = [ conditions ]"
                            data.result.length > 0 ? 
                                data.result.map( (hash,i) => method_call(wsConnection, "eth_getBlockByHash", "2.0", 0, [hash, false], i*flow_delay) )//eth_filter(wsConnection, async_buffer_length, filterHash) // heartbeat 
                                :
                                console.error('Error: incorrect data array length',data.result.length,'expects > 0')
                        :
                        typeof data.result == 'object' && data.result.transactions && data.result.transactions.length > 0 && Array.isArray(data.result.transactions) && data.result.miner && typeof data.result.miner == 'string' && data.result.miner.length == 42 ?
                            data.result.transactions.map( (hash,i) => method_call(wsConnection, "eth_getTransactionByHash", "2.0", 0, [hash], i*flow_delay))
                        : 
                        console.error('Unrecognized data type', typeof data.result)
                    : console.error('No result')
                    return;
                } else {
                    console.error('Unrecognized Client Version', data);
                    closeWS(wsConnection);
                }
            } else {
                console.log('incoming data for filter:',filterHash, data);
                if (typeof data.error == 'object') console.error('Request Error: ',data.error)  // this SHOULD be abstracted as data request error type with error code.
            }
            if (data.jsonrpc){
                if (data.jsonrpc == '2.0'){  // check version for handling data error type
                    
                    //now do something with the event.
                } else {
                    console.log('tx', data);
                    //now do something with the tx data.
                }
                return;
            }
            console.warn('got unrecognized json data', data);
        }
        catch (e){
            console.error(data)
            console.error(e);
        }
    };
    wsConnection.onclose = function(e){
        console.error('websocket error', e);
        if (e.code != 1000){
            closeWS(wsConnection);
        } else {
            setTimeout(function(){
                initWS(key);
            }, timeout);
        }
    };
}

function closeWS(wsConnection){
    if (wsConnection){
        console.log('closing ws connection');
        wsConnection.onclose = function(){
            wsConnection = null;
        };
        wsConnection.close();
    }
}

function eth_filter(wsConnection, async_buffer_length, filter_id) {
    const next = (filter) => {
        const params = [ filter ];
        const json_rpc_version = "2.0";
        const id = 0;
        method_call(wsConnection, "eth_getFilterChanges", json_rpc_version, id, params)
        setTimeout( () => next(filter), async_buffer_length) 
        return filter
    }
    return next(filter_id)
}

const method_call = (wsConnection, method, json_rpc_version, id, params) => {
    return () => wsConnection.send(JSON.stringify({
        "jsonrpc": json_rpc_version,
        "method": method,
        "params": params,
        "id": id
        }))
}

