export const processLifeCycle = (moduleLines, range, name, priorityList) => {
    const needFixVariable = moduleLines.splice(
      range.trueStartIndex,
      range.trueEndIndex - range.trueStartIndex + 1
    );
    priorityList[name] = [];
    for (let index = 0; index < needFixVariable.length; index++) {
      const item = needFixVariable[index];
      if (!item.text.trim()) continue;
      //检测this.的情况,但是需要排除注释的情况
      // if (item.text.indexOf("//") !== -1 || item.text.indexOf("*") !== -1)
      //   continue;
      let variableName = item.text.match(/this\.(\w+)/g);
      if (!variableName) continue;
      priorityList[name].push(
        ...variableName.map((item) => item.replace("this.", ""))
      );
    }
  };