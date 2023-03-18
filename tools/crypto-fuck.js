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

// 我瞎写的加密算法就是依托答辩

const PATH = "../blog-md/encrypted-article-test/index.md";
const FIRST_CHAR_CODE = "#".charCodeAt(0); // 每个 md 文件第一个字符都是 #

const fs = require("fs");

let data = new Uint8Array(fs.readFileSync(PATH));
const XOR = data[0] ^ FIRST_CHAR_CODE;
for (let i = 0; i < data.length; i++) {
    data[i] ^= XOR;
}
fs.writeFileSync(PATH, data);
