import { needFixVariableType, rangeTye } from "../../type";
import { IS_STRING } from "../../utils/constants";
import { isCommentOrEmpty } from "../../utils/functions";

export const processLifeCycle = (
  moduleLines: needFixVariableType[],
  range: any,
  name: string,
  priorityList
) => {
  const needFixVariable = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  priorityList[name] = [];
  for (let index = 0; index < needFixVariable.length; index++) {
    const item = needFixVariable[index];
    const CE = isCommentOrEmpty(item);
    if (CE !== IS_STRING) {
      //if this line is empty or comment,skip this line
      continue;
    }
    let variableName = item.text.match(/this\.(\w+)/g);
    if (!variableName) {
      continue;
    }
    priorityList[name].push(
      ...variableName.map((item) => item.replace("this.", ""))
    );
  }
  moduleLines.splice(range.trueStartIndex!, 0, ...needFixVariable);
};
