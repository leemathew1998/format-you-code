let flatCssNodes = new Map<string, Array<Object>>(); //对cssAst进行扁平化处理，方便后续查找
const patchAstCss = (cssAst: any, htmlAst: any) => {
  //此函数需要比对id和class，对于位置不对的，需要进行调整，已HTML为准
  console.log(cssAst);
  console.log("------------------");
  console.log(htmlAst);
  console.log("------------------");
  //先对cssAst进行扁平化处理
  for (let i = 0; i < cssAst.nodes.length; i++) {
    flatNodes(cssAst.nodes[i]);
  }
  //开始循环htmlAst。一般chindren只有一个，但是Vue3中可能会有多个
  for (let i = 0; i < htmlAst.children.length; i++) {
    const htmlAstChildren = htmlAst.children[i];
    if (htmlAstChildren.static) {
      //静态class,目前我们只处理这部分
      const htmlAstChildrenStaticClass = htmlAstChildren.attrsMap.class;
      const htmlAstChildrenStaticId = htmlAstChildren.attrsMap?.id;
      //开始循环cssAst,此处使用最笨的遍历操作来找出对应的class或者id
      sortCssBaseOnClassOrId(
        cssAst,
        `.${htmlAstChildrenStaticClass}`,
        `#${htmlAstChildrenStaticId}`
      );
    }
  }
  // flatCssNodes.clear()
};

const flatNodes = (cssAstNode) => {
  //第一次，给空数组
  if (!flatCssNodes.has(cssAstNode.selector)) {
    flatCssNodes.set(cssAstNode.selector, []);
  }
  if (cssAstNode.nodes.length > 0) {
    //如果有子节点，递归
    for (let j = 0; j < cssAstNode.nodes.length; j++) {
      const cssAstNodeChild = cssAstNode.nodes[j];
      if (cssAstNodeChild.type === "decl") {
        //如果是属性，直接push
        const res = flatCssNodes.get(cssAstNode.selector);
        res!.push(cssAstNodeChild);
      } else {
        //如果是节点，递归
        flatNodes(cssAstNodeChild);
      }
    }
  }
};

const sortCssBaseOnClassOrId = (
  cssAst,
  className: string,
  idName: string | null = null
) => {
  if (!flatCssNodes.has(className) && !flatCssNodes.has(idName || "")) {
    //如果在map中没有找到css中有这个class或者id，直接返回
    return;
  }
	console.log(flatCssNodes)
  if (flatCssNodes.has(className)) {
    const keys = flatCssNodes.keys();
    if (keys[0] !== className) {
      //如果第一个不是class，就需要调整
      console.log("如果第一个不是class，就需要调整");
    }
  }
  if (flatCssNodes.has(idName || "")) {
    const keys = flatCssNodes.keys();
    if (keys[0] !== idName) {
      //如果第一个不是id，就需要调整
      console.log("如果第一个不是id，就需要调整");
    }
  }
};

const walkCssNodes = (cssAstNode, className: string, idName: string) => {};

export default patchAstCss;
