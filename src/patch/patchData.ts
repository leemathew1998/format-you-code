import { lifeCycleArr } from "../utils/constants";
import * as modules from "./modules";

const patchData = (
  moduleLines: any,
  hasModules: any,
  lifeCycleStart: any,
  renderFunc: any
) => {
  const hasModulesKeys = Object.keys(hasModules);
  let priorityList = {};
  //hasModulesKeys中需要先遍历完lifeCycleArr，然后再处理别的参数
  const lifeCycleFirst = hasModulesKeys.filter((key) => {
    if (lifeCycleArr.includes(key)) {
      return key;
    }
  });
  lifeCycleFirst.forEach((key) => {
    const range = {
      trueStartIndex: lifeCycleStart[key] - moduleLines[0].lineNumber,
      trueEndIndex:
        lifeCycleStart[key] -
        moduleLines[0].lineNumber +
        hasModules[key].length -
        1,
    };
    modules.processLifeCycle(moduleLines, range, key, priorityList);
  });
  let temp: any = {
    first: [],
    second: [],
    third: [],
  };
  Object.entries(priorityList).forEach(([key, value]: any) => {
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
  temp.first = Array.from(new Set(temp.first));
  temp.second = Array.from(new Set(temp.second));
  temp.third = Array.from(new Set(temp.third));
  renderFunc = ` ${temp.first.join(" ")} ` + renderFunc;
  renderFunc += ` ${temp.third.join(" ")} `;


  let dataParams: string[] = [];
  let propsParams: string[] = [];
  let computedParams: string[] = [];
  for (let i = 0; i < hasModulesKeys.length; i++) {
    const key = hasModulesKeys[i];
    if (lifeCycleArr.includes(key)) {
      continue;
    }
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
      dataParams = modules.processData(
        moduleLines,
        range,
        renderFunc,
      );
    } else if (key === "methods") {
      modules.processMethods(moduleLines, range, renderFunc);
    } else if (key === "components") {
      modules.processComponents(moduleLines, range, renderFunc);
    } else if (key === "filters") {
      modules.processFilters(moduleLines, range, renderFunc);
    } else if (key === "mixins") {
      //mixins没办法处理，目前只做了排序
    } else if (key === "props") {
      propsParams = modules.processProps(
        moduleLines,
        range,
        renderFunc,
      );
    } else if (key === "computed") {
      computedParams = modules.processComputed(
        moduleLines,
        range,
        renderFunc,
      );
    } else if (key === "watch") {
      modules.processWatch(
        moduleLines,
        range,
        dataParams,
        propsParams,
        computedParams
      );
    }
  }
};

export default patchData;

/**
 * on:{"click":handleAddRole}},
 * on:{"click":function($event){return handleEdit(scope)}}
 * ,attrs:{"data":rolesList,"border":""}},
 * "click":function($event){return handleDelete(scope)}}
 * {attrs:{"visible":dialogVisible,"titl
 * ,e":dialogType === 'edit' ? 'Edit Role' : 'New Role'},
 * on:{"update:visible":function($event){dialogVisible=$event}}}
 * {attrs:{"model":role,"lab
 */
