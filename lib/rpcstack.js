/*
*   RPC stack manager
*   author: Diego Correa T. <algoritmia@labormedia.cl>
*/

'use strict';
import { setTimeout as setTimeoutPromise } from 'timers/promises';
class RPCStack  {
    constructor(stack=[], time_limit) {
        this.stack = stack;
        this.stack_is_empty = false;
        this.time_limit = time_limit ? time_limit : 1000;
        // this.init_consumer();
        return 0
    }
    /**
     * initialize a stack consumer loop based on local parameters (time_limit)
     *
     * @method init_consumer
     *
     * @returns {void}
     */
    init_consumer(method) {

        const ac = new AbortController();
        const signal = ac.signal;

        setTimeoutPromise(this.time_limit, 'stack', { signal })
        .then(() => {
            const next = this.consume_stack(this.stack);
            const idle = method ? method : () => console.log('Stack Idle.');
            return !this.empty_method() && next ? 
                idle
                :
                next
        })
        .then( x => this.init_consumer(x))
        .catch((err) => {
            if (err.name === 'AbortError')
            console.log('The timeout was aborted', err);
        });

        method ? method() : 0

        // ac.abort();
    }
    empty_method() {
        this.stack_is_empty = this.stack.length == 0 ? true : false;
        return () => this.stack
    }
    /**
     * adds method to the stack
     *
     * @method init_consumer
     *
     * @param {Object} method
     *
     * @returns {void}
     */
    add_to_stack(method) {
        this.stack.push(method)
    }
    /**
     * consumes elements from the stack or changes stack_is_empty to true if empty.
     *
     * @method consume_stack
     *
     * @param {Array} stack
     *
     * @returns {method}
     */
    consume_stack(stack) {
        return this.stack.length > 0 ? stack.shift() : this.empty_method()
    }
}

export default RPCStack;