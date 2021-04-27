import {UtilBuffer, UtilBufferEncoding} from "../src";

import * as chai from "chai";
import {it} from "mocha";

const expect = chai.expect;

describe("util-buffer library tests", () => {
    it('Create buffer from string', () => {
        let buff = new UtilBuffer("Input string for buffer");
        expect("Input string for buffer").equals(buff.toString());
        expect("Input string for buffer").equals(buff.to());
        expect("Input string for buffer").equals(buff.to(UtilBufferEncoding.UTF8));
        expect("496e70757420737472696e6720666f7220627566666572").equals(buff.toHex());
        expect("0x496e70757420737472696e6720666f7220627566666572").equals(buff.toHex(true));
        expect("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI=").equals(buff.toBase64());
        expect("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI").equals(buff.toBase64Url());
        expect("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI=").equals(buff.toBase64Url(true));
    });

    it('Create buffer from buffer', () => {
        expect("0x000000").equals((new UtilBuffer(new ArrayBuffer(3))).toHex(true));
    });

    it('Create buffer from typed arrays', () => {
        expect("0xa1b1").equals((new UtilBuffer(new Uint16Array([0xa1b1]))).to(UtilBufferEncoding.HEX, true));
        expect("0xa1b1c2d4").equals((new UtilBuffer(new Uint16Array([0xa1b1, 0xc2d4]))).to(UtilBufferEncoding.HEX, true));

        expect("0xa1b1c2d4").equals((new UtilBuffer(new Uint32Array([0xa1b1c2d4]))).to(UtilBufferEncoding.HEX, true));
    });

    it('Copy buffer and compare', () => {
        let src = UtilBuffer.fromHex("0x001122");
        let dst = src.copy();
        expect(src.toString()).equals(dst.toString());
        expect(true).equal(src.equals(dst));
        expect(false).equal(src.equals(UtilBuffer.fromHex("0x001112")));
        expect(false).equal(src.equals(UtilBuffer.fromHex("0x0011")));
    });

    it('Create random array', () => {
        for(let i = 0; i < 24; i++) {
            let buff = UtilBuffer.random(i);
            //console.log("Buff len=" + i + ": " + buff.toBase64() +  " - " + buff.toBase64Url());
            expect(buff.length).equals(i);
        }
    });

    it('Use creator functions', () => {
        expect("Input string for buffer").equals(UtilBuffer.fromHex("496e70757420737472696e6720666f7220627566666572").toString());
        expect("Input string for buffer").equals(UtilBuffer.fromHex("0x496e70757420737472696e6720666f7220627566666572").toString());
        expect("Input string for buffer").equals(UtilBuffer.fromBase64("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI=").toString());
        expect("Input string for buffer").equals(UtilBuffer.fromBase64Url("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI").toString());
        expect("Input string for buffer").equals(UtilBuffer.fromBase64Url("SW5wdXQgc3RyaW5nIGZvciBidWZmZXI=").toString());
    });

    it('Test special chars', () => {
        expect("test").equals(UtilBuffer.fromString("test").toString());
        expect("äöÄÖ").equals(UtilBuffer.fromString("äöÄÖ").toString());
        expect("").equals(UtilBuffer.fromString("").toString());
        expect("ထ").equals(UtilBuffer.fromString("ထ").toString());
        expect("𐀂").equals(UtilBuffer.fromString("𐀂").toString());
    });

    it('Test concat', () => {
        expect("FooBar").equals(UtilBuffer.concat(UtilBuffer.fromString("Foo"), UtilBuffer.fromString("Bar")).toString());

        let A = new UtilBuffer(new Uint16Array([1234]));
        expect(A.length).equal(2);

        let B = UtilBuffer.random(55);
        expect(B.length).equal(55);

        expect(UtilBuffer.concat(A, B).length).equal(57);
    });

    it('Test xor', () => {
        expect("ffffff").equals(UtilBuffer.xor(UtilBuffer.fromHex("00FF00"), UtilBuffer.fromHex("FF00FF")).toHex());
        try {
            // Expect error on xor with different array sizes
            expect("ffffff").equals(UtilBuffer.xor(UtilBuffer.fromHex("00FF00FF"), UtilBuffer.fromHex("FF00FF")).toHex());
            expect(false).equals("Should not reach hear")
        } catch(err) {
            expect(err.message).equals("Can not xor buffers with different lengths");
        }
    })
});
