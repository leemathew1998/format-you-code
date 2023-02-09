const vscode = require("vscode");
import { TextEditorEdit } from "vscode";
import { needFixVariableType } from "../type";
import { IS_EMPTY } from "../utils/constants";
import { isCommentOrEmpty, patchLastComma } from "../utils/functions";
const sortModule = (script) => {
  let lines = script.module;
  let firstLineNumber = lines[0].lineNumber;
  let copyLines: needFixVariableType[] = [];
  const returnParams: any = {};
  let currentIndex = 999999; //init value
  let currentName = "";
  let deep = 0;
  //if in methods have one function like this func(){}
  //the deep not really add because this line have '{' and '}'
  //to avoid this case,deep++ or deep-- both trigger heckTrick add one
  let heckTrick = 0;
  const scopes = [
    "el",
    "name",
    "components",
    "filters",
    "mixins",
    "layout",
    "middleware",
    "validate",
    "model",
    "props",
    "directives",
    "fetch",
    "data",
    "setup",
    "head",
    "computed",
    "watch",
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeDestroy",
    "methods",
    "fetchOnServer",
    "render",
  ];

  for (let index = 0; index < lines.length; index++) {
    const item = lines[index];
    // debugger
    heckTrick = 0;
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
    const bracketStartIndex = item.textCopy.lastIndexOf("{");
    const bracketEndIndex = item.textCopy.lastIndexOf("}");
    const squareBracketStart = item.textCopy.indexOf("[");
    const squareBracketEnd = item.textCopy.indexOf("]");
    const commentIndex = item.textCopy.indexOf("//");
    //计算{和}出现的次数,如果是奇数，可能为xxx},或者{}...}的情况,如果是偶数，可能为{xxx}或者}...{的情况
    const bracketStartCount = item.textCopy.match(/{/g)?.length ?? 0;
    const bracketEndCount = item.textCopy.match(/}/g)?.length ?? 0;
    let quotationIndex1: any = item.textCopy.slice(
      Math.min(commentIndex, bracketEndIndex),
      Math.max(commentIndex, bracketEndIndex)
    );
    quotationIndex1 =
      quotationIndex1.indexOf("'") === -1
        ? quotationIndex1.indexOf('"')
        : quotationIndex1.indexOf("'");

    let quotationIndex2: any = item.textCopy.slice(
      Math.min(commentIndex, squareBracketEnd),
      Math.max(commentIndex, squareBracketEnd)
    );
    quotationIndex2 =
      quotationIndex2.indexOf("'") === -1
        ? quotationIndex2.indexOf('"')
        : quotationIndex2.indexOf("'");
    if (
      bracketStartIndex !== -1 &&
      (bracketStartIndex < commentIndex || commentIndex === -1)
    ) {
      deep++;
      heckTrick++;
    }
    if (
      (bracketEndIndex !== -1 &&
        (bracketEndIndex < commentIndex ||
          commentIndex === -1 ||
          (bracketEndIndex > commentIndex && quotationIndex1 !== -1)) &&
        (bracketEndCount + bracketStartCount) % 2 &&
        bracketEndCount > bracketStartCount) ||
      (bracketStartCount === bracketEndCount && bracketStartCount !== 0)
    ) {
      /**
       * {}}| {}{}} | {}{ | }{}{ | {} | }{
       */
      deep--;
      heckTrick++;
      if (deep === 0) {
        patchLastComma(item);
        copyLines[copyLines.length - 1].text = item.text;
        currentIndex = 999999;
      }
    }
    // for square bracket
    if (
      squareBracketStart !== -1 &&
      (squareBracketStart < commentIndex || commentIndex === -1)
    ) {
      deep++;
      heckTrick++;
    }
    if (
      squareBracketEnd !== -1 &&
      (squareBracketEnd < commentIndex ||
        commentIndex === -1 ||
        (squareBracketEnd > commentIndex && quotationIndex2 !== -1))
    ) {
      deep--;
      heckTrick++;
      if (deep === 0) {
        currentIndex = 0;
      }
    }
    // debugger
    let reg1 = item.textCopy.match(/(\w+)\((\w+)?\)\{/); //xxxx():{
    let reg2 = item.textCopy.match(/(\w+)\s*:/); //xxx:
    let reg3 = item.textCopy.match(/(\w+):{?(\w+)/); //xxx:{
    let regVal = reg2 ?? reg1 ?? reg3;
    if (!regVal || deep > 1) {
      continue;
    }
    const indexFromScopes = scopes.indexOf(regVal[1]);
    if (indexFromScopes !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = indexFromScopes;
      currentIndex = indexFromScopes;
    }
    if (
      !returnParams.hasOwnProperty(regVal[1]) &&
      (heckTrick < 2 || (heckTrick === 2 && deep === 0))
    ) {
      currentName = regVal[1];
      returnParams[regVal[1]] = [];
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
  // debugger
  //start sort
  copyLines.sort((a, b) => a.thisVarIndex! - b.thisVarIndex!);
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    delete item.thisVarIndex;
  });
  script.module = copyLines;

  // const res = copyLines
  //   .filter((i) => i.text.length)
  //   .map((item) => item.text)
  //   .join("\n");
  // await vscode.window.activeTextEditor.edit((builder: TextEditorEdit) => {
  //   builder.delete(
  //     new vscode.Range(script.moduleRange[0], script.moduleRange[1])
  //   );
  //   builder.insert(script.moduleRange[0], res);
  // });

  return returnParams;
};

export default sortModule;
