import StackImplementation from './stack-implementation.js'

const JSONRPC = {
    jsonrpc: "2.0"
}

const ERRORS = {
        "-1": "Incorrect data length signature.",
        "-2": "Unrecognized json data.",
        "-3": "Unrecognized Data Type"
}

const DATA_TYPES = {
        "version": {
            type: "object",
            contains: ["jsonrpc", "result"],
            result: "Geth/v1.1.0-beta-032970b2/linux-amd64/go1.15.5"
        },
        "filter_hash": {
            length: 34,
            type: "string",
            startsWith: "0x"
        },
        "block_hash": {
            elements_length: 66,
            type: "array",
            elements_startsWith: "0x"
        },
        "block": {
            type: "object",
            contains: ["miner", "transactions"]
        },
        "transaction_hash": {
            type:"string"
        },
        "transaction": {
            type: "object",
            contains: ["hash","blockHash","blockNumber", "from", "to"]
        },
        "error": {
            type: "object",
            error_contains: ["code", "message"]
        }

}

function init() {
    const stack = new StackImplementation([], 1000, ERRORS, DATA_TYPES, JSONRPC.jsonrpc)
    stack.add_to_stack(() => console.log('Stack initialized.'));
    return stack
}

export default init;