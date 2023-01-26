import { lifeCycleArr } from "../utils/constants";
import { processComponents, processData, processFilters, processLifeCycle, processMethods } from "./patchFn";

const patchData = (moduleLines: any, hasModules: any, renderFunc: any) => {
  const hasModulesKeys = Object.keys(hasModules);
  let priorityList = {};
  //hasModulesKeys中需要先遍历完lifeCycleArr，然后再处理别的参数
  const lifeCycleFirst = hasModulesKeys.filter((key) => {
    if (lifeCycleArr.includes(key)) {
      return key;
    }
  });
  lifeCycleFirst.forEach((key) => {
    let startIndex = 0;
    const moduleItem = moduleLines.find((item: any, index) => {
      if (item.text.match(new RegExp(`^\\s*${key}\\s*`))) {
        startIndex = index;
        return true;
      }
      return false;
    });
    const range = {
      startLine: moduleItem.lineNumber,
      startCharacter: 0,
      endLine: moduleItem.lineNumber + hasModules[key].length - 1,
      endCharacter:
        moduleLines[startIndex + hasModules[key].length - 1].text.length,
      trueStartIndex: startIndex,
      trueEndIndex: startIndex + hasModules[key].length - 1,
    };
    processLifeCycle(moduleLines, range, key, priorityList);
  });
  let temp: any = {
    first: [],
    second: [],
    third: [],
  };
  Object.entries(priorityList).forEach(([key, value]:any) => {
    if (["beforeCreate", "created", "beforeMount", "mounted"].includes(key)) {
      temp.first.push(...value);
    }
    if (["beforeUpdate", "updated"].includes(key)) {
      temp.second.push(...value);
    }
    if (["beforeDestroy", "destroyed"].includes(key)) {
      temp.third.push(...value);
    }
  });
  temp.first = Array.from(new Set(temp.first)).reverse();
  temp.second = Array.from(new Set(temp.second)).reverse();
  temp.third = Array.from(new Set(temp.third)).reverse();
  priorityList = temp;
  for (let i = 0; i < hasModulesKeys.length; i++) {
    const key = hasModulesKeys[i];
    if (lifeCycleArr.includes(key)) continue;
    let startIndex = 0;
    const moduleItem = moduleLines.find((item: any, index) => {
      if (item.text.match(new RegExp(`^\\s*${key}\\s*`))) {
        startIndex = index;
        return true;
      }
      return false;
    });
    const range = {
      startLine: moduleItem.lineNumber,
      startCharacter: 0,
      endLine: moduleItem.lineNumber + hasModules[key].length - 1,
      endCharacter:
        moduleLines[startIndex + hasModules[key].length - 1].text.length,
      trueStartIndex: startIndex,
      trueEndIndex: startIndex + hasModules[key].length - 1,
    };
    if (key === "data") {
      processData(moduleLines, range, renderFunc, priorityList);
    } else if (key === "methods") {
      processMethods(moduleLines, range, renderFunc, priorityList);
    }else if (key === "components") {
      processComponents(moduleLines, range, renderFunc);
    }else if (key === "filters") {
      processFilters(moduleLines, range, renderFunc);
    }
  }
};

export default patchData;
