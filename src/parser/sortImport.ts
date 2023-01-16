const vscode = require("vscode");
import { sortImportType } from "../type";
import { mergeSameImport } from "../utils/sortImport";
const sortImport = (lines: any) => {
  const range = {
    startLine: -1,
    startCharacter: 0,
    endLine: -1,
    endCharacter: 0,
  };
  const chunkObj: sortImportType = {
    global: {
      lib: [],
      mixin: [],
      component: [],
    },
    share: {
      lib: [],
      mixin: [],
      component: [],
    },
    local: {
      lib: [],
      mixin: [],
      component: [],
    },
    other: [],
  };
  const chunk = lines.reduce((out: any, { text, lineNumber }) => {
    if (range.startLine === -1) {
      range.startLine = lineNumber;
    }
    if (range.endLine < lineNumber) {
      range.endLine = lineNumber;
      range.endCharacter = text.length;
    }

    if (text.match(/^import/)) {
      let type = text.match(/@/)
        ? "share"
        : text.match(/~/)
        ? "local"
        : "global";
      let scope = text.match(/(com|component)/i)
        ? "component"
        : text.match(/mixin/i)
        ? "mixin"
        : "lib";
      out[type][scope].push(text);
    } else {
      out.other.push(text);
    }

    return out;
  }, chunkObj);
  mergeSameImport(chunk);
  return vscode.window.activeTextEditor.edit((builder:any) => {
    builder.replace(
      new vscode.Range(
        range.startLine,
        range.startCharacter,
        range.endLine,
        range.endCharacter
      ),
      [
        ...chunk.global.lib.sort(),
        ...chunk.global.mixin.sort(),
        ...chunk.global.component.sort(),
        ...chunk.share.lib.sort(),
        ...chunk.share.mixin.sort(),
        ...chunk.share.component.sort(),
        ...chunk.local.lib.sort(),
        ...chunk.local.mixin.sort(),
        ...chunk.local.component.sort(),
        ...chunk.other,
      ].join("\n")
    );
  });
};

export default sortImport;
