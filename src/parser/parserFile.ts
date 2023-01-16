import * as vscode from "vscode";
import { scopeType } from "../type";
const parserFile = (document: any): scopeType => {
  const pointer = {
    position: 0,
    scriptModuleStart: false,
    templateModuleStart: false,
    styleModuleStart: false,
    enterScriptModule: false,
    styleModuleCount: -1,
    templateModuleCount: -1,
  };

  const scope: scopeType = {
    template: [],
    script: {
      import: [],
      module: [],
    },
    style: [],
  };
  for (
    pointer.position;
    pointer.position < document.lineCount;
    pointer.position++
  ) {
    let { text, lineNumber } = document.lineAt(pointer.position);
    //检测各种开始标签
    if (!pointer.scriptModuleStart && text.match(/<script.*>/i)) {
      pointer.scriptModuleStart = true;
      continue;
    } else if (!pointer.templateModuleStart && text.match(/<template.*>/i)) {
      pointer.templateModuleCount++;
      pointer.templateModuleStart = true;
    } else if (!pointer.styleModuleStart && text.match(/<style.*>/i)) {
      pointer.styleModuleCount++;
      pointer.styleModuleStart = true;
    }
    //检测各种结束标签
    if (pointer.scriptModuleStart && text.match(/<\/script.*>/i)) {
      pointer.scriptModuleStart = false;
      continue;
    } else if (pointer.templateModuleStart && text.match(/<\/template.*>/i)) {
      if (pointer.templateModuleCount >= 0) {
        pointer.templateModuleCount--;
      } else {
        pointer.templateModuleStart = false;
      }
    } else if (pointer.styleModuleStart && text.match(/<\/style.*>/i)) {
      pointer.styleModuleStart = false;
    }
    //对每一行进行分类
    if (pointer.templateModuleStart) {
      scope["template"].push({ text, lineNumber });
    } else if (pointer.scriptModuleStart) {
      if (text.match(/export default/i)) {
        pointer.enterScriptModule = true;
      }
      scope["script"][pointer.enterScriptModule ? "module" : "import"].push({
        text,
        lineNumber,
      });
    } else if (pointer.styleModuleStart) {
      if (scope["style"][pointer.styleModuleCount] === undefined) {
        scope["style"][pointer.styleModuleCount] = [];
      }
      scope["style"][pointer.styleModuleCount].push({ text, lineNumber });
    }
  }
  return scope;
};

export { parserFile };
