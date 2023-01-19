const patchData = (moduleLines: any, hasModules: any, renderFunc: any) => {
  const hasModulesKeys = Object.keys(hasModules);
  hasModulesKeys.forEach((key) => {
    let startIndex = 0;
    const moduleItem = moduleLines.find((item: any, index) => {
      if (item.text.match(new RegExp(`^\\s*${key}\\s*`))) {
        startIndex = index;
        return true;
      }
      return false;
    });
    const range = {
      startLine: moduleItem.lineNumber,
      startCharacter: 0,
      endLine: moduleItem.lineNumber + hasModules[key].length - 1,
      endCharacter:
        moduleLines[startIndex + hasModules[key].length - 1].text.length,
      trueStartIndex: startIndex,
      trueEndIndex: startIndex + hasModules[key].length - 1,
    };
    if (key === "data") {
      processName(moduleLines, range, renderFunc);
    }
    // if (moduleItem) {
    //   moduleItem.text = hasModules[key];
    // }
  });
  // console.log(data, render);
};

const processName = (moduleLines, range, renderFunc) => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );
  let pointer = -1;
  let result: any = [];
  console.log(needFixVariable);
  console.log("-----------------");
  console.log(range);

  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
    let variableName = item.text.match(/(\w+)\s*:/);
    if (!variableName) continue;

    variableName = variableName[1];
    const reg = new RegExp(`\\b${variableName}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (isshow) {
      const thisVarIndex = renderFunc.indexOf(isshow[0]);
      if (pointer < thisVarIndex) {
        pointer = thisVarIndex;
        result.push({
          name: variableName,
          text: item.text,
          thisVarIndex,
          lineNumber: item.lineNumber,
          index,
        });
      } else {
        for (let i = 0; i < result.length; i++) {
          // debugger
          if (result[i].thisVarIndex > thisVarIndex) {
            const readyToInsert = {
              name: variableName,
              text: item.text,
              thisVarIndex,
              lineNumber: item.lineNumber,
              index,
            };
            if (item.lineNumber > result[i].lineNumber) {
              needFixVariable[range.trueStartIndex + index].lineNumber =
                result[i].lineNumber;
              needFixVariable[range.trueStartIndex + i].lineNumber =
                item.lineNumber;
              readyToInsert.lineNumber = result[i].lineNumber;
            }
            result.push(readyToInsert);
            break;
          }
        }
      }
    }
  }
  console.log(result, needFixVariable);
};
export default patchData;
