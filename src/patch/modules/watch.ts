export const processWatch = async (
  moduleLines,
  range,
  dataParams,
  propsParams,
  computedParams
) => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );
  let firstLineNumber = -1;
  let currentIndex = -1;
  let sortPriorityProps = [...dataParams, ...propsParams, ...computedParams];
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    if (!item.text.trim()) continue;
    if (firstLineNumber === -1) {
      firstLineNumber = item.lineNumber;
    }
    //开始和结尾的特殊处理
    item.textCopy = item.text.replace(/\s/g, "");
    if (item.textCopy.indexOf("watch:{") !== -1) {
      item.thisVarIndex = -1000;
      continue;
    } else if (
      (item.textCopy.indexOf("}") !== -1 ||
        item.textCopy.indexOf("},") !== -1) &&
      index === needFixVariable.length - 1
    ) {
      item.thisVarIndex = 1000000;
      continue;
    }
    item.thisVarIndex = currentIndex;
    // 开始匹配xxx:{或者xxx(这两种情况
    let variableNameType = item.textCopy.match(/(\w+)[:|\(]/g);

    if (!variableNameType) {
      continue;
    } else {
      //说明匹配到了
      variableNameType = variableNameType[0].slice(0, -1);
      const temp = sortPriorityProps.indexOf(variableNameType);
      if (temp === -1) {
        //说明不是data,props,computed中的变量
        item.thisVarIndex = currentIndex;
      } else {
        item.thisVarIndex = temp;
        currentIndex = temp;
      }
    }
  }
  needFixVariable.sort((a, b) => a?.thisVarIndex - b?.thisVarIndex);
  
  needFixVariable.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber++;
    delete item.textCopy;
    delete item.thisVarIndex;
  });
  moduleLines.splice(range.trueStartIndex, 0, ...needFixVariable);
};
