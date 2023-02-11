import { needFixVariableType, sortImportType } from "../type";
import { mergeSameImport } from "../utils/sortImport";
const sortImport = (imports: any) => {
  const lines = imports.import;
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
    temp: [],
  };
  let deep = null;
  for (let i = 0; i < lines.length; i++) {
    const { text } = lines[i];
    const arr = text.match(/({|})/g);

    let type;
    let scope;
    if (text.match(/^import/)) {
      if (arr && arr.length === 1 && arr[0] === "{") {
        chunkObj.temp.push(text);
        continue;
      }
      type = text.match(/@/) ? "share" : text.match(/~/) ? "local" : "global";
      scope = text.match(/(com|component)/i)
        ? "component"
        : text.match(/mixin/i)
        ? "mixin"
        : "lib";
      chunkObj[type][scope].push(text);
    } else if (
      text.match(/from/) &&
      arr &&
      arr.length === 1 &&
      arr[0] === "}" &&
      chunkObj.temp.length
    ) {
      chunkObj.temp.push(text);
      type = text.match(/@/) ? "share" : text.match(/~/) ? "local" : "global";
      scope = text.match(/(com|component)/i)
        ? "component"
        : text.match(/mixin/i)
        ? "mixin"
        : "lib";
      const shiftLines = [...chunkObj.temp];
      chunkObj.temp.length = 0;
      chunkObj[type][scope].push(...shiftLines);
    } else if (chunkObj.temp.length) {
      chunkObj.temp.push(text);
      continue;
    } else {
      chunkObj.other.push(text);
    }
  }

  mergeSameImport(chunkObj);
  let linesCopy: needFixVariableType[] = [];
  Object.entries(chunkObj).forEach((item) => {
    if (!Array.isArray(item[1])) {
      Object.entries(item[1]!).forEach((arr) => {
        if (Array.isArray(arr[1])) {
          arr[1].forEach((text) => {
            linesCopy.push({
              text,
              lineNumber: firstLineNumber,
            });
            firstLineNumber++;
          });
        }
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
  imports.import = linesCopy;
};

export default sortImport;
