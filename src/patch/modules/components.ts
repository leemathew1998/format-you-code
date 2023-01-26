export const processComponents = (moduleLines, range, renderFunc) => {
    const needFixVariable = moduleLines.splice(
      range.trueStartIndex,
      range.trueEndIndex - range.trueStartIndex + 1
    );
    let firstLineNumber = -1;
    for (let index = 0; index < needFixVariable.length; index++) {
      const item = needFixVariable[index];
      // if (item.text.indexOf("//") !== -1 || item.text.indexOf("*") !== -1)
      //   continue;
      if (!item.text.trim()) continue;
      //把空格删掉
      item.textCopy = item.text.replace(/\s/g, "");
      if (
        item.textCopy.indexOf("components:{") === -1 &&
        item.textCopy.indexOf("},") === -1 &&
        item.textCopy.indexOf("}") === -1
      ) {
        //如果有,号，那就删掉
        if (item.textCopy.indexOf(",") !== -1) {
          item.textCopy = item.textCopy.replace(",", "");
        }
        const reg = new RegExp(`\\b${item.textCopy}\\b`, "g");
        const isshow = renderFunc.match(reg);
        if (!isshow) continue;
        if (firstLineNumber === -1) {
          firstLineNumber = needFixVariable[index].lineNumber;
        }
        // debugger;
        const thisVarIndex = renderFunc.indexOf(isshow[0]);
        needFixVariable[index].thisVarIndex = thisVarIndex;
      }
    }
  
    needFixVariable.sort((a, b) => a?.thisVarIndex - b?.thisVarIndex);
    needFixVariable.forEach((item) => {
      if (item.thisVarIndex) {
        item.lineNumber = firstLineNumber;
        firstLineNumber++;
        delete item.thisVarIndex;
      }
      delete item.textCopy;
    });
    moduleLines.splice(range.trueStartIndex, 0, ...needFixVariable);
  };