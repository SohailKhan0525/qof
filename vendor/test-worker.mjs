var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@stablelib/base64/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/@stablelib/base64/lib/base64.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = /* @__PURE__ */ __name(function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      }, "extendStatics");
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        __name(__, "__");
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var INVALID_BYTE = 256;
    var Coder = (
      /** @class */
      (function() {
        function Coder2(_paddingCharacter) {
          if (_paddingCharacter === void 0) {
            _paddingCharacter = "=";
          }
          this._paddingCharacter = _paddingCharacter;
        }
        __name(Coder2, "Coder");
        Coder2.prototype.encodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 8 + 5) / 6 | 0;
          }
          return (length + 2) / 3 * 4 | 0;
        };
        Coder2.prototype.encode = function(data) {
          var out = "";
          var i = 0;
          for (; i < data.length - 2; i += 3) {
            var c = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            out += this._encodeByte(c >>> 1 * 6 & 63);
            out += this._encodeByte(c >>> 0 * 6 & 63);
          }
          var left = data.length - i;
          if (left > 0) {
            var c = data[i] << 16 | (left === 2 ? data[i + 1] << 8 : 0);
            out += this._encodeByte(c >>> 3 * 6 & 63);
            out += this._encodeByte(c >>> 2 * 6 & 63);
            if (left === 2) {
              out += this._encodeByte(c >>> 1 * 6 & 63);
            } else {
              out += this._paddingCharacter || "";
            }
            out += this._paddingCharacter || "";
          }
          return out;
        };
        Coder2.prototype.maxDecodedLength = function(length) {
          if (!this._paddingCharacter) {
            return (length * 6 + 7) / 8 | 0;
          }
          return length / 4 * 3 | 0;
        };
        Coder2.prototype.decodedLength = function(s) {
          return this.maxDecodedLength(s.length - this._getPaddingLength(s));
        };
        Coder2.prototype.decode = function(s) {
          if (s.length === 0) {
            return new Uint8Array(0);
          }
          var paddingLength = this._getPaddingLength(s);
          var length = s.length - paddingLength;
          var out = new Uint8Array(this.maxDecodedLength(length));
          var op = 0;
          var i = 0;
          var haveBad = 0;
          var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
          for (; i < length - 4; i += 4) {
            v0 = this._decodeChar(s.charCodeAt(i + 0));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v0 << 2 | v1 >>> 4;
            out[op++] = v1 << 4 | v2 >>> 2;
            out[op++] = v2 << 6 | v3;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
            haveBad |= v2 & INVALID_BYTE;
            haveBad |= v3 & INVALID_BYTE;
          }
          if (i < length - 1) {
            v0 = this._decodeChar(s.charCodeAt(i));
            v1 = this._decodeChar(s.charCodeAt(i + 1));
            out[op++] = v0 << 2 | v1 >>> 4;
            haveBad |= v0 & INVALID_BYTE;
            haveBad |= v1 & INVALID_BYTE;
          }
          if (i < length - 2) {
            v2 = this._decodeChar(s.charCodeAt(i + 2));
            out[op++] = v1 << 4 | v2 >>> 2;
            haveBad |= v2 & INVALID_BYTE;
          }
          if (i < length - 3) {
            v3 = this._decodeChar(s.charCodeAt(i + 3));
            out[op++] = v2 << 6 | v3;
            haveBad |= v3 & INVALID_BYTE;
          }
          if (haveBad !== 0) {
            throw new Error("Base64Coder: incorrect characters for decoding");
          }
          return out;
        };
        Coder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 43;
          result += 62 - b >>> 8 & 62 - 43 - 63 + 47;
          return String.fromCharCode(result);
        };
        Coder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (42 - c & c - 44) >>> 8 & -INVALID_BYTE + c - 43 + 62;
          result += (46 - c & c - 48) >>> 8 & -INVALID_BYTE + c - 47 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        Coder2.prototype._getPaddingLength = function(s) {
          var paddingLength = 0;
          if (this._paddingCharacter) {
            for (var i = s.length - 1; i >= 0; i--) {
              if (s[i] !== this._paddingCharacter) {
                break;
              }
              paddingLength++;
            }
            if (s.length < 4 || paddingLength > 2) {
              throw new Error("Base64Coder: incorrect padding");
            }
          }
          return paddingLength;
        };
        return Coder2;
      })()
    );
    exports.Coder = Coder;
    var stdCoder = new Coder();
    function encode2(data) {
      return stdCoder.encode(data);
    }
    __name(encode2, "encode");
    exports.encode = encode2;
    function decode(s) {
      return stdCoder.decode(s);
    }
    __name(decode, "decode");
    exports.decode = decode;
    var URLSafeCoder = (
      /** @class */
      (function(_super) {
        __extends(URLSafeCoder2, _super);
        function URLSafeCoder2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        __name(URLSafeCoder2, "URLSafeCoder");
        URLSafeCoder2.prototype._encodeByte = function(b) {
          var result = b;
          result += 65;
          result += 25 - b >>> 8 & 0 - 65 - 26 + 97;
          result += 51 - b >>> 8 & 26 - 97 - 52 + 48;
          result += 61 - b >>> 8 & 52 - 48 - 62 + 45;
          result += 62 - b >>> 8 & 62 - 45 - 63 + 95;
          return String.fromCharCode(result);
        };
        URLSafeCoder2.prototype._decodeChar = function(c) {
          var result = INVALID_BYTE;
          result += (44 - c & c - 46) >>> 8 & -INVALID_BYTE + c - 45 + 62;
          result += (94 - c & c - 96) >>> 8 & -INVALID_BYTE + c - 95 + 63;
          result += (47 - c & c - 58) >>> 8 & -INVALID_BYTE + c - 48 + 52;
          result += (64 - c & c - 91) >>> 8 & -INVALID_BYTE + c - 65 + 0;
          result += (96 - c & c - 123) >>> 8 & -INVALID_BYTE + c - 97 + 26;
          return result;
        };
        return URLSafeCoder2;
      })(Coder)
    );
    exports.URLSafeCoder = URLSafeCoder;
    var urlSafeCoder = new URLSafeCoder();
    function encodeURLSafe(data) {
      return urlSafeCoder.encode(data);
    }
    __name(encodeURLSafe, "encodeURLSafe");
    exports.encodeURLSafe = encodeURLSafe;
    function decodeURLSafe(s) {
      return urlSafeCoder.decode(s);
    }
    __name(decodeURLSafe, "decodeURLSafe");
    exports.decodeURLSafe = decodeURLSafe;
    exports.encodedLength = function(length) {
      return stdCoder.encodedLength(length);
    };
    exports.maxDecodedLength = function(length) {
      return stdCoder.maxDecodedLength(length);
    };
    exports.decodedLength = function(s) {
      return stdCoder.decodedLength(s);
    };
  }
});

// node_modules/fast-sha256/sha256.js
var require_sha256 = __commonJS({
  "node_modules/fast-sha256/sha256.js"(exports, module) {
    (function(root, factory) {
      var exports2 = {};
      factory(exports2);
      var sha2562 = exports2["default"];
      for (var k in exports2) {
        sha2562[k] = exports2[k];
      }
      if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = sha2562;
      } else if (typeof define === "function" && define.amd) {
        define(function() {
          return sha2562;
        });
      } else {
        root.sha256 = sha2562;
      }
    })(exports, function(exports2) {
      "use strict";
      exports2.__esModule = true;
      exports2.digestLength = 32;
      exports2.blockSize = 64;
      var K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while (len >= 64) {
          a = v[0];
          b = v[1];
          c = v[2];
          d = v[3];
          e = v[4];
          f = v[5];
          g = v[6];
          h = v[7];
          for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (p[j] & 255) << 24 | (p[j + 1] & 255) << 16 | (p[j + 2] & 255) << 8 | p[j + 3] & 255;
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
            u = w[i - 15];
            t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
          }
          for (i = 0; i < 64; i++) {
            t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i] + w[i] | 0) | 0) | 0;
            t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          v[0] += a;
          v[1] += b;
          v[2] += c;
          v[3] += d;
          v[4] += e;
          v[5] += f;
          v[6] += g;
          v[7] += h;
          pos += 64;
          len -= 64;
        }
        return pos;
      }
      __name(hashBlocks, "hashBlocks");
      var Hash = (
        /** @class */
        (function() {
          function Hash2() {
            this.digestLength = exports2.digestLength;
            this.blockSize = exports2.blockSize;
            this.state = new Int32Array(8);
            this.temp = new Int32Array(64);
            this.buffer = new Uint8Array(128);
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            this.reset();
          }
          __name(Hash2, "Hash");
          Hash2.prototype.reset = function() {
            this.state[0] = 1779033703;
            this.state[1] = 3144134277;
            this.state[2] = 1013904242;
            this.state[3] = 2773480762;
            this.state[4] = 1359893119;
            this.state[5] = 2600822924;
            this.state[6] = 528734635;
            this.state[7] = 1541459225;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
          };
          Hash2.prototype.clean = function() {
            for (var i = 0; i < this.buffer.length; i++) {
              this.buffer[i] = 0;
            }
            for (var i = 0; i < this.temp.length; i++) {
              this.temp[i] = 0;
            }
            this.reset();
          };
          Hash2.prototype.update = function(data, dataLength) {
            if (dataLength === void 0) {
              dataLength = data.length;
            }
            if (this.finished) {
              throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
              while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
              }
              if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
              }
            }
            if (dataLength >= 64) {
              dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
              dataLength %= 64;
            }
            while (dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++];
              dataLength--;
            }
            return this;
          };
          Hash2.prototype.finish = function(out) {
            if (!this.finished) {
              var bytesHashed = this.bytesHashed;
              var left = this.bufferLength;
              var bitLenHi = bytesHashed / 536870912 | 0;
              var bitLenLo = bytesHashed << 3;
              var padLength = bytesHashed % 64 < 56 ? 64 : 128;
              this.buffer[left] = 128;
              for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
              }
              this.buffer[padLength - 8] = bitLenHi >>> 24 & 255;
              this.buffer[padLength - 7] = bitLenHi >>> 16 & 255;
              this.buffer[padLength - 6] = bitLenHi >>> 8 & 255;
              this.buffer[padLength - 5] = bitLenHi >>> 0 & 255;
              this.buffer[padLength - 4] = bitLenLo >>> 24 & 255;
              this.buffer[padLength - 3] = bitLenLo >>> 16 & 255;
              this.buffer[padLength - 2] = bitLenLo >>> 8 & 255;
              this.buffer[padLength - 1] = bitLenLo >>> 0 & 255;
              hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
              this.finished = true;
            }
            for (var i = 0; i < 8; i++) {
              out[i * 4 + 0] = this.state[i] >>> 24 & 255;
              out[i * 4 + 1] = this.state[i] >>> 16 & 255;
              out[i * 4 + 2] = this.state[i] >>> 8 & 255;
              out[i * 4 + 3] = this.state[i] >>> 0 & 255;
            }
            return this;
          };
          Hash2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          Hash2.prototype._saveState = function(out) {
            for (var i = 0; i < this.state.length; i++) {
              out[i] = this.state[i];
            }
          };
          Hash2.prototype._restoreState = function(from, bytesHashed) {
            for (var i = 0; i < this.state.length; i++) {
              this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
          };
          return Hash2;
        })()
      );
      exports2.Hash = Hash;
      var HMAC = (
        /** @class */
        (function() {
          function HMAC2(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
              new Hash().update(key).finish(pad).clean();
            } else {
              for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
              }
            }
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54;
            }
            this.inner.update(pad);
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54 ^ 92;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for (var i = 0; i < pad.length; i++) {
              pad[i] = 0;
            }
          }
          __name(HMAC2, "HMAC");
          HMAC2.prototype.reset = function() {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
          };
          HMAC2.prototype.clean = function() {
            for (var i = 0; i < this.istate.length; i++) {
              this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
          };
          HMAC2.prototype.update = function(data) {
            this.inner.update(data);
            return this;
          };
          HMAC2.prototype.finish = function(out) {
            if (this.outer.finished) {
              this.outer.finish(out);
            } else {
              this.inner.finish(out);
              this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
          };
          HMAC2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          return HMAC2;
        })()
      );
      exports2.HMAC = HMAC;
      function hash(data) {
        var h = new Hash().update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      __name(hash, "hash");
      exports2.hash = hash;
      exports2["default"] = hash;
      function hmac(key, data) {
        var h = new HMAC(key).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      __name(hmac, "hmac");
      exports2.hmac = hmac;
      function fillBuffer(buffer, hmac2, info, counter) {
        var num = counter[0];
        if (num === 0) {
          throw new Error("hkdf: cannot expand more");
        }
        hmac2.reset();
        if (num > 1) {
          hmac2.update(buffer);
        }
        if (info) {
          hmac2.update(info);
        }
        hmac2.update(counter);
        hmac2.finish(buffer);
        counter[0]++;
      }
      __name(fillBuffer, "fillBuffer");
      var hkdfSalt = new Uint8Array(exports2.digestLength);
      function hkdf(key, salt, info, length) {
        if (salt === void 0) {
          salt = hkdfSalt;
        }
        if (length === void 0) {
          length = 32;
        }
        var counter = new Uint8Array([1]);
        var okm = hmac(salt, key);
        var hmac_ = new HMAC(okm);
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
          if (bufpos === buffer.length) {
            fillBuffer(buffer, hmac_, info, counter);
            bufpos = 0;
          }
          out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
      }
      __name(hkdf, "hkdf");
      exports2.hkdf = hkdf;
      function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for (var i = 0; i * len < dkLen; i++) {
          var c = i + 1;
          ctr[0] = c >>> 24 & 255;
          ctr[1] = c >>> 16 & 255;
          ctr[2] = c >>> 8 & 255;
          ctr[3] = c >>> 0 & 255;
          prf.reset();
          prf.update(salt);
          prf.update(ctr);
          prf.finish(u);
          for (var j = 0; j < len; j++) {
            t[j] = u[j];
          }
          for (var j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (var k = 0; k < len; k++) {
              t[k] ^= u[k];
            }
          }
          for (var j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j];
          }
        }
        for (var i = 0; i < len; i++) {
          t[i] = u[i] = 0;
        }
        for (var i = 0; i < 4; i++) {
          ctr[i] = 0;
        }
        prf.clean();
        return dk;
      }
      __name(pbkdf2, "pbkdf2");
      exports2.pbkdf2 = pbkdf2;
    });
  }
});

// node_modules/standardwebhooks/dist/timing_safe_equal.js
var require_timing_safe_equal = __commonJS({
  "node_modules/standardwebhooks/dist/timing_safe_equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timingSafeEqual = timingSafeEqual2;
    function assert(expr, msg = "") {
      if (!expr) {
        throw new Error(msg);
      }
    }
    __name(assert, "assert");
    function timingSafeEqual2(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
      }
      if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
      }
      assert(a instanceof DataView);
      assert(b instanceof DataView);
      const length = a.byteLength;
      let out = 0;
      let i = -1;
      while (++i < length) {
        out |= a.getUint8(i) ^ b.getUint8(i);
      }
      return out === 0;
    }
    __name(timingSafeEqual2, "timingSafeEqual");
  }
});

// node_modules/standardwebhooks/dist/index.js
var require_dist = __commonJS({
  "node_modules/standardwebhooks/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Webhook = exports.WebhookVerificationError = void 0;
    var base64 = require_base64();
    var sha2562 = require_sha256();
    var timing_safe_equal_1 = require_timing_safe_equal();
    var WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
    var ExtendableError = class _ExtendableError extends Error {
      static {
        __name(this, "ExtendableError");
      }
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _ExtendableError.prototype);
        this.name = "ExtendableError";
        this.stack = new Error(message).stack;
      }
    };
    var WebhookVerificationError = class _WebhookVerificationError extends ExtendableError {
      static {
        __name(this, "WebhookVerificationError");
      }
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _WebhookVerificationError.prototype);
        this.name = "WebhookVerificationError";
      }
    };
    exports.WebhookVerificationError = WebhookVerificationError;
    var Webhook2 = class _Webhook {
      static {
        __name(this, "Webhook");
      }
      constructor(secret, options) {
        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
          if (secret instanceof Uint8Array) {
            this.key = secret;
          } else {
            this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
          }
        } else {
          if (typeof secret !== "string") {
            throw new Error("Expected secret to be of type string");
          }
          if (secret.startsWith(_Webhook.prefix)) {
            secret = secret.substring(_Webhook.prefix.length);
          }
          this.key = base64.decode(secret);
        }
        if (this.key.length === 0) {
          throw new Error("Secret can't be empty.");
        }
      }
      verify(payload, headers, options) {
        var _a2;
        const jsonParse = (_a2 = options === null || options === void 0 ? void 0 : options.jsonParse) !== null && _a2 !== void 0 ? _a2 : true;
        const normalizedHeaders = {};
        for (const key of Object.keys(headers)) {
          normalizedHeaders[key.toLowerCase()] = headers[key];
        }
        const msgId = normalizedHeaders["webhook-id"];
        const msgSignature = normalizedHeaders["webhook-signature"];
        const msgTimestamp = normalizedHeaders["webhook-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
          throw new WebhookVerificationError("Missing required headers");
        }
        const timestamp = this.verifyTimestamp(msgTimestamp);
        const computedSignature = this.sign(msgId, timestamp, payload);
        const expectedSignature = computedSignature.split(",")[1];
        const passedSignatures = msgSignature.split(" ");
        const encoder2 = new globalThis.TextEncoder();
        for (const versionedSignature of passedSignatures) {
          const [version, signature] = versionedSignature.split(",");
          if (version !== "v1") {
            continue;
          }
          if ((0, timing_safe_equal_1.timingSafeEqual)(encoder2.encode(signature), encoder2.encode(expectedSignature))) {
            const payloadString = payload.toString();
            if (payloadString === "") {
              return void 0;
            }
            if (jsonParse) {
              return JSON.parse(payloadString);
            } else {
              return void 0;
            }
          }
        }
        throw new WebhookVerificationError("No matching signature found");
      }
      sign(msgId, timestamp, payload) {
        if (typeof payload === "string") {
        } else if (payload.constructor.name === "Buffer") {
          payload = payload.toString();
        } else {
          throw new Error("Expected payload to be of type string or Buffer.");
        }
        const encoder2 = new TextEncoder();
        const timestampNumber = Math.floor(timestamp.getTime() / 1e3);
        const toSign = encoder2.encode(`${msgId}.${timestampNumber}.${payload}`);
        const expectedSignature = base64.encode(sha2562.hmac(this.key, toSign));
        return `v1,${expectedSignature}`;
      }
      verifyTimestamp(timestampHeader) {
        const now = Math.floor(Date.now() / 1e3);
        const timestamp = parseInt(timestampHeader, 10);
        if (Number.isNaN(timestamp)) {
          throw new WebhookVerificationError("Invalid Signature Headers");
        }
        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too old");
        }
        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too new");
        }
        return new Date(timestamp * 1e3);
      }
    };
    exports.Webhook = Webhook2;
    Webhook2.prefix = "whsec_";
  }
});

// node_modules/dodopayments/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
__name(__classPrivateFieldSet, "__classPrivateFieldSet");
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
__name(__classPrivateFieldGet, "__classPrivateFieldGet");

// node_modules/dodopayments/internal/utils/uuid.mjs
var uuid4 = /* @__PURE__ */ __name(function() {
  const { crypto: crypto2 } = globalThis;
  if (crypto2?.randomUUID) {
    uuid4 = crypto2.randomUUID.bind(crypto2);
    return crypto2.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
}, "uuid4");

// node_modules/dodopayments/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
__name(isAbortError, "isAbortError");
var castToError = /* @__PURE__ */ __name((err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error.stack = err.stack;
        if (err.cause && !error.cause)
          error.cause = err.cause;
        if (err.name)
          error.name = err.name;
        return error;
      }
    } catch {
    }
    try {
      return new Error(JSON.stringify(err));
    } catch {
    }
  }
  return new Error(err);
}, "castToError");

// node_modules/dodopayments/core/error.mjs
var DodoPaymentsError = class extends Error {
  static {
    __name(this, "DodoPaymentsError");
  }
};
var APIError = class _APIError extends DodoPaymentsError {
  static {
    __name(this, "APIError");
  }
  constructor(status2, error, message, headers) {
    super(`${_APIError.makeMessage(status2, error, message)}`);
    this.status = status2;
    this.headers = headers;
    this.error = error;
  }
  static makeMessage(status2, error, message) {
    const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
    if (status2 && msg) {
      return `${status2} ${msg}`;
    }
    if (status2) {
      return `${status2} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status2, errorResponse, message, headers) {
    if (!status2 || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) });
    }
    const error = errorResponse;
    if (status2 === 400) {
      return new BadRequestError(status2, error, message, headers);
    }
    if (status2 === 401) {
      return new AuthenticationError(status2, error, message, headers);
    }
    if (status2 === 403) {
      return new PermissionDeniedError(status2, error, message, headers);
    }
    if (status2 === 404) {
      return new NotFoundError(status2, error, message, headers);
    }
    if (status2 === 409) {
      return new ConflictError(status2, error, message, headers);
    }
    if (status2 === 422) {
      return new UnprocessableEntityError(status2, error, message, headers);
    }
    if (status2 === 429) {
      return new RateLimitError(status2, error, message, headers);
    }
    if (status2 >= 500) {
      return new InternalServerError(status2, error, message, headers);
    }
    return new _APIError(status2, error, message, headers);
  }
};
var APIUserAbortError = class extends APIError {
  static {
    __name(this, "APIUserAbortError");
  }
  constructor({ message } = {}) {
    super(void 0, void 0, message || "Request was aborted.", void 0);
  }
};
var APIConnectionError = class extends APIError {
  static {
    __name(this, "APIConnectionError");
  }
  constructor({ message, cause }) {
    super(void 0, void 0, message || "Connection error.", void 0);
    if (cause)
      this.cause = cause;
  }
};
var APIConnectionTimeoutError = class extends APIConnectionError {
  static {
    __name(this, "APIConnectionTimeoutError");
  }
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
};
var BadRequestError = class extends APIError {
  static {
    __name(this, "BadRequestError");
  }
};
var AuthenticationError = class extends APIError {
  static {
    __name(this, "AuthenticationError");
  }
};
var PermissionDeniedError = class extends APIError {
  static {
    __name(this, "PermissionDeniedError");
  }
};
var NotFoundError = class extends APIError {
  static {
    __name(this, "NotFoundError");
  }
};
var ConflictError = class extends APIError {
  static {
    __name(this, "ConflictError");
  }
};
var UnprocessableEntityError = class extends APIError {
  static {
    __name(this, "UnprocessableEntityError");
  }
};
var RateLimitError = class extends APIError {
  static {
    __name(this, "RateLimitError");
  }
};
var InternalServerError = class extends APIError {
  static {
    __name(this, "InternalServerError");
  }
};

// node_modules/dodopayments/internal/utils/values.mjs
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = /* @__PURE__ */ __name((url) => {
  return startsWithSchemeRegexp.test(url);
}, "isAbsoluteURL");
var isArray = /* @__PURE__ */ __name((val) => (isArray = Array.isArray, isArray(val)), "isArray");
var isReadonlyArray = isArray;
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
__name(maybeObj, "maybeObj");
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
__name(isEmptyObj, "isEmptyObj");
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
__name(hasOwn, "hasOwn");
var validatePositiveInteger = /* @__PURE__ */ __name((name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new DodoPaymentsError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new DodoPaymentsError(`${name} must be a positive integer`);
  }
  return n;
}, "validatePositiveInteger");
var safeJSON = /* @__PURE__ */ __name((text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return void 0;
  }
}, "safeJSON");

// node_modules/dodopayments/internal/utils/sleep.mjs
var sleep = /* @__PURE__ */ __name((ms) => new Promise((resolve) => setTimeout(resolve, ms)), "sleep");

// node_modules/dodopayments/version.mjs
var VERSION = "2.61.0";

// node_modules/dodopayments/internal/detect-platform.mjs
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
__name(getDetectedPlatform, "getDetectedPlatform");
var getPlatformProperties = /* @__PURE__ */ __name(() => {
  const detectedPlatform = getDetectedPlatform();
  if (detectedPlatform === "deno") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version
    };
  }
  if (detectedPlatform === "node") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
}, "getPlatformProperties");
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec("Cloudflare-Workers");
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
__name(getBrowserInfo, "getBrowserInfo");
var normalizeArch = /* @__PURE__ */ __name((arch) => {
  if (arch === "x32")
    return "x32";
  if (arch === "x86_64" || arch === "x64")
    return "x64";
  if (arch === "arm")
    return "arm";
  if (arch === "aarch64" || arch === "arm64")
    return "arm64";
  if (arch)
    return `other:${arch}`;
  return "unknown";
}, "normalizeArch");
var normalizePlatform = /* @__PURE__ */ __name((platform) => {
  platform = platform.toLowerCase();
  if (platform.includes("ios"))
    return "iOS";
  if (platform === "android")
    return "Android";
  if (platform === "darwin")
    return "MacOS";
  if (platform === "win32")
    return "Windows";
  if (platform === "freebsd")
    return "FreeBSD";
  if (platform === "openbsd")
    return "OpenBSD";
  if (platform === "linux")
    return "Linux";
  if (platform)
    return `Other:${platform}`;
  return "Unknown";
}, "normalizePlatform");
var _platformHeaders;
var getPlatformHeaders = /* @__PURE__ */ __name(() => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
}, "getPlatformHeaders");

// node_modules/dodopayments/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new DodoPayments({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
__name(getDefaultFetch, "getDefaultFetch");
function makeReadableStream(...args) {
  const ReadableStream = globalThis.ReadableStream;
  if (typeof ReadableStream === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream(...args);
}
__name(makeReadableStream, "makeReadableStream");
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
__name(ReadableStreamFrom, "ReadableStreamFrom");
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}
__name(CancelReadableStream, "CancelReadableStream");

// node_modules/dodopayments/internal/request-options.mjs
var FallbackEncoder = /* @__PURE__ */ __name(({ headers, body: body2 }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body2)
  };
}, "FallbackEncoder");

// node_modules/dodopayments/internal/qs/formats.mjs
var default_format = "RFC3986";
var default_formatter = /* @__PURE__ */ __name((v) => String(v), "default_formatter");
var formatters = {
  RFC1738: /* @__PURE__ */ __name((v) => String(v).replace(/%20/g, "+"), "RFC1738"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/dodopayments/internal/qs/utils.mjs
var has = /* @__PURE__ */ __name((obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key)), "has");
var hex_table = /* @__PURE__ */ (() => {
  const array = [];
  for (let i = 0; i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }
  return array;
})();
var limit = 1024;
var encode = /* @__PURE__ */ __name((str, _defaultEncoder, charset, _kind, format) => {
  if (str.length === 0) {
    return str;
  }
  let string = str;
  if (typeof str === "symbol") {
    string = Symbol.prototype.toString.call(str);
  } else if (typeof str !== "string") {
    string = String(str);
  }
  if (charset === "iso-8859-1") {
    return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
      return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
    });
  }
  let out = "";
  for (let j = 0; j < string.length; j += limit) {
    const segment = string.length >= limit ? string.slice(j, j + limit) : string;
    const arr = [];
    for (let i = 0; i < segment.length; ++i) {
      let c = segment.charCodeAt(i);
      if (c === 45 || // -
      c === 46 || // .
      c === 95 || // _
      c === 126 || // ~
      c >= 48 && c <= 57 || // 0-9
      c >= 65 && c <= 90 || // a-z
      c >= 97 && c <= 122 || // A-Z
      format === RFC1738 && (c === 40 || c === 41)) {
        arr[arr.length] = segment.charAt(i);
        continue;
      }
      if (c < 128) {
        arr[arr.length] = hex_table[c];
        continue;
      }
      if (c < 2048) {
        arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
        continue;
      }
      if (c < 55296 || c >= 57344) {
        arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        continue;
      }
      i += 1;
      c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
      arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
    }
    out += arr.join("");
  }
  return out;
}, "encode");
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
__name(is_buffer, "is_buffer");
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}
__name(maybe_map, "maybe_map");

// node_modules/dodopayments/internal/qs/stringify.mjs
var array_prefix_generators = {
  brackets(prefix) {
    return String(prefix) + "[]";
  },
  comma: "comma",
  indices(prefix, key) {
    return String(prefix) + "[" + key + "]";
  },
  repeat(prefix) {
    return String(prefix);
  }
};
var push_to_array = /* @__PURE__ */ __name(function(arr, value_or_array) {
  Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
}, "push_to_array");
var toISOString;
var defaults = {
  addQueryPrefix: false,
  allowDots: false,
  allowEmptyArrays: false,
  arrayFormat: "indices",
  charset: "utf-8",
  charsetSentinel: false,
  delimiter: "&",
  encode: true,
  encodeDotInKeys: false,
  encoder: encode,
  encodeValuesOnly: false,
  format: default_format,
  formatter: default_formatter,
  /** @deprecated */
  indices: false,
  serializeDate(date) {
    return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
__name(is_non_nullish_primitive, "is_non_nullish_primitive");
var sentinel = {};
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder2, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder2 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder2(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder2) {
      const key_value = encodeValuesOnly ? prefix : encoder2(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder2(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder2) {
      obj = maybe_map(obj, encoder2);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder2,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
__name(inner_stringify, "inner_stringify");
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
__name(normalize_stringify_options, "normalize_stringify_options");
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
__name(stringify, "stringify");

// node_modules/dodopayments/internal/utils/query.mjs
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "comma" });
}
__name(stringifyQuery, "stringifyQuery");

// node_modules/dodopayments/internal/utils/log.mjs
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = /* @__PURE__ */ __name((maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return void 0;
}, "parseLogLevel");
function noop() {
}
__name(noop, "noop");
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
__name(makeLogFn, "makeLogFn");
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap();
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
__name(loggerFor, "loggerFor");
var formatRequestDetails = /* @__PURE__ */ __name((details) => {
  if (details.options) {
    details.options = { ...details.options };
    delete details.options["headers"];
  }
  if (details.headers) {
    details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
      name,
      name.toLowerCase() === "authorization" || name.toLowerCase() === "api-key" || name.toLowerCase() === "x-api-key" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
    ]));
  }
  if ("retryOfRequestLogID" in details) {
    if (details.retryOfRequestLogID) {
      details.retryOf = details.retryOfRequestLogID;
    }
    delete details.retryOfRequestLogID;
  }
  return details;
}, "formatRequestDetails");

// node_modules/dodopayments/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body2 = await (async () => {
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json3 = await response.json();
      return json3;
    }
    const text = await response.text();
    return text;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body: body2,
    durationMs: Date.now() - startTime
  }));
  return body2;
}
__name(defaultParseResponse, "defaultParseResponse");

// node_modules/dodopayments/core/api-promise.mjs
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  static {
    __name(this, "APIPromise");
  }
  constructor(client, responsePromise, parseResponse = defaultParseResponse) {
    super((resolve) => {
      resolve(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse;
    _APIPromise_client.set(this, void 0);
    __classPrivateFieldSet(this, _APIPromise_client, client, "f");
  }
  _thenUnwrap(transform) {
    return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => transform(await this.parseResponse(client, props), props));
  }
  /**
   * Gets the raw `Response` instance instead of parsing the response
   * data.
   *
   * If you want to parse the response body but still get the `Response`
   * instance, you can use {@link withResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  /**
   * Gets the parsed response data and the raw `Response` instance.
   *
   * If you just want to get the raw `Response` instance without parsing it,
   * you can use {@link asResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
};
_APIPromise_client = /* @__PURE__ */ new WeakMap();

// node_modules/dodopayments/core/pagination.mjs
var _AbstractPage_client;
var AbstractPage = class {
  static {
    __name(this, "AbstractPage");
  }
  constructor(client, response, body2, options) {
    _AbstractPage_client.set(this, void 0);
    __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body2;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageRequestOptions() != null;
  }
  async getNextPage() {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new DodoPaymentsError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async *iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
};
var PagePromise = class extends APIPromise {
  static {
    __name(this, "PagePromise");
  }
  constructor(client, request, Page) {
    super(client, request, async (client2, props) => new Page(client2, props.response, await defaultParseResponse(client2, props), props.options));
  }
  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
};
var DefaultPageNumberPagination = class extends AbstractPage {
  static {
    __name(this, "DefaultPageNumberPagination");
  }
  constructor(client, response, body2, options) {
    super(client, response, body2, options);
    this.items = body2.items || [];
  }
  getPaginatedItems() {
    return this.items ?? [];
  }
  nextPageRequestOptions() {
    const query = this.options.query;
    const currentPage = query?.page_number ?? 1;
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        page_number: currentPage + 1
      }
    };
  }
};
var CursorPagePagination = class extends AbstractPage {
  static {
    __name(this, "CursorPagePagination");
  }
  constructor(client, response, body2, options) {
    super(client, response, body2, options);
    this.data = body2.data || [];
    this.iterator = body2.iterator || "";
    this.done = body2.done || false;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageRequestOptions() {
    if (this.done === true) {
      return null;
    }
    const cursor = this.iterator;
    if (!cursor) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        iterator: cursor
      }
    };
  }
};

// node_modules/dodopayments/internal/uploads.mjs
var checkFileSupport = /* @__PURE__ */ __name(() => {
  if (typeof File === "undefined") {
    const { process } = globalThis;
    const isOldNode = typeof process?.versions?.node === "string" && parseInt(process.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
}, "checkFileSupport");
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
__name(makeFile, "makeFile");
function getName(value) {
  return (typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "").split(/[\\/]/).pop() || void 0;
}
__name(getName, "getName");
var isAsyncIterable = /* @__PURE__ */ __name((value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function", "isAsyncIterable");

// node_modules/dodopayments/internal/to-file.mjs
var isBlobLike = /* @__PURE__ */ __name((value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function", "isBlobLike");
var isFileLike = /* @__PURE__ */ __name((value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value), "isFileLike");
var isResponseLike = /* @__PURE__ */ __name((value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function", "isResponseLike");
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name || (name = getName(value));
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
__name(toFile, "toFile");
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
__name(getBytes, "getBytes");
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
__name(propsForError, "propsForError");

// node_modules/dodopayments/internal/utils/env.mjs
var readEnv = /* @__PURE__ */ __name((env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() || void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
  }
  return void 0;
}, "readEnv");

// node_modules/dodopayments/core/workload-identity.mjs
var _TokenManager_instances;
var _TokenManager_client;
var _TokenManager_options;
var _TokenManager_cache_get;
var _TokenManager_exchange;
var _TokenManager_post;
var TOKEN_PATH = "/workload-identity/token";
var REVOKE_PATH = "/workload-identity/token/revoke";
var IDENTITY_PROVIDER_ID_ENV = "DODO_PAYMENTS_IDENTITY_PROVIDER_ID";
var IDENTITY_TOKEN_FILE_ENV = "DODO_PAYMENTS_IDENTITY_TOKEN_FILE";
var KUBERNETES_TOKEN_PATH = "/var/run/secrets/tokens/dodo-token";
var REFRESH_WINDOW_MS = 300 * 1e3;
function configError(message) {
  return new DodoPaymentsError(message);
}
__name(configError, "configError");
function resolveOptions(bearerToken, options) {
  if (options) {
    if (bearerToken != null) {
      throw configError("The `bearerToken` and `workloadIdentity` client options are mutually exclusive. Give only one of them.");
    }
    if (options.identityProviderId && options.provider) {
      return options;
    }
    const identityProviderId2 = options.identityProviderId ?? readEnv(IDENTITY_PROVIDER_ID_ENV);
    if (!identityProviderId2) {
      throw configError(`The \`workloadIdentity\` client option needs an \`identityProviderId\`. Give it, or set the ${IDENTITY_PROVIDER_ID_ENV} environment variable.`);
    }
    return { identityProviderId: identityProviderId2, provider: options.provider ?? auto() };
  }
  if (bearerToken != null) {
    return void 0;
  }
  const identityProviderId = readEnv(IDENTITY_PROVIDER_ID_ENV);
  if (!identityProviderId) {
    return void 0;
  }
  const provider2 = detect();
  return provider2 ? { identityProviderId, provider: provider2 } : void 0;
}
__name(resolveOptions, "resolveOptions");
var caches2 = /* @__PURE__ */ new WeakMap();
function cacheFor(options, baseURL2) {
  let byURL = caches2.get(options);
  if (!byURL) {
    byURL = /* @__PURE__ */ new Map();
    caches2.set(options, byURL);
  }
  let cache = byURL.get(baseURL2);
  if (!cache) {
    cache = {};
    byURL.set(baseURL2, cache);
  }
  return cache;
}
__name(cacheFor, "cacheFor");
var TokenManager = class {
  static {
    __name(this, "TokenManager");
  }
  constructor(client, options) {
    _TokenManager_instances.add(this);
    _TokenManager_client.set(this, void 0);
    _TokenManager_options.set(this, void 0);
    __classPrivateFieldSet(this, _TokenManager_client, client, "f");
    __classPrivateFieldSet(this, _TokenManager_options, options, "f");
  }
  /**
   * Returns a valid access token. Concurrent calls share one token exchange.
   */
  async getToken() {
    const cache = __classPrivateFieldGet(this, _TokenManager_instances, "a", _TokenManager_cache_get);
    if (cache.token && cache.token.expiresAt - Date.now() > REFRESH_WINDOW_MS) {
      return cache.token.accessToken;
    }
    if (!cache.inflight) {
      cache.inflight = __classPrivateFieldGet(this, _TokenManager_instances, "m", _TokenManager_exchange).call(this).then((token) => {
        cache.token = token;
        cache.inflight = void 0;
        return token;
      }, (err) => {
        cache.inflight = void 0;
        throw err;
      });
    }
    return (await cache.inflight).accessToken;
  }
  /**
   * Clears the cache if it holds the access token of the given `Authorization` header value.
   */
  invalidate(authorization) {
    const cache = __classPrivateFieldGet(this, _TokenManager_instances, "a", _TokenManager_cache_get);
    if (cache.token && authorization === `Bearer ${cache.token.accessToken}`) {
      cache.token = void 0;
    }
  }
  async revoke() {
    const cache = __classPrivateFieldGet(this, _TokenManager_instances, "a", _TokenManager_cache_get);
    const token = cache.token;
    if (!token) {
      return;
    }
    cache.token = void 0;
    loggerFor(__classPrivateFieldGet(this, _TokenManager_client, "f")).debug("workload identity: revoking the access token");
    const response = await __classPrivateFieldGet(this, _TokenManager_instances, "m", _TokenManager_post).call(this, REVOKE_PATH, {
      Authorization: `Bearer ${token.accessToken}`
    });
    if (!response.ok) {
      throw await statusError(response);
    }
  }
};
_TokenManager_client = /* @__PURE__ */ new WeakMap(), _TokenManager_options = /* @__PURE__ */ new WeakMap(), _TokenManager_instances = /* @__PURE__ */ new WeakSet(), _TokenManager_cache_get = /* @__PURE__ */ __name(function _TokenManager_cache_get2() {
  return cacheFor(__classPrivateFieldGet(this, _TokenManager_options, "f"), __classPrivateFieldGet(this, _TokenManager_client, "f").baseURL);
}, "_TokenManager_cache_get"), _TokenManager_exchange = /* @__PURE__ */ __name(async function _TokenManager_exchange2() {
  const client = __classPrivateFieldGet(this, _TokenManager_client, "f");
  const subjectToken = await __classPrivateFieldGet(this, _TokenManager_options, "f").provider(subjectTokenContext(client));
  const body2 = JSON.stringify({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    subject_token: subjectToken,
    identity_provider_id: __classPrivateFieldGet(this, _TokenManager_options, "f").identityProviderId
  });
  loggerFor(client).debug("workload identity: exchanging the subject token for an access token");
  const response = await __classPrivateFieldGet(this, _TokenManager_instances, "m", _TokenManager_post).call(this, TOKEN_PATH, { "Content-Type": "application/json" }, body2);
  if (!response.ok) {
    throw await statusError(response);
  }
  const json3 = await response.json();
  const expiresAt = json3.expires_at ? Date.parse(json3.expires_at) : NaN;
  return {
    accessToken: json3.access_token,
    expiresAt: Number.isNaN(expiresAt) ? Date.now() + (json3.expires_in ?? 0) * 1e3 : expiresAt
  };
}, "_TokenManager_exchange"), _TokenManager_post = /**
 * Sends a POST request without the client `Authorization` header.
 * Retries connection errors and 5xx responses with the retry policy of the client, but never a 4xx response.
 */
/* @__PURE__ */ __name(async function _TokenManager_post2(path2, headers, body2) {
  const client = __classPrivateFieldGet(this, _TokenManager_client, "f");
  const url = client.buildURL(path2, void 0);
  for (let attempt = 0; ; attempt++) {
    const retriesRemaining = client.maxRetries - attempt;
    const response = await client.fetchWithTimeout(url, {
      ...client.fetchOptions ?? {},
      method: "POST",
      headers: { Accept: "application/json", ...headers },
      ...body2 !== void 0 && { body: body2 }
    }, client.timeout, new AbortController()).catch(castToError);
    if (response instanceof Error) {
      if (retriesRemaining > 0) {
        await sleep(retryDelayMillis(attempt));
        continue;
      }
      throw new APIConnectionError({ cause: response });
    }
    if (response.status >= 500 && retriesRemaining > 0) {
      await response.body?.cancel().catch(() => {
      });
      await sleep(retryDelayMillis(attempt));
      continue;
    }
    return response;
  }
}, "_TokenManager_post");
function retryDelayMillis(attempt) {
  const sleepSeconds = Math.min(0.5 * Math.pow(2, attempt), 8);
  return sleepSeconds * (1 - Math.random() * 0.25) * 1e3;
}
__name(retryDelayMillis, "retryDelayMillis");
async function statusError(response) {
  const errText = await response.text().catch((err) => castToError(err).message);
  const errJSON = safeJSON(errText);
  return APIError.generate(response.status, errJSON, errJSON ? void 0 : errText, response.headers);
}
__name(statusError, "statusError");
function subjectTokenContext(client) {
  return {
    baseURL: client.baseURL,
    audience: new URL(client.baseURL).origin,
    fetch: /* @__PURE__ */ __name((url, init) => client.fetchWithTimeout(url, init, client.timeout, new AbortController()), "fetch")
  };
}
__name(subjectTokenContext, "subjectTokenContext");
function nodeFS() {
  const process = globalThis.process;
  return process?.getBuiltinModule?.("node:fs");
}
__name(nodeFS, "nodeFS");
async function readTokenFile(path2) {
  const fs = nodeFS();
  if (!fs) {
    throw configError(`Cannot read the token file ${path2}: this runtime has no Node.js file system.`);
  }
  const token = String(await fs.promises.readFile(path2, "utf8")).trim();
  if (!token) {
    throw configError(`The token file ${path2} is empty.`);
  }
  return token;
}
__name(readTokenFile, "readTokenFile");
function fileExists(path2) {
  try {
    return Boolean(nodeFS()?.existsSync(path2));
  } catch {
    return false;
  }
}
__name(fileExists, "fileExists");
function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    throw configError(`The ${name} environment variable is missing or empty.`);
  }
  return value;
}
__name(requireEnv, "requireEnv");
async function fetchText(response, source) {
  if (!response.ok) {
    throw configError(`${source} returned status ${response.status}.`);
  }
  return (await response.text()).trim();
}
__name(fetchText, "fetchText");
function githubActions(audience) {
  return async (context) => {
    const requestURL = requireEnv("ACTIONS_ID_TOKEN_REQUEST_URL");
    const requestToken = requireEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN");
    const url = `${requestURL}&audience=${encodeURIComponent(audience ?? context.audience)}`;
    const response = await context.fetch(url, {
      method: "GET",
      headers: { Authorization: `bearer ${requestToken}`, Accept: "application/json" }
    });
    if (!response.ok) {
      throw configError(`The GitHub Actions OIDC endpoint returned status ${response.status}.`);
    }
    const json3 = await response.json();
    if (!json3.value) {
      throw configError("The GitHub Actions OIDC endpoint returned no token.");
    }
    return json3.value;
  };
}
__name(githubActions, "githubActions");
function gitlab(envVar = "DODO_PAYMENTS_ID_TOKEN") {
  return () => requireEnv(envVar);
}
__name(gitlab, "gitlab");
function terraformCloud() {
  return () => readEnv("TFC_WORKLOAD_IDENTITY_TOKEN_DODO") ?? requireEnv("TFC_WORKLOAD_IDENTITY_TOKEN");
}
__name(terraformCloud, "terraformCloud");
function gcp(audience) {
  return async (context) => {
    const url = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience ?? context.audience)}&format=full`;
    const response = await context.fetch(url, { method: "GET", headers: { "Metadata-Flavor": "Google" } });
    return fetchText(response, "The GCP metadata server");
  };
}
__name(gcp, "gcp");
var VERCEL_TOKEN_URL = "https://oidc.vercel.com/~token";
var VERCEL_TIMEOUT_MS = 10 * 1e3;
function vercelRequestToken() {
  const requestContext = Reflect.get(globalThis, /* @__PURE__ */ Symbol.for("@vercel/request-context"));
  return requestContext?.get?.()?.headers?.["x-vercel-oidc-token"] || void 0;
}
__name(vercelRequestToken, "vercelRequestToken");
async function vercelBaseToken() {
  const requestToken = vercelRequestToken();
  if (requestToken) {
    return requestToken;
  }
  const tokenFile = readEnv("VERCEL_OIDC_TOKEN_FILE");
  if (tokenFile) {
    return readTokenFile(tokenFile);
  }
  const token = readEnv("VERCEL_OIDC_TOKEN");
  if (!token) {
    throw configError("Cannot find a Vercel OIDC token. Run on Vercel, or set VERCEL_OIDC_TOKEN_FILE or VERCEL_OIDC_TOKEN.");
  }
  return token;
}
__name(vercelBaseToken, "vercelBaseToken");
function vercel(audience) {
  return async (context) => {
    const baseToken = await vercelBaseToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VERCEL_TIMEOUT_MS);
    let response;
    let text;
    try {
      response = await context.fetch(VERCEL_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token: baseToken, aud: audience ?? context.audience }),
        signal: controller.signal
      });
      text = await response.text();
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      throw configError(`The Vercel OIDC token endpoint returned status ${response.status}: ${text.slice(0, 200)}`);
    }
    const json3 = safeJSON(text);
    if (!json3 || typeof json3.token !== "string" || !json3.token) {
      throw configError(`The Vercel OIDC token endpoint returned no token (status ${response.status}).`);
    }
    return json3.token;
  };
}
__name(vercel, "vercel");
function kubernetes(path2 = KUBERNETES_TOKEN_PATH) {
  return () => readTokenFile(path2);
}
__name(kubernetes, "kubernetes");
function file(path2) {
  const tokenPath = path2 ?? requireEnv(IDENTITY_TOKEN_FILE_ENV);
  return () => readTokenFile(tokenPath);
}
__name(file, "file");
function aws(fn) {
  return () => fn();
}
__name(aws, "aws");
function staticToken(token) {
  return () => token;
}
__name(staticToken, "staticToken");
function detect() {
  if (readEnv("ACTIONS_ID_TOKEN_REQUEST_URL") && readEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN")) {
    return githubActions();
  }
  if (readEnv("TFC_WORKLOAD_IDENTITY_TOKEN_DODO") || readEnv("TFC_WORKLOAD_IDENTITY_TOKEN")) {
    return terraformCloud();
  }
  const tokenFile = readEnv(IDENTITY_TOKEN_FILE_ENV);
  if (tokenFile) {
    return file(tokenFile);
  }
  if (fileExists(KUBERNETES_TOKEN_PATH)) {
    return kubernetes();
  }
  return void 0;
}
__name(detect, "detect");
function auto() {
  const provider2 = detect();
  if (!provider2) {
    throw configError(`Cannot find a workload identity token source. Give a \`provider\`, or set ${IDENTITY_TOKEN_FILE_ENV}.`);
  }
  return provider2;
}
__name(auto, "auto");
var helpers = {
  githubActions,
  gitlab,
  terraformCloud,
  gcp,
  vercel,
  kubernetes,
  file,
  aws,
  static: staticToken,
  auto
};

// node_modules/dodopayments/core/resource.mjs
var APIResource = class {
  static {
    __name(this, "APIResource");
  }
  constructor(client) {
    this._client = client;
  }
};

// node_modules/dodopayments/internal/headers.mjs
var brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
__name(iterateHeaders, "iterateHeaders");
var buildHeaders = /* @__PURE__ */ __name((newHeaders) => {
  const targetHeaders = new Headers();
  const nullHeaders = /* @__PURE__ */ new Set();
  for (const headers of newHeaders) {
    const seenHeaders = /* @__PURE__ */ new Set();
    for (const [name, value] of iterateHeaders(headers)) {
      const lowerName = name.toLowerCase();
      if (!seenHeaders.has(lowerName)) {
        targetHeaders.delete(name);
        seenHeaders.add(lowerName);
      }
      if (value === null) {
        targetHeaders.delete(name);
        nullHeaders.add(lowerName);
      } else {
        targetHeaders.append(name, value);
        nullHeaders.delete(lowerName);
      }
    }
  }
  return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
}, "buildHeaders");

// node_modules/dodopayments/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
__name(encodeURIPath, "encodeURIPath");
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = /* @__PURE__ */ __name((pathEncoder = encodeURIPath) => /* @__PURE__ */ __name(function path2(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path3 = statics.reduce((previousValue, currentValue, index) => {
    if (/[?#]/.test(currentValue)) {
      postPath = true;
    }
    const value = params[index];
    let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
    if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
    value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
      encoded = value + "";
      invalidSegments.push({
        start: previousValue.length + currentValue.length,
        length: encoded.length,
        error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
      });
    }
    return previousValue + currentValue + (index === params.length ? "" : encoded);
  }, "");
  const pathOnly = path3.split(/[?#]/, 1)[0];
  const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
  let match;
  while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
    invalidSegments.push({
      start: match.index,
      length: match[0].length,
      error: `Value "${match[0]}" can't be safely passed as a path parameter`
    });
  }
  invalidSegments.sort((a, b) => a.start - b.start);
  if (invalidSegments.length > 0) {
    let lastEnd = 0;
    const underline = invalidSegments.reduce((acc, segment) => {
      const spaces = " ".repeat(segment.start - lastEnd);
      const arrows = "^".repeat(segment.length);
      lastEnd = segment.start + segment.length;
      return acc + spaces + arrows;
    }, "");
    throw new DodoPaymentsError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path3}
${underline}`);
  }
  return path3;
}, "path"), "createPathTagFunction");
var path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);

// node_modules/dodopayments/resources/addons/translations.mjs
var Translations = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const translationsListResponse =
   *   await client.addons.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/addons/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const translation = await client.addons.translations.update(
   *   'ar',
   *   { id: 'id' },
   * );
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/addons/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.addons.translations.delete('ar', { id: 'id' });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/addons/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/addons/addons.mjs
var Addons = class extends APIResource {
  static {
    __name(this, "Addons");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const addonResponse of client.addons.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/addons", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const addonResponse = await client.addons.create({
   *   currency: 'AED',
   *   name: 'name',
   *   price: 0,
   *   tax_category: 'digital_products',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/addons", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const addonResponse = await client.addons.retrieve(
   *   'adn_NX1zdqW4Hbivsqz8vI9dc',
   * );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/addons/${id}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const addonResponse = await client.addons.update(
   *   'adn_NX1zdqW4Hbivsqz8vI9dc',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/addons/${id}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const response = await client.addons.updateImages(
   *   'adn_NX1zdqW4Hbivsqz8vI9dc',
   * );
   * ```
   */
  updateImages(id, options) {
    return this._client.put(path`/addons/${id}/images`, options);
  }
  /**
   * @example
   * ```ts
   * await client.addons.delete('adn_NX1zdqW4Hbivsqz8vI9dc');
   * ```
   */
  delete(id, options) {
    return this._client.delete(path`/addons/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.addons.unarchive('adn_NX1zdqW4Hbivsqz8vI9dc');
   * ```
   */
  unarchive(id, options) {
    return this._client.post(path`/addons/${id}/unarchive`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Addons.Translations = Translations;

// node_modules/dodopayments/resources/balances.mjs
var Balances = class extends APIResource {
  static {
    __name(this, "Balances");
  }
  retrieveLedger(query = {}, options) {
    return this._client.getAPIList("/balances/ledger", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
};

// node_modules/dodopayments/resources/blocklist/customers/notes.mjs
var Notes = class extends APIResource {
  static {
    __name(this, "Notes");
  }
  create(entryID, body2, options) {
    return this._client.post(path`/blocklist/customers/${entryID}/notes`, { body: body2, ...options });
  }
  update(noteID, params, options) {
    const { entry_id, ...body2 } = params;
    return this._client.patch(path`/blocklist/customers/${entry_id}/notes/${noteID}`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/blocklist/customers/customers.mjs
var Customers = class extends APIResource {
  static {
    __name(this, "Customers");
  }
  constructor() {
    super(...arguments);
    this.notes = new Notes(this._client);
  }
  list(query = {}, options) {
    return this._client.getAPIList("/blocklist/customers", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  create(body2, options) {
    return this._client.post("/blocklist/customers", { body: body2, ...options });
  }
  retrieve(entryID, options) {
    return this._client.get(path`/blocklist/customers/${entryID}`, options);
  }
  delete(entryID, options) {
    return this._client.delete(path`/blocklist/customers/${entryID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Customers.Notes = Notes;

// node_modules/dodopayments/resources/blocklist/blocklist.mjs
var Blocklist = class extends APIResource {
  static {
    __name(this, "Blocklist");
  }
  constructor() {
    super(...arguments);
    this.customers = new Customers(this._client);
  }
};
Blocklist.Customers = Customers;

// node_modules/dodopayments/resources/brands.mjs
var Brands = class extends APIResource {
  static {
    __name(this, "Brands");
  }
  /**
   * @example
   * ```ts
   * const brands = await client.brands.list();
   * ```
   */
  list(query = {}, options) {
    return this._client.get("/brands", { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const brand = await client.brands.create();
   * ```
   */
  create(body2, options) {
    return this._client.post("/brands", { body: body2, ...options });
  }
  /**
   * Thin handler just calls `get_brand` and wraps in `Json(...)`
   *
   * @example
   * ```ts
   * const brand = await client.brands.retrieve(
   *   'brnd_8dFiAW42v28JzhlVSocjq',
   * );
   * ```
   */
  retrieve(id, options) {
    return this._client.get(path`/brands/${id}`, options);
  }
  /**
   * @example
   * ```ts
   * const brand = await client.brands.update(
   *   'brnd_8dFiAW42v28JzhlVSocjq',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/brands/${id}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const response = await client.brands.updateImages(
   *   'brnd_8dFiAW42v28JzhlVSocjq',
   * );
   * ```
   */
  updateImages(id, options) {
    return this._client.put(path`/brands/${id}/images`, options);
  }
  /**
   * Archive a brand. Its products, live subscriptions, and product collections move
   * to the `move_products_to` brand. Archive is permanent.
   *
   * @example
   * ```ts
   * const response = await client.brands.archive(
   *   'brnd_8dFiAW42v28JzhlVSocjq',
   * );
   * ```
   */
  archive(id, body2, options) {
    return this._client.post(path`/brands/${id}/archive`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/checkout-sessions.mjs
var CheckoutSessions = class extends APIResource {
  static {
    __name(this, "CheckoutSessions");
  }
  /**
   * @example
   * ```ts
   * const checkoutSessionResponse =
   *   await client.checkoutSessions.create({
   *     product_cart: [
   *       { product_id: 'product_id', quantity: 0 },
   *     ],
   *   });
   * ```
   */
  create(body2, options) {
    return this._client.post("/checkouts", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const checkoutSessionStatus =
   *   await client.checkoutSessions.retrieve(
   *     'cks_n010SZaY4NXc7F1ck3Tq1',
   *   );
   * ```
   */
  retrieve(id, options) {
    return this._client.get(path`/checkouts/${id}`, options);
  }
  /**
   * @example
   * ```ts
   * const response = await client.checkoutSessions.preview({
   *   product_cart: [{ product_id: 'product_id', quantity: 0 }],
   * });
   * ```
   */
  preview(params, options) {
    const { locale, ...body2 } = params;
    return this._client.post("/checkouts/preview", { query: { locale }, body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/credit-entitlements/balances.mjs
var Balances2 = class extends APIResource {
  static {
    __name(this, "Balances");
  }
  /**
   * Returns a paginated list of customer credit balances for the given credit
   * entitlement.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Path Parameters
   *
   * - `credit_entitlement_id` - The unique identifier of the credit entitlement
   *
   * # Query Parameters
   *
   * - `page_size` - Number of items per page (default: 10, max: 100)
   * - `page_number` - Zero-based page number (default: 0)
   * - `customer_id` - Optional filter by specific customer
   *
   * # Responses
   *
   * - `200 OK` - Returns list of customer balances
   * - `404 Not Found` - Credit entitlement not found
   * - `500 Internal Server Error` - Database or server error
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const customerCreditBalance of client.creditEntitlements.balances.list(
   *   'cde_ztxm5XJsKxWucRWA3rjdM',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(creditEntitlementID, query = {}, options) {
    return this._client.getAPIList(path`/credit-entitlements/${creditEntitlementID}/balances`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Returns the credit balance details for a specific customer and credit
   * entitlement.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Path Parameters
   *
   * - `credit_entitlement_id` - The unique identifier of the credit entitlement
   * - `customer_id` - The unique identifier of the customer
   *
   * # Responses
   *
   * - `200 OK` - Returns the customer's balance
   * - `404 Not Found` - Credit entitlement or customer balance not found
   * - `500 Internal Server Error` - Database or server error
   *
   * @example
   * ```ts
   * const customerCreditBalance =
   *   await client.creditEntitlements.balances.retrieve(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *     { credit_entitlement_id: 'cde_ztxm5XJsKxWucRWA3rjdM' },
   *   );
   * ```
   */
  retrieve(customerID, params, options) {
    const { credit_entitlement_id } = params;
    return this._client.get(path`/credit-entitlements/${credit_entitlement_id}/balances/${customerID}`, options);
  }
  /**
   * Returns a paginated list of credit grants with optional filtering by status.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Path Parameters
   *
   * - `credit_entitlement_id` - The unique identifier of the credit entitlement
   * - `customer_id` - The unique identifier of the customer
   *
   * # Query Parameters
   *
   * - `page_size` - Number of items per page (default: 10, max: 100)
   * - `page_number` - Zero-based page number (default: 0)
   * - `status` - Filter by status: active, expired, depleted
   *
   * # Responses
   *
   * - `200 OK` - Returns list of grants
   * - `404 Not Found` - Credit entitlement not found
   * - `500 Internal Server Error` - Database or server error
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const balanceListGrantsResponse of client.creditEntitlements.balances.listGrants(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   *   { credit_entitlement_id: 'cde_ztxm5XJsKxWucRWA3rjdM' },
   * )) {
   *   // ...
   * }
   * ```
   */
  listGrants(customerID, params, options) {
    const { credit_entitlement_id, ...query } = params;
    return this._client.getAPIList(path`/credit-entitlements/${credit_entitlement_id}/balances/${customerID}/grants`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Returns a paginated list of credit transaction history with optional filtering.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Path Parameters
   *
   * - `credit_entitlement_id` - The unique identifier of the credit entitlement
   * - `customer_id` - The unique identifier of the customer
   *
   * # Query Parameters
   *
   * - `page_size` - Number of items per page (default: 10, max: 100)
   * - `page_number` - Zero-based page number (default: 0)
   * - `transaction_type` - Filter by transaction type
   * - `start_date` - Filter entries from this date
   * - `end_date` - Filter entries until this date
   *
   * # Responses
   *
   * - `200 OK` - Returns list of ledger entries
   * - `404 Not Found` - Credit entitlement not found
   * - `500 Internal Server Error` - Database or server error
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const creditLedgerEntry of client.creditEntitlements.balances.listLedger(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   *   { credit_entitlement_id: 'cde_ztxm5XJsKxWucRWA3rjdM' },
   * )) {
   *   // ...
   * }
   * ```
   */
  listLedger(customerID, params, options) {
    const { credit_entitlement_id, ...query } = params;
    return this._client.getAPIList(path`/credit-entitlements/${credit_entitlement_id}/balances/${customerID}/ledger`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * For credit entries, a new grant is created. For debit entries, credits are
   * deducted from existing grants using FIFO (oldest first).
   *
   * # Authentication
   *
   * Requires an API key with `Editor` role.
   *
   * # Path Parameters
   *
   * - `credit_entitlement_id` - The unique identifier of the credit entitlement
   * - `customer_id` - The unique identifier of the customer
   *
   * # Request Body
   *
   * - `entry_type` - "credit" or "debit"
   * - `amount` - Amount to credit or debit
   * - `reason` - Optional human-readable reason
   * - `expires_at` - Optional expiration for credited amount (only for credit type)
   * - `idempotency_key` - Optional key to prevent duplicate entries
   * - `metadata` - Optional key-value pairs
   *
   * # Responses
   *
   * - `201 Created` - Ledger entry created successfully
   * - `400 Bad Request` - Invalid request (e.g., debit with insufficient balance)
   * - `404 Not Found` - Credit entitlement or customer not found
   * - `409 Conflict` - Idempotency key already exists
   * - `500 Internal Server Error` - Database or server error
   *
   * @example
   * ```ts
   * const response =
   *   await client.creditEntitlements.balances.createLedgerEntry(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *     {
   *       credit_entitlement_id: 'cde_ztxm5XJsKxWucRWA3rjdM',
   *       amount: 'amount',
   *       entry_type: 'credit',
   *     },
   *   );
   * ```
   */
  createLedgerEntry(customerID, params, options) {
    const { credit_entitlement_id, ...body2 } = params;
    return this._client.post(path`/credit-entitlements/${credit_entitlement_id}/balances/${customerID}/ledger-entries`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/credit-entitlements/translations.mjs
var Translations2 = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const creditEntitlementTranslationsListResponse =
   *   await client.creditEntitlements.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/credit-entitlements/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const creditEntitlementTranslation =
   *   await client.creditEntitlements.translations.update(
   *     'ar',
   *     { id: 'id' },
   *   );
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/credit-entitlements/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.creditEntitlements.translations.delete('ar', {
   *   id: 'id',
   * });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/credit-entitlements/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/credit-entitlements/credit-entitlements.mjs
var CreditEntitlements = class extends APIResource {
  static {
    __name(this, "CreditEntitlements");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations2(this._client);
    this.balances = new Balances2(this._client);
  }
  /**
   * Returns a paginated list of credit entitlements, allowing filtering of deleted
   * entitlements. By default, only non-deleted entitlements are returned.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Query Parameters
   *
   * - `page_size` - Number of items per page (default: 10, max: 100)
   * - `page_number` - Zero-based page number (default: 0)
   * - `deleted` - Boolean flag to list deleted entitlements instead of active ones
   *   (default: false)
   *
   * # Responses
   *
   * - `200 OK` - Returns a list of credit entitlements wrapped in a response object
   * - `422 Unprocessable Entity` - Invalid query parameters (e.g., page_size > 100)
   * - `500 Internal Server Error` - Database or server error
   *
   * # Business Logic
   *
   * - Results are ordered by creation date in descending order (newest first)
   * - Only entitlements belonging to the authenticated business are returned
   * - The `deleted` parameter controls visibility of soft-deleted entitlements
   * - Pagination uses offset-based pagination (offset = page_number \* page_size)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const creditEntitlement of client.creditEntitlements.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/credit-entitlements", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * Credit entitlements define reusable credit templates that can be attached to
   * products. Each entitlement defines how credits behave in terms of expiration,
   * rollover, and overage.
   *
   * # Authentication
   *
   * Requires an API key with `Editor` role.
   *
   * # Request Body
   *
   * - `name` - Human-readable name of the credit entitlement (1-255 characters,
   *   required)
   * - `description` - Optional description (max 1000 characters)
   * - `precision` - Decimal precision for credit amounts (0-10 decimal places)
   * - `unit` - Unit of measurement for the credit (e.g., "API Calls", "Tokens",
   *   "Credits")
   * - `expires_after_days` - Number of days after which credits expire (optional)
   * - `rollover_enabled` - Whether unused credits can rollover to the next period
   * - `rollover_percentage` - Percentage of unused credits that rollover (0-100)
   * - `rollover_timeframe_count` - Count of timeframe periods for rollover limit
   * - `rollover_timeframe_interval` - Interval type (day, week, month, year)
   * - `max_rollover_count` - Maximum number of times credits can be rolled over
   * - `overage_enabled` - Whether overage charges apply when credits run out
   *   (requires price_per_unit)
   * - `overage_limit` - Maximum overage units allowed (optional)
   * - `currency` - Currency for pricing (required if price_per_unit is set)
   * - `price_per_unit` - Price per credit unit (decimal)
   *
   * # Responses
   *
   * - `201 Created` - Credit entitlement created successfully, returns the full
   *   entitlement object
   * - `422 Unprocessable Entity` - Invalid request parameters or validation failure
   * - `500 Internal Server Error` - Database or server error
   *
   * # Business Logic
   *
   * - A unique ID with prefix `cde_` is automatically generated for the entitlement
   * - Created and updated timestamps are automatically set
   * - Currency is required when price_per_unit is set
   * - price_per_unit is required when overage_enabled is true
   * - rollover_timeframe_count and rollover_timeframe_interval must both be set or
   *   both be null
   *
   * @example
   * ```ts
   * const creditEntitlement =
   *   await client.creditEntitlements.create({
   *     name: 'name',
   *     overage_enabled: true,
   *     precision: 0,
   *     rollover_enabled: true,
   *     unit: 'unit',
   *   });
   * ```
   */
  create(body2, options) {
    return this._client.post("/credit-entitlements", { body: body2, ...options });
  }
  /**
   * Returns the full details of a single credit entitlement including all
   * configuration settings for expiration, rollover, and overage policies.
   *
   * # Authentication
   *
   * Requires an API key with `Viewer` role or higher.
   *
   * # Path Parameters
   *
   * - `id` - The unique identifier of the credit entitlement (format: `cde_...`)
   *
   * # Responses
   *
   * - `200 OK` - Returns the full credit entitlement object
   * - `404 Not Found` - Credit entitlement does not exist or does not belong to the
   *   authenticated business
   * - `500 Internal Server Error` - Database or server error
   *
   * # Business Logic
   *
   * - Only non-deleted credit entitlements can be retrieved through this endpoint
   * - The entitlement must belong to the authenticated business (business_id check)
   * - Deleted entitlements return a 404 error and must be retrieved via the list
   *   endpoint with `deleted=true`
   *
   * @example
   * ```ts
   * const creditEntitlement =
   *   await client.creditEntitlements.retrieve(
   *     'cde_ztxm5XJsKxWucRWA3rjdM',
   *   );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/credit-entitlements/${id}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.creditEntitlements.delete(
   *   'cde_ztxm5XJsKxWucRWA3rjdM',
   * );
   * ```
   */
  delete(id, options) {
    return this._client.delete(path`/credit-entitlements/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Allows partial updates to a credit entitlement's configuration. Only the fields
   * provided in the request body will be updated; all other fields remain unchanged.
   * This endpoint supports nullable fields using the double option pattern.
   *
   * # Authentication
   *
   * Requires an API key with `Editor` role.
   *
   * # Path Parameters
   *
   * - `id` - The unique identifier of the credit entitlement to update (format:
   *   `cde_...`)
   *
   * # Request Body (all fields optional)
   *
   * - `name` - Human-readable name of the credit entitlement (1-255 characters)
   * - `description` - Optional description (max 1000 characters)
   * - `unit` - Unit of measurement for the credit (1-50 characters)
   *
   * Note: `precision` cannot be modified after creation as it would invalidate
   * existing grants.
   *
   * - `expires_after_days` - Number of days after which credits expire (use `null`
   *   to remove expiration)
   * - `rollover_enabled` - Whether unused credits can rollover to the next period
   * - `rollover_percentage` - Percentage of unused credits that rollover (0-100,
   *   nullable)
   * - `rollover_timeframe_count` - Count of timeframe periods for rollover limit
   *   (nullable)
   * - `rollover_timeframe_interval` - Interval type (day, week, month, year,
   *   nullable)
   * - `max_rollover_count` - Maximum number of times credits can be rolled over
   *   (nullable)
   * - `overage_enabled` - Whether overage charges apply when credits run out
   * - `overage_limit` - Maximum overage units allowed (nullable)
   * - `currency` - Currency for pricing (nullable)
   * - `price_per_unit` - Price per credit unit (decimal, nullable)
   *
   * # Responses
   *
   * - `200 OK` - Credit entitlement updated successfully
   * - `404 Not Found` - Credit entitlement does not exist or does not belong to the
   *   authenticated business
   * - `422 Unprocessable Entity` - Invalid request parameters or validation failure
   * - `500 Internal Server Error` - Database or server error
   *
   * # Business Logic
   *
   * - Only non-deleted credit entitlements can be updated
   * - Fields set to `null` explicitly will clear the database value (using double
   *   option pattern)
   * - The `updated_at` timestamp is automatically updated on successful modification
   * - Changes take effect immediately but do not retroactively affect existing
   *   credit grants
   * - The merged state is validated: currency required with price, rollover
   *   timeframe fields together, price required for overage
   *
   * @example
   * ```ts
   * await client.creditEntitlements.update(
   *   'cde_ztxm5XJsKxWucRWA3rjdM',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/credit-entitlements/${id}`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Undeletes a soft-deleted credit entitlement by clearing `deleted_at`, making it
   * available again through standard list and get endpoints.
   *
   * # Authentication
   *
   * Requires an API key with `Editor` role.
   *
   * # Path Parameters
   *
   * - `id` - The unique identifier of the credit entitlement to restore (format:
   *   `cde_...`)
   *
   * # Responses
   *
   * - `200 OK` - Credit entitlement restored successfully
   * - `500 Internal Server Error` - Database error, entitlement not found, or
   *   entitlement is not deleted
   *
   * # Business Logic
   *
   * - Only deleted credit entitlements can be restored
   * - The query filters for `deleted_at IS NOT NULL`, so non-deleted entitlements
   *   will result in 0 rows affected
   * - If no rows are affected (entitlement doesn't exist, doesn't belong to
   *   business, or is not deleted), returns 500
   * - The `updated_at` timestamp is automatically updated on successful restoration
   * - Once restored, the entitlement becomes immediately available in the standard
   *   list and get endpoints
   * - All configuration settings are preserved during delete/restore operations
   *
   * # Error Handling
   *
   * This endpoint returns 500 Internal Server Error in several cases:
   *
   * - The credit entitlement does not exist
   * - The credit entitlement belongs to a different business
   * - The credit entitlement is not currently deleted (already active)
   *
   * Callers should verify the entitlement exists and is deleted before calling this
   * endpoint.
   *
   * @example
   * ```ts
   * await client.creditEntitlements.undelete(
   *   'cde_ztxm5XJsKxWucRWA3rjdM',
   * );
   * ```
   */
  undelete(id, options) {
    return this._client.post(path`/credit-entitlements/${id}/undelete`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
CreditEntitlements.Translations = Translations2;
CreditEntitlements.Balances = Balances2;

// node_modules/dodopayments/resources/customers/customer-portal.mjs
var CustomerPortal = class extends APIResource {
  static {
    __name(this, "CustomerPortal");
  }
  /**
   * @example
   * ```ts
   * const customerPortalSession =
   *   await client.customers.customerPortal.create(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *   );
   * ```
   */
  create(customerID, params = {}, options) {
    const { return_url, send_email } = params ?? {};
    return this._client.post(path`/customers/${customerID}/customer-portal/session`, {
      query: { return_url, send_email },
      ...options
    });
  }
};

// node_modules/dodopayments/resources/customers/emails.mjs
var Emails = class extends APIResource {
  static {
    __name(this, "Emails");
  }
  /**
   * Returns every transactional email sent to this customer in the last 180 days,
   * newest first, with its delivery outcome. Delivery status comes from the email
   * provider and is as fresh as replication, typically seconds.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const emailLogItem of client.customers.emails.list(
   *   'customer_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(customerID, query = {}, options) {
    return this._client.getAPIList(path`/customers/${customerID}/emails`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Returns the email exactly as it was sent, plus the reason it failed when it did.
   * Some emails have no body to show: an authentication email carries a live login
   * token, a blocked email never reached the provider, and the provider clears
   * bodies at 180 days.
   *
   * @example
   * ```ts
   * const emailBody =
   *   await client.customers.emails.retrieveBody(
   *     'email_log_id',
   *     { customer_id: 'customer_id' },
   *   );
   * ```
   */
  retrieveBody(emailLogID, params, options) {
    const { customer_id } = params;
    return this._client.get(path`/customers/${customer_id}/emails/${emailLogID}/body`, options);
  }
};

// node_modules/dodopayments/resources/customers/wallets/ledger-entries.mjs
var LedgerEntries = class extends APIResource {
  static {
    __name(this, "LedgerEntries");
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const customerWalletTransaction of client.customers.wallets.ledgerEntries.list(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(customerID, query = {}, options) {
    return this._client.getAPIList(path`/customers/${customerID}/wallets/ledger-entries`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const customerWallet =
   *   await client.customers.wallets.ledgerEntries.create(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *     {
   *       amount: 0,
   *       currency: 'AED',
   *       entry_type: 'credit',
   *     },
   *   );
   * ```
   */
  create(customerID, body2, options) {
    return this._client.post(path`/customers/${customerID}/wallets/ledger-entries`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/customers/wallets/wallets.mjs
var Wallets = class extends APIResource {
  static {
    __name(this, "Wallets");
  }
  constructor() {
    super(...arguments);
    this.ledgerEntries = new LedgerEntries(this._client);
  }
  /**
   * @example
   * ```ts
   * const wallets = await client.customers.wallets.list(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * );
   * ```
   */
  list(customerID, options) {
    return this._client.get(path`/customers/${customerID}/wallets`, options);
  }
};
Wallets.LedgerEntries = LedgerEntries;

// node_modules/dodopayments/resources/customers/customers.mjs
var Customers2 = class extends APIResource {
  static {
    __name(this, "Customers");
  }
  constructor() {
    super(...arguments);
    this.customerPortal = new CustomerPortal(this._client);
    this.wallets = new Wallets(this._client);
    this.emails = new Emails(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const customer of client.customers.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/customers", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const customer = await client.customers.retrieve(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * );
   * ```
   */
  retrieve(customerID, options) {
    return this._client.get(path`/customers/${customerID}`, options);
  }
  /**
   * @example
   * ```ts
   * const customer = await client.customers.create({
   *   email: 'email',
   *   name: 'name',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/customers", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const customer = await client.customers.update(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * );
   * ```
   */
  update(customerID, body2, options) {
    return this._client.patch(path`/customers/${customerID}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.customers.retrievePaymentMethods(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *   );
   * ```
   */
  retrievePaymentMethods(customerID, options) {
    return this._client.get(path`/customers/${customerID}/payment-methods`, options);
  }
  /**
   * List all credit entitlements for a customer with their current balances
   *
   * @example
   * ```ts
   * const response =
   *   await client.customers.listCreditEntitlements(
   *     'cus_TV52uJWWXt2yIoBBxpjaa',
   *   );
   * ```
   */
  listCreditEntitlements(customerID, options) {
    return this._client.get(path`/customers/${customerID}/credit-entitlements`, options);
  }
  /**
   * @example
   * ```ts
   * await client.customers.deletePaymentMethod(
   *   'payment_method_id',
   *   { customer_id: 'cus_TV52uJWWXt2yIoBBxpjaa' },
   * );
   * ```
   */
  deletePaymentMethod(paymentMethodID, params, options) {
    const { customer_id } = params;
    return this._client.delete(path`/customers/${customer_id}/payment-methods/${paymentMethodID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * List all entitlement grants delivered (or in flight) to a customer.
   *
   * @example
   * ```ts
   * const response = await client.customers.listEntitlements(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * );
   * ```
   */
  listEntitlements(customerID, options) {
    return this._client.get(path`/customers/${customerID}/entitlements`, options);
  }
  /**
   * List all of a customer's entitlement grants across every entitlement. One row
   * per grant.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const entitlementGrant of client.customers.listEntitlementGrants(
   *   'cus_TV52uJWWXt2yIoBBxpjaa',
   * )) {
   *   // ...
   * }
   * ```
   */
  listEntitlementGrants(customerID, query = {}, options) {
    return this._client.getAPIList(path`/customers/${customerID}/entitlement-grants`, DefaultPageNumberPagination, { query, ...options });
  }
};
Customers2.CustomerPortal = CustomerPortal;
Customers2.Wallets = Wallets;
Customers2.Emails = Emails;

// node_modules/dodopayments/resources/discounts.mjs
var Discounts = class extends APIResource {
  static {
    __name(this, "Discounts");
  }
  /**
   * GET /discounts
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const discount of client.discounts.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/discounts", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * POST /discounts If `code` is omitted or empty, a random 16-char uppercase code
   * is generated.
   *
   * @example
   * ```ts
   * const discount = await client.discounts.create({
   *   amount: 0,
   *   type: 'flat',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/discounts", { body: body2, ...options });
  }
  /**
   * GET /discounts/{discount_id}
   *
   * @example
   * ```ts
   * const discount = await client.discounts.retrieve(
   *   'dsc_qxxEmg5PuM1uNTE0LgkP9',
   * );
   * ```
   */
  retrieve(discountID, options) {
    return this._client.get(path`/discounts/${discountID}`, options);
  }
  /**
   * DELETE /discounts/{discount_id}
   *
   * @example
   * ```ts
   * await client.discounts.delete('dsc_qxxEmg5PuM1uNTE0LgkP9');
   * ```
   */
  delete(discountID, options) {
    return this._client.delete(path`/discounts/${discountID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * PATCH /discounts/{discount_id}
   *
   * @example
   * ```ts
   * const discount = await client.discounts.update(
   *   'dsc_qxxEmg5PuM1uNTE0LgkP9',
   * );
   * ```
   */
  update(discountID, body2, options) {
    return this._client.patch(path`/discounts/${discountID}`, { body: body2, ...options });
  }
  /**
   * Validate and fetch a discount by its code name (e.g., "SAVE20"). This allows
   * real-time validation directly against the API using the human-readable discount
   * code instead of requiring the internal discount_id.
   *
   * @example
   * ```ts
   * const discount = await client.discounts.retrieveByCode(
   *   'code',
   * );
   * ```
   */
  retrieveByCode(code, options) {
    return this._client.get(path`/discounts/code/${code}`, options);
  }
};

// node_modules/dodopayments/resources/disputes.mjs
var Disputes = class extends APIResource {
  static {
    __name(this, "Disputes");
  }
  list(query = {}, options) {
    return this._client.getAPIList("/disputes", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  retrieve(disputeID, options) {
    return this._client.get(path`/disputes/${disputeID}`, options);
  }
};

// node_modules/dodopayments/resources/entitlements/files.mjs
var Files = class extends APIResource {
  static {
    __name(this, "Files");
  }
  /**
   * Attach a file to a `digital_files` entitlement. Per-file size cap: 500 MiB.
   *
   * @example
   * ```ts
   * const response = await client.entitlements.files.upload(
   *   'ent_jt7jcvI79Xh8eehqgWdcm',
   * );
   * ```
   */
  upload(id, options) {
    return this._client.post(path`/entitlements/${id}/files`, options);
  }
  /**
   * Detach a previously-attached file from a `digital_files` entitlement.
   *
   * @example
   * ```ts
   * await client.entitlements.files.delete('file_id', {
   *   id: 'ent_jt7jcvI79Xh8eehqgWdcm',
   * });
   * ```
   */
  delete(fileID, params, options) {
    const { id } = params;
    return this._client.delete(path`/entitlements/${id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/entitlements/grants.mjs
var Grants = class extends APIResource {
  static {
    __name(this, "Grants");
  }
  /**
   * GET /entitlements/{id}/grants (public API)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const entitlementGrant of client.entitlements.grants.list(
   *   'ent_jt7jcvI79Xh8eehqgWdcm',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(id, query = {}, options) {
    return this._client.getAPIList(path`/entitlements/${id}/grants`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Revoke a single grant. Idempotent: re-revoking an already-revoked grant returns
   * the grant in its current state.
   *
   * @example
   * ```ts
   * const entitlementGrant =
   *   await client.entitlements.grants.revoke(
   *     'entg_w0ZCJZgNXuNDdMVzvja6p',
   *     { id: 'ent_jt7jcvI79Xh8eehqgWdcm' },
   *   );
   * ```
   */
  revoke(grantID, params, options) {
    const { id } = params;
    return this._client.delete(path`/entitlements/${id}/grants/${grantID}`, options);
  }
  /**
   * For entitlements whose license-key config uses `manual` fulfillment, grants are
   * created in the `pending` state without a key. Call this endpoint to deliver the
   * key: the grant moves to `delivered`, the customer is emailed the key, and the
   * `license_key.created` and `entitlement_grant.delivered` webhook events are sent.
   *
   * @example
   * ```ts
   * const entitlementGrant =
   *   await client.entitlements.grants.fulfillLicenseKey(
   *     'entg_w0ZCJZgNXuNDdMVzvja6p',
   *     { key: 'key' },
   *   );
   * ```
   */
  fulfillLicenseKey(grantID, body2, options) {
    return this._client.post(path`/grants/${grantID}/license-key`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/entitlements/translations.mjs
var Translations3 = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const entitlementTranslationsListResponse =
   *   await client.entitlements.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/entitlements/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const entitlementTranslation =
   *   await client.entitlements.translations.update('ar', {
   *     id: 'id',
   *   });
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/entitlements/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.entitlements.translations.delete('ar', {
   *   id: 'id',
   * });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/entitlements/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/entitlements/entitlements.mjs
var Entitlements = class extends APIResource {
  static {
    __name(this, "Entitlements");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations3(this._client);
    this.files = new Files(this._client);
    this.grants = new Grants(this._client);
  }
  /**
   * GET /entitlements
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const entitlement of client.entitlements.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/entitlements", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * POST /entitlements
   *
   * @example
   * ```ts
   * const entitlement = await client.entitlements.create({
   *   integration_config: {
   *     feature_id: 'feature_id',
   *     feature_type: 'boolean',
   *   },
   *   integration_type: 'discord',
   *   name: 'name',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/entitlements", { body: body2, ...options });
  }
  /**
   * GET /entitlements/{id}
   *
   * @example
   * ```ts
   * const entitlement = await client.entitlements.retrieve(
   *   'ent_jt7jcvI79Xh8eehqgWdcm',
   * );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/entitlements/${id}`, { query, ...options });
  }
  /**
   * DELETE /entitlements/{id} (soft-delete)
   *
   * @example
   * ```ts
   * await client.entitlements.delete(
   *   'ent_jt7jcvI79Xh8eehqgWdcm',
   * );
   * ```
   */
  delete(id, options) {
    return this._client.delete(path`/entitlements/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * PATCH /entitlements/{id}
   *
   * @example
   * ```ts
   * const entitlement = await client.entitlements.update(
   *   'ent_jt7jcvI79Xh8eehqgWdcm',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/entitlements/${id}`, { body: body2, ...options });
  }
};
Entitlements.Translations = Translations3;
Entitlements.Files = Files;
Entitlements.Grants = Grants;

// node_modules/dodopayments/resources/invoices/payments.mjs
var Payments = class extends APIResource {
  static {
    __name(this, "Payments");
  }
  /**
   * @example
   * ```ts
   * const payment = await client.invoices.payments.retrieve(
   *   'pay_gr4RizvMOXFJ6xca3y2tU',
   * );
   *
   * const content = await payment.blob();
   * console.log(content);
   * ```
   */
  retrieve(paymentID, query = {}, options) {
    return this._client.get(path`/invoices/payments/${paymentID}`, {
      query,
      ...options,
      headers: buildHeaders([{ Accept: "application/pdf" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.invoices.payments.retrieveRefund(
   *     'ref_F0gZetLvTxxBrMU2CZcmy',
   *   );
   *
   * const content = await response.blob();
   * console.log(content);
   * ```
   */
  retrieveRefund(refundID, query = {}, options) {
    return this._client.get(path`/invoices/refunds/${refundID}`, {
      query,
      ...options,
      headers: buildHeaders([{ Accept: "application/pdf" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.invoices.payments.retrievePayout(
   *     'pyt_zFTrrn4sk3x3y2vjDBW3T',
   *   );
   *
   * const content = await response.blob();
   * console.log(content);
   * ```
   */
  retrievePayout(payoutID, query = {}, options) {
    return this._client.get(path`/invoices/payouts/${payoutID}`, {
      query,
      ...options,
      headers: buildHeaders([{ Accept: "application/pdf" }, options?.headers]),
      __binaryResponse: true
    });
  }
};

// node_modules/dodopayments/resources/invoices/invoices.mjs
var Invoices = class extends APIResource {
  static {
    __name(this, "Invoices");
  }
  constructor() {
    super(...arguments);
    this.payments = new Payments(this._client);
  }
};
Invoices.Payments = Payments;

// node_modules/dodopayments/resources/license-key-instances.mjs
var LicenseKeyInstances = class extends APIResource {
  static {
    __name(this, "LicenseKeyInstances");
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const licenseKeyInstance of client.licenseKeyInstances.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/license_key_instances", DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const licenseKeyInstance =
   *   await client.licenseKeyInstances.retrieve(
   *     'lki_EeWORStkMc7z0KycI31VS',
   *   );
   * ```
   */
  retrieve(id, options) {
    return this._client.get(path`/license_key_instances/${id}`, options);
  }
  /**
   * @example
   * ```ts
   * const licenseKeyInstance =
   *   await client.licenseKeyInstances.update(
   *     'lki_EeWORStkMc7z0KycI31VS',
   *     { name: 'name' },
   *   );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/license_key_instances/${id}`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/license-keys.mjs
var LicenseKeys = class extends APIResource {
  static {
    __name(this, "LicenseKeys");
  }
  /**
   * @deprecated
   */
  list(query = {}, options) {
    return this._client.getAPIList("/license_keys", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @deprecated
   */
  retrieve(id, options) {
    return this._client.get(path`/license_keys/${id}`, options);
  }
  /**
   * @deprecated
   */
  update(id, body2, options) {
    return this._client.patch(path`/license_keys/${id}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const licenseKey = await client.licenseKeys.create({
   *   customer_id: 'customer_id',
   *   key: 'key',
   *   product_id: 'product_id',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/license_keys", { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/licenses.mjs
var Licenses = class extends APIResource {
  static {
    __name(this, "Licenses");
  }
  /**
   * @example
   * ```ts
   * const response = await client.licenses.activate({
   *   license_key: 'license_key',
   *   name: 'name',
   * });
   * ```
   */
  activate(body2, options) {
    return this._client.post("/licenses/activate", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.licenses.deactivate({
   *   license_key: 'license_key',
   *   license_key_instance_id: 'license_key_instance_id',
   * });
   * ```
   */
  deactivate(body2, options) {
    return this._client.post("/licenses/deactivate", {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * const response = await client.licenses.validate({
   *   license_key: '2b1f8e2d-c41e-4e8f-b2d3-d9fd61c38f43',
   * });
   * ```
   */
  validate(body2, options) {
    return this._client.post("/licenses/validate", { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/meters/translations.mjs
var Translations4 = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const translationsListResponse =
   *   await client.meters.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/meters/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const translation = await client.meters.translations.update(
   *   'ar',
   *   { id: 'id' },
   * );
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/meters/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.meters.translations.delete('ar', { id: 'id' });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/meters/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/meters/meters.mjs
var Meters = class extends APIResource {
  static {
    __name(this, "Meters");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations4(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const meter of client.meters.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/meters", DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const meter = await client.meters.create({
   *   aggregation: { type: 'count' },
   *   event_name: 'event_name',
   *   measurement_unit: 'measurement_unit',
   *   name: 'name',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/meters", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const meter = await client.meters.retrieve(
   *   'mtr_h5tgTWL55OyMO0L2Q9w9v',
   * );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/meters/${id}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const meter = await client.meters.update(
   *   'mtr_h5tgTWL55OyMO0L2Q9w9v',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/meters/${id}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.meters.archive('mtr_h5tgTWL55OyMO0L2Q9w9v');
   * ```
   */
  archive(id, options) {
    return this._client.delete(path`/meters/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.meters.unarchive('mtr_h5tgTWL55OyMO0L2Q9w9v');
   * ```
   */
  unarchive(id, options) {
    return this._client.post(path`/meters/${id}/unarchive`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Meters.Translations = Translations4;

// node_modules/dodopayments/resources/misc.mjs
var Misc = class extends APIResource {
  static {
    __name(this, "Misc");
  }
  listSupportedCountries(options) {
    return this._client.get("/checkout/supported_countries", options);
  }
  /**
   * Lists the locales that a translation can have.
   */
  listLocales(options) {
    return this._client.get("/locales", options);
  }
};

// node_modules/dodopayments/resources/moderation.mjs
var Moderation = class extends APIResource {
  static {
    __name(this, "Moderation");
  }
  /**
   * Screens text, an image, or both, and returns a verdict: `allow`, `flag` or
   * `deny`. The API is fail-closed: do not generate when you get no verdict.
   *
   * **Pricing.** Dodo Payments charges $0.30 per 1000 billable screens and debits
   * the fee from your balance. A billable screen is a live-mode screen that returns
   * a verdict. Errors and test-mode screens are free.
   *
   * **429.** Honour `Retry-After` and retry. A 429 is a throughput limit, not a
   * verdict.
   *
   * **Test mode** returns mock verdicts and never calls the model. The default
   * verdict is `allow`. Put one of these strings in `text` to select another
   * outcome: `dodo_mock_flag` (`flag`), `dodo_mock_deny` (`deny`),
   * `dodo_mock_overloaded` (429) or `dodo_mock_not_ready` (503).
   */
  screen(body2, options) {
    return this._client.post("/moderation/screen", { body: body2, ...options });
  }
  /**
   * Shows how many billable screens you made and how close you are to your next
   * charge.
   *
   * **Billing.** A billable screen is a live-mode screen that returns a verdict.
   * Dodo Payments charges $0.30 for each full block of 1000 billable screens and
   * debits the fee from your balance. Each full block is charged within one hour.
   * Screens that do not fill a block stay unbilled until they do. Errors and
   * test-mode screens are free and are not counted.
   */
  retrieveUsage(options) {
    return this._client.get("/moderation/usage", options);
  }
};

// node_modules/dodopayments/resources/payments.mjs
var Payments2 = class extends APIResource {
  static {
    __name(this, "Payments");
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const paymentListResponse of client.payments.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/payments", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @deprecated
   */
  create(body2, options) {
    return this._client.post("/payments", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const payment = await client.payments.retrieve(
   *   'pay_gr4RizvMOXFJ6xca3y2tU',
   * );
   * ```
   */
  retrieve(paymentID, options) {
    return this._client.get(path`/payments/${paymentID}`, options);
  }
  /**
   * @example
   * ```ts
   * const response = await client.payments.retrieveLineItems(
   *   'pay_gr4RizvMOXFJ6xca3y2tU',
   * );
   * ```
   */
  retrieveLineItems(paymentID, query = {}, options) {
    return this._client.get(path`/payments/${paymentID}/line-items`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const manualRetry = await client.payments.retry(
   *   'payment_id',
   * );
   * ```
   */
  retry(paymentID, options) {
    return this._client.post(path`/payments/${paymentID}/retry`, options);
  }
  /**
   * @example
   * ```ts
   * const manualRetryState =
   *   await client.payments.retrieveRetryState('payment_id');
   * ```
   */
  retrieveRetryState(paymentID, options) {
    return this._client.get(path`/payments/${paymentID}/retry`, options);
  }
};

// node_modules/dodopayments/resources/payouts/breakup/details.mjs
var Details = class extends APIResource {
  static {
    __name(this, "Details");
  }
  /**
   * Returns paginated individual balance ledger entries for a payout. Each entry is
   * converted into the payout's currency at the rate the payout settled at. Supports
   * pagination via `page_size` (default 10, max 100) and `page_number` (default 0)
   * query parameters. A settlement batch payout shows its rows in native amounts.
   * `unattributed` is the payout amount less the sum of its rows in the payout
   * currency.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const detailListResponse of client.payouts.breakup.details.list(
   *   'pyt_zFTrrn4sk3x3y2vjDBW3T',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(payoutID, query = {}, options) {
    return this._client.getAPIList(path`/payouts/${payoutID}/breakup/details`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Downloads the complete payout breakup as a CSV file. Each row represents a
   * balance ledger entry with columns: Ledger ID, Event Type, Original Amount,
   * Original Currency, Reference Object ID, Description, Created At, USD Equivalent
   * Amount, and Payout Currency Amount. A settlement batch payout shows its rows in
   * native amounts.
   *
   * @example
   * ```ts
   * await client.payouts.breakup.details.downloadCsv(
   *   'pyt_zFTrrn4sk3x3y2vjDBW3T',
   * );
   * ```
   */
  downloadCsv(payoutID, options) {
    return this._client.get(path`/payouts/${payoutID}/breakup/details/csv`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/payouts/breakup/breakup.mjs
var Breakup = class extends APIResource {
  static {
    __name(this, "Breakup");
  }
  constructor() {
    super(...arguments);
    this.details = new Details(this._client);
  }
  /**
   * Returns the breakdown of a payout by event type (payments, refunds, disputes,
   * fees, etc.) in the payout's currency. Each amount is proportionally allocated
   * based on USD equivalent values, ensuring the total sums exactly to the payout
   * amount. A settlement batch payout shows its rows in native amounts. The
   * `carried_over` line holds the opening balance from the switch to settlement
   * batches and the rows dated before that opening balance. The `unattributed` line
   * shows the payout amount that the rows do not account for.
   *
   * @example
   * ```ts
   * const breakups = await client.payouts.breakup.retrieve(
   *   'pyt_zFTrrn4sk3x3y2vjDBW3T',
   * );
   * ```
   */
  retrieve(payoutID, options) {
    return this._client.get(path`/payouts/${payoutID}/breakup`, options);
  }
};
Breakup.Details = Details;

// node_modules/dodopayments/resources/payouts/payouts.mjs
var Payouts = class extends APIResource {
  static {
    __name(this, "Payouts");
  }
  constructor() {
    super(...arguments);
    this.breakup = new Breakup(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const payoutListResponse of client.payouts.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/payouts", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
};
Payouts.Breakup = Breakup;

// node_modules/dodopayments/resources/product-collections/translations.mjs
var Translations5 = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const translationsListResponse =
   *   await client.productCollections.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/product-collections/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const translation =
   *   await client.productCollections.translations.update(
   *     'ar',
   *     { id: 'id' },
   *   );
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/product-collections/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.productCollections.translations.delete('ar', {
   *   id: 'id',
   * });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/product-collections/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/product-collections/groups/items.mjs
var Items = class extends APIResource {
  static {
    __name(this, "Items");
  }
  /**
   * @example
   * ```ts
   * const productCollectionProducts =
   *   await client.productCollections.groups.items.create(
   *     '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *     {
   *       id: 'pdc_8BWv0hojwUH7iCDabr0NI',
   *       products: [{ product_id: 'product_id' }],
   *     },
   *   );
   * ```
   */
  create(groupID, params, options) {
    const { id, ...body2 } = params;
    return this._client.post(path`/product-collections/${id}/groups/${groupID}/items`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.groups.items.delete(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   {
   *     id: 'pdc_8BWv0hojwUH7iCDabr0NI',
   *     group_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   },
   * );
   * ```
   */
  delete(itemID, params, options) {
    const { id, group_id } = params;
    return this._client.delete(path`/product-collections/${id}/groups/${group_id}/items/${itemID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.groups.items.update(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   {
   *     id: 'pdc_8BWv0hojwUH7iCDabr0NI',
   *     group_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *     status: true,
   *   },
   * );
   * ```
   */
  update(itemID, params, options) {
    const { id, group_id, ...body2 } = params;
    return this._client.patch(path`/product-collections/${id}/groups/${group_id}/items/${itemID}`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/product-collections/groups/groups.mjs
var Groups = class extends APIResource {
  static {
    __name(this, "Groups");
  }
  constructor() {
    super(...arguments);
    this.items = new Items(this._client);
  }
  /**
   * @example
   * ```ts
   * const productCollectionGroupResponse =
   *   await client.productCollections.groups.create(
   *     'pdc_8BWv0hojwUH7iCDabr0NI',
   *     { products: [{ product_id: 'product_id' }] },
   *   );
   * ```
   */
  create(id, body2, options) {
    return this._client.post(path`/product-collections/${id}/groups`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.groups.delete(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   { id: 'pdc_8BWv0hojwUH7iCDabr0NI' },
   * );
   * ```
   */
  delete(groupID, params, options) {
    const { id } = params;
    return this._client.delete(path`/product-collections/${id}/groups/${groupID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.groups.update(
   *   '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
   *   { id: 'pdc_8BWv0hojwUH7iCDabr0NI' },
   * );
   * ```
   */
  update(groupID, params, options) {
    const { id, ...body2 } = params;
    return this._client.patch(path`/product-collections/${id}/groups/${groupID}`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Groups.Items = Items;

// node_modules/dodopayments/resources/product-collections/product-collections.mjs
var ProductCollections = class extends APIResource {
  static {
    __name(this, "ProductCollections");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations5(this._client);
    this.groups = new Groups(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const productCollectionListResponse of client.productCollections.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/product-collections", DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const productCollection =
   *   await client.productCollections.create({
   *     groups: [{ products: [{ product_id: 'product_id' }] }],
   *     name: 'name',
   *   });
   * ```
   */
  create(body2, options) {
    return this._client.post("/product-collections", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const productCollection =
   *   await client.productCollections.retrieve(
   *     'pdc_8BWv0hojwUH7iCDabr0NI',
   *   );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/product-collections/${id}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.delete(
   *   'pdc_8BWv0hojwUH7iCDabr0NI',
   * );
   * ```
   */
  delete(id, options) {
    return this._client.delete(path`/product-collections/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.productCollections.update(
   *   'pdc_8BWv0hojwUH7iCDabr0NI',
   * );
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/product-collections/${id}`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.productCollections.updateImages(
   *     'pdc_8BWv0hojwUH7iCDabr0NI',
   *   );
   * ```
   */
  updateImages(id, params = {}, options) {
    const { force_update } = params ?? {};
    return this._client.put(path`/product-collections/${id}/images`, { query: { force_update }, ...options });
  }
  /**
   * @example
   * ```ts
   * const response = await client.productCollections.unarchive(
   *   'pdc_8BWv0hojwUH7iCDabr0NI',
   * );
   * ```
   */
  unarchive(id, options) {
    return this._client.post(path`/product-collections/${id}/unarchive`, options);
  }
};
ProductCollections.Translations = Translations5;
ProductCollections.Groups = Groups;

// node_modules/dodopayments/resources/products/images.mjs
var Images = class extends APIResource {
  static {
    __name(this, "Images");
  }
  /**
   * @example
   * ```ts
   * const image = await client.products.images.update(
   *   'pdt_R8AWMPiV8RyJElcCKvAID',
   * );
   * ```
   */
  update(id, params = {}, options) {
    const { force_update } = params ?? {};
    return this._client.put(path`/products/${id}/images`, { query: { force_update }, ...options });
  }
};

// node_modules/dodopayments/resources/products/localized-prices.mjs
var LocalizedPrices = class extends APIResource {
  static {
    __name(this, "LocalizedPrices");
  }
  /**
   * @example
   * ```ts
   * const listLocalizedPricesResponse =
   *   await client.products.localizedPrices.list(
   *     'pdt_R8AWMPiV8RyJElcCKvAID',
   *   );
   * ```
   */
  list(productID, options) {
    return this._client.get(path`/products/${productID}/localized-prices`, options);
  }
  /**
   * @example
   * ```ts
   * const localizedPrice =
   *   await client.products.localizedPrices.create(
   *     'pdt_R8AWMPiV8RyJElcCKvAID',
   *     { amount: 0, currency: 'AED' },
   *   );
   * ```
   */
  create(productID, body2, options) {
    return this._client.post(path`/products/${productID}/localized-prices`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const localizedPrice =
   *   await client.products.localizedPrices.retrieve(
   *     'lcp_3aOOT7ebrzBOV41yL2V6s',
   *     { product_id: 'pdt_R8AWMPiV8RyJElcCKvAID' },
   *   );
   * ```
   */
  retrieve(id, params, options) {
    const { product_id } = params;
    return this._client.get(path`/products/${product_id}/localized-prices/${id}`, options);
  }
  /**
   * @example
   * ```ts
   * const localizedPrice =
   *   await client.products.localizedPrices.update(
   *     'lcp_3aOOT7ebrzBOV41yL2V6s',
   *     { product_id: 'pdt_R8AWMPiV8RyJElcCKvAID' },
   *   );
   * ```
   */
  update(id, params, options) {
    const { product_id, ...body2 } = params;
    return this._client.patch(path`/products/${product_id}/localized-prices/${id}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.products.localizedPrices.archive(
   *   'lcp_3aOOT7ebrzBOV41yL2V6s',
   *   { product_id: 'pdt_R8AWMPiV8RyJElcCKvAID' },
   * );
   * ```
   */
  archive(id, params, options) {
    const { product_id } = params;
    return this._client.delete(path`/products/${product_id}/localized-prices/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/products/short-links.mjs
var ShortLinks = class extends APIResource {
  static {
    __name(this, "ShortLinks");
  }
  /**
   * Lists all short links created by the business.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const shortLinkListResponse of client.products.shortLinks.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/products/short_links", DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Gives a Short Checkout URL with custom slug for a product. Uses a Static
   * Checkout URL under the hood.
   *
   * @example
   * ```ts
   * const shortLink = await client.products.shortLinks.create(
   *   'pdt_R8AWMPiV8RyJElcCKvAID',
   *   { slug: 'slug' },
   * );
   * ```
   */
  create(id, body2, options) {
    return this._client.post(path`/products/${id}/short_links`, { body: body2, ...options });
  }
};

// node_modules/dodopayments/resources/products/translations.mjs
var Translations6 = class extends APIResource {
  static {
    __name(this, "Translations");
  }
  /**
   * Lists the translations, for all the locales or for the locales of the filter.
   *
   * @example
   * ```ts
   * const translationsListResponse =
   *   await client.products.translations.list('id');
   * ```
   */
  list(id, query = {}, options) {
    return this._client.get(path`/products/${id}/translations`, { query, ...options });
  }
  /**
   * Creates or replaces the translation of one locale. The response is 201 for a new
   * locale and 200 for a replaced locale.
   *
   * @example
   * ```ts
   * const translation =
   *   await client.products.translations.update('ar', {
   *     id: 'id',
   *   });
   * ```
   */
  update(locale, params, options) {
    const { id, ...body2 } = params;
    return this._client.put(path`/products/${id}/translations/${locale}`, { body: body2, ...options });
  }
  /**
   * Deletes the translation of one locale.
   *
   * @example
   * ```ts
   * await client.products.translations.delete('ar', {
   *   id: 'id',
   * });
   * ```
   */
  delete(locale, params, options) {
    const { id } = params;
    return this._client.delete(path`/products/${id}/translations/${locale}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/products/products.mjs
var Products = class extends APIResource {
  static {
    __name(this, "Products");
  }
  constructor() {
    super(...arguments);
    this.translations = new Translations6(this._client);
    this.images = new Images(this._client);
    this.shortLinks = new ShortLinks(this._client);
    this.localizedPrices = new LocalizedPrices(this._client);
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const productListResponse of client.products.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/products", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const product = await client.products.create({
   *   name: 'name',
   *   price: {
   *     currency: 'AED',
   *     price: 0,
   *     type: 'one_time_price',
   *   },
   *   tax_category: 'digital_products',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/products", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const product = await client.products.retrieve(
   *   'pdt_R8AWMPiV8RyJElcCKvAID',
   * );
   * ```
   */
  retrieve(id, query = {}, options) {
    return this._client.get(path`/products/${id}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * await client.products.update('pdt_R8AWMPiV8RyJElcCKvAID');
   * ```
   */
  update(id, body2, options) {
    return this._client.patch(path`/products/${id}`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.products.archive('pdt_R8AWMPiV8RyJElcCKvAID');
   * ```
   */
  archive(id, options) {
    return this._client.delete(path`/products/${id}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * await client.products.unarchive(
   *   'pdt_R8AWMPiV8RyJElcCKvAID',
   * );
   * ```
   */
  unarchive(id, options) {
    return this._client.post(path`/products/${id}/unarchive`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * @example
   * ```ts
   * const response = await client.products.updateFiles(
   *   'pdt_R8AWMPiV8RyJElcCKvAID',
   *   { file_name: 'file_name' },
   * );
   * ```
   */
  updateFiles(id, body2, options) {
    return this._client.put(path`/products/${id}/files`, { body: body2, ...options });
  }
};
Products.Translations = Translations6;
Products.Images = Images;
Products.ShortLinks = ShortLinks;
Products.LocalizedPrices = LocalizedPrices;

// node_modules/dodopayments/resources/refunds.mjs
var Refunds = class extends APIResource {
  static {
    __name(this, "Refunds");
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const refundListItem of client.refunds.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/refunds", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const refund = await client.refunds.create({
   *   payment_id: 'payment_id',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/refunds", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const refund = await client.refunds.retrieve(
   *   'ref_F0gZetLvTxxBrMU2CZcmy',
   * );
   * ```
   */
  retrieve(refundID, options) {
    return this._client.get(path`/refunds/${refundID}`, options);
  }
};

// node_modules/dodopayments/resources/subscriptions.mjs
var Subscriptions = class extends APIResource {
  static {
    __name(this, "Subscriptions");
  }
  /**
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const subscriptionListResponse of client.subscriptions.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/subscriptions", DefaultPageNumberPagination, {
      query,
      ...options
    });
  }
  /**
   * @deprecated
   */
  create(body2, options) {
    return this._client.post("/subscriptions", { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const subscription = await client.subscriptions.retrieve(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   * );
   * ```
   */
  retrieve(subscriptionID, query = {}, options) {
    return this._client.get(path`/subscriptions/${subscriptionID}`, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const subscription = await client.subscriptions.update(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   * );
   * ```
   */
  update(subscriptionID, body2, options) {
    return this._client.patch(path`/subscriptions/${subscriptionID}`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const response = await client.subscriptions.charge(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   *   { product_price: 0 },
   * );
   * ```
   */
  charge(subscriptionID, body2, options) {
    return this._client.post(path`/subscriptions/${subscriptionID}/charge`, { body: body2, ...options });
  }
  /**
   * @example
   * ```ts
   * const response = await client.subscriptions.changePlan(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   *   {
   *     product_id: 'product_id',
   *     proration_billing_mode: 'prorated_immediately',
   *     quantity: 0,
   *   },
   * );
   * ```
   */
  changePlan(subscriptionID, body2, options) {
    return this._client.post(path`/subscriptions/${subscriptionID}/change-plan`, { body: body2, ...options });
  }
  /**
   * Get detailed usage history for a subscription that includes usage-based billing
   * (metered components). This endpoint provides insights into customer usage
   * patterns and billing calculations over time.
   *
   * ## What You'll Get:
   *
   * - **Billing periods**: Each item represents a billing cycle with start and end
   *   dates
   * - **Meter usage**: Detailed breakdown of usage for each meter configured on the
   *   subscription
   * - **Usage calculations**: Total units consumed, free threshold units, and
   *   chargeable units
   * - **Historical tracking**: Complete audit trail of usage-based charges
   *
   * ## Use Cases:
   *
   * - **Customer support**: Investigate billing questions and usage discrepancies
   * - **Usage analytics**: Analyze customer consumption patterns over time
   * - **Billing transparency**: Provide customers with detailed usage breakdowns
   * - **Revenue optimization**: Identify usage trends to optimize pricing strategies
   *
   * ## Filtering Options:
   *
   * - **Date range filtering**: Get usage history for specific time periods
   * - **Meter-specific filtering**: Focus on usage for a particular meter
   * - **Pagination**: Navigate through large usage histories efficiently
   *
   * ## Important Notes:
   *
   * - Only returns data for subscriptions with usage-based (metered) components
   * - Usage history is organized by billing periods (subscription cycles)
   * - Free threshold units are calculated and displayed separately from chargeable
   *   units
   * - Historical data is preserved even if meter configurations change
   *
   * ## Example Query Patterns:
   *
   * - Get last 3 months:
   *   `?start_date=2024-01-01T00:00:00Z&end_date=2024-03-31T23:59:59Z`
   * - Filter by meter: `?meter_id=mtr_api_requests`
   * - Paginate results: `?page_size=20&page_number=1`
   * - Recent usage: `?start_date=2024-03-01T00:00:00Z` (from March 1st to now)
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const subscriptionRetrieveUsageHistoryResponse of client.subscriptions.retrieveUsageHistory(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   * )) {
   *   // ...
   * }
   * ```
   */
  retrieveUsageHistory(subscriptionID, query = {}, options) {
    return this._client.getAPIList(path`/subscriptions/${subscriptionID}/usage-history`, DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.subscriptions.updatePaymentMethod(
   *     'sub_Iuaq622bbmmfOGrVTqdXv',
   *     { payment_method: { type: 'new' } },
   *   );
   * ```
   */
  updatePaymentMethod(subscriptionID, params, options) {
    const { payment_method } = params;
    return this._client.post(path`/subscriptions/${subscriptionID}/update-payment-method`, {
      body: payment_method,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.subscriptions.previewChangePlan(
   *     'sub_Iuaq622bbmmfOGrVTqdXv',
   *     {
   *       product_id: 'product_id',
   *       proration_billing_mode: 'prorated_immediately',
   *       quantity: 0,
   *     },
   *   );
   * ```
   */
  previewChangePlan(subscriptionID, body2, options) {
    return this._client.post(path`/subscriptions/${subscriptionID}/change-plan/preview`, {
      body: body2,
      ...options
    });
  }
  /**
   * @example
   * ```ts
   * const response =
   *   await client.subscriptions.retrieveCreditUsage(
   *     'sub_Iuaq622bbmmfOGrVTqdXv',
   *   );
   * ```
   */
  retrieveCreditUsage(subscriptionID, options) {
    return this._client.get(path`/subscriptions/${subscriptionID}/credit-usage`, options);
  }
  /**
   * @example
   * ```ts
   * await client.subscriptions.cancelChangePlan(
   *   'sub_Iuaq622bbmmfOGrVTqdXv',
   * );
   * ```
   */
  cancelChangePlan(subscriptionID, options) {
    return this._client.delete(path`/subscriptions/${subscriptionID}/change-plan/scheduled`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/usage-events.mjs
var UsageEvents = class extends APIResource {
  static {
    __name(this, "UsageEvents");
  }
  /**
   * This endpoint allows you to ingest custom events that can be used for:
   *
   * - Usage-based billing and metering
   * - Analytics and reporting
   * - Customer behavior tracking
   *
   * ## Important Notes:
   *
   * - **Duplicate Prevention**:
   *   - Duplicate `event_id` values within the same request are rejected (entire
   *     request fails)
   *   - Subsequent requests with existing `event_id` values are ignored (idempotent
   *     behavior)
   * - **Rate Limiting**: Maximum 1000 events per request
   * - **Time Validation**: Events with timestamps older than 1 hour or more than 5
   *   minutes in the future will be rejected
   * - **Metadata Limits**: Maximum 50 key-value pairs per event, keys max 100 chars,
   *   values max 500 chars
   *
   * ## Example Usage:
   *
   * ```json
   * {
   *   "events": [
   *     {
   *       "event_id": "api_call_12345",
   *       "customer_id": "cus_abc123",
   *       "event_name": "api_request",
   *       "timestamp": "2024-01-15T10:30:00Z",
   *       "metadata": {
   *         "endpoint": "/api/v1/users",
   *         "method": "GET",
   *         "tokens_used": "150"
   *       }
   *     }
   *   ]
   * }
   * ```
   */
  ingest(body2, options) {
    return this._client.post("/events/ingest", { body: body2, ...options });
  }
  /**
   * Fetch events from your account with powerful filtering capabilities. This
   * endpoint is ideal for:
   *
   * - Debugging event ingestion issues
   * - Analyzing customer usage patterns
   * - Building custom analytics dashboards
   * - Auditing billing-related events
   *
   * ## Filtering Options:
   *
   * - **Customer filtering**: Filter by specific customer ID
   * - **Event name filtering**: Filter by event type/name
   * - **Meter-based filtering**: Use a meter ID to apply the meter's event name and
   *   filter criteria automatically
   * - **Time range filtering**: Filter events within a specific date range
   * - **Pagination**: Navigate through large result sets
   *
   * ## Meter Integration:
   *
   * When using `meter_id`, the endpoint automatically applies:
   *
   * - The meter's configured `event_name` filter
   * - The meter's custom filter criteria (if any)
   * - If you also provide `event_name`, it must match the meter's event name
   *
   * ## Example Queries:
   *
   * - Get all events for a customer: `?customer_id=cus_abc123`
   * - Get API request events: `?event_name=api_request`
   * - Get events from last 24 hours:
   *   `?start=2024-01-14T10:30:00Z&end=2024-01-15T10:30:00Z`
   * - Get events with meter filtering: `?meter_id=mtr_xyz789`
   * - Paginate results: `?page_size=50&page_number=2`
   */
  list(query = {}, options) {
    return this._client.getAPIList("/events", DefaultPageNumberPagination, { query, ...options });
  }
  /**
   * Fetch detailed information about a single event using its unique event ID. This
   * endpoint is useful for:
   *
   * - Debugging specific event ingestion issues
   * - Retrieving event details for customer support
   * - Validating that events were processed correctly
   * - Getting the complete metadata for an event
   *
   * ## Event ID Format:
   *
   * The event ID should be the same value that was provided during event ingestion
   * via the `/events/ingest` endpoint. Event IDs are case-sensitive and must match
   * exactly.
   *
   * ## Response Details:
   *
   * The response includes all event data including:
   *
   * - Complete metadata key-value pairs
   * - Original timestamp (preserved from ingestion)
   * - Customer and business association
   * - Event name and processing information
   *
   * ## Example Usage:
   *
   * ```text
   * GET /events/api_call_12345
   * ```
   */
  retrieve(eventID, options) {
    return this._client.get(path`/events/${eventID}`, options);
  }
};

// node_modules/dodopayments/resources/webhook-events.mjs
var WebhookEvents = class extends APIResource {
  static {
    __name(this, "WebhookEvents");
  }
};

// node_modules/dodopayments/resources/webhooks/headers.mjs
var Headers2 = class extends APIResource {
  static {
    __name(this, "Headers");
  }
  /**
   * Get a webhook by id
   *
   * @example
   * ```ts
   * const header = await client.webhooks.headers.retrieve(
   *   'whk_YdWqVEGKmSYKbsIyDxEab',
   * );
   * ```
   */
  retrieve(webhookID, options) {
    return this._client.get(path`/webhooks/${webhookID}/headers`, options);
  }
  /**
   * Patch a webhook by id
   *
   * @example
   * ```ts
   * await client.webhooks.headers.update(
   *   'whk_YdWqVEGKmSYKbsIyDxEab',
   *   { headers: { foo: 'string' } },
   * );
   * ```
   */
  update(webhookID, body2, options) {
    return this._client.patch(path`/webhooks/${webhookID}/headers`, {
      body: body2,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/dodopayments/resources/webhooks/webhooks.mjs
var import_standardwebhooks = __toESM(require_dist(), 1);
var Webhooks = class extends APIResource {
  static {
    __name(this, "Webhooks");
  }
  constructor() {
    super(...arguments);
    this.headers = new Headers2(this._client);
  }
  /**
   * List all webhooks
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const webhookDetails of client.webhooks.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/webhooks", CursorPagePagination, { query, ...options });
  }
  /**
   * Create a new webhook
   *
   * @example
   * ```ts
   * const webhookDetails = await client.webhooks.create({
   *   url: 'url',
   * });
   * ```
   */
  create(body2, options) {
    return this._client.post("/webhooks", { body: body2, ...options });
  }
  /**
   * Get a webhook by id
   *
   * @example
   * ```ts
   * const webhookDetails = await client.webhooks.retrieve(
   *   'whk_YdWqVEGKmSYKbsIyDxEab',
   * );
   * ```
   */
  retrieve(webhookID, options) {
    return this._client.get(path`/webhooks/${webhookID}`, options);
  }
  /**
   * Delete a webhook by id
   *
   * @example
   * ```ts
   * await client.webhooks.delete('whk_YdWqVEGKmSYKbsIyDxEab');
   * ```
   */
  delete(webhookID, options) {
    return this._client.delete(path`/webhooks/${webhookID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Patch a webhook by id
   *
   * @example
   * ```ts
   * const webhookDetails = await client.webhooks.update(
   *   'whk_YdWqVEGKmSYKbsIyDxEab',
   * );
   * ```
   */
  update(webhookID, body2, options) {
    return this._client.patch(path`/webhooks/${webhookID}`, { body: body2, ...options });
  }
  /**
   * Get webhook secret by id
   *
   * @example
   * ```ts
   * const response = await client.webhooks.retrieveSecret(
   *   'whk_YdWqVEGKmSYKbsIyDxEab',
   * );
   * ```
   */
  retrieveSecret(webhookID, options) {
    return this._client.get(path`/webhooks/${webhookID}/secret`, options);
  }
  unwrap(body2, { headers, key }) {
    if (headers !== void 0) {
      const keyStr = key === void 0 ? this._client.webhookKey : key;
      if (keyStr === null)
        throw new Error("Webhook key must not be null in order to unwrap");
      const wh = new import_standardwebhooks.Webhook(keyStr);
      wh.verify(body2, headers);
    }
    return JSON.parse(body2);
  }
  unsafeUnwrap(body2) {
    return JSON.parse(body2);
  }
};
Webhooks.Headers = Headers2;

// node_modules/dodopayments/client.mjs
var _DodoPayments_instances;
var _a;
var _DodoPayments_encoder;
var _DodoPayments_workloadIdentity;
var _DodoPayments_workloadIdentityRetried;
var _DodoPayments_baseURLOverridden;
var environments = {
  live_mode: "https://live.dodopayments.com",
  test_mode: "https://test.dodopayments.com"
};
var DodoPayments = class {
  static {
    __name(this, "DodoPayments");
  }
  /**
   * API Client for interfacing with the Dodo Payments API.
   *
   * @param {string | undefined} [opts.bearerToken=process.env['DODO_PAYMENTS_API_KEY'] ?? undefined]
   * @param {string | null | undefined} [opts.webhookKey=process.env['DODO_PAYMENTS_WEBHOOK_KEY'] ?? null]
   * @param {Environment} [opts.environment=live_mode] - Specifies the environment URL to use for the API.
   * @param {string} [opts.baseURL=process.env['DODO_PAYMENTS_BASE_URL'] ?? https://live.dodopayments.com] - Override the default base URL for the API.
   * @param {number} [opts.timeout=1 minute] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
   */
  constructor({ baseURL: baseURL2 = readEnv("DODO_PAYMENTS_BASE_URL"), workloadIdentity, bearerToken = workloadIdentity ? void 0 : readEnv("DODO_PAYMENTS_API_KEY"), webhookKey = readEnv("DODO_PAYMENTS_WEBHOOK_KEY") ?? null, ...opts } = {}) {
    _DodoPayments_instances.add(this);
    _DodoPayments_encoder.set(this, void 0);
    _DodoPayments_workloadIdentity.set(this, void 0);
    _DodoPayments_workloadIdentityRetried.set(this, /* @__PURE__ */ new WeakSet());
    this.workloadIdentity = {
      revoke: /* @__PURE__ */ __name(async () => {
        await __classPrivateFieldGet(this, _DodoPayments_workloadIdentity, "f")?.revoke();
      }, "revoke")
    };
    this.checkoutSessions = new CheckoutSessions(this);
    this.payments = new Payments2(this);
    this.subscriptions = new Subscriptions(this);
    this.invoices = new Invoices(this);
    this.licenses = new Licenses(this);
    this.licenseKeys = new LicenseKeys(this);
    this.licenseKeyInstances = new LicenseKeyInstances(this);
    this.customers = new Customers2(this);
    this.blocklist = new Blocklist(this);
    this.refunds = new Refunds(this);
    this.disputes = new Disputes(this);
    this.payouts = new Payouts(this);
    this.products = new Products(this);
    this.misc = new Misc(this);
    this.discounts = new Discounts(this);
    this.addons = new Addons(this);
    this.brands = new Brands(this);
    this.webhooks = new Webhooks(this);
    this.webhookEvents = new WebhookEvents(this);
    this.usageEvents = new UsageEvents(this);
    this.meters = new Meters(this);
    this.balances = new Balances(this);
    this.creditEntitlements = new CreditEntitlements(this);
    this.entitlements = new Entitlements(this);
    this.productCollections = new ProductCollections(this);
    this.moderation = new Moderation(this);
    const resolvedWorkloadIdentity = resolveOptions(bearerToken, workloadIdentity);
    if (bearerToken === void 0 && !resolvedWorkloadIdentity) {
      throw new DodoPaymentsError("The DODO_PAYMENTS_API_KEY environment variable is missing or empty; either provide it, or instantiate the DodoPayments client with an bearerToken option, like new DodoPayments({ bearerToken: 'My Bearer Token' }).");
    }
    const options = {
      bearerToken,
      webhookKey,
      ...opts,
      workloadIdentity: resolvedWorkloadIdentity,
      baseURL: baseURL2,
      environment: opts.environment ?? "live_mode"
    };
    if (baseURL2 && opts.environment) {
      throw new DodoPaymentsError("Ambiguous URL; The `baseURL` option (or DODO_PAYMENTS_BASE_URL env var) and the `environment` option are given. If you want to use the environment you must pass baseURL: null");
    }
    this.baseURL = options.baseURL || environments[options.environment || "live_mode"];
    this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
    this.logger = options.logger ?? console;
    const defaultLogLevel = "warn";
    this.logLevel = defaultLogLevel;
    this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("DODO_PAYMENTS_LOG"), "process.env['DODO_PAYMENTS_LOG']", this) ?? defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? getDefaultFetch();
    __classPrivateFieldSet(this, _DodoPayments_encoder, FallbackEncoder, "f");
    const customHeadersEnv = readEnv("DODO_PAYMENTS_CUSTOM_HEADERS");
    if (customHeadersEnv) {
      const parsed = {};
      for (const line of customHeadersEnv.split("\n")) {
        const colon = line.indexOf(":");
        if (colon >= 0) {
          parsed[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
        }
      }
      options.defaultHeaders = { ...parsed, ...options.defaultHeaders };
    }
    this._options = options;
    this.bearerToken = bearerToken;
    __classPrivateFieldSet(this, _DodoPayments_workloadIdentity, resolvedWorkloadIdentity && new TokenManager(this, resolvedWorkloadIdentity), "f");
    this.webhookKey = webhookKey;
  }
  /**
   * Create a new client instance re-using the same options given to the current client with optional overriding.
   */
  withOptions(options) {
    const client = new this.constructor({
      ...this._options,
      environment: options.environment ? options.environment : void 0,
      baseURL: options.environment ? void 0 : this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      bearerToken: this.bearerToken,
      webhookKey: this.webhookKey,
      ...options
    });
    return client;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  validateHeaders({ values, nulls }) {
    return;
  }
  async authHeaders(opts) {
    if (__classPrivateFieldGet(this, _DodoPayments_workloadIdentity, "f")) {
      return buildHeaders([{ Authorization: `Bearer ${await __classPrivateFieldGet(this, _DodoPayments_workloadIdentity, "f").getToken()}` }]);
    }
    return buildHeaders([{ Authorization: `Bearer ${this.bearerToken}` }]);
  }
  stringifyQuery(query) {
    return stringifyQuery(query);
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  makeStatusError(status2, error, message, headers) {
    return APIError.generate(status2, error, message, headers);
  }
  buildURL(path2, query, defaultBaseURL) {
    const baseURL2 = !__classPrivateFieldGet(this, _DodoPayments_instances, "m", _DodoPayments_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path2) ? new URL(path2) : new URL(baseURL2 + (baseURL2.endsWith("/") && path2.startsWith("/") ? path2.slice(1) : path2));
    const defaultQuery = this.defaultQuery();
    const pathQuery = Object.fromEntries(url.searchParams);
    if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
      query = { ...pathQuery, ...defaultQuery, ...query };
    }
    if (typeof query === "object" && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query);
    }
    return url.toString();
  }
  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.
   */
  async prepareOptions(options) {
  }
  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  async prepareRequest(request, { url, options }) {
  }
  get(path2, opts) {
    return this.methodRequest("get", path2, opts);
  }
  post(path2, opts) {
    return this.methodRequest("post", path2, opts);
  }
  patch(path2, opts) {
    return this.methodRequest("patch", path2, opts);
  }
  put(path2, opts) {
    return this.methodRequest("put", path2, opts);
  }
  delete(path2, opts) {
    return this.methodRequest("delete", path2, opts);
  }
  methodRequest(method, path2, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path2, ...opts2 };
    }));
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
  }
  async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining
    });
    await this.prepareRequest(req, { url, options });
    const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
    const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();
    loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
      retryOfRequestLogID,
      method: options.method,
      url,
      options,
      headers: req.headers
    }));
    if (options.signal?.aborted) {
      throw new APIUserAbortError();
    }
    const controller = new AbortController();
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();
    if (response instanceof globalThis.Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new APIUserAbortError();
      }
      const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
      if (retriesRemaining) {
        loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
        loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
      loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
        retryOfRequestLogID,
        url,
        durationMs: headersTime - startTime,
        message: response.message
      }));
      if (isTimeout) {
        throw new APIConnectionTimeoutError();
      }
      throw new APIConnectionError({ cause: response });
    }
    const responseInfo = `[${requestLogID}${retryLogStr}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
    if (!response.ok) {
      if (response.status === 401 && __classPrivateFieldGet(this, _DodoPayments_workloadIdentity, "f") && !__classPrivateFieldGet(this, _DodoPayments_workloadIdentityRetried, "f").has(options)) {
        __classPrivateFieldGet(this, _DodoPayments_workloadIdentityRetried, "f").add(options);
        await CancelReadableStream(response.body);
        __classPrivateFieldGet(this, _DodoPayments_workloadIdentity, "f").invalidate(req.headers.get("authorization"));
        loggerFor(this).info(`${responseInfo} - retrying with a new workload identity access token`);
        return this.makeRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        await CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
        loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
      }
      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err2) => castToError(err2).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? void 0 : errText;
      loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        message: errMessage,
        durationMs: Date.now() - startTime
      }));
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }
    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
      retryOfRequestLogID,
      url: response.url,
      status: response.status,
      headers: response.headers,
      durationMs: headersTime - startTime
    }));
    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }
  getAPIList(path2, Page, opts) {
    return this.requestAPIList(Page, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path2, ...opts2 })) : { method: "get", path: path2, ...opts });
  }
  requestAPIList(Page, options) {
    const request = this.makeRequest(options, null, void 0);
    return new PagePromise(this, request, Page);
  }
  async fetchWithTimeout(url, init, ms, controller) {
    const { signal, method, ...options } = init || {};
    const abort = this._makeAbort(controller);
    if (signal)
      signal.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, ms);
    const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
    const fetchOptions = {
      signal: controller.signal,
      ...isReadableBody ? { duplex: "half" } : {},
      method: "GET",
      ...options
    };
    if (method) {
      fetchOptions.method = method.toUpperCase();
    }
    try {
      return await this.fetch.call(void 0, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }
  async shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.get("retry-after");
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1e3;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (timeoutMillis === void 0) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1e3;
  }
  async buildRequest(inputOptions, { retryCount = 0 } = {}) {
    const options = { ...inputOptions };
    const { method, path: path2, query, defaultBaseURL } = options;
    const url = this.buildURL(path2, query, defaultBaseURL);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body: body2 } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
    const req = {
      method,
      headers: reqHeaders,
      ...options.signal && { signal: options.signal },
      ...globalThis.ReadableStream && body2 instanceof globalThis.ReadableStream && { duplex: "half" },
      ...body2 && { body: body2 },
      ...this.fetchOptions ?? {},
      ...options.fetchOptions ?? {}
    };
    return { req, url, timeout: options.timeout };
  }
  async buildHeaders({ options, method, bodyHeaders, retryCount }) {
    let idempotencyHeaders = {};
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }
    const headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: "application/json",
        "User-Agent": this.getUserAgent(),
        "X-Stainless-Retry-Count": String(retryCount),
        ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
        ...getPlatformHeaders()
      },
      await this.authHeaders(options),
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers
    ]);
    this.validateHeaders(headers);
    return headers.values;
  }
  _makeAbort(controller) {
    return () => controller.abort();
  }
  buildBody({ options: { body: body2, headers: rawHeaders } }) {
    if (!body2) {
      return { bodyHeaders: void 0, body: void 0 };
    }
    const headers = buildHeaders([rawHeaders]);
    if (
      // Pass raw type verbatim
      ArrayBuffer.isView(body2) || body2 instanceof ArrayBuffer || body2 instanceof DataView || typeof body2 === "string" && // Preserve legacy string encoding behavior for now
      headers.values.has("content-type") || // `Blob` is superset of `File`
      globalThis.Blob && body2 instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
      body2 instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
      body2 instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
      globalThis.ReadableStream && body2 instanceof globalThis.ReadableStream
    ) {
      return { bodyHeaders: void 0, body: body2 };
    } else if (typeof body2 === "object" && (Symbol.asyncIterator in body2 || Symbol.iterator in body2 && "next" in body2 && typeof body2.next === "function")) {
      return { bodyHeaders: void 0, body: ReadableStreamFrom(body2) };
    } else if (typeof body2 === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
      return {
        bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
        body: this.stringifyQuery(body2)
      };
    } else {
      return __classPrivateFieldGet(this, _DodoPayments_encoder, "f").call(this, { body: body2, headers });
    }
  }
};
_a = DodoPayments, _DodoPayments_encoder = /* @__PURE__ */ new WeakMap(), _DodoPayments_workloadIdentity = /* @__PURE__ */ new WeakMap(), _DodoPayments_workloadIdentityRetried = /* @__PURE__ */ new WeakMap(), _DodoPayments_instances = /* @__PURE__ */ new WeakSet(), _DodoPayments_baseURLOverridden = /* @__PURE__ */ __name(function _DodoPayments_baseURLOverridden2() {
  return this.baseURL !== environments[this._options.environment || "live_mode"];
}, "_DodoPayments_baseURLOverridden");
DodoPayments.DodoPayments = _a;
DodoPayments.DEFAULT_TIMEOUT = 6e4;
DodoPayments.workloadIdentity = helpers;
DodoPayments.DodoPaymentsError = DodoPaymentsError;
DodoPayments.APIError = APIError;
DodoPayments.APIConnectionError = APIConnectionError;
DodoPayments.APIConnectionTimeoutError = APIConnectionTimeoutError;
DodoPayments.APIUserAbortError = APIUserAbortError;
DodoPayments.NotFoundError = NotFoundError;
DodoPayments.ConflictError = ConflictError;
DodoPayments.RateLimitError = RateLimitError;
DodoPayments.BadRequestError = BadRequestError;
DodoPayments.AuthenticationError = AuthenticationError;
DodoPayments.InternalServerError = InternalServerError;
DodoPayments.PermissionDeniedError = PermissionDeniedError;
DodoPayments.UnprocessableEntityError = UnprocessableEntityError;
DodoPayments.toFile = toFile;
DodoPayments.CheckoutSessions = CheckoutSessions;
DodoPayments.Payments = Payments2;
DodoPayments.Subscriptions = Subscriptions;
DodoPayments.Invoices = Invoices;
DodoPayments.Licenses = Licenses;
DodoPayments.LicenseKeys = LicenseKeys;
DodoPayments.LicenseKeyInstances = LicenseKeyInstances;
DodoPayments.Customers = Customers2;
DodoPayments.Blocklist = Blocklist;
DodoPayments.Refunds = Refunds;
DodoPayments.Disputes = Disputes;
DodoPayments.Payouts = Payouts;
DodoPayments.Products = Products;
DodoPayments.Misc = Misc;
DodoPayments.Discounts = Discounts;
DodoPayments.Addons = Addons;
DodoPayments.Brands = Brands;
DodoPayments.Webhooks = Webhooks;
DodoPayments.WebhookEvents = WebhookEvents;
DodoPayments.UsageEvents = UsageEvents;
DodoPayments.Meters = Meters;
DodoPayments.Balances = Balances;
DodoPayments.CreditEntitlements = CreditEntitlements;
DodoPayments.Entitlements = Entitlements;
DodoPayments.ProductCollections = ProductCollections;
DodoPayments.Moderation = Moderation;

// server/index.ts
import { timingSafeEqual } from "node:crypto";

// src/lib/public-content.ts
var faqEntries = [
  [
    "What exactly does $10 buy?",
    "One $10 unit of advertising weight for 30 days. Your approved website gets a readable entry on the paid board, an outbound link and a public detail page. The first 30-day period starts when your paid listing is approved. This is a one-time purchase, with no automatic renewal."
  ],
  [
    "How does the ranking work?",
    "More active paid spend means a higher position on the paid board. Equal amounts are ordered by when the listing was created, with the earlier listing first; an internal ID breaks an exact timestamp tie. Categories and filters help visitors browse, but the displayed rank is the overall paid rank. Every approved active website has a readable entry."
  ],
  [
    "Does a displayed price reserve my rank?",
    "No. The price to move up is calculated from the current paid board in $10 units. Other purchases, approvals, refunds and expiries can change it before your placement goes live. You buy a 30-day advertising amount, not a guaranteed position, number of visits, clicks or sales."
  ],
  [
    "What happens when I add more?",
    "Each additional purchase adds its own 30-day amount. It does not restart the clock on older purchases. For example, $10 on Monday and $20 on Friday overlap at $30 until Monday\u2019s amount expires. Your rank can change as each amount expires."
  ],
  [
    "Are the editorial discoveries paid placements?",
    "No. Editorial discoveries are selected separately to give visitors interesting websites to explore. They are labeled and kept outside the paid ranking. Buying a placement does not buy editorial selection or an endorsement."
  ],
  [
    "Can I advertise anything?",
    "Every new listing is reviewed. We exclude illegal, deceptive, abusive, unsafe, and restricted content. You must be authorized to advertise the website. Rejected paid placements are eligible for a full refund; see the advertising and refund policies."
  ],
  [
    "How are link opens counted?",
    "We record redirects from a live placement to its website, limiting repeat counts from the same hashed IP per listing per UTC day. Automated activity may still count; people sharing a network may be grouped. These are not guaranteed human visits or conversions."
  ],
  [
    "How do I manage my spot?",
    "Save your private recovery code before checkout. Your purchase status, review result, active amount, and expiry details are available under My spot. Use the code to restore access on another device. The code is not emailed; your payment receipt is handled by the payment provider. Unpaid checkout access expires after 24 hours or when its matching checkout is closed; paid purchases remain recoverable."
  ]
];
var publicRoutes = [
  "/",
  "/terms",
  "/privacy",
  "/refunds",
  "/contact",
  "/advertising-policy"
];
var pageMetadata = {
  "/": {
    title: "Qofeno \u2014 30-day website advertising from $10",
    description: "Discover independent websites through editorial picks and a readable paid ranking. One-time advertising starts at $10 for 30 days, reviewed before publication."
  },
  "/terms": {
    title: "Terms of purchase \u2014 Qofeno",
    description: "Read how Qofeno\u2019s one-time website advertising placements, active-spend ranking, 30-day periods, review process and purchase access work."
  },
  "/privacy": {
    title: "Privacy policy \u2014 Qofeno",
    description: "How Qofeno handles public listings, purchase access, essential cookies, saved sites, visitor estimates, link-open counts and privacy requests."
  },
  "/refunds": {
    title: "Refund policy \u2014 Qofeno",
    description: "Refunds for rejected or cancelled placements, advertising service problems and duplicate purchases. Contact support@loopproof.me with your receipt ID."
  },
  "/contact": {
    title: "Contact Qofeno \u2014 Support and seller details",
    description: "Contact support@loopproof.me for placement questions, purchase help or privacy requests. Qofeno is operated by Mohd Zaheeruddin, an individual based in India."
  },
  "/advertising-policy": {
    title: "Advertising standards \u2014 Qofeno",
    description: "Requirements for Qofeno advertising placements: working public websites, truthful descriptions, authorized submissions and a review before publication."
  },
  "/my-spot": {
    title: "My spot \u2014 Qofeno",
    description: "Use your private recovery code to check your purchase status and manage your Qofeno placement."
  },
  "/owner": {
    title: "Owner review \u2014 Qofeno",
    description: "The private Qofeno placement review desk."
  }
};
var missingPageMetadata = {
  title: "Page not found \u2014 Qofeno",
  description: "That page does not exist. Explore the Qofeno paid board and editorial discoveries or contact support@loopproof.me."
};

// src/lib/legal-content.ts
var legalPages = {
  "/terms": {
    title: "The terms, in plain sight.",
    description: "Effective 8 November 2026. These terms describe what a Qofeno advertising placement includes.",
    sections: [
      {
        title: "Who operates Qofeno",
        content: [
          {
            text: "Qofeno is operated by Mohd Zaheeruddin, an individual based in India, at loopproof.me. Contact "
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me"
          },
          {
            text: ". When a purchase is processed through Dodo Payments, Dodo acts as merchant of record; the applicable checkout entity and payment terms are shown before payment."
          }
        ]
      },
      {
        title: "What you are buying",
        content: [
          {
            text: "Each US$10 unit purchases advertising weight for a website placement for 30 days. You can buy 1\u2013100 units in a purchase. An approved, active placement appears as a readable entry on the public paid board, with its submitted name, description, category, website link, active advertising amount, overall paid rank, scheduled expiry amounts, and recorded link-open count. Active placements also have a public detail page. Any applicable tax is shown at checkout. This is a one-time advertising purchase, with no subscription, renewal charge, cash balance, resale right, or ownership of the website."
          }
        ]
      },
      {
        title: "How ranking and duration work",
        content: [
          {
            text: "The paid board ranks websites by current, paid, unrefunded advertising weight, highest first. Equal amounts are ordered by listing creation time, earliest first, then by internal listing ID if those timestamps also match. Category and display filters do not change the overall rank. Every approved active placement has a readable entry. Rank changes as purchases start, expire, or are refunded. No position, number of visitors, clicks, sales, or business result is guaranteed."
          },
          {
            break: true
          },
          {
            break: true
          },
          {
            text: "A new placement\u2019s 30 days start when it is approved after review. Additional purchases for an already approved placement begin their own 30-day periods when payment is confirmed. They do not extend the expiry of earlier purchases. As each period ends, that purchase\u2019s weight is removed. A listing leaves the active paid board when it has no remaining active weight."
          },
          {
            break: true
          },
          {
            break: true
          },
          {
            text: "Displayed prices to move up or take first place are estimates calculated from the current ranking and $10 purchase units. They reserve neither a price nor a position. Another purchase, an approval, a refund or an expiry may change the ranking before payment or review completes. No advertiser receives a cash prize, payout or resale right from ranking. Editorial discoveries are selected separately from paid placements; payment does not buy editorial selection."
          }
        ]
      },
      {
        title: "Submission, review, and access",
        content: [
          {
            text: "You must be authorized to advertise the submitted website and have the rights to your submitted content. Your placement must comply with our "
          },
          {
            text: "advertising policy",
            href: "/advertising-policy"
          },
          {
            text: ". Payment alone does not approve a new placement. We review new submissions before they appear publicly and may reject or suspend noncompliant content. Rejected paid placements receive a full refund of the affected purchase. Save the private recovery code shown before checkout; it restores access to your purchase status and placement. The code is not emailed. Contact support if you lose it, using your payment receipt ID rather than card details."
          },
          { break: true },
          { break: true },
          {
            text: "Recovery access to an unpaid checkout expires after 24 hours, or earlier when its matching checkout is closed from this browser. Closing checkout does not cancel a payment already being processed or issue a refund. If a payment is confirmed later, the original saved recovery code works for that confirmed purchase. We keep the order record and code hash so delayed payments can be reconciled. Paid-purchase recovery does not expire under this unpaid-code rule."
          }
        ]
      },
      {
        title: "Public metrics and third-party websites",
        content: [
          {
            text: "Link-open counts record requests to a placement\u2019s outbound link, deduplicated by network address for each UTC day. They are not an audited count of people, customers, or conversions. Shared networks, automated requests, and technical limitations can affect them. Advertisers are responsible for their destination websites; a paid placement is not a Qofeno endorsement. Clearly labeled examples demonstrate ranking and do not represent paid customers or transactions. Editorial discoveries are separate from paid advertisements and do not imply a partnership with the featured website."
          }
        ]
      },
      {
        title: "Problems and consumer rights",
        content: [
          {
            text: "Our "
          },
          {
            text: "refund policy",
            href: "/refunds"
          },
          {
            text: " applies to purchases. If we cannot provide the described placement, contact support so we can correct the issue or arrange an appropriate refund. Nothing in these terms removes mandatory consumer rights. The terms displayed when you purchase govern that purchase; later changes apply to future purchases. A payment completing through an earlier checkout is reviewed under the earlier offer. If that offer can no longer be delivered, we will arrange a full refund through the payment provider rather than substitute different placement terms."
          }
        ]
      }
    ]
  },
  "/privacy": {
    title: "Your information.",
    description: "Effective 12 November 2026. We use information to publish placements, verify payments, estimate website activity, prevent abuse, and provide support.",
    sections: [
      {
        title: "Who is responsible",
        content: [
          {
            text: "Mohd Zaheeruddin operates Qofeno from India. Privacy questions and requests can be sent to "
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me"
          },
          {
            text: "."
          }
        ]
      },
      {
        title: "Public placement information",
        content: [
          {
            text: "Approved, active listings publicly display the submitted name, description, website address, selected appearance, category, overall paid rank, active advertising amount, a schedule of active amounts ending at each expiry, and recorded link-open count. Submit only information you are authorized to make public. Payment card details, customer email addresses, recovery codes, and payment-provider identifiers are not part of the public listing."
          }
        ]
      },
      {
        title: "Payments and purchase access",
        content: [
          {
            text: "Your checkout email is sent to Dodo Payments for payment processing and your receipt; Qofeno does not store it in its order database. Our database stores order and listing identifiers, quantities, product and payment-provider identifiers, payment and review status, and relevant timestamps. It stores a hash of the private recovery code, not the raw code. We do not receive or store your full card number. If you email support, we receive the information included in your message."
          }
        ]
      },
      {
        title: "Essential cookies and technical information",
        content: [
          {
            text: "An essential HTTP-only cookie remembers your purchase access for up to one year. Unpaid access expires after 24 hours or when the matching checkout is closed; the cookie is cleared when that expiry is checked. A confirmed paid purchase remains recoverable with its saved code, including after a delayed payment. Clearing a cookie does not erase a copy of the code you saved yourself. We do not install advertising trackers or third-party analytics cookies on this site."
          },
          {
            break: true
          },
          {
            break: true
          },
          {
            text: "Saved placements and editorial discoveries are stored as IDs in this browser\u2019s local storage under \u201Cqofeno-saved-placements\u201D. These bookmarks belong to this browser, not an account. They are not sent to our server, used for tracking, or shared between devices. If storage is unavailable, saves last only for the current tab."
          },
          { break: true },
          { break: true },
          {
            text: "A temporary per-tab session-storage entry, \u201Cqofeno.checkout-return\u201D, stores only a checkout reference, timestamp and handoff flag to recognize a return from payment. It never stores the recovery code or provider checkout URL. It is cleared after the return or cancellation flow and discarded when older than two days. The reference alone grants no purchase access. If browser storage is unavailable, return detection may be limited to the current page or the provider\u2019s return URL."
          },
          {
            break: true
          },
          {
            break: true
          },
          {
            text: "To count outbound link opens, we use a daily salted hash of the network IP address to deduplicate requests for each listing and UTC day. These deduplication records expire after 48 hours and are removed during subsequent outbound requests. Rate-limit records use hashed IP addresses in ten-minute windows, expire after ten minutes, and are removed during subsequent rate-limited requests. Hashing does not make these records equivalent to anonymous data. Hosting providers may also process IP addresses and request logs for service operation and security."
          }
        ]
      },
      {
        title: "Public visitor estimates",
        content: [
          {
            text: "Our visitor panel publishes estimated activity on Qofeno: recent visible-page activity within two minutes, visitors today, and visitors this calendar month. Days and months use UTC. Collection begins on the date shown in the panel; we do not reconstruct earlier traffic. These estimates are not verified people, advertiser clicks, sales, or promised reach. Shared networks and browser types may be grouped; changes of network or browser may count separately. Known automated clients are excluded where detectable, but automated activity can still be counted."
          },
          { break: true },
          { break: true },
          {
            text: "Visitor measurement does not set an analytics cookie or store a tracking identifier on your device. The server briefly processes the connecting network address and a broad browser/platform category to create secret-keyed pseudonymous identifiers, separated by purpose and UTC period. The visitor database stores those identifiers and expiry times, not the raw address, complete browser description, visited paths, referrers, location, or purchase details. It is separate from the payment database. Public responses contain totals and measurement dates only."
          },
          { break: true },
          { break: true },
          {
            text: "Daily identifiers expire at the next UTC day and monthly identifiers at the next UTC month. Presence entries expire after two minutes. Expired entries are removed by bounded hourly cleanup, which can take additional runs if there is a backlog. Aggregate daily and monthly totals are retained for approximately 13 months. The pseudonymous identifiers are not equivalent to anonymous information while they are retained."
          },
          { break: true },
          { break: true },
          {
            text: "We respect supported Do Not Track and Global Privacy Control signals for this measurement. You can also exclude future activity from this browser using the visitor panel\u2019s counting preference; only that preference is saved locally. The panel remains readable when you opt out. Exclusion does not subtract activity already included in aggregate totals, and recent presence may remain visible until its two-minute window expires. Measurement pauses when a page is hidden or offline, and the owner and purchase-access pages do not send visitor heartbeats."
          }
        ]
      },
      {
        title: "Providers and international processing",
        content: [
          {
            text: "Cloudflare hosts the website and order database. Dodo Payments processes checkout, receipts, tax, refunds, and payment risk under its own privacy terms. Our email providers process support correspondence. These providers may process information outside your country. We do not sell personal information or add buyers to a marketing list. Destination websites have their own privacy practices once you follow an advertised link."
          }
        ]
      },
      {
        title: "Retention and requests",
        content: [
          {
            text: "We retain order and review records as needed to provide the service, resolve disputes, prevent abuse, and meet applicable legal and accounting obligations. Payment providers have their own retention requirements. You can request access, correction, or deletion by email. We may need to verify your purchase and retain records where legally required. Removing access records may prevent future purchase recovery; removing a live listing may affect its remaining display period."
          }
        ]
      }
    ]
  },
  "/refunds": {
    title: "If something goes wrong.",
    description: "Effective 8 November 2026. This policy covers one-time Qofeno advertising purchases.",
    sections: [
      {
        title: "Contact the operator",
        content: [
          {
            text: "Email "
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me"
          },
          {
            text: " with your payment receipt ID, placement name, and a description of the issue. Do not send full card numbers, passwords, or identity documents. We aim to reply within three business days."
          }
        ]
      },
      {
        title: "Before a new placement starts",
        content: [
          {
            text: "If a paid submission is rejected before activation, the affected purchase is eligible for a full refund. You may also request cancellation and a refund before that purchase\u2019s advertising period starts. A rejection notice is not confirmation that the payment provider has completed a refund; we process the refund separately and the provider supplies its confirmation."
          }
        ]
      },
      {
        title: "After advertising begins",
        content: [
          {
            text: "Contact us promptly if the placement is missing during its active period, is materially different from the agreed description, or suffers a significant service failure. We will investigate and correct the issue or provide an appropriate refund where the purchased service cannot be delivered. Accidental duplicate purchases should be reported promptly for review. Mandatory consumer remedies remain available."
          },
          {
            break: true
          },
          {
            break: true
          },
          {
            text: "Changes in ranking, other advertisers buying more advertising weight, low traffic, or a lack of clicks or sales are not service failures: those outcomes are not guaranteed. Change-of-mind refunds after the advertising period starts are not generally offered, except where applicable law requires otherwise."
          }
        ]
      },
      {
        title: "How refunds affect the paid board",
        content: [
          {
            text: "Approved refunds are returned through the original payment provider to the original payment method, subject to its processing time and your bank. A full refund removes that purchase\u2019s remaining advertising weight. A partial refund also suspends the affected purchase\u2019s weight while support reviews the adjustment; it does not automatically leave a proportional amount of advertising active. Other valid purchases for the same listing retain their separate expiry dates. Payment disputes or policy violations can suspend display while the issue is reviewed. There is no subscription or automatic renewal to cancel."
          }
        ]
      }
    ]
  },
  "/advertising-policy": {
    title: "A public page, with standards.",
    description: "Every new placement is reviewed before it appears. Buying space does not buy an exception to these rules.",
    sections: [
      {
        title: "Advertise a real, working destination",
        content: [
          {
            text: "Submit a functioning public website that accurately matches its name and description. You must be authorized to advertise it and hold the rights to your submitted material. Use a clear title and truthful description. Do not impersonate another business, imply a partnership with Qofeno, or suggest that placement is an endorsement."
          }
        ]
      },
      {
        title: "Content we do not accept",
        content: [
          {
            text: "We do not accept fraud, phishing, malware, deceptive redirects, impersonation, illegal products or services, stolen content, harassment, hate or violent threats, explicit adult content, gambling or betting, get-rich-quick schemes, misleading financial promises, or attempts to evade the payment provider\u2019s restrictions. We may decline other destinations that cannot be safely or lawfully advertised through this service."
          }
        ]
      },
      {
        title: "Keep the destination consistent",
        content: [
          {
            text: "Do not change an approved destination into prohibited or materially different content during the paid period. We may recheck destinations and suspend a listing while investigating a report. Submitting repeated rejected listings or manipulating link-open counts can also result in refusal or suspension."
          }
        ]
      },
      {
        title: "Review, rejection, and reports",
        content: [
          {
            text: "A new placement\u2019s paid display period begins after approval, so review time does not consume that period. If a paid submission is rejected before activation, we arrange a full refund of the affected purchase. To report a problematic listing, email "
          },
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me"
          },
          {
            text: " with the listing name or link and the reason. We may request enough information to verify the issue. See our"
          },
          {
            text: " "
          },
          {
            text: "refund policy",
            href: "/refunds"
          },
          {
            text: " for purchase problems."
          }
        ]
      }
    ]
  },
  "/contact": {
    title: "Reach the person behind it.",
    description: "For purchase help, placement questions, privacy requests, or a listing that needs a closer look.",
    sections: [
      {
        title: "Email",
        content: [
          {
            text: "support@loopproof.me",
            href: "mailto:support@loopproof.me"
          },
          {
            break: true
          },
          {
            text: "We aim to respond within three business days. For purchase support, include your receipt ID and listing name. For a content report, include the public listing link and explain the concern. Never send card details, passwords, or identity documents by email."
          }
        ]
      },
      {
        title: "Operator",
        content: [
          {
            text: "Qofeno is operated by Mohd Zaheeruddin, an individual based in India, serving advertisers internationally. Website: loopproof.me. Qofeno is the customer-facing brand."
          }
        ]
      },
      {
        title: "Useful details",
        content: [
          {
            text: "Terms of purchase",
            href: "/terms"
          },
          {
            text: " \xB7"
          },
          {
            text: " "
          },
          {
            text: "Refund policy",
            href: "/refunds"
          },
          {
            text: " \xB7"
          },
          {
            text: " "
          },
          {
            text: "Advertising standards",
            href: "/advertising-policy"
          },
          {
            text: " \xB7"
          },
          {
            text: " "
          },
          {
            text: "Privacy policy",
            href: "/privacy"
          }
        ]
      }
    ]
  }
};

// src/lib/brand-paths.ts
var QOFENO_SWEEP_PATH = "M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z";
var QOFENO_BLADE_PATH = "M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z";

// server/seo-artwork.ts
var legalArtwork = { "/terms": '<div class="legal-interface-art"><div class="interface-illustration interface-illustration--light interface-illustration--compact interface-on-light" data-interface-illustration="submit" data-interface-phase="static" aria-hidden="true"><svg viewBox="0 0 600 360" fill="none" focusable="false"><g data-interface-entrance="true"><g data-interface-detail="browser"><rect class="interface-paper" x="76" y="42" width="448" height="276" rx="22"></rect><g class="interface-browser-bar"><path class="interface-line" d="M76 89H524"></path><circle class="interface-muted-dot" cx="97" cy="66" r="4"></circle><circle class="interface-muted-dot" cx="112" cy="66" r="4"></circle><circle class="interface-muted-dot" cx="127" cy="66" r="4"></circle></g><rect class="interface-soft-fill" x="154" y="52" width="286" height="28" rx="9"></rect><text class="interface-label" x="171" y="73">your-website.com</text><path class="interface-muted-outline" d="M107 116H491V287H107Z"></path></g><g data-interface-travel-x="12"><g data-interface-subject="site-card"><rect class="interface-lilac" x="130" y="133" width="342" height="160" rx="17"></rect><g class="interface-ink-mark"><svg x="155" y="154" width="29" height="29" viewBox="0 0 202 202" class="interface-mark"><path d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg></g><text class="interface-card-title" x="155" y="222">Your website</text><path class="interface-ink-line" data-interface-draw="true" d="M156 246H329M156 261H268"></path><g data-interface-signal="submission"><circle class="interface-lime" cx="432" cy="253" r="23"></circle><path class="interface-ink-line" data-interface-draw="true" d="M422 263L442 243M422 243H442V263"></path></g></g></g></g></svg></div><span>The agreement</span></div>', "/privacy": '<div class="legal-interface-art"><div class="interface-illustration interface-illustration--light interface-illustration--compact interface-on-light" data-interface-illustration="privacy" data-interface-phase="static" aria-hidden="true"><svg viewBox="0 0 600 360" fill="none" focusable="false"><g data-interface-entrance="true"><g data-interface-subject="lock"><path class="interface-lock-shackle" d="M199 142V104C199 14 341 14 341 104V142"></path><rect class="interface-lilac" x="147" y="135" width="245" height="170" rx="27"></rect><circle class="interface-ink-fill" cx="269" cy="201" r="17"></circle><path class="interface-keyhole" d="M269 217V247"></path></g><g data-interface-travel-x="12"><g data-interface-detail="key"><circle class="interface-key-ring" cx="402" cy="222" r="28"></circle><path class="interface-key-stem" d="M430 222H517M483 222V242M505 222V242"></path></g></g><g data-interface-signal="private-access"><path class="interface-stroke" data-interface-draw="true" d="M177 326H362"></path></g></g></svg></div><span>Your information</span></div>', "/refunds": '<div class="legal-interface-art"><div class="interface-illustration interface-illustration--light interface-illustration--compact interface-on-light" data-interface-illustration="receipt" data-interface-phase="static" aria-hidden="true"><svg viewBox="0 0 600 360" fill="none" focusable="false"><g data-interface-entrance="true"><g data-interface-subject="ticket"><rect class="interface-paper" x="79" y="73" width="442" height="225" rx="24"></rect><svg x="109" y="100" width="35" height="35" viewBox="0 0 202 202" class="interface-mark"><path d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg><text class="interface-label" x="158" y="126">Placement</text><text class="interface-ticket-value" x="109" y="203">30 days</text><text class="interface-label" x="109" y="250">One-time purchase</text><circle class="interface-cutout" cx="79" cy="185" r="12"></circle><circle class="interface-cutout" cx="521" cy="185" r="12"></circle></g><g data-interface-travel-x="12"><g data-interface-detail="ticket-stub"><path class="interface-lilac" d="M398 74H498Q521 74 521 98V173C505 173 505 197 521 197V274Q521 298 498 298H398Z"></path><path class="interface-perforation" data-interface-draw="true" d="M398 86V285"></path><g class="interface-ink-mark"><svg x="430" y="115" width="50" height="50" viewBox="0 0 202 202" class="interface-mark"><path d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg></g><g class="interface-barcode"><path d="M423 208V250"></path><path d="M431 208V250"></path><path d="M439 208V250"></path><path d="M447 208V250"></path><path d="M455 208V250"></path><path d="M463 208V250"></path><path d="M471 208V250"></path><path d="M479 208V250"></path></g></g></g><g data-interface-signal="ticket-detail"><path class="interface-stroke" data-interface-draw="true" d="M109 272H249"></path></g></g></svg></div><span>Making it right</span></div>', "/contact": '<div class="legal-interface-art"><div class="interface-illustration interface-illustration--light interface-illustration--compact interface-on-light" data-interface-illustration="contact" data-interface-phase="static" aria-hidden="true"><svg viewBox="0 0 600 360" fill="none" focusable="false"><g data-interface-entrance="true"><g data-interface-subject="envelope"><path class="interface-soft-fill" d="M112 137L287 39Q300 31 313 39L488 137V293Q488 315 466 315H134Q112 315 112 293Z"></path></g><g data-interface-travel-y="-10"><g data-interface-detail="message"><rect class="interface-peach" x="181" y="69" width="238" height="168" rx="17"></rect><text class="interface-message-title" x="207" y="123">Hello.</text><path class="interface-ink-line" data-interface-draw="true" d="M208 153H375M208 175H336"></path></g></g><g data-interface-detail="envelope-front"><path class="interface-paper" d="M112 137L289 240Q300 246 311 240L488 137V293Q488 315 466 315H134Q112 315 112 293Z"></path><path class="interface-line" data-interface-draw="true" d="M120 307L245 215M480 307L355 215"></path></g><g data-interface-signal="reply"><circle class="interface-lime" cx="478" cy="112" r="37"></circle><path class="interface-check" data-interface-draw="true" d="M460 111L473 124L497 99"></path></g></g></svg></div><span>A line to us</span></div>', "/advertising-policy": '<div class="legal-interface-art"><div class="interface-illustration interface-illustration--light interface-illustration--compact interface-on-light" data-interface-illustration="review" data-interface-phase="static" aria-hidden="true"><svg viewBox="0 0 600 360" fill="none" focusable="false"><g data-interface-entrance="true"><g data-interface-subject="review-page"><rect class="interface-paper" x="87" y="47" width="337" height="265" rx="21"></rect><g class="interface-browser-bar"><path class="interface-line" d="M87 94H424"></path><circle class="interface-muted-dot" cx="108" cy="71" r="4"></circle><circle class="interface-muted-dot" cx="123" cy="71" r="4"></circle><circle class="interface-muted-dot" cx="138" cy="71" r="4"></circle></g><rect class="interface-peach" x="111" y="117" width="74" height="74" rx="13"></rect><g class="interface-ink-mark"><svg x="129" y="134" width="38" height="38" viewBox="0 0 202 202" class="interface-mark"><path d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg></g><text class="interface-label interface-label-strong" x="207" y="145">Your website</text><path class="interface-stroke" data-interface-draw="true" d="M209 164H371M112 222H346M112 244H303M112 266H257"></path></g><g data-interface-detail="reviewer"><circle class="interface-soft-fill" cx="465" cy="97" r="37"></circle><circle class="interface-line" cx="465" cy="86" r="10"></circle><path class="interface-line" data-interface-draw="true" d="M445 116C445 94 485 94 485 116"></path></g><g data-interface-travel-y="-8"><g data-interface-signal="approval"><circle class="interface-lime" cx="423" cy="245" r="79"></circle><path class="interface-check" data-interface-draw="true" d="M388 233L410 255L456 209"></path><text class="interface-badge-label" x="423" y="286" text-anchor="middle">Human review</text></g></g></g></svg></div><span>The house rules</span></div>' };
var referenceHeroMarkup = '<section class="reference-hero" data-reference-hero="static"><div class="reference-hero-kicker"><span>Qofeno</span><span>Independent websites. A paid front row.</span></div><div class="reference-hero-stage"><h1 class="reference-headline"><span class="reference-headline-line"><span class="reference-hero-word">Make</span> <span class="reference-hero-word">some</span></span> <span class="reference-headline-line"><span class="reference-hero-word">room.</span></span></h1><div class="reference-glyph reference-glyph-flower" aria-hidden="true"><div class="reference-glyph-drift"><div class="reference-glyph-entry"><div class="reference-glyph-idle"><svg viewBox="0 0 180 180" fill="none"><defs><linearGradient id="qofeno-petal" x1="30" y1="0" x2="140" y2="170" gradientUnits="userSpaceOnUse"><stop stop-color="#efff9b"></stop><stop offset="1" stop-color="#49db91"></stop></linearGradient></defs><g data-hero-petal="true"><path transform="rotate(0 90 90)" d="M90 90H12V12C55 12 90 47 90 90Z" fill="url(#qofeno-petal)"></path></g><g data-hero-petal="true"><path transform="rotate(90 90 90)" d="M90 90H12V12C55 12 90 47 90 90Z" fill="url(#qofeno-petal)"></path></g><g data-hero-petal="true"><path transform="rotate(180 90 90)" d="M90 90H12V12C55 12 90 47 90 90Z" fill="url(#qofeno-petal)"></path></g><g data-hero-petal="true"><path transform="rotate(270 90 90)" d="M90 90H12V12C55 12 90 47 90 90Z" fill="url(#qofeno-petal)"></path></g><circle cx="90" cy="90" r="11" fill="#0e100f"></circle></svg></div></div></div></div><div class="reference-glyph reference-glyph-orbit" aria-hidden="true"><div class="reference-glyph-drift"><div class="reference-glyph-entry"><div class="reference-glyph-idle"><svg viewBox="0 0 240 210" fill="none"><defs><linearGradient id="qofeno-orbit" x1="20" y1="20" x2="220" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#fec5fb"></stop><stop offset=".55" stop-color="#c4b6ff"></stop><stop offset="1" stop-color="#ff9867"></stop></linearGradient></defs><g data-hero-orbit-ring="true"><ellipse cx="120" cy="105" rx="96" ry="43" transform="rotate(-35 120 105)" stroke="url(#qofeno-orbit)" stroke-width="7"></ellipse></g><g data-hero-orbit-ring="true"><ellipse cx="120" cy="105" rx="83" ry="50" transform="rotate(-19 120 105)" stroke="url(#qofeno-orbit)" stroke-width="7"></ellipse></g><g data-hero-orbit-ring="true"><ellipse cx="120" cy="105" rx="70" ry="57" transform="rotate(-3 120 105)" stroke="url(#qofeno-orbit)" stroke-width="7"></ellipse></g><g data-hero-orbit-ring="true"><ellipse cx="120" cy="105" rx="57" ry="64" transform="rotate(13 120 105)" stroke="url(#qofeno-orbit)" stroke-width="7"></ellipse></g><g data-hero-orbit-ring="true"><ellipse cx="120" cy="105" rx="44" ry="71" transform="rotate(29 120 105)" stroke="url(#qofeno-orbit)" stroke-width="7"></ellipse></g><circle cx="120" cy="105" r="31" fill="#d8c8ff"></circle><circle cx="120" cy="105" r="11" fill="#0e100f"></circle></svg></div></div></div></div><div class="reference-hero-star" aria-hidden="true"><svg class="qofeno-brand-symbol" width="36" height="36" viewBox="0 0 202 202" fill="currentColor" shape-rendering="geometricPrecision" focusable="false" aria-hidden="true"><path data-brand-path="sweep" pathLength="1" d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path data-brand-path="blade" pathLength="1" d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg></div></div><div class="reference-hero-bottom"><p class="reference-hero-description">Independent websites.<br/>One shared place to be discovered.</p><div class="hero-actions reference-hero-actions"><a class="button button-outline" href="#board">Explore the board <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" aria-hidden="true"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg></a><a class="text-link hero-buy" href="#how-it-works">Get a placement \xB7 $10 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></a></div></div><p class="reference-hero-meta"><span>One-time advertising placements</span><span>30 days per purchase \xB7 Your link included</span></p></section>';
var productTourMarkup = '<section class="product-tour" id="take-a-look" aria-labelledby="_R_0_" data-tour-chapter="0" data-tour-amount="10" data-tour-phase="static"><div class="product-tour-heading"><p class="product-tour-eyebrow">A little more open web</p><h2 id="_R_0_">Good websites.<br/><span>Worth a closer look.</span></h2><p>Find a new favourite. Or give your own website<br class="tour-desktop-break"/> a place to be discovered.</p></div><div class="product-tour-window" role="figure" aria-describedby="_R_0H1_"><div class="product-tour-window-bar" aria-hidden="true"><span class="tour-window-brand"><svg class="qofeno-brand-symbol" width="20" height="20" viewBox="0 0 202 202" fill="currentColor" shape-rendering="geometricPrecision" focusable="false" aria-hidden="true"><path data-brand-path="sweep" pathLength="1" d="M35.73 143.76L70.37 123.76C53.73 111.15 52.4 88.39 62.79 71.14C68.9 61 78.26 53.1 87.6 46.04C95.86 39.8 104.53 34.13 113.43 28.86C120.56 24.64 127.85 20.69 135.22 16.92C144.06 12.41 153.02 8.03 162.2 4.24C152.78 7.16 143.35 10.08 133.98 13.17C117.28 18.69 100.72 24.79 84.85 32.4C74.31 37.45 63.83 43.06 54.67 50.38C39.44 62.57 29.36 79.21 26.78 98.66C25.9 105.27 26 112 26.97 118.59C28.28 127.49 31.37 135.92 35.73 143.76Z"></path><path data-brand-path="blade" pathLength="1" d="M110.04 36.76C102.75 41.33 95.64 46.15 88.82 51.4C78.94 59.01 69.28 67.7 64.22 79.35L73.57 87.19C77.42 82.8 82.12 79.41 87.67 77.5C115.62 67.89 140.6 98.36 125.73 123.87C123.58 127.55 120.7 130.79 117.3 133.34C113.74 136.02 109.62 137.94 105.28 138.94C100.43 140.06 95.33 140.03 90.5 138.85C83.59 137.16 77.8 133.24 73.21 127.89L38.38 148C58.95 177.97 97.13 188.1 129.88 172.36L147.82 197.76L175.82 197.76L152.52 154.88C158.61 147.67 163.39 139.52 166.38 130.54C177.38 97.58 162.97 61.06 132.43 44.48C125.42 40.67 117.88 38.18 110.04 36.76Z"></path></svg> Qofeno</span><span class="tour-window-address"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg> A small corner of the open web</span><span class="tour-window-label">Walkthrough</span></div><div class="product-tour-viewport" data-tour-viewport="true"><div class="product-tour-scene product-tour-discover" data-tour-panel="0" aria-hidden="true"><div class="tour-discover-list"><div class="tour-list-heading"><span>Off the beaten feed</span><span>Editorial picks</span></div><div class="tour-find tour-find-radio" data-tour-find="true"><span class="tour-find-icon">R</span><div><small>Culture</small><strong>Radio Garden</strong><span>Hear what\u2019s playing somewhere else.</span></div><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div><div class="tour-find" data-tour-find="true"><span class="tour-find-icon tour-find-book"><svg viewBox="0 0 36 36" fill="none"><path d="M9 7H25V29H9C5 29 5 24 9 24H25M9 7C5 7 5 11 5 14V26M12 12H21M12 16H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><div><small>Reading</small><strong>Standard Ebooks</strong><span>Classics, carefully made.</span></div><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div><div class="tour-find" data-tour-find="true"><span class="tour-find-icon tour-find-type">Aa</span><div><small>Design</small><strong>Fonts In Use</strong><span>Good type, out in the world.</span></div><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div></div><div class="tour-discovery-feature" data-tour-feature="true"><div class="tour-radio-art"><svg viewBox="0 0 240 140" fill="none" aria-hidden="true"><path d="M16 70H224M120 12V128" stroke="currentColor" opacity=".2"></path><g data-tour-radio="true"><circle cx="120" cy="70" r="53" stroke="currentColor" stroke-width="1.5"></circle><ellipse cx="120" cy="70" rx="26" ry="53" stroke="currentColor" stroke-width="1.5"></ellipse><ellipse cx="120" cy="70" rx="53" ry="21" stroke="currentColor" stroke-width="1.5"></ellipse><path d="M75 42C100 53 140 53 165 42M75 98C100 87 140 87 165 98" stroke="currentColor" stroke-width="1.5"></path></g><circle cx="150" cy="43" r="10" fill="#fffce1"></circle><circle cx="150" cy="43" r="4" fill="currentColor"></circle><path d="M43 51L31 44M43 89L31 96M197 51L209 44M197 89L209 96" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg></div><span class="tour-feature-category">A different kind of window</span><h3>Somewhere,<br/>a song is playing.</h3><p>Turn a globe. Find a station.<br/>Take the long way around.</p><div class="tour-feature-bottom"><span>radio.garden</span><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div></div></div><div class="product-tour-scene product-tour-listing" data-tour-panel="1" aria-hidden="true"><div class="tour-listing-paper" data-tour-listing="true"><div class="tour-listing-top"><span>Website placement</span><span>Fictional example</span></div><div class="tour-listing-identity"><span class="tour-drift-mark">d.</span><span>Culture &amp; curiosity</span></div><h3>Drift</h3><p>Small stories for the<br/>scenic route.</p><div class="tour-listing-link"><span>drift.example</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div></div><div class="tour-listing-notes"><div class="tour-review-note" data-tour-review="true"><span class="tour-review-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg></span><div><span>Example review</span><strong>A person checks your site</strong></div></div><dl class="tour-listing-facts"><div><dt>One-time placement</dt><dd>$10 <span>+ tax</span></dd></div><div><dt>First term starts at approval</dt><dd>30 <span>days</span></dd></div></dl><p><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-3" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6h4"></path></svg> No automatic renewal.<br/>Your dates stay visible.</p></div></div><div class="product-tour-scene product-tour-ranking" data-tour-panel="2" aria-hidden="true"><div class="tour-ranking-board"><div class="tour-list-heading"><span>The front row</span><span>Fictional amounts</span></div><div class="tour-rank-stage"><ol class="tour-rank-positions"><li>01</li><li>02</li><li>03</li></ol><div class="tour-rank-rows"><div class="tour-rank-row-wrap" data-tour-rank-row="studio" style="transform:translateY(0%)"><div class="tour-rank-row tour-rank-lilac"><span class="tour-rank-monogram">S</span><strong>Studio<small>An older example listing</small></strong><span class="tour-rank-amount">$30</span></div></div><div class="tour-rank-row-wrap" data-tour-rank-row="journal" style="transform:translateY(100%)"><div class="tour-rank-row tour-rank-peach"><span class="tour-rank-monogram">J</span><strong>Journal<small>An older example listing</small></strong><span class="tour-rank-amount">$20</span></div></div><div class="tour-rank-row-wrap" data-tour-rank-row="drift" style="transform:translateY(200%)"><div class="tour-rank-row tour-rank-lime"><span class="tour-rank-monogram">D</span><strong>Drift<small>Your example website</small></strong><span class="tour-rank-amount">$10</span></div></div></div></div><p class="tour-ranking-note">Active paid spend sets the order.</p></div><div class="tour-ranking-receipt" data-tour-receipt="true"><span class="tour-receipt-heading">Drift\u2019s example placement</span><div class="tour-receipt-amount">$10</div><span class="tour-receipt-detail">Fictional active spend</span><div class="tour-receipt-rule"></div><div class="tour-receipt-position"><span>Example rank</span><strong>#3</strong></div><p>Every approved site gets a readable entry.</p><span class="tour-receipt-foot"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg> No payment in this walkthrough</span></div></div></div><div class="product-tour-example-note"><span>Illustrative walkthrough \xB7 no purchase</span><span>Made for websites, like yours.</span></div></div><div class="product-tour-chapters"><span class="product-tour-chapter"><span>01</span><strong>Find a detour</strong><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" aria-hidden="true"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg></span><span class="product-tour-chapter"><span>02</span><strong>Make an introduction</strong><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" aria-hidden="true"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg></span><span class="product-tour-chapter"><span>03</span><strong>See how rank works</strong><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down" aria-hidden="true"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg></span></div><div class="product-tour-caption" id="_R_0H1_"><div><h3>The good stuff is out there.</h3><p>Browse independent websites and a handpicked collection. Editorial picks are free to explore, and separate from paid placements.</p></div><a class="text-link" href="#discover">Explore the real collection<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></a></div></section>';

// src/lib/editorial-picks.ts
var editorialPicks = [
  {
    id: "public-domain-review",
    title: "The Public Domain Review",
    description: "Essays and unusual finds from the history of art, books and ideas.",
    url: "https://publicdomainreview.org/",
    host: "publicdomainreview.org",
    category: "reading",
    note: "Start with the collections: old maps, curious photographs and forgotten stories."
  },
  {
    id: "standard-ebooks",
    title: "Standard Ebooks",
    description: "Classic books carefully proofread and typeset for a better reading experience.",
    url: "https://standardebooks.org/",
    host: "standardebooks.org",
    category: "reading",
    note: "Volunteer-produced editions drawn from texts in the US public domain."
  },
  {
    id: "radio-garden",
    title: "Radio Garden",
    description: "Turn a globe and listen to live radio stations from different places.",
    url: "https://radio.garden/",
    host: "radio.garden",
    category: "culture",
    note: "Choose a place you have never visited and see what is playing."
  },
  {
    id: "window-swap",
    title: "WindowSwap",
    description: "Look through windows shared by people around the world.",
    url: "https://www.window-swap.com/",
    host: "window-swap.com",
    category: "culture",
    note: "A change of scenery, from somebody else\u2019s everyday view."
  },
  {
    id: "fonts-in-use",
    title: "Fonts In Use",
    description: "See how typefaces work in real books, posters, packaging and websites.",
    url: "https://fontsinuse.com/",
    host: "fontsinuse.com",
    category: "design",
    note: "Browse by typeface, format or subject to find the detail you came for."
  },
  {
    id: "neal-fun",
    title: "Neal.fun",
    description: "Small interactive experiments, visualizations and games by Neal.",
    url: "https://neal.fun/",
    host: "neal.fun",
    category: "other",
    note: "An invitation to click around and find something unexpected."
  }
];

// server/seo.ts
var escapeHTML = /* @__PURE__ */ __name((value) => value.replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
), "escapeHTML");
var serializeStructuredData = /* @__PURE__ */ __name((value) => JSON.stringify(value).replace(
  /[<>&\u2028\u2029]/g,
  (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
), "serializeStructuredData");
var isPublicPage = /* @__PURE__ */ __name((path2) => publicRoutes.includes(path2), "isPublicPage");
var isApplicationPage = /* @__PURE__ */ __name((path2) => isPublicPage(path2) || path2 === "/owner" || path2 === "/my-spot", "isApplicationPage");
var SITEMAP_PAGE_SIZE = 1e3;
var SITEMAP_INDEX_LIMIT = 1e3;
var sharePath = "/og-reference.png?v=20261108-line-art";
var shareAlt = "Qofeno \u2014 Make some room. Independent websites. A paid front row. Thirty-day placements from US$10 at loopproof.me.";
var icon = `<svg class="qofeno-brand-symbol" width="27" height="27" viewBox="0 0 202 202" fill="currentColor" aria-hidden="true"><path d="${QOFENO_SWEEP_PATH}"/><path d="${QOFENO_BLADE_PATH}"/></svg>`;
var arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17L17 7M7 7H17V17"/></svg>';
var footerLinks = '<a href="/contact">Contact</a> \xB7 <a href="/terms">Terms</a> \xB7 <a href="/privacy">Privacy</a> \xB7 <a href="/refunds">Refunds</a> \xB7 <a href="/advertising-policy">Advertising standards</a>';
var header = `<a href="#main" class="skip-link">Skip to content</a><header class="qofeno-header" data-open="false" data-scrolled="false"><div class="qofeno-header-inner"><span class="qofeno-header-shell" aria-hidden="true"></span><a class="qofeno-header-brand" href="/" aria-label="Qofeno. Home"><span class="qofeno-header-mark" aria-hidden="true">${icon}</span><span>Qofeno<span class="qofeno-header-dot">.</span></span></a><nav class="qofeno-header-navigation" aria-label="Main navigation"><a class="qofeno-header-canvas" href="/#board">The paid board</a><a class="qofeno-header-trigger" href="/contact">Contact</a></nav><div class="qofeno-header-actions"><a class="qofeno-header-my-spot" href="/my-spot">My spot ${arrow}</a><a class="qofeno-header-buy" href="/#how-it-works">Get a placement ${arrow}</a></div></div></header>`;
function partsHTML(parts) {
  return parts.map(
    (part) => part.break ? "<br/>" : part.href ? `<a href="${escapeHTML(part.href)}">${escapeHTML(part.text)}</a>` : escapeHTML(part.text)
  ).join("");
}
__name(partsHTML, "partsHTML");
function homeContent(checkoutAvailable) {
  return `${referenceHeroMarkup}${productTourMarkup}
<section class="canvas-section" id="board"><div class="section-heading"><div><p class="eyebrow">Paid advertising</p><h2>The front <span class="muted">row.</span></h2></div><p>Independent websites, ranked by active paid spend.<br/>Every approved placement gets a readable entry.</p></div><div class="canvas-panel"><p>One-time placements start at US$10 for 30 days. Higher active paid amounts rank first. Equal amounts put the earlier-created listing first. Categories, search and sorting help you explore; they do not change the overall paid rank.</p><p>A displayed price to move up is a current estimate, not a reserved position. Traffic, clicks and sales are not guaranteed.</p><noscript><p>Enable JavaScript to load the current paid ranking, search websites and start a purchase. Public placement pages are also available in the <a href="/sitemap.xml">sitemap</a>.</p></noscript></div></section>
<section class="canvas-section" id="discover"><div class="section-heading"><div><p class="eyebrow">Editorial discoveries \xB7 Not paid placements</p><h2>A few good <span class="muted">finds.</span></h2></div><p>Selected separately from the paid board.<br/>Payment does not buy editorial selection.</p></div><ul>${editorialPicks.map((pick) => `<li><h3><a href="${escapeHTML(pick.url)}" rel="noopener noreferrer">${escapeHTML(pick.title)}</a></h3><p>${escapeHTML(pick.description)}</p><p>${escapeHTML(pick.note)}</p></li>`).join("")}</ul><a href="/discover.xml">Follow editorial discoveries by RSS</a></section>
<section class="legal-page" id="how-it-works"><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">How it works</p><h2>A place on the page. On your terms.</h2><p>One-time website advertising from US$10 for 30 days.</p></div></header><div class="legal-sections"><section class="legal-section"><span class="legal-section-number" aria-hidden="true">01</span><div><h3>Introduce your website</h3><p>Submit a working website, a name and a truthful description. Choose a category and your advertising amount in $10 units. You must be authorized to advertise the destination.</p></div></section><section class="legal-section"><span class="legal-section-number" aria-hidden="true">02</span><div><h3>A human takes a look</h3><p>Every new paid listing is reviewed before publication. Its first 30 days start after approval. Rejected paid submissions are eligible for a full refund.</p></div></section><section class="legal-section"><span class="legal-section-number" aria-hidden="true">03</span><div><h3>Your 30 days begin</h3><p>Your active paid amount determines your rank. Each additional purchase has an independent 30-day period. Ranking can change as purchases start, expire or are refunded; every approved active listing remains readable.</p><p>${checkoutAvailable ? "JavaScript is needed to prepare your placement and open the secure checkout." : "Payments are not open yet. You can review the placement terms and contact support@loopproof.me with questions."}</p><p><a href="/terms">Read the terms</a> \xB7 <a href="/refunds">Refund policy</a> \xB7 <a href="/advertising-policy">Advertising standards</a></p></div></section></div></section>
<section class="questions-section" id="questions"><div><p class="eyebrow">Fair questions</p><h2>The details,<br/>without the tiny type.</h2><a class="text-link" href="mailto:support@loopproof.me">Ask us something ${arrow}</a></div><div class="faq-list">${faqEntries.map(([q, a]) => `<details><summary>${escapeHTML(q)}</summary><p>${escapeHTML(a)}</p></details>`).join("")}</div></section>`;
}
__name(homeContent, "homeContent");
function legalContent(path2) {
  const page = legalPages[path2];
  const index = `<nav class="legal-document-index" aria-label="On this page"><span>In this document</span>${page.sections.map((section, index2) => `<a href="#policy-${index2 + 1}">${escapeHTML(section.title)}</a>`).join("")}</nav>`;
  const sections = page.sections.map((section, index2) => `<section class="legal-section" id="policy-${index2 + 1}" tabindex="-1"><span class="legal-section-number" aria-hidden="true">${String(index2 + 1).padStart(2, "0")}</span><div><h2>${escapeHTML(section.title)}</h2><p>${partsHTML(section.content)}</p></div></section>`).join("");
  return `<article class="legal-page legal-interface-page"><a class="legal-back" href="/">\u2190 Back to the board</a><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Qofeno / The useful details</p><h1>${escapeHTML(page.title)}</h1><p>${escapeHTML(page.description)}</p></div>${legalArtwork[path2] || ""}</header>${index}<div class="legal-sections">${sections}</div></article>`;
}
__name(legalContent, "legalContent");
function utilityContent(path2) {
  const known = path2 === "/my-spot" || path2 === "/owner";
  const title = path2 === "/my-spot" ? "Your little corner." : path2 === "/owner" ? "The review desk." : "Nothing posted here.";
  const text = path2 === "/my-spot" ? "Enable JavaScript to restore your purchase with its private recovery code. Never share your recovery code publicly. Contact support@loopproof.me if you need help." : path2 === "/owner" ? "This review desk requires authorized access and JavaScript. No private review or customer data is included in this page." : missingPageMetadata.description;
  return `<article class="legal-page"><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Qofeno / ${known ? "Private access" : "Page not found"}</p><h1>${title}</h1><p>${escapeHTML(text)}</p><a href="/">Back to the board</a></div></header></article>`;
}
__name(utilityContent, "utilityContent");
function staticSearchPage(path2, origin, live, checkoutAvailable) {
  const metadata = pageMetadata[path2] || missingPageMetadata;
  const indexable = live && isPublicPage(path2);
  const organization = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "Qofeno",
    url: `${origin}/`,
    email: "support@loopproof.me",
    logo: `${origin}/brand/qofeno-icon.svg`,
    founder: { "@type": "Person", name: "Mohd Zaheeruddin" },
    address: { "@type": "PostalAddress", addressCountry: "IN" }
  };
  const website = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: `${origin}/`,
    name: "Qofeno",
    inLanguage: "en",
    publisher: { "@id": `${origin}/#organization` }
  };
  const webpage = {
    "@type": path2 === "/contact" ? "ContactPage" : "WebPage",
    "@id": `${origin}${path2}#page`,
    url: `${origin}${path2}`,
    name: metadata.title,
    description: metadata.description,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` }
  };
  const structuredData = indexable ? [organization, website, webpage] : [];
  if (indexable && path2 === "/")
    structuredData.push({
      "@type": "FAQPage",
      "@id": `${origin}/#questions`,
      mainEntity: faqEntries.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a }
      }))
    });
  return {
    path: path2,
    ...metadata,
    status: isApplicationPage(path2) ? 200 : 404,
    indexable,
    structuredData,
    content: path2 === "/" ? homeContent(checkoutAvailable) : legalPages[path2] ? legalContent(path2) : utilityContent(path2)
  };
}
__name(staticSearchPage, "staticSearchPage");
function placementSearchPage(path2, listing, _share, live) {
  const title = listing ? `${listing.title} \u2014 Qofeno` : "Placement unavailable \u2014 Qofeno";
  const description = listing ? `${listing.tagline} View its current paid rank and the scheduled expiry of its $${listing.activeSpend} active advertising placement.` : "This placement is not currently live. Explore Qofeno\u2019s active paid board and editorial discoveries.";
  const content = listing ? `<article class="legal-page"><a class="legal-back" href="/">\u2190 Back to the board</a><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Paid advertising placement</p><h1>${escapeHTML(listing.title)}</h1><p>${escapeHTML(listing.tagline)}</p><p>${escapeHTML(listing.host)}</p><p>Active advertising amount: US$${listing.activeSpend}. ${listing.rank ? `Overall paid rank: #${listing.rank}.` : ""} Latest current expiry: ${new Date(listing.expiresAt).toISOString().slice(0, 10)} UTC.</p><a class="button button-dark" href="/go/${encodeURIComponent(listing.id)}" rel="sponsored noopener noreferrer">Visit website ${arrow}</a><p>This is a reviewed advertising placement, not a Qofeno endorsement. Ranking can change as other purchases start or expire. Traffic, clicks and sales are not guaranteed.</p></div></header></article>` : '<article class="legal-page"><h1>This spot isn\u2019t live.</h1><p>This link does not currently have an active public placement. Browse the paid board for websites that are live now.</p><a href="/">Back to the board</a></article>';
  return {
    path: path2,
    title,
    description,
    status: listing ? 200 : 404,
    indexable: !!listing && live,
    content
  };
}
__name(placementSearchPage, "placementSearchPage");
function renderSearchDocument(template, page, origin) {
  const canonical = origin + page.path;
  const robots = page.indexable ? "index,follow" : "noindex,nofollow";
  const metadata = `<title>${escapeHTML(page.title)}</title>
<meta name="description" content="${escapeHTML(page.description)}" />
<meta name="robots" content="${robots}" />
<link rel="canonical" href="${escapeHTML(canonical)}" />
<meta property="og:title" content="${escapeHTML(page.title)}" />
<meta property="og:description" content="${escapeHTML(page.description)}" />
<meta property="og:url" content="${escapeHTML(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Qofeno" />
<meta property="og:image" content="${escapeHTML(origin + sharePath)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${escapeHTML(shareAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHTML(page.title)}" />
<meta name="twitter:description" content="${escapeHTML(page.description)}" />
<meta name="twitter:image" content="${escapeHTML(origin + sharePath)}" />
<meta name="twitter:image:alt" content="${escapeHTML(shareAlt)}" />${page.structuredData?.length ? `
<script type="application/ld+json">${serializeStructuredData({ "@context": "https://schema.org", "@graph": page.structuredData })}<\/script>` : ""}`;
  let html = template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "").replace(
    /<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,
    ""
  ).replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, () => `${metadata}
</head>`) : `<!doctype html><html lang="en"><head>${metadata}</head><body><div id="root"></div>${html}</body></html>`;
  const root = `<div id="root"><div class="motion-root">${header}<main id="main">${page.content}</main><footer class="site-footer" style="padding:32px max(24px,calc((100vw - 1200px)/2))"><p>Qofeno \xB7 Mohd Zaheeruddin, India \xB7 <a href="mailto:support@loopproof.me">support@loopproof.me</a></p><nav aria-label="Footer navigation">${footerLinks}</nav></footer></div></div>`;
  return html.replace(
    /<div\b[^>]*\bid=["']root["'][^>]*>\s*<\/div>/i,
    () => root
  );
}
__name(renderSearchDocument, "renderSearchDocument");
function sitemapIndexXML(origin, cursors) {
  const urls = [
    `${origin}/sitemaps/pages.xml`,
    ...cursors.map(
      (cursor) => `${origin}/sitemaps/placements/${encodeURIComponent(cursor)}.xml`
    )
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${escapeHTML(url)}</loc></sitemap>`).join("")}</sitemapindex>`;
}
__name(sitemapIndexXML, "sitemapIndexXML");
function sitemapURLsXML(origin, paths) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path2) => `<url><loc>${escapeHTML(origin + path2)}</loc></url>`).join("")}</urlset>`;
}
__name(sitemapURLsXML, "sitemapURLsXML");

// src/lib/placement-category.ts
var placementCategories = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "reading", label: "Reading" },
  { value: "learning", label: "Learning" },
  { value: "culture", label: "Culture" },
  { value: "other", label: "Other" }
];
function isPlacementCategory(value) {
  return typeof value === "string" && placementCategories.some((category) => category.value === value);
}
__name(isPlacementCategory, "isPlacementCategory");

// server/visitors.ts
import { isIP } from "node:net";
var VisitorError = class extends Error {
  constructor(status2, message, retryAfter) {
    super(message);
    this.status = status2;
    this.retryAfter = retryAfter;
  }
  status;
  retryAfter;
  static {
    __name(this, "VisitorError");
  }
};
var WINDOW_MS = 12e4;
var COALESCE_MS = 45e3;
var CLEANUP_LIMIT = 5e3;
var encoder = new TextEncoder();
function json(value, status2 = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status: status2,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers
    }
  });
}
__name(json, "json");
function periods(now) {
  const date = new Date(now);
  return {
    day: date.toISOString().slice(0, 10),
    month: date.toISOString().slice(0, 7),
    nextDay: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
    nextMonth: Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
  };
}
__name(periods, "periods");
function trustedAddress(request) {
  const address = request.headers.get("CF-Connecting-IP");
  if (!address || address.length > 45) return null;
  const version = isIP(address);
  if (version === 4) return address;
  if (version === 6) return new URL(`http://[${address}]/`).hostname.slice(1, -1);
  return null;
}
__name(trustedAddress, "trustedAddress");
async function sha256(value) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
async function protect(request, env) {
  if (!env.VISITOR_RATE_LIMITER) {
    if (env.REQUIRE_REQUEST_PROTECTION === "true")
      throw new VisitorError(503, "Visitor estimates are temporarily unavailable.");
    return;
  }
  let outcome;
  try {
    outcome = await env.VISITOR_RATE_LIMITER.limit({
      key: await sha256(trustedAddress(request) || "unavailable-address")
    });
  } catch {
    throw new VisitorError(503, "Visitor estimates are temporarily unavailable.");
  }
  if (outcome?.success === false)
    throw new VisitorError(429, "Visitor estimates are updating too frequently. Please wait a minute.", 60);
  if (outcome?.success !== true)
    throw new VisitorError(503, "Visitor estimates are temporarily unavailable.");
}
__name(protect, "protect");
function coarseBrowser(userAgent) {
  const platform = /android/i.test(userAgent) ? "android" : /iphone|ipad|ipod/i.test(userAgent) ? "ios" : /windows/i.test(userAgent) ? "windows" : /macintosh|mac os/i.test(userAgent) ? "mac" : /linux/i.test(userAgent) ? "linux" : "other";
  const browser = /edg(?:e|a|ios)?\//i.test(userAgent) ? "edge" : /opr\/|opera/i.test(userAgent) ? "opera" : /firefox\/|fxios\//i.test(userAgent) ? "firefox" : /chrome\/|chromium\/|crios\//i.test(userAgent) ? "chromium" : /safari\//i.test(userAgent) ? "safari" : "other";
  return `${platform}:${browser}`;
}
__name(coarseBrowser, "coarseBrowser");
function excluded(request, userAgent) {
  return request.headers.get("DNT") === "1" || request.headers.get("Sec-GPC") === "1" || /bot|crawler|spider|headless|playwright|puppeteer|curl\/|wget\/|python|uptime|monitor|preview|facebookexternalhit|slurp/i.test(userAgent) || request.cf?.botManagement?.verifiedBot === true;
}
__name(excluded, "excluded");
async function emptyBody(request) {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    throw new VisitorError(415, "Use a JSON request.");
  if (Number(request.headers.get("Content-Length")) > 256)
    throw new VisitorError(413, "The visitor request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new VisitorError(400, "Send an empty JSON object.");
  const decoder = new TextDecoder();
  let length = 0;
  let raw = "";
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > 256) {
      await reader.cancel();
      throw new VisitorError(413, "The visitor request is too large.");
    }
    raw += decoder.decode(part.value, { stream: true });
  }
  raw += decoder.decode();
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new VisitorError(400, "Send an empty JSON object.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length)
    throw new VisitorError(400, "Visitor identifiers and counts are assigned by the server.");
}
__name(emptyBody, "emptyBody");
async function identityKeys(request, env, now, userAgent) {
  const address = trustedAddress(request);
  if (!address || !env.VISITOR_STATS_SECRET || env.VISITOR_STATS_SECRET.length < 32)
    throw new VisitorError(503, "Visitor measurement is temporarily unavailable.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.VISITOR_STATS_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const current = periods(now);
  const identity = `${address}|${coarseBrowser(userAgent)}`;
  const sign = /* @__PURE__ */ __name(async (purpose, period) => {
    const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`qofeno-visitors-v1|${purpose}|${period}|${identity}`)));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, "sign");
  const [day, month, presence] = await Promise.all([
    sign("daily", current.day),
    sign("monthly", current.month),
    sign("presence", current.month)
  ]);
  return { day, month, presence, current };
}
__name(identityKeys, "identityKeys");
async function record(request, env, now, userAgent) {
  const db = env.VISITOR_DB;
  if (!db) throw new VisitorError(503, "Visitor measurement is temporarily unavailable.");
  const keys = await identityKeys(request, env, now, userAgent);
  const statements = [];
  for (const [kind, period, key, expires] of [
    ["day", keys.current.day, keys.day, keys.current.nextDay],
    ["month", keys.current.month, keys.month, keys.current.nextMonth]
  ]) {
    statements.push(db.prepare(`INSERT INTO visitor_totals (kind,period,visitors)
      SELECT ?,?,1 WHERE NOT EXISTS (
        SELECT 1 FROM visitor_dedupe WHERE kind = ? AND period = ? AND visitor_key = ?
      ) ON CONFLICT(kind,period) DO UPDATE SET visitors = visitors + 1`).bind(kind, period, kind, period, key));
    statements.push(db.prepare("INSERT OR IGNORE INTO visitor_dedupe (kind,period,visitor_key,expires_at) VALUES (?,?,?,?)").bind(kind, period, key, expires));
  }
  statements.push(db.prepare(`INSERT INTO visitor_presence (period,visitor_key,last_seen_at,expires_at) VALUES (?,?,?,?)
    ON CONFLICT(period,visitor_key) DO UPDATE SET last_seen_at = excluded.last_seen_at,expires_at = excluded.expires_at
    WHERE visitor_presence.last_seen_at <= excluded.last_seen_at - ?`).bind(keys.current.month, keys.presence, now, now + WINDOW_MS, COALESCE_MS));
  await db.batch(statements);
}
__name(record, "record");
async function snapshot(env, now) {
  if (!env.VISITOR_DB) throw new VisitorError(503, "Visitor estimates are temporarily unavailable.");
  const current = periods(now);
  const row = await env.VISITOR_DB.prepare(`SELECT started_at AS startedAt,
    (SELECT COUNT(*) FROM visitor_presence WHERE period = ? AND expires_at > ?) AS online,
    COALESCE((SELECT visitors FROM visitor_totals WHERE kind = 'day' AND period = ?),0) AS today,
    COALESCE((SELECT visitors FROM visitor_totals WHERE kind = 'month' AND period = ?),0) AS month
    FROM visitor_meta WHERE id = 1`).bind(current.month, now, current.day, current.month).first();
  if (!row || [row.startedAt, row.online, row.today, row.month].some((value) => !Number.isSafeInteger(value) || value < 0))
    throw new VisitorError(503, "Visitor estimates are temporarily unavailable.");
  return {
    online: row.online,
    today: row.today,
    month: row.month,
    asOf: now,
    day: current.day,
    monthKey: current.month,
    startedAt: row.startedAt,
    onlineWindowSeconds: 120,
    refreshAfterSeconds: 60,
    timezone: "UTC",
    metric: "estimated_visitors",
    trackingEnabled: env.VISITOR_TRACKING_ENABLED !== "false"
  };
}
__name(snapshot, "snapshot");
async function publicSnapshot(request, env, now) {
  const current = periods(now);
  const trackingState = env.VISITOR_TRACKING_ENABLED === "false" ? "paused" : "enabled";
  const key = new Request(`${new URL(request.url).origin}/__qofeno/visitor-snapshot/v1/${current.day}/${trackingState}`);
  let cache;
  try {
    if (typeof caches !== "undefined") cache = await caches.open("qofeno-visitor-estimates-v1");
  } catch {
  }
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        const value2 = await hit.json();
        if (value2.day === current.day && value2.asOf <= now && now - value2.asOf < 1e4) return value2;
      }
    } catch {
    }
  }
  const value = await snapshot(env, now);
  if (cache) {
    try {
      await cache.put(key, json(value, 200, { "Cache-Control": "public, max-age=10" }));
    } catch {
    }
  }
  return value;
}
__name(publicSnapshot, "publicSnapshot");
async function visitorActivity(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/visitors" && request.method === "GET") {
    await protect(request, env);
    return json(await publicSnapshot(request, env, Date.now()), 200, { "Cache-Control": "public, max-age=10" });
  }
  if (url.pathname !== "/api/visitors/heartbeat" || request.method !== "POST")
    throw new VisitorError(405, "Use the visitor activity endpoints with their supported methods.");
  let canonical;
  try {
    canonical = new URL(env.PUBLIC_SITE_URL || "");
  } catch {
    throw new VisitorError(503, "Visitor measurement is temporarily unavailable.");
  }
  if (url.origin !== canonical.origin || request.headers.get("Origin") !== canonical.origin || request.headers.has("Sec-Fetch-Site") && request.headers.get("Sec-Fetch-Site") !== "same-origin")
    throw new VisitorError(403, "Visitor measurement must come from this website.");
  await protect(request, env);
  await emptyBody(request);
  const userAgent = request.headers.get("User-Agent") || "";
  if (userAgent.length > 1024) throw new VisitorError(413, "The visitor request is too large.");
  if (env.VISITOR_TRACKING_ENABLED === "false" || excluded(request, userAgent))
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  const now = Date.now();
  await record(request, env, now, userAgent);
  return json(await publicSnapshot(request, env, now));
}
__name(visitorActivity, "visitorActivity");
async function cleanupVisitors(env, now = Date.now()) {
  if (!env.VISITOR_DB) return;
  const date = new Date(now);
  const cutoff = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 12, 1)).toISOString();
  await env.VISITOR_DB.batch([
    env.VISITOR_DB.prepare(`DELETE FROM visitor_dedupe WHERE (kind,period,visitor_key) IN
      (SELECT kind,period,visitor_key FROM visitor_dedupe WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`).bind(now, CLEANUP_LIMIT),
    env.VISITOR_DB.prepare(`DELETE FROM visitor_presence WHERE (period,visitor_key) IN
      (SELECT period,visitor_key FROM visitor_presence WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`).bind(now, CLEANUP_LIMIT),
    env.VISITOR_DB.prepare(`DELETE FROM visitor_totals WHERE (kind,period) IN
      (SELECT kind,period FROM visitor_totals WHERE (kind = 'day' AND period < ?) OR (kind = 'month' AND period < ?) LIMIT ?)`).bind(cutoff.slice(0, 10), cutoff.slice(0, 7), CLEANUP_LIMIT)
  ]);
}
__name(cleanupVisitors, "cleanupVisitors");

// server/index.ts
var HttpError = class extends Error {
  constructor(status2, message, retryAfter) {
    super(message);
    this.status = status2;
    this.retryAfter = retryAfter;
  }
  status;
  retryAfter;
  static {
    __name(this, "HttpError");
  }
};
var COOKIE = "qofeno_access";
var UNIT_PRICE = 10;
var MAX_CHECKOUT_UNITS = 100;
var TERM_DAYS = 30;
var TERM_MS = TERM_DAYS * 864e5;
var PENDING_RECOVERY_MS = 864e5;
var CLEANUP_BATCH_SIZE = 100;
var securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
var json2 = /* @__PURE__ */ __name((data, status2 = 200, extra = {}) => new Response(JSON.stringify(data), {
  status: status2,
  headers: { ...securityHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", ...extra }
}), "json");
async function hashToken(value) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
function newToken() {
  return "QF-" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(newToken, "newToken");
var isToken = /* @__PURE__ */ __name((value) => /^QF-[A-Za-z0-9_-]{43}$/.test(value), "isToken");
var mode = /* @__PURE__ */ __name((env) => ["test_mode", "live_mode"].includes(env.DODO_ENVIRONMENT || "") ? env.DODO_ENVIRONMENT : null, "mode");
function compatibleOfferProducts(env) {
  const current = env.DODO_PRODUCT_ID || "";
  const configured = env.DODO_COMPATIBLE_PRODUCT_IDS || "";
  if (!configured.trim() || configured.length > 2048) return [current];
  const previous = configured.split(",").map((value) => value.trim());
  if (previous.length > 16 || previous.some((value) => !/^pdt_[A-Za-z0-9]{1,80}$/.test(value))) return [current];
  return [.../* @__PURE__ */ new Set([current, ...previous])];
}
__name(compatibleOfferProducts, "compatibleOfferProducts");
function baseURL(env) {
  try {
    const url = new URL(env.PUBLIC_SITE_URL || "");
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    return url;
  } catch {
    return null;
  }
}
__name(baseURL, "baseURL");
function ready(env) {
  return !!(env.CHECKOUT_ENABLED === "true" && env.DB && env.DODO_PAYMENTS_API_KEY && env.DODO_PAYMENTS_WEBHOOK_KEY && env.DODO_PRODUCT_ID && env.QOFENO_ADMIN_KEY && mode(env) && baseURL(env));
}
__name(ready, "ready");
function status(env) {
  return { checkoutAvailable: ready(env), mode: ready(env) ? env.DODO_ENVIRONMENT === "live_mode" ? "live" : "test" : "unconfigured", unitPrice: UNIT_PRICE, maxCheckoutUnits: MAX_CHECKOUT_UNITS, termDays: TERM_DAYS, currency: "USD" };
}
__name(status, "status");
function provider(env) {
  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    maxRetries: 1,
    timeout: 15e3
  });
}
__name(provider, "provider");
function sessionCookie(token, request) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
__name(sessionCookie, "sessionCookie");
function clearSessionCookie(request) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
__name(clearSessionCookie, "clearSessionCookie");
async function boundedText(request, maxBytes = 8192) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new HttpError(413, "The request is too large.");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "The request is too large.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(result);
}
__name(boundedText, "boundedText");
async function body(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new HttpError(415, "Use a JSON request.");
  const raw = await boundedText(request);
  try {
    const input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
    return input;
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
}
__name(body, "body");
async function rateLimit(request, env, action, limit2, seconds) {
  const now = Math.floor(Date.now() / 1e3);
  const key = `${action}:${Math.floor(now / seconds)}:${await hashToken(request.headers.get("CF-Connecting-IP") || "local")}`;
  await env.DB.prepare("DELETE FROM rate_limits WHERE key IN (SELECT key FROM rate_limits WHERE expires_at < ? ORDER BY expires_at LIMIT ?)").bind(now, CLEANUP_BATCH_SIZE).run();
  const result = await env.DB.prepare("INSERT INTO rate_limits (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts").bind(key, now + seconds).first();
  if (!result || result.attempts > limit2) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
}
__name(rateLimit, "rateLimit");
async function nativeRateLimit(request, env, kind) {
  const limiter = kind === "read" ? env.PUBLIC_READ_LIMITER : env.SENSITIVE_REQUEST_LIMITER;
  if (!limiter) {
    if (env.REQUIRE_REQUEST_PROTECTION === "true")
      throw new HttpError(503, "Request protection is temporarily unavailable. Please try again shortly.");
    return;
  }
  const key = await hashToken(request.headers.get("CF-Connecting-IP") || "local");
  let outcome;
  try {
    outcome = await limiter.limit({ key });
  } catch {
    throw new HttpError(503, "Request protection is temporarily unavailable. Please try again shortly.");
  }
  if (outcome?.success === false) throw new HttpError(429, "Too many requests. Please wait one minute and try again.", 60);
  if (outcome?.success !== true) throw new HttpError(503, "Request protection is temporarily unavailable. Please try again shortly.");
}
__name(nativeRateLimit, "nativeRateLimit");
async function orderFor(request, env) {
  const token = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !isToken(token) || !env.DB) return null;
  const order = await env.DB.prepare("SELECT * FROM orders WHERE token_hash = ?").bind(await hashToken(token)).first();
  return order?.provider_environment === mode(env) ? order : null;
}
__name(orderFor, "orderFor");
async function activeTotals(id, env) {
  return await env.DB.prepare("SELECT COALESCE(SUM(units * ?), 0) AS activeSpend, MAX(expires_at) AS expiresAt FROM orders WHERE listing_id = ? AND provider_environment = ? AND status = 'paid' AND starts_at <= ? AND expires_at > ?").bind(UNIT_PRICE, id, mode(env), Date.now(), Date.now()).first() || { activeSpend: 0, expiresAt: null };
}
__name(activeTotals, "activeTotals");
function pendingRecoveryExpired(order) {
  return !!order && order.status === "pending" && (order.recovery_expires_at ?? order.created_at + PENDING_RECOVERY_MS) <= Date.now();
}
__name(pendingRecoveryExpired, "pendingRecoveryExpired");
async function sessionInfo(order, env) {
  if (!order) return { paid: false, status: "none" };
  if (pendingRecoveryExpired(order)) return { paid: false, status: "expired" };
  const listing = await env.DB.prepare("SELECT * FROM listings WHERE id = ?").bind(order.listing_id).first();
  const totals = listing ? await activeTotals(listing.id, env) : null;
  return {
    paid: order.status === "paid",
    status: order.status,
    checkoutId: order.id,
    order: { units: order.units, amount: order.units * UNIT_PRICE, startsAt: order.starts_at, expiresAt: order.expires_at },
    listing: listing ? {
      id: listing.id,
      title: listing.title,
      tagline: listing.tagline,
      website: listing.website,
      host: listing.host,
      tone: listing.tone,
      category: listing.category,
      moderation: listing.moderation,
      reviewReason: listing.review_reason,
      clicks: listing.clicks,
      ...totals
    } : void 0
  };
}
__name(sessionInfo, "sessionInfo");
function textField(input, name, max) {
  if (typeof input !== "string" || !input.trim() || input.trim().length > max || /[\u0000-\u001f\u007f<>]/.test(input)) throw new HttpError(400, `${name} must contain 1\u2013${max} characters without markup or control characters.`);
  return input.trim();
}
__name(textField, "textField");
function websiteField(input) {
  if (typeof input !== "string" || input.length > 2048) throw new HttpError(400, "Enter a complete public website address.");
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port && !["80", "443"].includes(url.port) || !host.includes(".") || host.endsWith(".") || host.includes(":") || /^\d+(\.\d+)*$/.test(host) || /(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(host) || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) throw new Error();
    return { website: url.href, host: host.replace(/^www\./, "") };
  } catch {
    throw new HttpError(400, "Use an HTTP or HTTPS address on a public domain, without credentials or a custom port.");
  }
}
__name(websiteField, "websiteField");
async function checkout(request, env) {
  if (!ready(env)) throw new HttpError(503, "Payments are not open yet. No payment has been taken.");
  if (new URL(request.url).origin !== baseURL(env).origin) throw new HttpError(403, "Please purchase from the official Qofeno website.");
  await nativeRateLimit(request, env, "sensitive");
  await rateLimit(request, env, "checkout", 4, 600);
  const input = await body(request);
  if (typeof input.email !== "string" || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new HttpError(400, "Enter a valid email address for your receipt.");
  if (!Number.isInteger(input.units) || Number(input.units) < 1 || Number(input.units) > MAX_CHECKOUT_UNITS) throw new HttpError(400, "Choose a whole number of $10 units, from 1 to 100.");
  if (input.category !== void 0 && !isPlacementCategory(input.category)) throw new HttpError(400, "Choose one of the available website categories.");
  const units = Number(input.units);
  const now = Date.now();
  let listing = null;
  if (input.listingId !== void 0) {
    const ownedOrder = await orderFor(request, env);
    if (typeof input.listingId !== "string" || !ownedOrder || ownedOrder.status !== "paid" || ownedOrder.listing_id !== input.listingId) throw new HttpError(403, "Restore a paid purchase for this listing before adding a placement purchase.");
    listing = await env.DB.prepare("SELECT * FROM listings WHERE id = ? AND provider_environment = ?").bind(input.listingId, mode(env)).first();
    if (!listing || listing.moderation !== "approved") throw new HttpError(409, "Only approved listings can add another placement purchase.");
  } else {
    const title = textField(input.title, "The listing title", 40);
    const tagline = textField(input.tagline, "The tagline", 100);
    const website = websiteField(input.website);
    if (typeof input.tone !== "string" || !["ink", "red", "blue", "green", "yellow", "plum"].includes(input.tone)) throw new HttpError(400, "Choose one of the available colors.");
    listing = { id: crypto.randomUUID(), title, tagline, ...website, tone: input.tone, category: input.category === void 0 ? "other" : input.category, provider_environment: mode(env), moderation: "pending", review_reason: null, clicks: 0, created_at: now, updated_at: now };
  }
  const client = provider(env);
  let product;
  try {
    product = await client.products.retrieve(env.DODO_PRODUCT_ID);
  } catch {
    throw new HttpError(502, "The placement price could not be checked. Please try again.");
  }
  const price = product.price;
  if (product.product_id !== env.DODO_PRODUCT_ID || product.is_recurring !== false || product.pricing_mode != null || !price || price.type !== "one_time_price" || price.currency !== "USD" || price.price !== UNIT_PRICE * 100 || price.pay_what_you_want || price.purchasing_power_parity || price.tax_inclusive === true || (price.discount_bps ?? price.discount ?? 0) !== 0) throw new HttpError(503, "The placement is not configured at its advertised one-time price. Please contact support@loopproof.me.");
  const id = crypto.randomUUID();
  const token = newToken();
  const statements = [];
  if (input.listingId === void 0) statements.push(env.DB.prepare("INSERT INTO listings (id,title,tagline,website,host,tone,category,provider_environment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(listing.id, listing.title, listing.tagline, listing.website, listing.host, listing.tone, listing.category, mode(env), now, now));
  statements.push(env.DB.prepare("INSERT INTO orders (id,listing_id,token_hash,units,product_id,provider_environment,created_at,updated_at,recovery_expires_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, listing.id, await hashToken(token), units, env.DODO_PRODUCT_ID, mode(env), now, now, now + PENDING_RECOVERY_MS));
  await env.DB.batch(statements);
  let result;
  try {
    result = await client.checkoutSessions.create({
      product_cart: [{ product_id: env.DODO_PRODUCT_ID, quantity: units }],
      customer: { email: input.email },
      metadata: { order_id: id },
      billing_currency: "USD",
      feature_flags: { allow_currency_selection: false, allow_discount_code: false },
      customization: {
        theme: "dark",
        show_order_details: true,
        show_on_demand_tag: false,
        theme_config: {
          radius: "12px",
          font_size: "md",
          font_weight: "normal",
          dark: {
            bg_primary: "#0e100f",
            bg_secondary: "#191d17",
            text_primary: "#fffce1",
            text_secondary: "#bbbaa6",
            text_placeholder: "#a7ad9c",
            text_error: "#ffb29c",
            text_success: "#c9ff6b",
            border_primary: "#505545",
            border_secondary: "#3b4034",
            button_primary: "#c9ff6b",
            button_primary_hover: "#dcffa8",
            button_text_primary: "#0e100f",
            button_secondary: "#252b20",
            button_secondary_hover: "#343f29",
            button_text_secondary: "#fffce1",
            input_focus_border: "#c9ff6b"
          }
        }
      },
      return_url: `${baseURL(env).origin}/my-spot?checkout=return`,
      cancel_url: `${baseURL(env).origin}/?checkout=cancelled`
    });
  } catch {
    throw new HttpError(502, "Checkout could not be opened. Please try again.");
  }
  if (!result.checkout_url || !result.session_id) throw new HttpError(502, "The payment provider did not return a checkout. Please try again.");
  let target;
  try {
    target = new URL(result.checkout_url);
  } catch {
    throw new HttpError(502, "The payment provider returned an invalid checkout address.");
  }
  if (target.protocol !== "https:" || target.username || target.password || target.port || !["checkout.dodopayments.com", "test.checkout.dodopayments.com"].includes(target.hostname)) throw new HttpError(502, "The payment provider returned an invalid checkout address.");
  await env.DB.prepare("UPDATE orders SET checkout_session_id = ?, updated_at = ? WHERE id = ?").bind(result.session_id, Date.now(), id).run();
  return json2({ checkoutUrl: result.checkout_url, recoveryCode: token, checkoutId: id, recoveryExpiresAt: now + PENDING_RECOVERY_MS }, 200, { "Set-Cookie": sessionCookie(token, request) });
}
__name(checkout, "checkout");
async function leaveCheckout(request, env) {
  if (!env.DB || !mode(env)) throw new HttpError(503, "Checkout cleanup is temporarily unavailable. Please try again.");
  await nativeRateLimit(request, env, "sensitive");
  const input = await body(request);
  if (typeof input.checkoutId !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(input.checkoutId)) throw new HttpError(400, "Choose the checkout you want to close.");
  await rateLimit(request, env, "checkout-leave", 20, 600);
  const order = await orderFor(request, env);
  if (!order || order.id !== input.checkoutId || order.status !== "pending")
    return json2({ cleared: false, expired: false, status: pendingRecoveryExpired(order) ? "expired" : order?.status || "none" });
  const now = Date.now();
  await env.DB.prepare("UPDATE orders SET recovery_expires_at = MIN(COALESCE(recovery_expires_at, created_at + ?), ?),updated_at = ? WHERE id = ? AND provider_environment = ? AND status = 'pending'").bind(PENDING_RECOVERY_MS, now, now, order.id, mode(env)).run();
  const current = await orderFor(request, env);
  if (!current || current.id !== order.id || current.status !== "pending")
    return json2({ cleared: false, expired: false, status: current?.status || "none" });
  return json2({ cleared: true, expired: true, status: "expired" }, 200, { "Set-Cookie": clearSessionCookie(request) });
}
__name(leaveCheckout, "leaveCheckout");
var publicMode = /* @__PURE__ */ __name((env) => mode(env) === "test_mode" ? "test" : mode(env) === "live_mode" ? "live" : "unconfigured", "publicMode");
async function publicListings(env, asOf, onlyId) {
  const rows = (await env.DB.prepare(`WITH active AS (
    SELECT l.id,l.title,l.tagline,l.website,l.host,l.tone,l.category,l.clicks,l.created_at AS sortCreated,
      SUM(o.units * ?) AS activeSpend,MAX(o.expires_at) AS expiresAt,
      json_group_array(json_object('at',o.expires_at,'amount',o.units * ?)) AS expirationRows
    FROM listings l JOIN orders o ON o.listing_id = l.id
    WHERE l.moderation = 'approved' AND l.provider_environment = ? AND o.provider_environment = ?
      AND o.status = 'paid' AND o.starts_at <= ? AND o.expires_at > ?
    GROUP BY l.id
  ), ranked AS (
    SELECT active.*,SUM(activeSpend) OVER () AS boardTotal,
      ROW_NUMBER() OVER standings AS rank,
      LAG(activeSpend) OVER standings AS previousSpend,
      LAG(sortCreated) OVER standings AS previousCreated,
      LAG(id) OVER standings AS previousId
    FROM active WINDOW standings AS (ORDER BY activeSpend DESC,sortCreated ASC,id ASC)
  ) SELECT *,CASE WHEN rank = 1 THEN NULL ELSE previousSpend - activeSpend +
      CASE WHEN sortCreated < previousCreated OR (sortCreated = previousCreated AND id < previousId) THEN 0 ELSE ? END
    END AS nextRankCost FROM ranked
    ${onlyId === void 0 ? "" : "WHERE id = ?"}
    ORDER BY activeSpend DESC,sortCreated ASC,id ASC`).bind(UNIT_PRICE, UNIT_PRICE, mode(env), mode(env), asOf, asOf, UNIT_PRICE, ...onlyId === void 0 ? [] : [onlyId]).all()).results || [];
  return {
    totalActiveSpend: rows[0]?.boardTotal || 0,
    listings: rows.map((row) => {
      const grouped = /* @__PURE__ */ new Map();
      for (const item of JSON.parse(row.expirationRows))
        grouped.set(item.at, (grouped.get(item.at) || 0) + item.amount);
      return {
        id: row.id,
        title: row.title,
        tagline: row.tagline,
        website: row.website,
        host: row.host,
        tone: row.tone,
        category: row.category,
        rank: row.rank,
        nextRankCost: row.nextRankCost,
        clicks: row.clicks,
        activeSpend: row.activeSpend,
        expiresAt: row.expiresAt,
        expirations: Array.from(grouped, ([at, amount]) => ({ at, amount })).sort((a, b) => a.at - b.at)
      };
    })
  };
}
__name(publicListings, "publicListings");
async function board(env) {
  const asOf = Date.now();
  const { listings, totalActiveSpend } = await publicListings(env, asOf);
  return json2({
    ...status(env),
    mode: publicMode(env),
    asOf,
    listings,
    totalActiveSpend,
    activeCount: listings.length,
    firstPlaceCost: (listings[0]?.activeSpend || 0) + UNIT_PRICE
  });
}
__name(board, "board");
function placementId(raw) {
  try {
    const id = decodeURIComponent(raw);
    return /^[A-Za-z0-9_-]{1,120}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
__name(placementId, "placementId");
async function placementData(env, rawId) {
  const asOf = Date.now();
  const id = placementId(rawId);
  const result = id ? await publicListings(env, asOf, id) : { listings: [], totalActiveSpend: 0 };
  const listing = result.listings[0];
  return listing ? { asOf, listing, totalActiveSpend: result.totalActiveSpend, share: listing.activeSpend / result.totalActiveSpend, mode: publicMode(env) } : null;
}
__name(placementData, "placementData");
async function publicPlacement(env, rawId) {
  const data = await placementData(env, rawId);
  if (!data) throw new HttpError(404, "This placement is not currently live.");
  return json2(data);
}
__name(publicPlacement, "publicPlacement");
async function searchDocument(request, env, page) {
  const asset = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url), { headers: { Accept: "text/html" } }));
  if (!asset.ok) throw new HttpError(503, "The page is temporarily unavailable.");
  const html = renderSearchDocument(await asset.text(), page, baseURL(env)?.origin || "https://loopproof.me");
  return new Response(request.method === "HEAD" ? null : html, {
    status: page.status,
    headers: {
      ...securityHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      ...page.indexable ? {} : { "X-Robots-Tag": "noindex, nofollow" }
    }
  });
}
__name(searchDocument, "searchDocument");
async function applicationPage(request, env, path2) {
  return searchDocument(request, env, staticSearchPage(path2, baseURL(env)?.origin || "https://loopproof.me", mode(env) === "live_mode", ready(env)));
}
__name(applicationPage, "applicationPage");
async function placementPage(request, env, rawId) {
  const data = await placementData(env, rawId);
  const path2 = `/spot/${encodeURIComponent(placementId(rawId) || "unavailable")}`;
  return searchDocument(request, env, placementSearchPage(path2, data?.listing || null, data?.share || 0, data?.mode === "live"));
}
__name(placementPage, "placementPage");
var sitemapEligibility = `l.moderation = 'approved' AND l.provider_environment = ?
  AND EXISTS (SELECT 1 FROM orders o WHERE o.listing_id = l.id AND o.provider_environment = ?
    AND o.status = 'paid' AND o.starts_at <= ? AND o.expires_at > ?)`;
async function sitemap(request, env, path2) {
  if (mode(env) !== "live_mode") throw new HttpError(404, "Sitemaps are only available on the live site.");
  const origin = baseURL(env)?.origin || "https://loopproof.me";
  const now = Date.now();
  let xml;
  if (path2 === "/sitemaps/pages.xml") xml = sitemapURLsXML(origin, publicRoutes);
  else if (path2 === "/sitemap.xml") {
    const rows = (await env.DB.prepare(`SELECT MIN(id) AS cursor FROM (
      SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id) AS rowNumber FROM listings l WHERE ${sitemapEligibility}
    ) GROUP BY CAST((rowNumber - 1) / ? AS INTEGER) ORDER BY cursor LIMIT ?`).bind(mode(env), mode(env), now, now, SITEMAP_PAGE_SIZE, SITEMAP_INDEX_LIMIT).all()).results || [];
    xml = sitemapIndexXML(origin, rows.map((row) => row.cursor));
  } else {
    const match = path2.match(/^\/sitemaps\/placements\/([^/]+)\.xml$/);
    const cursor = match ? placementId(match[1]) : null;
    if (!cursor) throw new HttpError(404, "This sitemap does not exist.");
    const rows = (await env.DB.prepare(`SELECT l.id FROM listings l WHERE ${sitemapEligibility} AND l.id >= ? ORDER BY l.id LIMIT ?`).bind(mode(env), mode(env), now, now, cursor, SITEMAP_PAGE_SIZE).all()).results || [];
    if (!rows.length) throw new HttpError(404, "This sitemap has no active placements.");
    xml = sitemapURLsXML(origin, rows.map((row) => `/spot/${encodeURIComponent(row.id)}`));
  }
  return new Response(request.method === "HEAD" ? null : xml, { headers: {
    ...securityHeaders,
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=60"
  } });
}
__name(sitemap, "sitemap");
async function outbound(request, env, id) {
  const listing = await env.DB.prepare("SELECT * FROM listings WHERE id = ? AND moderation = 'approved' AND provider_environment = ?").bind(id, mode(env)).first();
  if (!listing || (await activeTotals(id, env)).activeSpend <= 0) throw new HttpError(404, "This placement is no longer active.");
  if (request.method === "GET") {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const visitorHash = await hashToken(`${day}:${request.headers.get("CF-Connecting-IP") || "local"}`);
    try {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM click_dedupe WHERE rowid IN (SELECT rowid FROM click_dedupe WHERE expires_at < ? ORDER BY expires_at LIMIT ?)").bind(now, CLEANUP_BATCH_SIZE),
        env.DB.prepare("UPDATE listings SET clicks = clicks + 1 WHERE id = ? AND NOT EXISTS(SELECT 1 FROM click_dedupe WHERE listing_id = ? AND visitor_hash = ? AND day = ?)").bind(id, id, visitorHash, day),
        env.DB.prepare("INSERT OR IGNORE INTO click_dedupe (listing_id,visitor_hash,day,expires_at) VALUES (?,?,?,?)").bind(id, visitorHash, day, now + 2 * 864e5)
      ]);
    } catch {
      console.error("Qofeno click metrics could not be recorded.");
    }
  }
  return new Response(null, { status: 302, headers: { ...securityHeaders, Location: listing.website, "Cache-Control": "no-store" } });
}
__name(outbound, "outbound");
async function admin(request, env, path2) {
  if (!env.QOFENO_ADMIN_KEY) throw new HttpError(503, "Moderation access is not configured.");
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.length <= 512 ? /^Bearer[ \t]+([^\s]+)[ \t]*$/i.exec(authorization)?.[1] : void 0;
  const authenticated = supplied && timingSafeEqual(
    new TextEncoder().encode(await hashToken(supplied)),
    new TextEncoder().encode(await hashToken(env.QOFENO_ADMIN_KEY))
  );
  if (!authenticated) {
    if (!env.DB) throw new HttpError(503, "Owner sign-in is temporarily unavailable.");
    await nativeRateLimit(request, env, "sensitive");
    await rateLimit(request, env, "owner-signin", 10, 600);
    throw new HttpError(401, "The owner key was not accepted. Use your private owner key to open the review desk.");
  }
  if (path2 === "/api/admin/listings" && request.method === "GET") {
    const listings = (await env.DB.prepare(`SELECT l.*,SUM(CASE WHEN o.status = 'paid' THEN o.units * ? ELSE 0 END) AS paidAmount,
      COUNT(CASE WHEN o.status = 'paid' THEN 1 END) AS paidOrders FROM listings l JOIN orders o ON o.listing_id = l.id
      WHERE l.provider_environment = ? GROUP BY l.id HAVING paidOrders > 0 ORDER BY l.created_at ASC`).bind(UNIT_PRICE, mode(env)).all()).results;
    return json2({ listings });
  }
  if (path2 === "/api/admin/review" && request.method === "POST") {
    const input = await body(request);
    if (typeof input.listingId !== "string" || !["approve", "reject", "suspend"].includes(String(input.action))) throw new HttpError(400, "Choose a listing and a valid review action.");
    const listing = await env.DB.prepare("SELECT * FROM listings WHERE id = ? AND provider_environment = ?").bind(input.listingId, mode(env)).first();
    if (!listing) throw new HttpError(404, "The listing could not be found.");
    const now = Date.now();
    const allPaid = (await env.DB.prepare("SELECT id AS orderId,payment_id AS paymentId,units * ? AS amount,starts_at AS startsAt,expires_at AS expiresAt FROM orders WHERE listing_id = ? AND status = 'paid' AND provider_environment = ?").bind(UNIT_PRICE, listing.id, mode(env)).all()).results;
    if (!allPaid.length) throw new HttpError(409, "There is no confirmed payment to review.");
    const paid = allPaid.filter((order) => order.startsAt === null || order.expiresAt !== null && order.expiresAt > now);
    const historicalPayments = allPaid.filter((order) => order.startsAt !== null && (order.expiresAt === null || order.expiresAt <= now));
    if (input.action === "approve") {
      if (listing.moderation === "rejected") throw new HttpError(409, "A rejected listing requires refund resolution, not reactivation.");
      const compatibleProducts = compatibleOfferProducts(env);
      const placeholders = compatibleProducts.map(() => "?").join(",");
      if (await env.DB.prepare(`SELECT id FROM orders WHERE listing_id = ? AND status = 'paid' AND provider_environment = ? AND product_id NOT IN (${placeholders}) AND NOT EXISTS(SELECT 1 FROM orders AS history WHERE history.listing_id = orders.listing_id AND history.provider_environment = orders.provider_environment AND history.starts_at IS NOT NULL) LIMIT 1`).bind(listing.id, mode(env), ...compatibleProducts).first())
        throw new HttpError(409, "This payment purchased a previous offer. Its terms cannot be silently changed. Reject the listing and issue a full refund through Dodo before asking the customer to make a new purchase.");
      const approved = await env.DB.batch([
        env.DB.prepare(`UPDATE listings SET moderation = 'approved',review_reason = NULL,updated_at = ? WHERE id = ? AND moderation <> 'rejected' AND NOT EXISTS(SELECT 1 FROM orders WHERE listing_id = listings.id AND status = 'paid' AND provider_environment = ? AND product_id NOT IN (${placeholders}) AND NOT EXISTS(SELECT 1 FROM orders AS history WHERE history.listing_id = orders.listing_id AND history.provider_environment = orders.provider_environment AND history.starts_at IS NOT NULL))`).bind(now, listing.id, mode(env), ...compatibleProducts),
        env.DB.prepare("UPDATE orders SET starts_at = ?,expires_at = ?,updated_at = ? WHERE listing_id = ? AND status = 'paid' AND starts_at IS NULL AND provider_environment = ? AND EXISTS(SELECT 1 FROM listings WHERE listings.id = orders.listing_id AND moderation = 'approved')").bind(now, now + TERM_MS, now, listing.id, mode(env))
      ]);
      if (!approved[0].meta.changes) throw new HttpError(409, "The listing was rejected or a payment for a previous offer arrived during this review. Check its payments and resolve any required refund through Dodo before further action.");
      return json2({ reviewed: true, moderation: "approved", refundRequired: false });
    }
    const reason = textField(input.reason, "The review reason", 300);
    const moderation = input.action === "reject" ? "rejected" : "suspended";
    await env.DB.prepare("UPDATE listings SET moderation = ?,review_reason = ?,updated_at = ? WHERE id = ?").bind(moderation, reason, now, listing.id).run();
    return json2({
      reviewed: true,
      moderation,
      refundRequired: paid.length > 0,
      payments: paid,
      historicalPayments,
      nextAction: paid.length > 0 ? "Issue full refunds for the current or unstarted payments listed in payments. Historical payments are not included in this default action. Refund webhooks will update the orders. No refund has been issued by this action." : "No current or unstarted payments require a refund through this action. Historical payments are listed separately for individual review if needed. No refund has been issued by this action."
    });
  }
  throw new HttpError(404, "This moderation endpoint does not exist.");
}
__name(admin, "admin");
async function webhook(request, env) {
  if (!env.DODO_PAYMENTS_WEBHOOK_KEY || !env.DODO_PAYMENTS_API_KEY || !mode(env) || !env.DB) throw new HttpError(503, "Payment notifications are not configured.");
  const raw = await boundedText(request, 262144);
  const headers = Object.fromEntries(["webhook-id", "webhook-timestamp", "webhook-signature"].map((key) => [key, request.headers.get(key) || ""]));
  let event;
  try {
    event = await provider(env).webhooks.unwrap(raw, { headers });
  } catch {
    throw new HttpError(401, "Invalid payment notification signature.");
  }
  const eventId = `${mode(env)}:${headers["webhook-id"]}`;
  if (await env.DB.prepare("SELECT id FROM webhook_events WHERE id = ?").bind(eventId).first()) return json2({ received: true });
  const statements = [];
  const now = Date.now();
  let expectedPayment;
  if (event.type === "payment.succeeded") {
    const payment = event.data;
    const orderId = payment.metadata?.order_id;
    const order = typeof orderId === "string" ? await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first() : null;
    if (!order) return json2({ received: true, ignored: true });
    if (!order.checkout_session_id) throw new HttpError(503, "Checkout is still being recorded. Retry this notification.");
    if (order.provider_environment !== mode(env) || payment.status !== "succeeded" || !payment.payment_id || payment.checkout_session_id !== order.checkout_session_id || payment.product_cart?.length !== 1 || payment.product_cart[0].product_id !== order.product_id || payment.product_cart[0].quantity !== order.units || order.payment_id && order.payment_id !== payment.payment_id) throw new HttpError(400, "Payment does not match this order.");
    const tax = payment.tax ?? 0;
    if (payment.currency !== "USD" || !Number.isSafeInteger(payment.total_amount) || !Number.isSafeInteger(tax) || tax < 0 || payment.total_amount - tax !== order.units * UNIT_PRICE * 100) throw new HttpError(400, "Payment currency or amount does not match this order.");
    expectedPayment = { orderId: order.id, paymentId: payment.payment_id };
    statements.push(env.DB.prepare(`UPDATE orders SET payment_id = ?,status = CASE WHEN EXISTS(SELECT 1 FROM payment_blocks WHERE payment_id = ? AND provider_environment = ? AND blocked = 1) THEN 'revoked' ELSE 'paid' END,
      starts_at = CASE WHEN starts_at IS NULL AND EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND moderation = 'approved') THEN ? ELSE starts_at END,
      expires_at = CASE WHEN starts_at IS NULL AND EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND moderation = 'approved') THEN ? ELSE expires_at END,updated_at = ? WHERE id = ? AND (payment_id IS NULL OR payment_id = ?)`).bind(payment.payment_id, payment.payment_id, mode(env), now, now + TERM_MS, now, order.id, payment.payment_id));
  } else if (event.type === "refund.succeeded") {
    const refund = event.data;
    if (!refund.refund_id || !refund.payment_id || refund.status !== "succeeded" || typeof refund.is_partial !== "boolean") throw new HttpError(400, "The refund notification is incomplete.");
    {
      statements.push(env.DB.prepare("INSERT INTO payment_blocks (reference,payment_id,provider_environment,blocked,occurred_at) VALUES (?,?,?,1,?) ON CONFLICT(reference) DO NOTHING").bind(`${mode(env)}:refund:${refund.refund_id}`, refund.payment_id, mode(env), now));
      statements.push(env.DB.prepare("UPDATE orders SET status = 'revoked',updated_at = ? WHERE payment_id = ? AND provider_environment = ?").bind(now, refund.payment_id, mode(env)));
    }
  } else if (event.type.startsWith("dispute.")) {
    const dispute = event.data;
    const occurredAt = Date.parse(event.timestamp);
    const supported = ["dispute.opened", "dispute.challenged", "dispute.won", "dispute.cancelled", "dispute.accepted", "dispute.lost", "dispute.expired"];
    if (supported.includes(event.type) && dispute.dispute_id && dispute.payment_id && Number.isFinite(occurredAt)) {
      const blocked = ["dispute.won", "dispute.cancelled"].includes(event.type) ? 0 : 1;
      statements.push(env.DB.prepare("INSERT INTO payment_blocks (reference,payment_id,provider_environment,blocked,occurred_at) VALUES (?,?,?,?,?) ON CONFLICT(reference) DO UPDATE SET blocked = excluded.blocked,occurred_at = excluded.occurred_at WHERE excluded.occurred_at > payment_blocks.occurred_at").bind(`${mode(env)}:dispute:${dispute.dispute_id}`, dispute.payment_id, mode(env), blocked, occurredAt));
      statements.push(env.DB.prepare("UPDATE orders SET status = CASE WHEN EXISTS(SELECT 1 FROM payment_blocks WHERE payment_id = ? AND provider_environment = ? AND blocked = 1) THEN 'revoked' ELSE 'paid' END,updated_at = ? WHERE payment_id = ? AND provider_environment = ?").bind(dispute.payment_id, mode(env), now, dispute.payment_id, mode(env)));
    }
  }
  statements.push(expectedPayment ? env.DB.prepare("INSERT OR IGNORE INTO webhook_events (id,event_type,received_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id = ? AND payment_id = ?)").bind(eventId, event.type, now, expectedPayment.orderId, expectedPayment.paymentId) : env.DB.prepare("INSERT OR IGNORE INTO webhook_events (id,event_type,received_at) VALUES (?,?,?)").bind(eventId, event.type, now));
  const processed = await env.DB.batch(statements);
  if (expectedPayment && !processed[0].meta.changes) throw new HttpError(409, "A different payment is already attached to this order. Contact support@loopproof.me.");
  return json2({ received: true });
}
__name(webhook, "webhook");
async function route(request, env) {
  const url = new URL(request.url);
  const canonical = baseURL(env);
  if (url.protocol === "http:" && canonical?.protocol === "https:" && url.hostname === canonical.hostname) {
    url.protocol = "https:";
    url.port = canonical.port;
    return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, "Cache-Control": "no-store" } });
  }
  if (url.hostname === "www.loopproof.me") {
    url.hostname = "loopproof.me";
    url.protocol = "https:";
    url.port = "";
    return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, "Cache-Control": "no-store" } });
  }
  if (url.pathname.startsWith("/go/") && ["GET", "HEAD"].includes(request.method)) {
    await nativeRateLimit(request, env, "read");
    return outbound(request, env, url.pathname.slice(4));
  }
  if (url.pathname.startsWith("/spot/") && ["GET", "HEAD"].includes(request.method)) {
    await nativeRateLimit(request, env, "read");
    return placementPage(request, env, url.pathname.slice(6));
  }
  if (!url.pathname.startsWith("/api/")) {
    if (!["GET", "HEAD"].includes(request.method)) throw new HttpError(405, "Use GET or HEAD to view this page.");
    const cleanPath = url.pathname.replace(/\/+$/, "") || "/";
    if (url.pathname === "/index.html" || cleanPath !== url.pathname && isApplicationPage(cleanPath)) {
      url.pathname = url.pathname === "/index.html" ? "/" : cleanPath;
      return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/sitemap.xml" || url.pathname.startsWith("/sitemaps/")) {
      if (url.pathname !== "/sitemaps/pages.xml") await nativeRateLimit(request, env, "read");
      return sitemap(request, env, url.pathname);
    }
    if (url.pathname === "/robots.txt" && mode(env) !== "live_mode") return new Response(request.method === "HEAD" ? null : "User-agent: *\nDisallow: /\n", {
      headers: { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" }
    });
    if (isApplicationPage(url.pathname)) return applicationPage(request, env, url.pathname);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404 || asset.status === 200 && asset.headers.get("Content-Type")?.includes("text/html")) return applicationPage(request, env, url.pathname);
    const response = new Response(request.method === "HEAD" ? null : asset.body, asset);
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    return response;
  }
  if (request.method === "POST" && url.pathname !== "/api/webhook" && request.headers.get("origin") !== url.origin) throw new HttpError(403, "This action must be performed from the Qofeno website.");
  if (url.pathname === "/api/visitors" || url.pathname === "/api/visitors/heartbeat") {
    const response = await visitorActivity(request, env);
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    return response;
  }
  if (url.pathname === "/api/status" && request.method === "GET") return json2(status(env));
  if (url.pathname === "/api/board" && request.method === "GET") {
    await nativeRateLimit(request, env, "read");
    return board(env);
  }
  if (url.pathname.startsWith("/api/placements/") && request.method === "GET") {
    await nativeRateLimit(request, env, "read");
    return publicPlacement(env, url.pathname.slice("/api/placements/".length));
  }
  if (url.pathname === "/api/session" && request.method === "GET") {
    await nativeRateLimit(request, env, "read");
    const order = await orderFor(request, env);
    return json2(await sessionInfo(order, env), 200, pendingRecoveryExpired(order) ? { "Set-Cookie": clearSessionCookie(request) } : {});
  }
  if (url.pathname === "/api/checkout" && request.method === "POST") return checkout(request, env);
  if (url.pathname === "/api/checkout/leave" && request.method === "POST") return leaveCheckout(request, env);
  if (url.pathname === "/api/webhook" && request.method === "POST") return webhook(request, env);
  if (url.pathname.startsWith("/api/admin/")) return admin(request, env, url.pathname);
  if (url.pathname === "/api/restore" && request.method === "POST") {
    if (!env.DB) throw new HttpError(503, "Purchase recovery is temporarily unavailable.");
    await nativeRateLimit(request, env, "sensitive");
    await rateLimit(request, env, "restore", 10, 600);
    const input = await body(request);
    const code = typeof input.code === "string" ? input.code.trim() : "";
    if (!isToken(code)) throw new HttpError(400, "Enter the complete recovery code saved before checkout.");
    const order = await env.DB.prepare("SELECT * FROM orders WHERE token_hash = ?").bind(await hashToken(code)).first();
    if (!order || order.provider_environment !== mode(env)) throw new HttpError(404, "That recovery code could not be found. Check the code or contact support@loopproof.me.");
    if (order.status === "revoked") throw new HttpError(403, "Access has been suspended for this payment. Contact support@loopproof.me.");
    if (pendingRecoveryExpired(order)) throw new HttpError(410, "This unfinished checkout code has expired. Start a new checkout. If you already paid, wait for confirmation or contact support@loopproof.me; your saved code will work once payment is confirmed.");
    return json2(await sessionInfo(order, env), 200, { "Set-Cookie": sessionCookie(code, request) });
  }
  throw new HttpError(404, "This endpoint does not exist.");
}
__name(route, "route");
var index_default = {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof HttpError || error instanceof VisitorError) return json2({ error: error.message }, error.status, error.status === 429 ? { "Retry-After": String(error.retryAfter ?? 600) } : {});
      console.error("Qofeno request failed:", error instanceof Error ? error.name : "Unknown error");
      return json2({ error: "Something went wrong. Please retry or contact support@loopproof.me." }, 500);
    }
  },
  async scheduled(_controller, env) {
    await cleanupVisitors(env);
  }
};

// server/payments-test.ts
var testOrigin = "https://qofeno-payments-test.sohailkhannn-0525.workers.dev";
var noIndex = "noindex, nofollow, noarchive";
var banner = `<aside aria-label="Payment test environment" style="padding:12px 20px;text-align:center;background:#fbe4c6;color:#52300e;border-bottom:1px solid #c7a174;font:500 13px/1.5 system-ui,sans-serif">Payment test environment \xB7 No live charges. Use test payment details only.</aside>`;
var payments_test_default = {
  async scheduled(controller, env) {
    if (env.PUBLIC_SITE_URL !== testOrigin || env.DODO_ENVIRONMENT !== "test_mode") return;
    await index_default.scheduled(controller, env);
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.origin !== testOrigin || env.PUBLIC_SITE_URL !== testOrigin || env.DODO_ENVIRONMENT !== "test_mode") {
      return new Response(
        "This test deployment is not configured for this origin.",
        {
          status: 503,
          headers: { "X-Robots-Tag": noIndex, "Cache-Control": "no-store" }
        }
      );
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": noIndex,
          "Cache-Control": "no-store"
        }
      });
    }
    if (url.pathname === "/sitemap.xml" || url.pathname.startsWith("/sitemaps/")) {
      return new Response("No sitemap for the test environment.", {
        status: 404,
        headers: { "X-Robots-Tag": noIndex, "Cache-Control": "no-store" }
      });
    }
    const result = await index_default.fetch(request, env);
    const response = new Response(result.body, result);
    response.headers.set("X-Robots-Tag", noIndex);
    if (!response.headers.get("Content-Type")?.includes("text/html"))
      return response;
    response.headers.set("Cache-Control", "no-store");
    return new HTMLRewriter().on('meta[name="robots"]', {
      element(element) {
        element.setAttribute("content", noIndex);
      }
    }).on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute("href", testOrigin + url.pathname);
      }
    }).on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute("content", testOrigin + url.pathname);
      }
    }).on("body", {
      element(element) {
        element.prepend(banner, { html: true });
      }
    }).transform(response);
  }
};
export {
  payments_test_default as default
};
//# sourceMappingURL=payments-test.js.map
