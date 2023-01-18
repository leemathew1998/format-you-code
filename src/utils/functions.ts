const flatCssNodesFunc = (cssAstNode, flatCssNodes) => {
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
        flatCssNodesFunc(cssAstNodeChild, flatCssNodes);
      }
    }
  }
};

const flatHtmlNodesFunc = (item, flatHtmlNodes) => {
  //以非贪婪模式匹配class和id，class会有多个，id只有一个,注意要检测是不是动态的class或者id，动态的会以:开头
  //如果检测到是:class或者v-bind:class，就不进行匹配
  const classReg = /(?<![:|v\-bind:])class=["|']([^"]*)["|']/g;
  const idReg = /(?<![:|v\-bind:])id=["|']([^"]*)["|']/g;
  const classResult = item.text.match(classReg);
  const idResult = item.text.match(idReg);
  if (classResult) {
    classResult.forEach((oneMatch) => {
      //示例：class="container",需要去掉class="和"
      oneMatch = oneMatch.replace(/class=["|']/g, "").replace(/["|']/g, "").split(" ").map(i=>`.${i}`).join(" ");
      flatHtmlNodes.set(oneMatch, ".");
    });
  }
  if (idResult) {
    idResult.forEach((oneMatch) => {
      //示例：id="container",需要去掉id="和"
      oneMatch = oneMatch.replace(/id=["|']/g, "").replace(/["|']/g, "").split(" ").map(i=>`#${i}`).join(" ");
      flatHtmlNodes.set(oneMatch, "#");
    });
  }
};

export { flatCssNodesFunc, flatHtmlNodesFunc };

/**
 * 
 * 
 * 
 * 
 .container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .header {
    width: 100%;
    height: 50px;
    background-color: #f00;
    display: flex;
    justify-content: center;
    align-items: center;
    #title {
      color: #fff;
      font-size: 20px;
    }
  }
  .main {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .def {
      width: 100%;
      height: 50%;
      background-color: #0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      #def {
        color: #fff;
        font-size: 20px;
      }
    }
    .mark {
      width: 100%;
      height: 50%;
      background-color: #00f;
      display: flex;
      justify-content: center;
      align-items: center;
      #mark {
        color: #fff;
        font-size: 20px;
      }
    }
  }
  .footer {
    width: 100%;
    height: 50px;
    background-color: #f0f;
    display: flex;
    justify-content: center;
    align-items: center;
    #footer {
      color: #fff;
      font-size: 20px;
    }
  }
}
 * 
 * 
 * 
 */
