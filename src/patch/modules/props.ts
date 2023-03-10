import { needFixVariableType, rangeTye, returnParams } from "../../type";
import { IS_EMPTY } from "../../utils/constants";
import { isCommentOrEmpty, patchLastComma } from "../../utils/functions";

export const processProps = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string
): string[] => {
  /**
   * slice data part
   * example:
   * props:[xxx,xxx]
   * or
   * props:{
   *    props1:{},
   *    props2:{}
   * }
   */
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  const returnParams: returnParams[] = [];
  //props have two type: 1.[] 2.{}
  const isArr = needFixVariable[0].text.indexOf("[") !== -1;
  if (isArr) {
    /**
     * type1:['props1','props2']
     * type2:['props1', //xxxx
     *        'props2'  //xxxx
     *       ]
     */
    let props: string[] = [];
    for (let index = 0; index < needFixVariable.length; index++) {
      //match "props1" or 'props1'
      const item = needFixVariable[index];
      const singleQuotes = item.text.match(/\'([^\"]*)\'/g);
      const doubleQuotes = item.text.match(/\"([^\"]*)\"/g);
      if (singleQuotes) {
        singleQuotes[0]
          .split(",")
          .forEach((item) => props.push(item.split("'")[1]));
      }
      if (doubleQuotes) {
        doubleQuotes[0]
          .split(",")
          .forEach((item) => props.push(item.split(`"`)[1]));
      }
    }

    let map = new Map();
    for (let index = 0; index < props.length; index++) {
      const item = props[index];
      returnParams.push({
        name: item,
        thisVarIndex: 999999,
      });
      const reg = new RegExp(`\\b${item}\\b`, "g");
      const isshow = renderFunc.match(reg);
      if (!isshow) {
        continue;
      }
      const thisVarIndex = renderFunc.indexOf(isshow[0]);
      const alpha = returnParams.find((name) => name.name === item);
      if (alpha) {
        alpha.thisVarIndex = thisVarIndex;
      }
      map.set(thisVarIndex, item);
    }

    let arr = Array.from(map)
      .sort((a, b) => a[0] - b[0])
      .map((item) => item[1]);
    needFixVariable[0].text = `props: [${arr
      .map((item) => `"${item}"`)
      .join(", ")}],`;
    //if is muti-line, change into single line
    if (needFixVariable.length > 1) {
      needFixVariable.splice(1);
    }
  } else {
    /**
     *     props:{
     *          props1:{
     *            type:String,
     *            ......
     *          },
     *     }
     */
    let firstLineNumber = needFixVariable[0].lineNumber;
    let currentIndex = 999999; //init value
    let deep = 0;
    let oneShort = false;
    let copyLines: needFixVariableType[] = [];

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
      if (item.textCopy.indexOf("props:{") !== -1) {
        copyLines[copyLines.length - 1].thisVarIndex = -1000;
        continue;
      } else if (
        item.textCopy.indexOf("}") !== -1 &&
        index === needFixVariable.length - 1
      ) {
        copyLines[copyLines.length - 1].thisVarIndex = 1000000;
        continue;
      }
      let variableName = item.textCopy.match(/(\w+):{?/);
      if (deep === 0 && variableName) {
        returnParams.push({
          name: variableName[1],
          thisVarIndex: currentIndex,
        });
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
        patchLastComma(item);
        copyLines[copyLines.length - 1].text = item.text;
        currentIndex = 999999;
      }

      if (!variableName || deep > 1) {
        continue;
      }
      if (!oneShort) {
        continue;
      }
      if (oneShort) {
        oneShort = false;
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
  }
  return returnParams
    .sort((a, b) => a?.thisVarIndex - b?.thisVarIndex)
    .map((item) => item.name);
};
