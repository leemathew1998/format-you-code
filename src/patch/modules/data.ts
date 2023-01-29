import { needFixVariableType, rangeTye, returnParams } from "../../type";
import { IS_COMMENT, IS_EMPTY } from "../../utils/constants";
import { isCommentOrEmpty, patchLastComma } from "../../utils/functions";
export const processData = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string,
  priorityList
): Array<string> => {
  /**
   * slice data part
   * example:
   * data(){
   *   name:'111'
   * }
   */
  let needFixVariable: needFixVariableType[] = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  //return a new sorted list
  const returnParams: returnParams[] = [];
  let firstLineNumber = needFixVariable[0].lineNumber;

  //start sort the data module
  let copyLines: needFixVariableType[] = [];
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    const CE = isCommentOrEmpty(item);
    if (CE === IS_EMPTY) {
      continue;
    }
    copyLines.push({
      text: item.text,
    });
    let variableName = item.text.match(/(\w+)\s*[:|,]/);
    if (!variableName) continue;
    //If a parameter is prioritized/lagged,
    //it needs to be added at the start or end of the render string(renderFunc)
    if (priorityList.first.includes(variableName[1])) {
      //prioritized
      renderFunc = ` ${variableName[1]} ` + renderFunc;
    } else if (priorityList.third.includes(variableName[1])) {
      //anti-priority
      renderFunc += ` ${variableName[1]} `;
    }

    //incase this line has not "," but move to the top, will have a error
    patchLastComma(item);
    const reg = new RegExp(`\\b${variableName[1]}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) continue;
    const thisVarIndex = renderFunc.indexOf(isshow[0]);
    returnParams.push({
      name: variableName[1],
      thisVarIndex,
    });
    copyLines[copyLines.length - 1].thisVarIndex = thisVarIndex;
  }
  copyLines.sort((a, b) => {
    if (a.thisVarIndex && b.thisVarIndex) {
      return a.thisVarIndex - b.thisVarIndex;
    }
    return 0;
  });
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    if (item.thisVarIndex) {
      delete item.thisVarIndex;
    }
  });
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
  return returnParams
    .sort((a, b) => a?.thisVarIndex - b?.thisVarIndex)
    .map((item) => item.name);
};
