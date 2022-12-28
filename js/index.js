async function 获取名言() {
    return new Promise((resolve, reject) => {
        fetch("/json/saying.json")
            .then((res) => res.json())
            .then((j) => {
                resolve(
                    j[Math.ceil(Math.random() * Number(j?.length))] ||
                        "获取失败"
                );
            })
            .catch((e) => {
                resolve("获取失败");
            });
    });
}
async function 获取个人信息() {
    return new Promise((resolve, reject) => {
        fetch("https://api.github.com/users/dsy4567")
            .then((res) => res.json())
            .then((j) => {
                resolve(j);
            })
            .catch((e) => {
                resolve({ bio: "", followers: "未知", following: "未知" });
            });
    });
}
完成加载.push(async () => {
    if (路径 == "/") {
        document.querySelector("#随机金句").innerHTML =
            "&emsp;&emsp;" + (await 获取名言());
        let 个人信息 = await 获取个人信息();
        document.querySelector("#关注粉丝码龄").innerHTML = ` 关注: ${
            个人信息.following
        } | 粉丝: ${个人信息.followers} | 码龄: ${
            new Date().getFullYear() -
            new Date(个人信息.created_at).getFullYear()
        }年 `;
        document.querySelector("#个性签名").innerText = 个人信息.bio;
    }
});
