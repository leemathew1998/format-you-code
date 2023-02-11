import { needFixVariableType, rangeTye, returnParams } from "../../type";
import { IS_COMMENT, IS_EMPTY, IS_STRING } from "../../utils/constants";
import { isCommentOrEmpty, patchLastCommaForData } from "../../utils/functions";
export const processData = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string,
): Array<string> => {
  /**
   * slice data part
   * example:
   * data(){
   *   name:'111'
   * }
   */
  // debugger
  let needFixVariable: needFixVariableType[] = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  //return a new sorted list
  const returnParams: returnParams[] = [];
  let firstLineNumber = needFixVariable[0].lineNumber;
  let currentIndex = -100; //init value
  let deep = 0;
  //start sort the data module
  let copyLines: needFixVariableType[] = [];
  let isEnterReturn = false;
  let oneShort = false;
  let notEmptyData: needFixVariableType[] = [];
  let hackTrick: any = [false, false];
  let hackTrickCopy: any = [false, false];
  for (let index = 0; index < needFixVariable.length; index++) {
    const CE = isCommentOrEmpty(needFixVariable[index]);
    // if (CE !== IS_EMPTY) {
    notEmptyData.push(needFixVariable[index]);
    notEmptyData[notEmptyData.length - 1].CE = CE;
    // }
  }

  for (let index = 0; index < notEmptyData.length; index++) {
    const item = notEmptyData[index];
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    item.textCopy = item.text.replace(/\s/g, "");
    if (item.textCopy.indexOf("data(){") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (item.textCopy.indexOf("return{") !== -1 && deep === 0) {
      copyLines[copyLines.length - 1].thisVarIndex = -1;
      deep = 1;
      isEnterReturn = true;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === notEmptyData.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    }
    if (!isEnterReturn) {
      //if not enter return{}, just skip
      continue;
    }
    const arr = item.textCopy.match(/({|}|\[|\]|\/\/)/g);
    if (arr) {
      for (let key = 0; key < arr.length; key++) {
        if (arr[key] === "//") {
          break;
        } else if (arr[key] === "{" || arr[key] === "[") {
          deep++;
          oneShort = true;
        } else if (arr[key] === "}" || arr[key] === "]") {
          deep--;
          oneShort = false;
        }
      }
    }
    if (deep === 0 && item.textCopy.length > 0) {
      currentIndex = 0;
      copyLines[copyLines.length - 1].thisVarIndex = 999999;
      continue;
    }
    if (deep === 1) {
      //data module have a little different, if one line is so long that need to be split in mutil lines
      //so we only need to patch the last line,
      /**
       * example1: url:
       *            'https://longlonglonglonglongUrl.com'
       * example2: word: `
       *  ..............
       *  ..............
       *  `
       * we need to patch the last line of example1 and example2
       */
      if (item.textCopy[item.textCopy.length - 1] === ":") {
        hackTrick[0] = true;
      } else {
        hackTrick[0] = false;
      }
      const temp = item.textCopy.match(/`/g);
      if (temp && temp?.length % 2) {
        hackTrick[1] = !hackTrick[1];
      }
      if (!hackTrick[0] && !hackTrick[1]) {
        copyLines[copyLines.length - 1].text = patchLastCommaForData(
          copyLines[copyLines.length - 1].text
        );
      } else {
        hackTrickCopy = [...hackTrick];
      }

      //  else {
      //   copyLines[copyLines.length - 1].text = patchLastCommaForData(
      //     copyLines[copyLines.length - 1].text
      //   );
      // }
    }
    let variableName = item.text.match(/(\w+)\s*[:|,]/);
    if ((hackTrickCopy[0] && !hackTrick[0]) || hackTrickCopy[1]) {
      hackTrickCopy = [...hackTrick];
      continue;
    }
    if (!oneShort && deep > 1) {
      continue;
    }
    if (oneShort) {
      oneShort = false;
    }
    if (!variableName) {
      continue;
    }

    if (item.CE === IS_STRING && deep <= 2) {
      // debugger;
      returnParams.push({
        name: variableName[1],
        thisVarIndex: 999999,
      });
    }
    const reg = new RegExp(`\\b${variableName[1]}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) {
      // if (deep === 1) {
      copyLines[copyLines.length - 1].thisVarIndex = 99999;
      currentIndex = 99999;
      // }
      continue;
    }
    const thisVarIndex = renderFunc.indexOf(isshow[0]);
    const alpha = returnParams.find((name) => name.name === variableName![1]);
    if (alpha) {
      alpha.thisVarIndex = thisVarIndex;
    }
    currentIndex = thisVarIndex;
    copyLines[copyLines.length - 1].thisVarIndex = thisVarIndex;
  }
  // debugger
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
