import * as vscode from "vscode";
import {parserFile,sortImport} from "./parser/parserFile";

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
	const scope = parserFile(res!.document)
	if(scope.import.length){
		sortImport(scope.import)
	}
	console.log(scope)
	// if (scope.import.length) {
	// 	sortImport(scope.import)
	// 		.then(() => {
	// 			resolve(script)
	// 		})
	// 		.catch((e) => {
	// 			reject(e)
	// 		})
	// }
    vscode.window.showErrorMessage("format-one-file");
    // parserFile();
  }
);

export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  context.subscriptions.push(formatOneFile);
}

// This method is called when your extension is deactivated
export function deactivate() {}
