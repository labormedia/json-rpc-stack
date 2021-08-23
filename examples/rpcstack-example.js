import { WebSocket } from 'ws';
import web3_ws from '../lib/web3_ws.js';
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

initWS(url, init_message);

function initWS(url, initMessage) {

    const stack = web3_ws();

    stack.init_consumer(() => console.log('RPC-JSON stack initialized.'))

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

    wsConnection.onmessage = function (d) {
        try {
            const data = JSON.parse(d.data);
            // console.log('Received: ', data);
            var this_type = null;
            const it_is = stack.check_type(data).it_is
            it_is.length == 1 ?
                this_type = it_is[0]
                :
                0//stack.error_code(data, "-3"
            switch (this_type) {
                case "filter_hash": {
                    console.log("FILTER_HASH")
                    filterHash = data.result
                    const params = [ filterHash ];
                    const json_rpc_version = "2.0";
                    const id = 0;
                    stack.add_to_stack( method_call(wsConnection, "eth_getFilterChanges", "2.0", 0, params) )
                    break;
                }
                case "block_hash": {
                    console.log("BLOCK_HASH")
                    data.result.map( hash => stack.add_to_stack( method_call(wsConnection, "eth_getBlockByHash", "2.0", 0, [hash, false]) ))
                    stack.add_to_stack( method_call(wsConnection, "eth_getFilterChanges", "2.0", 0, [filterHash]) )
                    break;
                }
                case "block": {
                    console.log("BLOCK")
                    data.result.transactions.map( hash => stack.add_to_stack(method_call(wsConnection, "eth_getTransactionByHash", "2.0", 0, [hash])) )
                    break;
                }
                case "transaction": {
                    console.log("TRANSACTION")
                    console.log('transaction hash:',data.result.hash)
                    console.log('transaction block hash', data.result.blockHash)
                    console.log('transaction block number', data.result.blockNumber, parseInt(data.result.blockNumber, 16))
                    console.log('to:', data.result.to)
                    break;
                }
                case "error": {
                    if (data.error && data.error.code == -32000) {

                        console.log("Filter not found yet. Retrying...")
                        filterHash ? 
                            stack.add_to_stack( method_call(wsConnection, "eth_getFilterChanges", "2.0", 0, [filterHash]) )
                            :
                            0
                        }
                    break;
                }
                default : {
                    console.log('default type for',data)
                    break;
                }
            }
            
        }
        catch (e) {
            stack.cast_error(d.data, "-2")
            console.log(e)
        }
    }

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

const method_call = (wsConnection, method, json_rpc_version, id, params) => {
    return () => wsConnection.send(JSON.stringify({
        "jsonrpc": json_rpc_version,
        "method": method,
        "params": params,
        "id": id
        }))
}