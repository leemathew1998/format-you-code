import * as vscode from "vscode";
import parserFile from "./parser/parserFile";
import sortImport from "./parser/sortImport";
import sortModule from "./parser/sortModule";
import sortCss from "./parser/sortCss";
import patchData from "./patch/patchData";
import { TextEditorEdit } from "vscode";

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
      const { returnParams, returnParamsRange } = sortModule(scope.script);
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
    // console.log(state1)
    await activeTextEditor!.edit((builder: TextEditorEdit) => {
      builder.delete(new vscode.Range(start, end));
      builder.insert(start, state1);
    });
    setTimeout(async () => {
      await vscode.commands.executeCommand("editor.action.formatDocument");
      //重置选中行到第一行state1[0].lineNumber,0的地方
      // await activeTextEditor!.selection = new vscode.Selection(
      //   new vscode.Position(state1[0].lineNumber, 0),
      //   new vscode.Position(state1[0].lineNumber, 0)
      // );
    }, 200);

    // vscode.window.showInformationMessage("format-one-file");
  }
);

export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  context.subscriptions.push(formatOneFile);
}
