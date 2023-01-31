import { needFixVariableType, rangeTye } from "../../type";
import { IS_EMPTY } from "../../utils/constants";
import { isCommentOrEmpty, patchLastComma } from "../../utils/functions";

export const processFilters = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string
) => {
  /**
   * slice data part
   * example:
   * filters:{
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
  let copyLines: needFixVariableType[] = [];
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    const CE = isCommentOrEmpty(item);
    if (CE === IS_EMPTY) {
      continue;
    }
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    item.textCopy = item.text.replace(/\s/g, "");
    if (item.textCopy.indexOf("filters:{") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === needFixVariable.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    }
    const bracketStartIndex = item.textCopy.indexOf("{");
    const bracketEndIndex = item.textCopy.indexOf("}");
    const commentIndex = item.textCopy.indexOf("//");
    if (
      bracketStartIndex !== -1 &&
      (bracketStartIndex < commentIndex || commentIndex === -1)
    ) {
      deep++;
    }
    if (
      bracketEndIndex !== -1 &&
      (bracketEndIndex < commentIndex || commentIndex === -1)
    ) {
      deep--;
      patchLastComma(item);
      copyLines[copyLines.length - 1].text = item.text;

      if (deep === 0) {
        currentIndex = 999999;
      }
    }
    //match two type: xxx(){、xxx(args){
    let variableName = item.textCopy.match(/(\w+)\((\w+)?\)\{/);
    if (!variableName) continue;
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
