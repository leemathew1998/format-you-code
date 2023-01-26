export const processProps = (
  moduleLines,
  range,
  renderFunc,
  priorityList
): string[] => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex,
    range.trueEndIndex - range.trueStartIndex + 1
  );
  const returnParams: string[] = [];
  //props有两种，第一种是数组，第二种是对象
  const isArr = needFixVariable[0].text.indexOf("[") !== -1;
  if (isArr) {
    //数组形式
    let strProps = needFixVariable
      .map((item) => item.text.replace(/\s/g, ""))
      .join("")
      .split("[")[1]
      .split("]")[0]
      .replace(/"/g, "")
      .replace(/'/g, "")
      .split(",");
    if (strProps.length === 0) return returnParams;
    returnParams.push(...strProps);
    //第一次循环，把需要放在renderFunc最前面的变量放在renderFunc最前面
    for (let index = 0; index < strProps.length; index++) {
      const item = strProps[index];
      if (priorityList.first.includes(item)) {
        //在renderFunc最前面插入
        renderFunc = ` ${item} ` + renderFunc;
      } else if (priorityList.third.includes(item)) {
        renderFunc += ` ${item} `;
      }
    }
    let map = new Map();
    for (let index = 0; index < strProps.length; index++) {
      const item = strProps[index];

      const reg = new RegExp(`\\b${item}\\b`, "g");
      const isshow = renderFunc.match(reg);
      if (!isshow) continue;
      const thisVarIndex = renderFunc.indexOf(isshow[0]);
      map.set(thisVarIndex, item);
    }
    //按照key的大小重新排序变成一个value的Array
    let arr = Array.from(map)
      .sort((a, b) => a[0] - b[0])
      .map((item) => item[1]);
    needFixVariable[0].text = needFixVariable[0].text = `props: [${arr
      .map((item) => `"${item}"`)
      .join(", ")}],`;
    if (needFixVariable.length > 1) {
      needFixVariable.splice(1);
    }
  } else {
    //对象形式
    let firstLineNumber = -1;
    let stackForComma: string[] = [];
    let currentIndex = 999999;
    //   debugger;
    //第一次循环，把需要放在renderFunc最前面的变量放在renderFunc最前面
    for (let index = 0; index < needFixVariable.length; index++) {
      const item = needFixVariable[index];
      if (!item.text.trim()) continue;
      //匹配xxx:{、xxx: {、xxx : {三种情况
      let variableName = item.text.replace(/\s/g, "").match(/(\w+):{?/);
      if (!variableName) continue;
      variableName = variableName[1];
      if (priorityList.first.includes(variableName)) {
        //在renderFunc最前面插入
        renderFunc = ` ${variableName} ` + renderFunc;
      } else if (priorityList.third.includes(variableName)) {
        renderFunc += ` ${variableName} `;
      }
    }
    // debugger;
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

      if (item.textCopy.indexOf("props:{") !== -1) {
        item.thisVarIndex = -1000;
      } else if (
        (item.textCopy.indexOf("}") !== -1 ||
          item.textCopy.indexOf("},") !== -1) &&
        index === needFixVariable.length - 1
      ) {
        item.thisVarIndex = 1000000;
      }
      let variableName = item.textCopy.match(/(\w+):{?/);

      if (item.textCopy.indexOf("}") !== -1 && stackForComma.length) {
        stackForComma.pop();
      }

      if (!variableName || stackForComma.length >= 2) {
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
  }
  return returnParams;
};
