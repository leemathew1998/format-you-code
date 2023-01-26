import * as vscode from "vscode";
export const processWatch = async (
  moduleLines,
  range,
  dataParams,
  propsParams,
  computedParams
) => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );
  let watchMap = new Map();
  let firstLineNumber = -1;
  let stackForComma: string[] = [];
  //   debugger;
  let currentIndex = String(Math.random() * 100).slice(0, 5);
  let sortPriorityProps = [...dataParams, ...propsParams, ...computedParams];
  console.log(sortPriorityProps);
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
    if (firstLineNumber === -1) {
      firstLineNumber = item.lineNumber;
    }
    //开始和结尾的特殊处理
    item.textCopy = item.text.replace(/\s/g, "");
    if (item.textCopy.indexOf("watch:{") !== -1) {
      item.thisVarIndex = -1000;
      stackForComma.push("{");
      continue;
    } else if (
      (item.textCopy.indexOf("}") !== -1 ||
        item.textCopy.indexOf("},") !== -1) &&
      index === needFixVariable.length - 1
    ) {
      item.thisVarIndex = 1000000;
      stackForComma.pop();
      continue;
    }
    item.thisVarIndex = currentIndex;

    // 开始匹配xxx:{或者xxx(这两种情况
    let variableNameType = item.textCopy.match(/(\w+)[:|\(]/g);

    if (stackForComma.length > 1) {
      continue;
    } else if (stackForComma.length === 0) {
      currentIndex = String(Math.random() * 100).slice(0, 5);
    }
    if (!variableNameType) {
      // if (
      //   item.textCopy.indexOf("},") !== -1 ||
      //   item.textCopy.indexOf("}") !== -1
      // ) {
      //   // currentIndex = 999999;
      // }
      continue;
    }
    console.log(variableNameType[0], stackForComma.length);
    if (item.textCopy.indexOf("}") !== -1 && stackForComma.length) {
      stackForComma.pop();
    }
    if (item.textCopy.indexOf("{") !== -1) {
      stackForComma.push("{");
    }
    /***
 * 
 * 
 *     name: {
      handler: function (val, oldVal) {
        console.log("name changed", val, oldVal);
      },
      immediate: true,
    },
    number: {
      handler: function (val, oldVal) {
        console.log("number changed", val, oldVal);
      },
    },
 */

    // variableName = variableName[1];
    // const reg = new RegExp(`\\b${variableName}\\b`, "g");
    // const isshow = renderFunc.match(reg);
    // if (!isshow) {
    //   currentIndex = 999999;
    //   continue;
    // }
    // const thisVarIndex = renderFunc.indexOf(isshow[0]);
    // item.thisVarIndex = thisVarIndex;
    // currentIndex = thisVarIndex;
  }
  //   console.log(needFixVariable);
};
