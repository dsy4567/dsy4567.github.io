/**

             DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                        Version 2, December 2004

    Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

    Everyone is permitted to copy and distribute verbatim or modified
    copies of this license document, and changing it is allowed as long
    as the name is changed.

                DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
    TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

    0. You just DO WHAT THE FUCK YOU WANT TO.

*/

const PATH = "../blog-md/encrypted-article-test/index.md";
let PASSWORD = "P@ssw0rd";

const fs = require("fs");
// prettier-ignore
const KEY = [
    0x66, 0xcc, 0xff,
    0x39, 0xc5, 0xbb,
    0x11, 0x45, 0x14,
    0x19, 0x19, 0x81
];

PASSWORD = [...PASSWORD];
for (let i = 0; i < PASSWORD.length; i++) {
    PASSWORD[i] = PASSWORD[i].charCodeAt(0);
}
for (let i = 0; i < PASSWORD.length; i++) {
    for (let j = 0; j < KEY.length; j++) {
        PASSWORD[i] ^= KEY[j];
    }
}

let data = new Uint8Array(fs.readFileSync(PATH));
for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < PASSWORD.length; j++) {
        data[i] ^= PASSWORD[j];
    }
}
fs.writeFileSync(PATH, data);
