/*-----------------------------------------------------------*/
/*  XTEA-CTR encryption for Obliv8 platform boundary        */
/*-----------------------------------------------------------*/
import { Obliv8 } from "./obliv8.js";

// Private: XTEA block encryption (64-bit block, 128-bit key)
function xteaEncryptBlock(v: Uint32Array, key: Uint32Array): void {
    let v0 = v[0], v1 = v[1];
    let sum = 0;
    const delta = 0x9E3779B9;

    for (let i = 0; i < 32; i++) {
        v0 = (v0 + (((v1 << 4 ^ v1 >>> 5) + v1) ^ (sum + key[sum & 3]))) >>> 0;
        sum = (sum + delta) >>> 0;
        v1 = (v1 + (((v0 << 4 ^ v0 >>> 5) + v0) ^ (sum + key[(sum >>> 11) & 3]))) >>> 0;
    }

    v[0] = v0;
    v[1] = v1;
}

// Private: XTEA-CTR transform (encryption = decryption)
function applyMockEncryption(data: Uint8Array, key: Uint32Array, nonce: Uint32Array): Uint8Array {
    if (key.length !== 4) throw new Error("Key must be 4 Uint32s (128-bit)");
    if (nonce.length !== 2) throw new Error("Nonce must be 2 Uint32s (64-bit)");

    const output = new Uint8Array(data.length);
    const counterBlock = new Uint32Array([nonce[0], nonce[1]]);
    const keystreamBlock = new Uint32Array(2);

    for (let i = 0; i < data.length; i++) {
        const byteIndexInBlock = i % 8;

        if (byteIndexInBlock === 0) {
            keystreamBlock[0] = counterBlock[0];
            keystreamBlock[1] = counterBlock[1];
            xteaEncryptBlock(keystreamBlock, key);

            counterBlock[1] = (counterBlock[1] + 1) >>> 0;
            if (counterBlock[1] === 0) {
                counterBlock[0] = (counterBlock[0] + 1) >>> 0;
            }
        }

        const wordIndex = byteIndexInBlock < 4 ? 0 : 1;
        const shiftAmount = (byteIndexInBlock % 4) * 8;
        const keystreamByte = (keystreamBlock[wordIndex] >>> shiftAmount) & 0xFF;

        output[i] = data[i] ^ keystreamByte;
    }

    return output;
}

// Module-private state
const MASTER_KEY = new Uint32Array([0x01234567, 0x89ABCDEF, 0xFEDCBA98, 0x76543210]);
let globalCounter = 0;
const counterMap = new WeakMap<object, number>();

/** Encrypt a plaintext byte; returns ciphertext byte and the counter used as nonce. */
export function encryptByte(plain: number): { encrypted: number; ctr: number } {
    const ctr = globalCounter++;
    const nonce = new Uint32Array([Math.floor(ctr / 0x100000000), ctr >>> 0]);
    const result = applyMockEncryption(new Uint8Array([plain]), MASTER_KEY, nonce);
    return { encrypted: result[0], ctr };
}

/** Decrypt a ciphertext byte given the counter used when encrypting. */
export function decryptByte(encrypted: number, ctr: number): number {
    const nonce = new Uint32Array([Math.floor(ctr / 0x100000000), ctr >>> 0]);
    const result = applyMockEncryption(new Uint8Array([encrypted]), MASTER_KEY, nonce);
    return result[0];
}

/** Associate an Obliv8 object with its encryption counter. */
export function registerCounter(obj: object, ctr: number): void {
    counterMap.set(obj, ctr);
}

/** Retrieve the encryption counter for an Obliv8 object. */
export function getCounter(obj: object): number {
    const ctr = counterMap.get(obj);
    if (ctr === undefined) throw new Error("No counter registered for Obliv8 object");
    return ctr;
}

/**
 * Intentional declassification: reveal the plaintext value of an Obliv8.
 * This is the only public API for reading oblivious data.
 */
export function revealByte(o: Obliv8): number {
    return decryptByte(o.value, getCounter(o));
}
