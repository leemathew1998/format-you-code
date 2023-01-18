interface scriptTypeBase {
  import: Array<{ text: string; lineNumber: number }>;
  module: Array<{ text: string; lineNumber: number }>;
}
interface sortImportTypeBase {
  lib: Array<string>;
  mixin: Array<string>;
  component: Array<string>;
}

export interface scopeType {
  template: Array<{ text: string; lineNumber: number }>;
  ast: any;
  script: scriptTypeBase;
  style: Array<Array<{ text: string; lineNumber: number }>>;
}

export interface sortImportType {
  global: sortImportTypeBase;
  share: sortImportTypeBase;
  local: sortImportTypeBase;
  other: Array<string>;
}

export interface sortCssType {
  prop:string;
  value:string;
}