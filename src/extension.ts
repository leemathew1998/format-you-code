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
    const res = vscode.window.activeTextEditor;
    if (!res!.document) {
      return;
    }
    if (res!.document.languageId !== "vue") {
      vscode.window.showErrorMessage("当前文件不是vue文件");
    }
    const scope = parserFile(res!.document);

    if (scope.script.import.length) {
      const temp = scope.script.import;
      // scope.script.importRange = [
      //   new vscode.Position(temp[0].lineNumber, 0),
      //   new vscode.Position(
      //     temp[temp.length - 1].lineNumber,
      //     temp[temp.length - 1].text.length
      //   ),
      // ];
      sortImport(scope.script);
    }
    // if (scope.style.length) {
    //   await sortCss(scope.style, scope.template);
    // }
    if (scope.script.module.length > 2) {
      const temp = scope.script.module;
      // scope.script.moduleRange = [
      //   new vscode.Position(temp[0].lineNumber, 0),
      //   new vscode.Position(
      //     temp[temp.length - 1].lineNumber,
      //     temp[temp.length - 1].text.length
      //   ),
      // ];
      const hasModules = sortModule(scope.script);
      patchData(scope.script.module, hasModules, scope.ast.render); //开始遍历全部module部分，对每一个小模块进行排序
    }
    //start flash
    let state1: any = [...scope.script.import, ...scope.script.module];
    let start = new vscode.Position(state1[0].lineNumber, 0);
    let end = new vscode.Position(
      state1[state1.length - 1].lineNumber,
      state1[state1.length - 1].text.length
    );
    state1 =
      state1
        .filter((i) => i.text.length)
        .map((item) => item.text)
        .join("\n") + "\n";
        
    await vscode.window.activeTextEditor!.edit((builder: TextEditorEdit) => {
      builder.delete(new vscode.Range(start, end));
      builder.insert(start, state1);
    });

    await vscode.commands.executeCommand("editor.action.formatDocument");
    // vscode.window.showInformationMessage("format-one-file");
  }
);

export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  context.subscriptions.push(formatOneFile);
}
