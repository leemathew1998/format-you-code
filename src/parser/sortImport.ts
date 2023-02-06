import { needFixVariableType, sortImportType } from "../type";
import { mergeSameImport } from "../utils/sortImport";
const sortImport = (imports: any) => {
  const lines = imports.import
  let firstLineNumber = lines[0].lineNumber;
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
  let linesCopy: needFixVariableType[] = [];
  Object.entries(chunk).forEach((item) => {
    if (!Array.isArray(item[1])) {
      Object.entries(item[1]!).forEach((arr) => {
        arr[1].forEach((text) => {
          linesCopy.push({
            text,
            lineNumber: firstLineNumber,
          });
          firstLineNumber++;
        });
      });
    } else {
      item[1].forEach((text) => {
        linesCopy.push({
          text,
          lineNumber: firstLineNumber,
        });
        firstLineNumber++;
      });
    }
  });
  imports.import = linesCopy
};

export default sortImport;
