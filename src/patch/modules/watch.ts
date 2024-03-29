import { needFixVariableType, rangeTye } from "../../type";
import { IS_EMPTY } from "../../utils/constants";
import {
  isCommentOrEmpty,
  patchLastComma,
  patchLastCommaForSquareBracket,
} from "../../utils/functions";

export const processWatch = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  dataParams,
  propsParams,
  computedParams
) => {
  /**
   * slice data part
   * example:
   * watch:{
   *   xxx(newVal,oldVal){},
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
  let sortPriorityProps = [...dataParams, ...propsParams, ...computedParams];
  for (let index = 0; index < needFixVariable.length; index++) {
    // debugger
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
    if (item.textCopy.indexOf("watch:{") !== -1) {
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

    if (deep > 1) {
      continue;
    }
    // 开始匹配xxx:{或者xxx(这两种情况
    let matchs = item.textCopy.match(/([A-Za-z0-9_'"]+)[:|\(|\[]/g);

    if (!matchs) {
      continue;
    }
    for (let i = 0; i < sortPriorityProps.length; i++) {
      const name = sortPriorityProps[i];
      if (matchs![0].includes(name)) {
        copyLines[copyLines.length - 1].thisVarIndex = i;
        currentIndex = i;
        break;
      }
    }
  }
  copyLines.sort((a, b) => a.thisVarIndex! - b.thisVarIndex!);
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    delete item.thisVarIndex;
  });
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
};
