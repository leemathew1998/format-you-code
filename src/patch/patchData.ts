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
    console.log(moduleLines);
  });
};

const processName = (moduleLines, range, renderFunc) => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );
  let firstLineNumber = -1;
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
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
};
export default patchData;
