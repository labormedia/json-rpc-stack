'use strict';
import RPCStack from './rpcstack.js'

class StackImplementation extends RPCStack {
    // we will include abstractions of data and error types with unit testing (TypeScript?).


    constructor(stack=[], time_limit, errors, data_types, jsonrpc) {
        super(stack, time_limit);
        this.VERSION = jsonrpc ? jsonrpc : "2.0"
        this.ERRORS = typeof errors == 'object' ? errors : this.ERRORS;
        this.DATA_TYPES = data_types ? data_types : this.DATA_TYPES;
    }

    check_type(data) {

        return Object.entries(this.DATA_TYPES).reduce(
            (check,type_form) => {
                var response;
                const flag = type_form[1].type;
                // console.log('type', type_form[0] )
                switch ( flag ) {
                    case "array" : {
                        response = Array.isArray(data.result)
                            && data.result.reduce( (a,x) => a && x.startsWith(type_form[1].elements_startsWith), true)
                            && (type_form[1].elements_length && data.result.length > 0 && data.result.reduce( (a,x) => a && x.length == type_form[1].elements_length, true))
                        break;
                    }
                    case "object" : {
                        // console.log('check error', typeof data.error == "object" ^ type_form[1].error_contains)
                        response = type_form[1].type == typeof data.result
                            && (type_form[1].contains && data.result) ? 
                                type_form[1].contains.reduce( (a,x) => a && data.result.hasOwnProperty(x) , true) 
                                : true
                            && (data.error && type_form[1].error_contains) ? 
                                type_form[1].error_contains.reduce( (a,x) => a && data.error.hasOwnProperty(x), true) 
                                : false
                        break;
                    }
                    case 'string': {
                        response = type_form[1].type == typeof data.result
                            && data.result.length == type_form[1].length
                            && data.result.startsWith(type_form[1].startsWith)
                        break;
                    }
                    default: {
                        console.log('type', type_form[1].type == typeof data.result)
                        // this.cast_error(data, "-3")
                        response = false
                        break;
                    }
                }
                // console.log('response for', type_form[0],response)
                return response ? { it_is: check.it_is.concat([type_form[0]]) } : check
            }
        , {it_is:[]})

    }

    cast_error(data, code) {
        console.error(this.error_code(code), data)
        return data
    }

    error_code(code) {
        return this.ERRORS[code] ? this.ERRORS[code] : 'Undefined error.'
    }

}

export default StackImplementation;