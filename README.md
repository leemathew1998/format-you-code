# Format Vue Style Code

<!-- English User can go to here ☞ [git-emoji Commit](https://github.com/maixiaojie/git-emoji) -->

## Features

### 1️⃣ 重排 import 文件顺序 ✅

<div id="container">
<div style="width:50%;padding-right:2px;!important">
<span style="margin:0 40%;!important">重排前</span>

```js
let timer;
import App from "./App.vue";
import { func1 } from "@/utils/func.js";
import { func2 } from "@/utils/func.js";
import Vue from "vue";
```
</div>

<div style="width:50%;padding-left:2px">
<span style="margin:0 40%">重排后</span>

```js
import Vue from "vue";
import { func1, func2 } from "@/utils/func.js";
import App from "./App.vue";
let timer;
```
</div>
</div>

<style>
  #container{
    display:flex;
  }
</style>


引入文件将会按照以下规则进行排序，并且自动去除重复引入的文件。

1. 依赖文件
2. 带有`@`或者`~`的引入文件
3. 相对路径引入的文件或者定义的变量

### 2️⃣ 对 Vue2 中的 option API 写法进行格式化 ✅

<div style="display:flex;">
<div style="width:50%;padding-right:2px">
<span style="margin:0 40%">重排前</span>

```js
export default {
  methods: {    3️⃣
    func1() {},
  },
  data() {      2️⃣
    return {};
  },
  name: "App",  1️⃣
};
```
</div>

<div style="width:50%;padding-left:2px">
<span style="margin:0 40%">重排后</span>

```js
export default {
  name: "App",  1️⃣
  data() {      2️⃣
    return {};
  },
  methods: {    3️⃣
    func1() {},
  },
};
```
</div>
</div>

将按照 [name、components...等顺序](https://github.com/leemathew1998/format-you-code/blob/main/src/utils/constants.ts) 进行排列。

### 3️⃣ 对 data 等 [options](https://github.com/leemathew1998/format-you-code/tree/main/src/patch/modules) 中的内容进行排序 ✅

<div style="display:flex;">
<div style="width:50%;padding-right:2px">
<span style="margin:0 40%;white-space: nowrap;">template part</span>

```html
<template>
  <div>
    <div>{{ a }}</div>
    <div>{{ b }}</div>
  </div>
</template>
 ```

</div>
<div style="width:50%;padding-left:2px">
<span style="margin:0 40%;white-space: nowrap;">script part</span>

```js
export default {
  data() {
    return {
        b: 2,// => a: 1,
        a: 1,// => b: 2,
    };
  },
  created() {
    console.log(this.a)
  },
};
 ```
</div>
</div>

- 在此例子中，`data` 中的 `a: 1` 将会被放到 `b: 2` 的前面；因为不管在template中还是其他option中，`a` 变量都是优先使用的。如果有冲突，那会以生命周期函数>template进行排序。

## How to use

- 右键菜单中的`Format You Code`选项
- 快捷键：`ctrl + shift + p` 或者 `command + shift + p`，输入`Format You Code`

## Undone Features

- [ ] 对 Vue3 中的 composition API 进行格式化
- [ ] 代码重构

## Download

在 vscode 扩展中搜索 `format-vue-style-code` 即可找到该插件。

## Issues

使用中遇到问题可以在这里提问。
[https://github.com/leemathew1998/format-you-code/issues](https://github.com/leemathew1998/format-you-code/issues)

## Sources

插件源码，沟通交流在这里。
[https://github.com/leemathew1998/format-you-code](https://github.com/leemathew1998/format-you-code)
