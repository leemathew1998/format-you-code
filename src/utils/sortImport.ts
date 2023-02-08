import { sortImportType } from "../type";

const mergeSameImport = (imports: sortImportType) => {
  const keys = Object.keys(imports);
  keys.forEach((key) => {
    let type = imports[String(key)];
    if (!Array.isArray(type)) {
      Object.keys(type).forEach((item) => {
        type[item] = reduceLines(type[item]) || [];
      });
    } else {
      type = reduceLines(type) || [];
    }
  });
};

const reduceLines = (lines: Array<string>) => {
  if (lines.length === 0) {
    return;
  }
  /***
   * import { mapGetters } from "vuex";
   * import { mapState } from "vuex";
   * will be transform to
   * import { mapState, mapGetters } from "vuex";
   */
  const reg = /import\s+{(.*)}\s+from\s+["|'](.*)["|']/g;
  let match: string[] = [];
  let unmatch: string[] = [];
  //区分能够合并和不能合并的import
  lines.forEach((item: string) => {
    const result = item.match(reg);
    if (result) {
      match.push(item);
    } else {
      unmatch.push(item);
    }
  });
  //匹配相同的import
  const reg2 = /["|'](.*)["|']/g;
  const match2Map = new Map();
  match.forEach((item) => {
    const result = item.match(reg2);
    if (result?.length) {
      const key = result[0];
      if (match2Map.has(key)) {
        const value = match2Map.get(key);
        value?.push(item);
      } else {
        match2Map.set(key, [item]);
      }
    }
  });
  //合并相同的import
  const finial: string[] = [];
  match2Map.forEach((value, key) => {
    let map: string[] = [];
    if (value.length > 1) {
      let result = `import { `;
      const reg3 = /{(.*)}/g;

      //匹配文字
      value.forEach((item: any) => {
        const result2 = item.match(reg3);
        const str = result2[0]
          .replaceAll(/[{|}|,]/g, ",")
          .split(",")
          .map((item: string) => {
            return item.trim();
          })
          .filter((item: string) => item !== "");
        map.push(...str);
      });
      //去重
      map = Array.from(new Set(map));
      result += `${map.join(", ")} `;
      result += `} from ${key}`;
      finial.push(result);
    } else {
      finial.push(value[0]);
    }
  });
  finial.push(...unmatch);
  return finial;
};

export { mergeSameImport };
