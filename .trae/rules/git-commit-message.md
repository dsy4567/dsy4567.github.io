---
alwaysApply: true
scene: git_message
---

提交信息格式参考如下：
    ```text
    <符合 gitmoji 规范的 emoji 字符> <简要描述>

    - <对更改的详细说明>
    - ...
    ```
  - emoji 和简要描述间隔一个空格
  - 如果更改非常简单，允许不编写详细说明
  - 如果选择编写详细说明，注意包含空行和 markdown 无序列表
  - 使用简体中文

参考 - gitmoji 标准：

{
  "gitmojis": [
    { "emoji": "🎨", "description": "Improve structure / format of the code.", "name": "art"},
    { "emoji": "⚡️", "description": "Improve performance.", "name": "zap"},
    { "emoji": "🔥", "description": "Remove code or files.", "name": "fire"},
    { "emoji": "🐛", "description": "Fix a bug.", "name": "bug"},
    { "emoji": "🚑️", "description": "Critical hotfix.", "name": "ambulance"},
    { "emoji": "✨", "description": "Introduce new features.", "name": "sparkles"},
    { "emoji": "📝", "description": "Add or update documentation.", "name": "memo"},
    { "emoji": "🚀", "description": "Deploy stuff.", "name": "rocket"},
    { "emoji": "💄", "description": "Add or update the UI and style files.", "name": "lipstick"},
    { "emoji": "🎉", "description": "Begin a project.", "name": "tada"},
    { "emoji": "✅", "description": "Add, update, or pass tests.", "name": "white-check-mark"},
    { "emoji": "🔒️", "description": "Fix security or privacy issues.", "name": "lock"},
    { "emoji": "🔐", "description": "Add or update secrets.", "name": "closed-lock-with-key"},
    { "emoji": "🔖", "description": "Release / Version tags.", "name": "bookmark"},
    { "emoji": "🚨", "description": "Fix compiler / linter warnings.", "name": "rotating-light"},
    { "emoji": "🚧", "description": "Work in progress.", "name": "construction"},
    { "emoji": "💚", "description": "Fix CI Build.", "name": "green-heart"},
    { "emoji": "⬇️", "description": "Downgrade dependencies.", "name": "arrow-down"},
    { "emoji": "⬆️", "description": "Upgrade dependencies.", "name": "arrow-up"},
    { "emoji": "📌", "description": "Pin dependencies to specific versions.", "name": "pushpin"},
    { "emoji": "👷", "description": "Add or update CI build system.", "name": "construction-worker"},
    { "emoji": "📈", "description": "Add or update analytics or track code.", "name": "chart-with-upwards-trend"},
    { "emoji": "♻️", "description": "Refactor code.", "name": "recycle"},
    { "emoji": "➕", "description": "Add a dependency.", "name": "heavy-plus-sign"},
    { "emoji": "➖", "description": "Remove a dependency.", "name": "heavy-minus-sign"},
    { "emoji": "🔧", "description": "Add or update configuration files.", "name": "wrench"},
    { "emoji": "🔨", "description": "Add or update development scripts.", "name": "hammer"},
    { "emoji": "🌐", "description": "Internationalization and localization.", "name": "globe-with-meridians"},
    { "emoji": "✏️", "description": "Fix typos.", "name": "pencil2"},
    { "emoji": "💩", "description": "Write bad code that needs to be improved.", "name": "poop"},
    { "emoji": "⏪️", "description": "Revert changes.", "name": "rewind"},
    { "emoji": "🔀", "description": "Merge branches.", "name": "twisted-rightwards-arrows"},
    { "emoji": "📦️", "description": "Add or update compiled files or packages.", "name": "package"},
    { "emoji": "👽️", "description": "Update code due to external API changes.", "name": "alien"},
    { "emoji": "🚚", "description": "Move or rename resources (e.g.: files, paths, routes).", "name": "truck"},
    { "emoji": "📄", "description": "Add or update license.", "name": "page-facing-up"},
    { "emoji": "💥", "description": "Introduce breaking changes.", "name": "boom"},
    { "emoji": "🍱", "description": "Add or update assets.", "name": "bento"},
    { "emoji": "♿️", "description": "Improve accessibility.", "name": "wheelchair"},
    { "emoji": "💡", "description": "Add or update comments in source code.", "name": "bulb"},
    { "emoji": "🍻", "description": "Write code drunkenly.", "name": "beers"},
    { "emoji": "💬", "description": "Add or update text and literals.", "name": "speech-balloon"},
    { "emoji": "🗃️", "description": "Perform database related changes.", "name": "card-file-box"},
    { "emoji": "🔊", "description": "Add or update logs.", "name": "loud-sound"},
    { "emoji": "🔇", "description": "Remove logs.", "name": "mute"},
    { "emoji": "👥", "description": "Add or update contributor(s).", "name": "busts-in-silhouette"},
    { "emoji": "🚸", "description": "Improve user experience / usability.", "name": "children-crossing"},
    { "emoji": "🏗️", "description": "Make architectural changes.", "name": "building-construction"},
    { "emoji": "📱", "description": "Work on responsive design.", "name": "iphone"},
    { "emoji": "🤡", "description": "Mock things.", "name": "clown-face"},
    { "emoji": "🥚", "description": "Add or update an easter egg.", "name": "egg"},
    { "emoji": "🙈", "description": "Add or update a .gitignore file.", "name": "see-no-evil"},
    { "emoji": "📸", "description": "Add or update snapshots.", "name": "camera-flash"},
    { "emoji": "⚗️", "description": "Perform experiments.", "name": "alembic"},
    { "emoji": "🔍️", "description": "Improve SEO.", "name": "mag"},
    { "emoji": "🏷️", "description": "Add or update types.", "name": "label"},
    { "emoji": "🌱", "description": "Add or update seed files.", "name": "seedling"},
    { "emoji": "🚩", "description": "Add, update, or remove feature flags.", "name": "triangular-flag-on-post"},
    { "emoji": "🥅", "description": "Catch errors.", "name": "goal-net"},
    { "emoji": "💫", "description": "Add or update animations and transitions.", "name": "dizzy"},
    { "emoji": "🗑️", "description": "Deprecate code that needs to be cleaned up.", "name": "wastebasket"},
    { "emoji": "🛂", "description": "Work on code related to authorization, roles and permissions.", "name": "passport-control"},
    { "emoji": "🩹", "description": "Simple fix for a non-critical issue.", "name": "adhesive-bandage"},
    { "emoji": "🧐", "description": "Data exploration/inspection.", "name": "monocle-face"},
    { "emoji": "⚰️", "description": "Remove dead code.", "name": "coffin"},
    { "emoji": "🧪", "description": "Add a failing test.", "name": "test-tube"},
    { "emoji": "👔", "description": "Add or update business logic.", "name": "necktie"},
    { "emoji": "🩺", "description": "Add or update healthcheck.", "name": "stethoscope"},
    { "emoji": "🧱", "description": "Infrastructure related changes.", "name": "bricks"},
    { "emoji": "🧑‍💻", "description": "Improve developer experience.", "name": "technologist"},
    { "emoji": "💸", "description": "Add sponsorships or money related infrastructure.", "name": "money-with-wings"},
    { "emoji": "🧵", "description": "Add or update code related to multithreading or concurrency.", "name": "thread"},
    { "emoji": "🦺", "description": "Add or update code related to validation.", "name": "safety-vest"},
    { "emoji": "✈️", "description": "Improve offline support.", "name": "airplane"},
    { "emoji": "🦖", "description": "Code that adds backwards compatibility.", "name": "t-rex"}
  ]
}