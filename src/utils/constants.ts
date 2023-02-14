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
  "directives",
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
  "render",
];
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
export { scopes, lifeCycleArr, IS_COMMENT, IS_EMPTY, IS_STRING };
