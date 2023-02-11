import { needFixVariableType, rangeTye, returnParams } from "../../type";
import { IS_EMPTY } from "../../utils/constants";
import { isCommentOrEmpty, patchLastComma } from "../../utils/functions";
export const processComputed = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string,
): string[] => {
  /**
   * slice data part
   * example:
   * computed(){
   *   xxx(){},
   * }
   */
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  let firstLineNumber = needFixVariable[0].lineNumber;
  let currentIndex = 999999; //init value
  let deep = 0;
  const returnParams: returnParams[] = [];
  let copyLines: needFixVariableType[] = [];
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    // const CE = isCommentOrEmpty(item);
    // if (CE === IS_EMPTY) {
    //   continue;
    // }
    /**
     * first,give a init value, In this case,
     * it means that this line is also part of the function
     * example:
     * computed1(){  -->thisVarIndex = xxx
     * return 'this line also have the same index'; -->thisVarIndex = xxx
     * }  -->thisVarIndex = xxx
     */
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    item.textCopy = item.text.replace(/\s/g, "");
    //check the start line or end line, make the thisVarIndex to the mini or large
    if (item.textCopy.indexOf("computed:{") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === needFixVariable.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    }
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
    let variableName = item.textCopy.match(/(\w+)\((\w+)?\)\{/);

    if (!variableName || deep > 1) {
      continue;
    }
    returnParams.push({
      name: variableName[1],
      thisVarIndex: currentIndex,
    });

    const reg = new RegExp(`\\b${variableName[1]}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) {
      if (deep === 0) {
        currentIndex = 999999;
      }
      continue;
    }
    const thisVarIndex = renderFunc.indexOf(isshow[0]);

    const alpha = returnParams.find((name) => name.name === variableName![1]);
    if (alpha) {
      alpha.thisVarIndex = thisVarIndex;
    }
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
  return returnParams
    .sort((a, b) => a?.thisVarIndex - b?.thisVarIndex)
    .map((item) => item.name);
};
