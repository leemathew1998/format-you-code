import { needFixVariableType, rangeTye } from "../../type";
import { IS_EMPTY, IS_COMMENT } from "../../utils/constants";
import { isCommentOrEmpty } from "../../utils/functions";

export const processComponents = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string
) => {
  /**
   * slice components part
   * example:
      components: {
        XXX,
      },
   */
  const needFixVariable: needFixVariableType[] = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );

  let firstLineNumber = needFixVariable[0].lineNumber;
  let copyLines: needFixVariableType[] = [];
  let components: string[] = [];
  if (needFixVariable.length === 1) {
    components = needFixVariable[0].text
      .replace(/\s/g, "")
      .split("components:{")[1]
      .split("}")[0]
      .split(",")
      .filter((i) => i.length);
  } else {
    for (let index = 0; index < needFixVariable.length; index++) {
      const item = needFixVariable[index];
      // const CE = isCommentOrEmpty(item);
      // if (CE === IS_EMPTY) {
      //   continue;
      // }
      //replace all the space
      const copy = item.text.replace(/\s/g, "");

      if (copy.indexOf("components:{") === -1 && copy.indexOf("}") === -1) {
        //if not the start or end, must be the components
        components.push(item.text);
      }
    }
  }

  components.forEach((item) => {
    copyLines.push({
      text: item,
    });
  });
  for (let i = 0; i < components.length; i++) {
    const item = components[i];
    const nameCopy = item.replace(/\s/g, "").split("//")[0].split(",")[0];
    //if textCopy have upper case like submitDialogModal,
    //user can use <submit-dialog-modal> or <submitDialogModal> two ways
    let reg = new RegExp(`\\b${nameCopy}\\b`, "g");
    let isshowCase1: RegExpMatchArray | null = renderFunc.match(reg);
    let isshowCase2: RegExpMatchArray | null = null;
    const hasUppercase = nameCopy.match(/[A-Z]/);
    if (hasUppercase) {
      //if has uppercase, we need to tranform from submitDialogModal to submit-dialog-modal
      const split = nameCopy.split("");
      const result: any = [];
      for (let i = 0; i < split.length; i++) {
        if (split[i].match(/[A-Z]/)) {
          result.push("-");
          result.push(split[i].toLowerCase());
        } else {
          result.push(split[i]);
        }
      }

      let reg = new RegExp(`\\b${result.slice(1).join("")}\\b`, "g");
      isshowCase2 = renderFunc.match(reg);
    } else {
      isshowCase2 = null;
    }
    if (!isshowCase1 && !isshowCase2) {
      //two case both not match
      copyLines[i].thisVarIndex = 99999;
      continue;
    } else if (isshowCase1 && isshowCase2) {
      //if both case match, we use the smaller index
      copyLines[i].thisVarIndex = Math.min(
        renderFunc.indexOf(isshowCase1[0]),
        renderFunc.indexOf(isshowCase2[0])
      );
    } else if (isshowCase1) {
      //if case1 match, we use case1
      copyLines[i].thisVarIndex = renderFunc.indexOf(isshowCase1[0]);
    } else if (isshowCase2) {
      //if case2 match, we use case2
      copyLines[i].thisVarIndex = renderFunc.indexOf(isshowCase2[0]);
    }
  }
  //this have two type one line mode and muti line mode
  const space = needFixVariable[0].text.split("components")[0];
  if (needFixVariable.length === 1) {
    let line = {
      //need padding the space in front of components
      text: `${space}components: { ${copyLines.map((i) => i.text + ", ")}},`,
      lineNumber: firstLineNumber,
    };
    copyLines = [line];
  } else {
    copyLines.sort((a, b) => {
      if (a.thisVarIndex && b.thisVarIndex) {
        return a.thisVarIndex - b.thisVarIndex;
      }
      return 0;
    });
    copyLines.forEach((item, i) => {
      item.lineNumber = firstLineNumber;
      firstLineNumber!++;
      const haveComment = item.text.split("//")[1];
      const pureText = item.text.split(",")[0];
      item.text = `${pureText.trimEnd()},`;
      if (haveComment?.length) {
        item.text += ` //${haveComment}`;
      }
    });
    //add head and tail
    copyLines.unshift({
      text: `${space}components: {`,
    });
    copyLines.push({
      text: `${space}},`,
    });
  }

  //insert the new components part
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
};
