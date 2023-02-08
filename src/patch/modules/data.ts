import { needFixVariableType, rangeTye, returnParams } from "../../type";
import { IS_COMMENT, IS_EMPTY, IS_STRING } from "../../utils/constants";
import { isCommentOrEmpty, patchLastCommaForData } from "../../utils/functions";
export const processData = (
  moduleLines: needFixVariableType[],
  range: rangeTye,
  renderFunc: string,
  priorityList
): Array<string> => {
  /**
   * slice data part
   * example:
   * data(){
   *   name:'111'
   * }
   */
  let needFixVariable: needFixVariableType[] = moduleLines.splice(
    range.trueStartIndex!,
    range.trueEndIndex! - range.trueStartIndex! + 1
  );
  //return a new sorted list
  const returnParams: returnParams[] = [];
  let firstLineNumber = needFixVariable[0].lineNumber;
  let currentIndex = 0; //init value
  let deep = 0;
  //start sort the data module
  let copyLines: needFixVariableType[] = [];
  let flagAlpha = false;
  let oneShort = false;
  let notEmptyData: needFixVariableType[] = [];
  for (let index = 0; index < needFixVariable.length; index++) {
    const CE = isCommentOrEmpty(needFixVariable[index]);
    if (CE !== IS_EMPTY) {
      notEmptyData.push(needFixVariable[index]);
      notEmptyData[notEmptyData.length - 1].CE = CE;
    }
  }

  for (let index = 0; index < notEmptyData.length; index++) {
    const item = notEmptyData[index];
    // debugger;
    copyLines.push({
      text: item.text,
      thisVarIndex: currentIndex,
    });
    item.textCopy = item.text.replace(/\s/g, "");
    if (item.textCopy.indexOf("data(){") !== -1) {
      copyLines[copyLines.length - 1].thisVarIndex = -1000;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === notEmptyData.length - 1
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 1000000;
      continue;
    } else if (item.textCopy.indexOf("return{") !== -1 && deep === 0) {
      copyLines[copyLines.length - 1].thisVarIndex = -1;
      deep = 1;
      flagAlpha = true;
      continue;
    } else if (
      item.textCopy.indexOf("}") !== -1 &&
      index === notEmptyData.length - 2
    ) {
      copyLines[copyLines.length - 1].thisVarIndex = 999999;
      deep--;
      continue;
    }

    const bracketStartIndex = item.text.indexOf("{");
    const bracketEndIndex = item.text.indexOf("}");
    const squareBracketStart = item.textCopy.indexOf("[");
    const squareBracketEnd = item.textCopy.indexOf("]");
    const commentIndex = item.text.indexOf("//");
    if (
      bracketStartIndex !== -1 &&
      (bracketStartIndex < commentIndex || commentIndex === -1)
    ) {
      deep++;
      oneShort = true;
    }
    if (
      bracketEndIndex !== -1 &&
      (bracketEndIndex < commentIndex || commentIndex === -1)
    ) {
      deep--;
      if (deep === 0) {
        currentIndex = 0;
      }
    }
    // for square bracket
    if (
      squareBracketStart !== -1 &&
      (squareBracketStart < commentIndex || commentIndex === -1)
    ) {
      deep++;
    }
    if (
      squareBracketEnd !== -1 &&
      (squareBracketEnd < commentIndex || commentIndex === -1)
    ) {
      deep--;
      if (deep === 0) {
        currentIndex = 0;
      }
    }
    let variableName = item.text.match(/(\w+)\s*[:|,]/);

    if (!variableName || !flagAlpha) {
      continue;
    }
    // if (!oneShort && deep > 1) {
    //   continue;
    // }
    if (deep >= 2) {
      continue;
    }
    // if (oneShort) {
    //   oneShort = false;
    // }
    if (item.CE === IS_STRING && deep <= 2) {
      // debugger;
      returnParams.push({
        name: variableName[1],
        thisVarIndex: 999999,
      });
    }
    if (deep === 1) {
      // incase this line has not "," but move to the top, will have a error
      copyLines[copyLines.length - 1].text = patchLastCommaForData(
        copyLines[copyLines.length - 1].text
      );
    }
    //If a parameter is prioritized/lagged,
    //it needs to be added at the start or end of the render string(renderFunc)
    if (priorityList.first.includes(variableName[1])) {
      //prioritized
      renderFunc = ` ${variableName[1]} ` + renderFunc;
    } else if (priorityList.third.includes(variableName[1])) {
      //anti-priority
      renderFunc += ` ${variableName[1]} `;
    }
    const reg = new RegExp(`\\b${variableName[1]}\\b`, "g");
    const isshow = renderFunc.match(reg);
    if (!isshow) {
      if (deep === 1) {
        copyLines[copyLines.length - 1].thisVarIndex = 9999;
        currentIndex = 9999;
      }
      continue;
    }
    const thisVarIndex = renderFunc.indexOf(isshow[0]);
    const alpha = returnParams.find((name) => name.name === variableName![1]);
    if (alpha) {
      alpha.thisVarIndex = thisVarIndex;
    }
    currentIndex = thisVarIndex;
    copyLines[copyLines.length - 1].thisVarIndex = thisVarIndex;
  }
  debugger;
  copyLines.sort((a, b) => {
    if (a.thisVarIndex && b.thisVarIndex) {
      return a.thisVarIndex - b.thisVarIndex;
    }
    return 0;
  });
  copyLines.forEach((item) => {
    item.lineNumber = firstLineNumber;
    firstLineNumber!++;
    if (item.thisVarIndex) {
      delete item.thisVarIndex;
    }
  });
  moduleLines.splice(range.trueStartIndex!, 0, ...copyLines);
  return returnParams
    .sort((a, b) => a?.thisVarIndex - b?.thisVarIndex)
    .map((item) => item.name);
};


<template>
  <div class="components-container">
    <el-table :data="gridData">
      <el-table-column property="date" label="Date" width="150" />
      <el-table-column property="name" label="Name" width="200" />
      <el-table-column property="address" label="Address" />
    </el-table>
    <el-button type="primary" @click="dialogTableVisible = true">
      open a Drag Dialog
    </el-button>
    <el-dialog
      v-el-drag-dialog
      :visible.sync="dialogTableVisible"
      title="Shipping address"
      @dragDialog="handleDrag"
    >
      <el-select ref="select" v-model="value" placeholder="请选择">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-dialog>
  </div>
</template>

<script>
import elDragDialog from '@/directive/el-drag-dialog'; // base on element-ui

export default {
  name: 'DragDialogDemo',
  directives: { elDragDialog },
  data() {
    return {
      dialogTableVisible: false,
      options: [{ value: '选项1', label: '黄金糕' }],
      value: '',
      gridData: [
        {
          date: '2016-05-02',
          name: 'John Smith',
          address: 'No.1518,  Jinshajiang Road, Putuo District',
        },
      ],
    };
  },
  methods: {
    handleDrag() {
      this.$refs.select.blur();
    },
    // v-el-drag-dialog onDrag callback function
  },
};
</script>
