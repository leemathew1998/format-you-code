import { needFixVariableType, rangeTye } from "../../type";
import { IS_EMPTY, IS_COMMENT } from "../../utils/constants";
import { isCommentOrEmpty } from "../../utils/functions";

export const processComponents = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string
) => {
  /**
   * slice data part
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
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    const CE = isCommentOrEmpty(item);
    if (CE === IS_EMPTY) {
      continue;
    }
    copyLines.push({
      text: item.text,
    });
    //replace all the space
    item.textCopy = item.text.replace(/\s/g, "");

    if (
      item.textCopy.indexOf("components:{") === -1 &&
      item.textCopy.indexOf("}") === -1
    ) {
      //if not the start or end, must be the components
      if (item.textCopy.indexOf(",") !== -1) {
        item.textCopy = item.textCopy.split(",")[0];
      }
      //if textCopy have upper case like submitDialogModal,
      //user can use <submit-dialog-modal> or <submitDialogModal> two ways

      let reg = new RegExp(`\\b${item.textCopy}\\b`, "g");
      let isshowCase1: RegExpMatchArray | null = renderFunc.match(reg);
      let isshowCase2: RegExpMatchArray | null = null;
      const hasUppercase = item.textCopy.match(/[A-Z]/);
      if (hasUppercase) {
        //if has uppercase, we need to tranform from submitDialogModal to submit-dialog-modal
        const split = item.textCopy.split("");
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
        continue;
      } else if (isshowCase1 && isshowCase2) {
        //if both case match, we use the smaller index
        copyLines[copyLines.length - 1].thisVarIndex = Math.min(
          renderFunc.indexOf(isshowCase1[0]),
          renderFunc.indexOf(isshowCase2[0])
        );
      } else if (isshowCase1) {
        //if case1 match, we use case1
        copyLines[copyLines.length - 1].thisVarIndex = renderFunc.indexOf(
          isshowCase1[0]
        );
      } else if (isshowCase2) {
        //if case2 match, we use case2
        copyLines[copyLines.length - 1].thisVarIndex = renderFunc.indexOf(
          isshowCase2[0]
        );
      }
    }
  }

  copyLines.sort((a, b) => {
    if (a.thisVarIndex && b.thisVarIndex) {
      return a.thisVarIndex - b.thisVarIndex;
    }
    return 0;
  });
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    if (item.thisVarIndex) {
      delete item.thisVarIndex;
      delete item.textCopy;
    }
  });
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
};
