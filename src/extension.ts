import * as vscode from "vscode";
import parserFile from "./parser/parserFile";
import sortImport from "./parser/sortImport";
import sortModule from "./parser/sortModule";
import sortCss from "./parser/sortCss";

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
      await sortImport(scope.script.import);
    }
    if (scope.script.module.length > 2) {
      await sortModule(scope.script.module.slice(1, -1));
    }
    if (scope.style.length) {
      await sortCss(scope.style,scope.template);
    }
    await vscode.commands.executeCommand("editor.action.formatDocument");
    vscode.window.showInformationMessage("format-one-file");
  }
);

export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  context.subscriptions.push(formatOneFile);
}
