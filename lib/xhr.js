const stream = require('react-native-streams');

const Buffer = require('buffer').Buffer;

class XHRStream extends stream.PassThrough {
    constructor(xhr, opts) {
        super(opts)
        this.offset = 0;
        xhr.onreadystatechange = this.handle.bind(this)
        xhr.send(null)
        this.xhr = xhr;
    }

    handle() {
        if (this.xhr.readyState === 4) this.write();
    }

    write() {
        if (this.xhr.response instanceof ArrayBuffer) {
            if (!this.responseArray) this.responseArray = Buffer.from(this.xhr.response);
            if (this.responseArray.byteLength > this.offset) {
                this.emit('data', this.responseArray.slice(this.offset))
                this.offset = this.responseArray.byteLength
            }
        } else if (typeof this.xhr._response == 'string') {
            if (!this.responseArray) this.responseArray = Buffer.from(typeof this.xhr._response == 'string' ? atob(this.xhr._response) : this.xhr._response);
            if (this.responseArray.byteLength > this.offset) {
                this.emit('data', this.responseArray.slice(this.offset))
                this.offset = this.responseArray.byteLength
            }
        }
        this.emit('end')
    }

    text() {
        return new Promise((resolve, reject) => {
            let body = '';
            this.setEncoding('utf8');
            this.on('data', chunk => body += chunk);
            this.on('end', () => {
                resolve(body)
            });
            this.on('error', reject);
        });
    }
}


function dispatchXHR(url, opts) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open(opts.method ? opts.method : "GET", url, true);
    for (const key in opts.headers) {
        xhr.setRequestHeader(key, opts.headers[key]);
    }

    return new XHRStream(xhr, opts)
}

module.exports = dispatchXHR;