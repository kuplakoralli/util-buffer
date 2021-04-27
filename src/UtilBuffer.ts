
export enum UtilBufferEncoding {
    'UTF8' = 'utf8',
    'BASE64' = 'base64',
    'BASE64URL' = 'base64url',
    'HEX' = 'hex',
    'BUFFER' = 'buffer'
}

export class UtilBuffer {

    private readonly buffer: Uint8Array;
    public readonly length: number;

    private static base64regex = /(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    private static hexRegex = /0[xX][0-9a-fA-F]+/;
    private static base64urlRegex = /^[A-Za-z0-9_-]+$/;


    constructor(inputData: ArrayBuffer | string, private defaultEncoding: UtilBufferEncoding = UtilBufferEncoding.UTF8) {
        if(typeof(inputData) === 'string') {
            UtilBuffer.validateInput(inputData, defaultEncoding);
            switch(defaultEncoding) {
                case UtilBufferEncoding.UTF8:
                    this.buffer = UtilBuffer.stringToArray(inputData);
                    break;
                case UtilBufferEncoding.BASE64:
                    this.buffer = UtilBuffer.b64toBytes(inputData);
                    break;
                case UtilBufferEncoding.BASE64URL:
                    // Convert base64url to base64 and then use base64 method
                    this.buffer = UtilBuffer.b64toBytes(UtilBuffer.base64urlTOBase64(inputData));
                    break;
                case UtilBufferEncoding.HEX:
                    this.buffer = UtilBuffer.hexToBytes(inputData);
                    break;
                default:
                    throw(new Error('Unknown encoding: ' + defaultEncoding));
            }
            this.length = this.buffer.byteLength;
        } else {
            let u8 = UtilBuffer.convertToU8Array(inputData);
            this.buffer = u8;
            this.length = u8.byteLength;
        }
    }

    private static convertToU8Array(array: ArrayBuffer): Uint8Array {
        if(array instanceof Uint8Array) {
            return array;
        }
        else if(array instanceof Uint16Array) {
            let u8 = new Uint8Array(array.byteLength);
            for(let i = 0; i < array.length; i++) {
                u8[2 * i] = array[i] >> 8;
                u8[2 * i + 1] = 0xFF & array[i];
            }
            return u8;
        }
        else if(array instanceof Uint32Array) {
            let u8 = new Uint8Array(array.byteLength);
            for(let i = 0; i < array.length; i++) {
                u8[4 * i] = array[i] >> 24;
                u8[4 * i + 1] = (array[i] >> 16) & 0xFF;
                u8[4 * i + 2] = (array[i] >> 8) & 0xFF;
                u8[4 * i + 3] = array[i] & 0xFF
            }
            return u8;
        }
        else if(array instanceof ArrayBuffer) {
            return new Uint8Array(array);
        }
        else {
            throw "Not known format";
        }

    }

    public getArray(): Uint8Array {
        return this.buffer;
    }

    public to(encoding: UtilBufferEncoding = UtilBufferEncoding.UTF8, withOption: boolean = false): string | ArrayBuffer {
        switch(encoding) {
            case UtilBufferEncoding.UTF8:
                return this.toString();
            case UtilBufferEncoding.BASE64:
                return this.toBase64();
            case UtilBufferEncoding.BASE64URL:
                return this.toBase64Url(withOption)
            case UtilBufferEncoding.HEX:
                return this.toHex(withOption);
            case UtilBufferEncoding.BUFFER:
                return this.getArray();
            default:
                throw(new Error('Unknown encoding: ' + encoding));
        }
    }

    public toString(): string {
        // If buffer is already Uint8Array use it
        return UtilBuffer.bytesToString(this.getArray());
    }

    public toHex(withPrefix: boolean = false): string {
        return (withPrefix ? "0x": "") + UtilBuffer.bytesToHex(this.getArray());
    }

    public toBase64(): string {
        if (typeof(window) !== 'undefined' && typeof(window.btoa) !== "undefined") {
            return window.btoa(String.fromCharCode.apply(null, this.getArray()));
        }
        else {
            return Buffer.from(this.getArray()).toString('base64');
        }
    }

    public toBase64Url(withPadding: boolean = false): string {
        let base64UrlString = UtilBuffer.base64ToBase64Url(this.toBase64());
        return (withPadding ? base64UrlString : (base64UrlString.split("=")[0]));
    }

    public static random(lengthInBytes: number): UtilBuffer {
        let randomBytes = new Uint8Array(lengthInBytes);
        if(typeof(window) !== 'undefined') {
            window.crypto.getRandomValues(randomBytes);
        }
        else {
            let rnd = new Uint8Array(randomBytes.length);
            rnd = require('crypto').randomBytes(rnd.length);
            for(let i = 0; i < rnd.length; i++) {
                randomBytes[i] = rnd[i];
            }
        }
        return new UtilBuffer(randomBytes);
    }

    public static concat(A: UtilBuffer, B: UtilBuffer): UtilBuffer {
        let aBuffer: Uint8Array = A.getArray();
        let bBuffer: Uint8Array = B.getArray();

        let array = new Uint8Array(aBuffer.byteLength + bBuffer.byteLength);
        array.set(aBuffer);
        array.set(bBuffer, aBuffer.byteLength);
        return new UtilBuffer(array);

    }
    
    public static fromString(inputString: string) {
        return new UtilBuffer(inputString);
    }

    public static fromBase64(inputString: string) {
        return new UtilBuffer(inputString, UtilBufferEncoding.BASE64);
    }

    public static fromBase64Url(inputString: string) {
        return new UtilBuffer(inputString, UtilBufferEncoding.BASE64URL);
    }

    public static fromHex(inputString: string) {
        return new UtilBuffer(inputString, UtilBufferEncoding.HEX);
    }

    private static validateInput(input: string, encoding: UtilBufferEncoding): boolean {
        switch(encoding) {
            case UtilBufferEncoding.UTF8:
                return true; // Valid strings all always utf8
            case UtilBufferEncoding.HEX:
                if(UtilBuffer.hexRegex.test(input)) {
                    return true
                }
                break;
            case UtilBufferEncoding.BASE64:
                if(UtilBuffer.base64regex.test(input)) {
                    return true;
                }
                break;
            case UtilBufferEncoding.BASE64URL:
                if(UtilBuffer.base64urlRegex.test(input)) {
                    return true;
                }
                break
            default:
                throw(new Error("Invalid input: " + input + "\nencoding: " + encoding));
        }
    }

    public static xor(A: UtilBuffer, B: UtilBuffer): UtilBuffer {
        let aArray = A.getArray();
        let bArray = B.getArray();

        if(aArray.length !== bArray.length) {
            throw new Error('Can not xor buffers with different lengths');
        }

        let xorArray = new Uint8Array(aArray.length);

        for(let i = 0; i < aArray.length; i++) {
            xorArray[i] = aArray[i] ^ bArray[i];
        }
        return new UtilBuffer(xorArray);
    }

    private static stringToArray(strInput: string): Uint8Array {
        let byteArray = [];
        for (let i = 0; i < strInput.length; i++) {
            let charCode = strInput.charCodeAt(i);
            if (charCode < 0x80) {
                byteArray.push(charCode);
            }
            else if (charCode < 0x800) {
                byteArray.push(
                    0xC0 | (charCode >> 6),
                    0x80 | (charCode & 0x3F)
                );
            }
            else if (charCode < 0xD800 || charCode >= 0xE000) {
                byteArray.push(
                    0xE0 | (charCode >> 12),
                    0x80 | ((charCode >> 6) & 0x3F),
                    0x80 | (charCode & 0x3F)
                );
            }
            else {
                // surrogate pair
                i++;
                charCode = 0x10000 + (((charCode & 0x3FF) << 10) | (strInput.charCodeAt(i) & 0x3FF));
                byteArray.push(
                    0xF0 | (charCode >> 18),
                    0x80 | ((charCode >> 12) & 0x3F),
                    0x80 | ((charCode >> 6) & 0x3F),
                    0x80 | (charCode & 0x3F)
                );
            }
        }
        return new Uint8Array(byteArray);
    }

    public copy(): UtilBuffer {
        let arrayBuffer = new ArrayBuffer(this.length);
        new Uint8Array(arrayBuffer).set(new Uint8Array(this.buffer));
        return new UtilBuffer(arrayBuffer);
    }

    public equals(buffToCompare): boolean {
        if(this.length != buffToCompare.length) {
            return false;
        }
        for(let i = 0, aBuff = this.getArray(), bBuff = buffToCompare.getArray(); i < this.length; i++) {
            if(aBuff[i] !== bBuff[i]) {
                return false;
            }
        }
        return true;
    }

    private static b64toBytes(base64input: string): Uint8Array {
        let binaryString = UtilBuffer.atob(base64input);
        let bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /*
   Following functions are implemented based on RFC 7515, Appendix C
   https://tools.ietf.org/html/rfc7515#appendix-C

    */
    private static base64ToBase64Url(base64Str: string): string {
        let base64urlStr: string = base64Str;
        //base64urlStr = base64urlStr.split('=')[0]; // Remove trailing '=' chars
        base64urlStr = base64urlStr.replace(/\+/g, '-'); // Replace '+' with '-' (minus)
        base64urlStr = base64urlStr.replace(/\//g, '_'); // Replace '/' with '_' (underscore)
        return base64urlStr;
    }

    private static base64urlTOBase64(base64urlStr: string): string {
        let base64Str = base64urlStr;
        base64Str = base64Str.replace(/-/g, '+'); // Replace '-' (minus) with '+'
        base64Str = base64Str.replace(/_/g, '/'); // Replace '_' (underscore) with '/'
        switch(base64Str.length % 4) { // Pad with trailing '='
            case 0:
                break;
            case 2:
                base64Str = base64Str + '==';
                break;
            case 3:
                base64Str = base64Str + '=';
                break;
            default:
                throw 'Invalid base64url string as input';

        }
        return base64Str;
    }



    private static bytesToHex(buffer: Uint8Array): string {
        if (buffer.length == 0) {
            return '';
        }
        let hexString = '';
        for (let i = 0; i < buffer.length; i++) {
            let currByte = buffer[i];
            if (currByte <= 0xF) {
                hexString += '0' + currByte.toString(16);
            }
            else {
                hexString += currByte.toString(16);
            }
        }
        return hexString;
    }

    private static hexToBytes(hexInput: string): Uint8Array {
        let byteArray = [];
        let startPosition = 0;
        if(hexInput.substring(0, 2) == '0x') {
            startPosition = 2;
        }
        for (let i = startPosition; i < hexInput.length; i += 2) {
            byteArray.push(parseInt(hexInput.substr(i, 2), 16));
        }
        return new Uint8Array(byteArray);
    }

    /*
     * Implement atob as generic as possible.
     *
     * */
    private static atob(base64input: string) {
        if (typeof(window) !== 'undefined' && typeof(window.atob) !== "undefined") {
            return window.atob(base64input);
        }
        else if(typeof(UtilBuffer) !== "undefined") {
            return Buffer.from(base64input, 'base64').toString('binary');
        }
    }

    private static bytesToString(buffer: Uint8Array): string {
        let str: string = '';
        for (let i = 0; i < buffer.length; i++) {
            let byte1 = buffer[i];
            let byte2, byte3, byte4;
            if (byte1 <= 0x7F) {
                str += String.fromCharCode(byte1);
            }
            else if (byte1 <= 0xDF) {
                byte2 = buffer[++i];
                str += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
            }
            else if (byte1 <= 0xEF) {
                byte2 = buffer[++i];
                byte3 = buffer[++i];
                str += String.fromCharCode(((byte1 & 0xF) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
            }
            else {
                // surrogate pair
                byte2 = buffer[++i];
                byte3 = buffer[++i];
                byte4 = buffer[++i];
                let codePoint = ((byte1 & 0x7) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);

                // Algorithm from https://en.wikipedia.org/wiki/UTF-16
                codePoint -= 0x10000;
                str += String.fromCharCode(0xD800 + (codePoint >> 10));
                str += String.fromCharCode(0xDC00 + (codePoint & 0x03FF));
            }
        }
        return str;
    }
}

