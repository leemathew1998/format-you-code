const lifeCycleArr = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
];

const IS_COMMENT = Symbol("isComment");
const IS_EMPTY = Symbol("isEmpty");
const IS_STRING = Symbol("isString");
export { lifeCycleArr, IS_COMMENT, IS_EMPTY, IS_STRING };
