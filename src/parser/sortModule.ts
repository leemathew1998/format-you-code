import { needFixVariableType } from "../type";
const sortModule = (script,scopes): any => {
  let lines = script.module;
  let firstLineNumber = lines[0].lineNumber;
  let copyLines: needFixVariableType[] = [];
  const returnParams: any = {};
  let returnParamsRange: any = {};
  let currentIndex = 999999; //init value
  let currentName = "";
  let deep = 0;
  //if in methods have one function like this func(){}
  //the deep not really add because this line have '{' and '}'
  //to avoid this case,deep++ or deep-- both trigger hackTrick add one
  let hackTrick = 0;

  for (let index = 0; index < lines.length; index++) {
    const item = lines[index];
    // debugger
    hackTrick = 0;
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    if (deep > 0) {
      returnParams[currentName].push({
        text: copyLines[copyLines.length - 1],
      });
    }
    item.textCopy = item.text.replace(/\s/g, "");
    //check the start line or end line, make the thisVarIndex to the mini or large
    if (item.textCopy.indexOf("exportdefault{") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === lines.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    }
    //把item.textCopy中的{,},[,],//拆出来一个数组
    const arr = item.textCopy.match(/({|}|\[|\]|\/\/)/g);
    for (let key = 0; key < arr?.length; key++) {
      if (arr[key] === "//") {
        break;
      } else if (arr[key] === "{" || arr[key] === "[") {
        deep++;
        hackTrick++;
      } else if (arr[key] === "}" || arr[key] === "]") {
        deep--;
        hackTrick++;
      }
    }

    let reg1 = item.textCopy.match(/(\w+)\((\w+)?\)\{/); //xxxx():{
    let reg2 = item.textCopy.match(/(\w+)\s*:/); //xxx:
    let reg3 = item.textCopy.match(/(\w+):{?(\w+)/); //xxx:{
    let regVal = reg2 ?? reg1 ?? reg3;
    if (!regVal || deep > 1) {
      continue;
    }
    if (regVal[1].includes("async")) {
      regVal[1] = regVal[1].split("async")[1];
    }
    const indexFromScopes = scopes.indexOf(regVal[1]);
    if (indexFromScopes !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = indexFromScopes;
      currentIndex = indexFromScopes;
    } else {
      continue;
    }
    if (
      !returnParams.hasOwnProperty(regVal[1]) &&
      (hackTrick < 2 || (hackTrick === 2 && deep === 0))
    ) {
      currentName = regVal[1];
      returnParams[regVal[1]] = [];
      returnParamsRange[regVal[1]] = item.text;
    }
    returnParams[currentName].push({
      text: copyLines[copyLines.length - 1],
      length: copyLines.length - 1,
    });
  }
  if (returnParams.hasOwnProperty("mixins")) {
    if (returnParams.mixins.length > 2) {
      let start = returnParams.mixins[0].length;
      let mixinsLines = [
        returnParams.mixins[0].text,
        ...returnParams.mixins
          .slice(1, -1)
          .sort((a, b) => (a > b ? 1 : -1))
          .map((i) => i.text),
        returnParams.mixins[returnParams.mixins.length - 1].text,
      ];

      copyLines.splice(start, returnParams.mixins.length, ...mixinsLines);
    } else if (returnParams.mixins.length === 1) {
      const match =
        copyLines[returnParams.mixins[0].length].text.match(
          /^(.*\[)(.*)(\].*,)$/
        );
      if (match) {
        const sort = match[2]
          .split(",")
          .map((e) => e.trim())
          .filter((i) => i.length)
          .sort()
          .join(", ");
        copyLines[returnParams.mixins[0].length].text =
          match[1] + sort + match[3];
      }
    }
  }
  //start sort
  copyLines.sort((a, b) => a.thisVarIndex! - b.thisVarIndex!);
  const temp = {};
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    for (let key in returnParamsRange) {
      if (returnParamsRange[key] === item.text) {
        temp[key] = item.lineNumber;
        delete returnParamsRange[key];
      }
    }
    firstLineNumber!++;
    delete item.thisVarIndex;
  });
  returnParamsRange = temp;
  script.module = copyLines;

  return { returnParams, returnParamsRange };
};

export default sortModule;
