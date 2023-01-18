import { flatHtmlNodesFunc, flatCssNodesFunc } from "../utils/functions";

let flatCssNodes = new Map<string, Array<Object>>(); //对cssAst进行扁平化处理，方便后续查找
let flatHtmlNodes = new Map<string, Array<Object>>(); //对htmlAst进行扁平化处理，方便后续查找
//设置指针，方便后续查找
let cssAstPointer = -1;
const patchAstCss = (cssAst: any, htmlTemplate: any) => {
  //此函数需要比对id和class，对于位置不对的，需要进行调整，已HTML为准
  //先对cssAst进行扁平化处理
  for (let i = 0; i < cssAst.nodes.length; i++) {
    flatCssNodesFunc(cssAst.nodes[i], flatCssNodes);
  }
  for (let i = 0; i < htmlTemplate.length; i++) {
    flatHtmlNodesFunc(htmlTemplate[i], flatHtmlNodes);
  }
  //开始循环htmlAst。一般chindren只有一个，但是Vue3中可能会有多个
  const cssKeys = Array.from(flatCssNodes.keys());
  const cssArray = Array.from(flatCssNodes.entries());
  flatHtmlNodes.forEach((type, keyWithSpace) => {
    //keyWithSpace有可能是多个，以空格分隔
    const keys = keyWithSpace.split(" ");
    keys.forEach((key) => {
      if (cssKeys.includes(key)) {
        const pointer = cssKeys.indexOf(key);
        if (cssAstPointer > pointer) {
          /***
           * 说明cssAst中的位置在htmlAst中的位置之前，需要调整
           * 你可以这么理解，如果进入了这里，那就代表:
           * pointer是现在的位置，
           * cssAstPointer代表需要调整到的位置
           */
          const cssAstNode = cssArray.splice(pointer, 1);
          cssArray.splice(cssAstPointer, 0, ...cssAstNode);
          const item = cssKeys.splice(pointer, 1);
          cssKeys.splice(cssAstPointer, 0, ...item);
        } else {
          cssAstPointer = pointer;
        }
      }
    });
  });
  flatHtmlNodes.clear();
  flatCssNodes.clear();
  let result =  ``;
  cssArray.forEach((item) => {
    const payload = {};
    item[1].forEach((propery:any) => {
      payload[propery!.prop] = propery!.value;
    });
    result += `${item[0].toString()} ${JSON.stringify(payload).replace(/"/g, "").replace(/,/g, ";")}`;
  });
  return result;
};

export default patchAstCss;
