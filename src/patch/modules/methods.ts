export const processMethods = (moduleLines, range, renderFunc, priorityList) => {
    const needFixVariable = moduleLines.splice(
      range.trueStartIndex,
      range.trueEndIndex - range.trueStartIndex + 1
    );
    let firstLineNumber = -1;
    let stackForComma: string[] = [];
    let currentIndex = 999999;
    //   debugger;
    //第一次循环，把需要放在renderFunc最前面的变量放在renderFunc最前面
    for (let index = 0; index < needFixVariable.length; index++) {
      const item = needFixVariable[index];
      if (!item.text.trim()) continue;
      let variableName = item.text.replace(/\s/g, "").match(/(\w+)\((\w+)?\)\{/);
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
      item.thisVarIndex = currentIndex;
      if (firstLineNumber === -1) {
        firstLineNumber = item.lineNumber;
      }
      if (!item.text.trim()) continue;
      // if (item.text.indexOf("//") !== -1 || item.text.indexOf("*") !== -1)
      // continue;
      //把空格删掉
      item.textCopy = item.text.replace(/\s/g, "");
  
      if (item.textCopy.indexOf("methods:{") !== -1) {
        item.thisVarIndex = -1000;
      } else if (
        (item.textCopy.indexOf("}") !== -1 ||
          item.textCopy.indexOf("},") !== -1) &&
        index === needFixVariable.length - 1
      ) {
        item.thisVarIndex = 1000000;
      }
      let variableName = item.textCopy.match(/(\w+)\((\w+)?\)\{/);
  
      if (item.textCopy.indexOf("}") !== -1 && stackForComma.length) {
        stackForComma.pop();
      }
      //检测xxx(){或者xxx(...){两种情况，一种有参数，一种没有参数
  
      if (!variableName) {
        if (
          item.textCopy.indexOf("},") !== -1 ||
          item.textCopy.indexOf("}") !== -1
        ) {
          currentIndex = 999999;
        }
        continue;
      }
  
      //此处需要看这一行是不是这个函数的最后一行，检测{和}字符，存到stackForComma中
      if (item.textCopy.indexOf("{") !== -1) {
        stackForComma.push("{");
      }
  
      variableName = variableName[1];
      const reg = new RegExp(`\\b${variableName}\\b`, "g");
      const isshow = renderFunc.match(reg);
      if (!isshow) {
        currentIndex = 999999;
        continue;
      }
      const thisVarIndex = renderFunc.indexOf(isshow[0]);
      item.thisVarIndex = thisVarIndex;
      currentIndex = thisVarIndex;
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