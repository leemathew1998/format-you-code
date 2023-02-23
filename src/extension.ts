// import * as vscode from "vscode";

const vscode = require("vscode");
import parserFile from "./parser/parserFile";
import sortImport from "./parser/sortImport";
import sortModule from "./parser/sortModule";
// import sortCss from "./parser/sortCss";
import patchData from "./patch/patchData";
import { scopes } from "./utils/constants";
import { TextEditorEdit } from "vscode";
let context_;
// 执行格式化一个vue文件
let formatOneFile = vscode.commands.registerCommand(
  "format-you-code.file",
  async () => {
    await vscode.commands.executeCommand("editor.action.formatDocument");
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor!.document) {
      return;
    }
    if (activeTextEditor!.document.languageId !== "vue") {
      vscode.window.showErrorMessage("当前文件不是vue文件");
    }
    const scope = parserFile(activeTextEditor!.document);

    if (scope.script.import.length) {
      sortImport(scope.script);
    }
    if (scope.script.module.length > 2) {
      const { returnParams, returnParamsRange } = sortModule(
        scope.script,
        context_.globalState.get("optionsOrder")
      );
      patchData(
        scope.script.module,
        returnParams,
        returnParamsRange,
        scope.ast.render
      ); //开始遍历全部module部分，对每一个小模块进行排序
    }
    // if (scope.style.length) {
    //   sortCss(scope.style, scope.template);
    // }
    //start flash
    let state1: any = [...scope.script.import, ...scope.script.module];
    let start = new vscode.Position(state1[0].lineNumber, 0);
    let end = new vscode.Position(
      state1[state1.length - 1].lineNumber,
      state1[state1.length - 1].text.length
    );
    state1 = state1
      .filter((i) => i.text.length)
      .map((item) => item.text)
      .join("\n");
    await activeTextEditor!.edit((builder: TextEditorEdit) => {
      builder.delete(new vscode.Range(start, end));
      builder.insert(start, state1);
    });
    setTimeout(async () => {
      await vscode.commands.executeCommand("editor.action.formatDocument");
    }, 200);
  }
);

let changeOptionOrder = vscode.commands.registerCommand(
  "format-you-code.optionOrder",
  async () => {
    const res = await vscode.window.showInputBox({
      title: "请输入options的顺序，以英文逗号结尾",
    });
    if (res && res.split(",")) {
      let userOptions = res.split(",");
      const rest = scopes.filter((name) => !userOptions.includes(name));
      userOptions.push(...rest);
      context_.globalState.update("optionsOrder", userOptions);
    }
  }
);

export function activate(context) {
  // The command has been defined in the package.json 
  if (!context.globalState.get("optionsOrder")) {
    context.globalState.update("optionsOrder", scopes);
  }

  context_ = context;
  context.subscriptions.push(formatOneFile);
  context.subscriptions.push(changeOptionOrder);
}
