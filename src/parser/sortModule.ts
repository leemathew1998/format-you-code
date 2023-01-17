import { TextEditorEdit } from "vscode";

const vscode = require("vscode");
const sortModule = (lines) => {
  const range = {
    startLine: -1,
    startCharacter: 0,
    endLine: -1,
    endCharacter: 0,
  };
  const scopes = [
    "el",
    "name",
    "components",
    "filters",
    "mixins",
    "layout",
    "middleware",
    "validate",
    "model",
    "props",
    "fetch",
    "data",
    "setup",
    "head",
    "computed",
    "watch",
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeDestroy",
    "methods",
    "fetchOnServer",
  ];

  const chunk = lines.reduce(
    (out, { text, lineNumber }, index) => {
      if (index === 0) {
        range.startLine = lineNumber;
        out.space = text.match(/^(\s+|)/)[0].length;
      }
      if (range.endLine < lineNumber) {
        range.endLine = lineNumber;
        range.endCharacter = text.length;
      }
      let match = text.match(
        new RegExp(
          "^(\\s{" + out.space + "})(async\\s+|)(\\w+)((\\s+|)(:|\\())"
        )
      );
      if (match) {
        out.scope = match[3];
      }
      if (out.scope) {
        if (scopes.indexOf(out.scope) === -1) {
          scopes.push(out.scope);
        }
        if (!out.keep.hasOwnProperty(out.scope)) {
          out.keep[out.scope] = [];
        }
        out.keep[out.scope].push(text);
      }

      return out;
    },
    {
      space: 0,
      scope: null,
      keep: {},
    }
  ).keep;
  if (chunk.hasOwnProperty("components")) {
    if (chunk.components.length > 2) {
      chunk.components = [
        chunk.components[0],
        ...chunk.components.slice(1, -1).sort(),
        chunk.components[chunk.components.length - 1],
      ];
    }
  }

  if (chunk.hasOwnProperty("mixins")) {
    if (chunk.mixins.length > 2) {
      chunk.mixins = [
        chunk.mixins[0],
        ...chunk.mixins.slice(1, -1).sort(),
        chunk.mixins[chunk.mixins.length - 1],
      ];
    } else if (chunk.mixins.length == 1) {
      const match = chunk.mixins[0].match(/^(.*\[)(.*)(\].*,)$/);
      if (match) {
        const sort = match[2]
          .split(",")
          .map((e) => e.trim())
          .sort()
          .join(", ");
        chunk.mixins = [match[1] + sort + match[3]];
      }
    }
  }

  const res = scopes
    .reduce((out: string[], scope) => {
      if (chunk.hasOwnProperty(scope)) {
        out.push(...chunk[scope]);
      }
      return out;
    }, [])
    .join("\n");
  return vscode.window.activeTextEditor.edit((builder: TextEditorEdit) => {
    //先进行删除，然后在进行添加
    let start = new vscode.Position(range.startLine, range.startCharacter);
    let end = new vscode.Position(range.endLine, range.endCharacter);
    builder.replace(new vscode.Range(start, end), res);
  });
};

export default sortModule;
