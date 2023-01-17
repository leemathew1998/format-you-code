let postcss = require("postcss");
let cssnano = require("cssnano");
const vscode = require("vscode");
import { TextEditorEdit } from "vscode";

const sortCss = async (cssModules, ast) => {
  //style标签不止一个，需要循环处理
  for (let i = 0; i < cssModules.length; i++) {
    if (cssModules[i].length > 0) {
      const range = {
        startLine: cssModules[i][0].lineNumber,
        startCharacter: 0,
        endLine: cssModules[i][cssModules[i].length - 1].lineNumber,
        endCharacter: cssModules[i][cssModules[i].length - 1].text.length,
      };
      const cssText = cssModules[i].map((item) => item.text).join("\n");
      const result = await postcss(cssnano).process(cssText, {
        from: undefined,
        to: undefined,
      });
      const result2 = await postcss.parse(cssText).toResult();
    //   console.log(template);

      return vscode.window.activeTextEditor.edit((builder: TextEditorEdit) => {
        // let start = new vscode.Position(range.startLine, range.startCharacter);
        // let end = new vscode.Position(range.endLine, range.endCharacter);
        // builder.delete(new vscode.Range(start, end));
        // builder.insert(
        //   new vscode.Position(range.startLine, range.startCharacter),
        //   result.css
        // );
      });
    }
  }
};

export default sortCss;
