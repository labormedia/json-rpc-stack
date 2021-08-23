/*
*   RPC stack manager
*   author: Diego Correa T. <algoritmia@labormedia.cl>
*/

'use strict';
import { setTimeout as setTimeoutPromise } from 'timers/promises';
class RPCStack  {
    constructor(stack=[], time_limit) {
        this.stack = stack;
        this.stack_is_empty = true;
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
            const next = this.consume_stack();
            const idle = method ? method : () => console.log('Stack Idle.');
            return next ? 
                next
                :
                idle
        })
        .then( x => this.init_consumer(x))
        .catch((err) => {
            if (err.name === 'AbortError')
            console.log('The timeout was aborted', err);
        });

        method ? method() : 0

        // ac.abort();
    }
    loop_method(callback) {
        const ac = new AbortController();
        const signal = ac.signal;
        setTimeoutPromise(this.time_limit, 'stack', { signal })
        .then(() => {
            const next = this.consume_stack();
            const idle = () => 'Stack Idle.';
            return next ? 
                next
                :
                idle
        })
        .then( x => {
            const payload = x();
            console.log('payload', payload)
            this.loop_method(callback)
            return callback(x());
        })
        .catch((err) => {
            if (err.name === 'AbortError')
            console.log('The timeout was aborted', err);
        });
    }
    empty_method() {
        this.stack_is_empty = this.stack.length == 0 ? true : false;
        return () => false
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
        this.stack_is_empty = false;
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
    consume_stack() {
        return this.stack.length > 0 ? this.stack.shift() : this.empty_method()
    }

    stack_length() {
        return this.stack.length
    }
}

export default RPCStack;