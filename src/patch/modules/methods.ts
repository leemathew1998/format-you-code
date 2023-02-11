import { needFixVariableType, rangeTye } from "../../type";
import { IS_EMPTY } from "../../utils/constants";
import {
  isCommentOrEmpty,
  patchLastComma,
  patchLastCommaForData,
} from "../../utils/functions";

export const processMethods = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string,
) => {
  /**
   * slice data part
   * example:
   * methods:{
   *   fun1(){},
   *   fun2(){}
   * }
   */
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  let firstLineNumber = needFixVariable[0].lineNumber;
  let currentIndex = 999999; //init value
  let deep = 0;
  let copyLines: needFixVariableType[] = [];
  //需要首先先把
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    // const CE = isCommentOrEmpty(item);
    // if (CE === IS_EMPTY) {
    //   continue;
    // }
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    item.textCopy = item.text.replace(/\s/g, "");

    //check the start line or end line, make the thisVarIndex to the mini or large
    if (item.textCopy.indexOf("methods:{") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === needFixVariable.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    }
    //把item.textCopy中的{,},[,],//拆出来一个数组
    const arr = item.textCopy.match(/({|}|\[|\]|\/\/)/g);
    if (arr) {
      for (let key = 0; key < arr.length; key++) {
        if (arr[key] === "//") {
          break;
        } else if (arr[key] === "{" || arr[key] === "[") {
          deep++;
        } else if (arr[key] === "}" || arr[key] === "]") {
          deep--;
        }
      }
    }
    if (deep === 0 && item.textCopy.length > 0) {
      patchLastComma(item);
      copyLines[copyLines.length - 1].text = item.text;
      currentIndex = 999999;
    }

    //match two type: xxx(){、xxx(args){
    let variableName = item.textCopy.match(/(\w+)\((\S+)?\)\{/);

    if (!variableName || deep > 1) {
      continue;
    }
    if (variableName[1].includes("async")) {
      variableName[1] = variableName[1].split("async")[1];
    }

    const reg = new RegExp(`\\b${variableName[1]}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) {
      if (deep === 0) {
        currentIndex = 999999;
      }
      continue;
    }
    const thisVarIndex = renderFunc.indexOf(isshow[0]);
    copyLines[copyLines.length - 1].thisVarIndex = thisVarIndex;
    currentIndex = thisVarIndex;
  }

  copyLines.sort((a, b) => a.thisVarIndex! - b.thisVarIndex!);
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    delete item.thisVarIndex;
  });
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
};
