import { IS_COMMENT, IS_EMPTY, IS_STRING } from "./constants";

const flatCssNodesFunc = (cssAstNode, flatCssNodes) => {
  //第一次，给空数组
  if (!flatCssNodes.has(cssAstNode.selector)) {
    flatCssNodes.set(cssAstNode.selector, []);
  }
  if (cssAstNode.nodes.length > 0) {
    //如果有子节点，递归
    for (let j = 0; j < cssAstNode.nodes.length; j++) {
      const cssAstNodeChild = cssAstNode.nodes[j];
      if (cssAstNodeChild.type === "decl") {
        //如果是属性，直接push
        const res = flatCssNodes.get(cssAstNode.selector);
        res!.push(cssAstNodeChild);
      } else {
        //如果是节点，递归
        flatCssNodesFunc(cssAstNodeChild, flatCssNodes);
      }
    }
  }
};

const flatHtmlNodesFunc = (item, flatHtmlNodes) => {
  //以非贪婪模式匹配class和id，class会有多个，id只有一个,注意要检测是不是动态的class或者id，动态的会以:开头
  //如果检测到是:class或者v-bind:class，就不进行匹配
  const classReg = /(?<![:|v\-bind:])class=["|']([^"]*)["|']/g;
  const idReg = /(?<![:|v\-bind:])id=["|']([^"]*)["|']/g;
  const classResult = item.text.match(classReg);
  const idResult = item.text.match(idReg);
  if (classResult) {
    classResult.forEach((oneMatch) => {
      //示例：class="container",需要去掉class="和"
      oneMatch = oneMatch
        .replace(/class=["|']/g, "")
        .replace(/["|']/g, "")
        .split(" ")
        .map((i) => `.${i}`)
        .join(" ");
      flatHtmlNodes.set(oneMatch, ".");
    });
  }
  if (idResult) {
    idResult.forEach((oneMatch) => {
      //示例：id="container",需要去掉id="和"
      oneMatch = oneMatch
        .replace(/id=["|']/g, "")
        .replace(/["|']/g, "")
        .split(" ")
        .map((i) => `#${i}`)
        .join(" ");
      flatHtmlNodes.set(oneMatch, "#");
    });
  }
};

/**
 * if we have remark like '//....' or '/** ....', we should skip this line
 */
const isCommentOrEmpty = (item) => {
  if (item.text.trim().indexOf("//") === 0 || item.text.indexOf("*") !== -1) {
    return IS_COMMENT;
  } else if (!item.text.trim()) {
    return IS_EMPTY;
  }
  return IS_STRING;
};

const patchLastComma = (item) => {
  if (item.text.indexOf("*") !== -1) return;
  const index = item.text.indexOf("//");
  if (index > 0) {
    //like this-> name:xxx //name is a variable
    const temp = item.text.split("//");
    const trimTemp = temp[0].trim();
    if (trimTemp[trimTemp.length - 1] !== ",") {
      temp[0] += ",";
      temp[1] = "//" + temp[1];
      item.text = temp.join("");
    }
  } else {
    //like name:xxx
    const trimTemp = item.text.trim();
    if (trimTemp[trimTemp.length - 1] !== ",") {
      item.text += ",";
    }
  }
};

export {
  flatCssNodesFunc,
  flatHtmlNodesFunc,
  isCommentOrEmpty,
  patchLastComma,
};
