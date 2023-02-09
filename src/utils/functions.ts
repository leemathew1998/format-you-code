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
  if (item.text.indexOf("*") !== -1) {
    return;
  }
  const commentIndex = item.text.indexOf("//");
  if (commentIndex > 0) {
    //like this-> xxx//
    //if have brackets, there have two type
    // 1.xxxxx //}  2.xxxxx}//  3.xxx:'https://...'  4.xxx:'https://...' //xsssss
    const temp = item.text.split("//");
    const trim0Temp = temp[0].trim();
    const trim1Temp = temp[1].trim();
    const bracketIndex = item.text.indexOf("}");
    if (bracketIndex > 0) {
      if (commentIndex > bracketIndex) {
        if (trim0Temp[trim0Temp.length - 1] !== ",") {
          temp[0] += ",";
          temp[1] = "//" + temp[1];
          item.text = temp.join("");
        }
      } else {
        if (trim1Temp[trim1Temp.length - 1] !== ",") {
          temp[1] = "//" + temp[1] + ",";
          item.text = temp.join("");
        }
      }
    } else {
      if (trim0Temp[trim0Temp.length - 1] !== ",") {
        temp[0] += ",";
        temp[1] = "//" + temp[1];
        item.text = temp.join("");
      }
    }
  } else {
    //like name:xxx
    const trimTemp = item.text.trim();
    if (trimTemp[trimTemp.length - 1] !== ",") {
      item.text += ",";
    }
  }
};

const patchLastCommaForData = (str) => {
  //需要在每一行最后判断是不是加了逗号，如果没有加，就加上，以下是各种情况
  //1.如果是xxxxx这种，就直接加逗号
  //2.如果是xxxxx//...这种，就需要判断//之前有没有逗号
  //3.如果是http://xxx这种,就不需要加逗号,但是如果是http://xxx //...这种，就需要判断第二个//之前有没有逗号
  //开始对每种情况写正则
  const reg1 = /([^,])$/;
  const reg2 = /([^,])\/\/\.\.\./;
  const reg3 = /([^,])http:\/\//;
  const reg4 = /([^,])http:\/\/\.\.\./;
  //开始判断
  if (reg1.test(str)) {
    str = str + ",";
  }
  if (reg2.test(str)) {
    str = str.replace(reg2, "$1, //...");
  }
  if (reg3.test(str)) {
    str = str.replace(reg3, "$1http://");
  }
  if (reg4.test(str)) {
    str = str.replace(reg4, "$1http://...");
  }
  return str;
};

const patchLastCommaForMethods = (str) => {
  /**
   * 给定一个字符串，判断是不是以逗号结尾，如果不是，就加上逗号,如果是，就不加
   * 但是由于string会有注释的情况，所以需要判断有没有//，如果有，就需要判断//之前有没有逗号
   */
  const reg = /([^,])$/;
  if (reg.test(str)) {
    str = str + ",";
  } else {
    const commentIndex = str.indexOf("//");
    if (commentIndex > 0) {
      const temp = str.split("//");
      const trim0Temp = temp[0].trim();
      const trim1Temp = temp[1].trim();
      if (trim0Temp[trim0Temp.length - 1] !== ",") {
        temp[0] += ",";
        temp[1] = "//" + temp[1];
        str = temp.join("");
      }
    }
  }
  console.log(str);
  return str;
};
patchLastCommaForMethods('nihao//nihao')
const patchLastCommaForSquareBracket = (item) => {
  if (item.text.indexOf("*") !== -1) {
    return;
  }
  const commentIndex = item.text.indexOf("//");
  if (commentIndex > 0) {
    //like this-> xxx//
    //if have brackets, there have two type
    // 1.//}  2.}//
    const temp = item.text.split("//");
    const trim0Temp = temp[0].trim();
    const trim1Temp = temp[1].trim();
    const bracketIndex = item.text.indexOf("]");
    if (bracketIndex > 0) {
      if (commentIndex > bracketIndex) {
        if (trim0Temp[trim0Temp.length - 1] !== ",") {
          temp[0] += ",";
          temp[1] = "//" + temp[1];
          item.text = temp.join("");
        }
      } else {
        if (trim1Temp[trim1Temp.length - 1] !== ",") {
          temp[1] = "//" + temp[1] + ",";
          item.text = temp.join("");
        }
      }
    } else {
      if (trim0Temp[trim0Temp.length - 1] !== ",") {
        temp[0] += ",";
        temp[1] = "//" + temp[1];
        item.text = temp.join("");
      }
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
  patchLastCommaForSquareBracket,
  patchLastCommaForData
};
