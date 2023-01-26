import { returnParams } from "../../type";
export const processData = (
  moduleLines,
  range,
  renderFunc,
  priorityList
): Array<string> => {
  //截取响应的data部分
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );

  const returnParams: returnParams[] = [];
  let firstLineNumber = -1;
  //第一次循环，把需要放在renderFunc最前面的变量放在renderFunc最前面
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
    let variableName = item.text.match(/(\w+)\s*:/);
    if (!variableName) continue;

    variableName = variableName[1];

    if (priorityList.first.includes(variableName)) {
      //在renderFunc最前面插入
      renderFunc = ` ${variableName} ` + renderFunc;
    } else if (priorityList.third.includes(variableName)) {
      renderFunc += ` ${variableName} `;
    }
  }
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
    // if (item.text.indexOf("//") !== -1 || item.text.indexOf("*") !== -1)
    // continue;
    let variableName = item.text.match(/(\w+)\s*:/);
    if (!variableName) continue;

    variableName = variableName[1];

    const reg = new RegExp(`\\b${variableName}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) continue;
    if (firstLineNumber === -1) {
      firstLineNumber = needFixVariable[index].lineNumber;
    }
    // debugger;
    const thisVarIndex = renderFunc.indexOf(isshow[0]);
    returnParams.push({
      name: variableName,
      thisVarIndex,
    });
    needFixVariable[index].thisVarIndex = thisVarIndex;
  }
  needFixVariable.sort((a, b) => a?.thisVarIndex - b?.thisVarIndex);
  needFixVariable.forEach((item) => {
    if (item.thisVarIndex) {
      item.lineNumber = firstLineNumber;
      firstLineNumber++;
      delete item.thisVarIndex;
    }
  });
  moduleLines.splice(range.trueStartIndex, 0, ...needFixVariable);
  return returnParams
    .sort((a, b) => a?.thisVarIndex - b?.thisVarIndex)
    .map((item) => item.name);
};
