const patchLastCommaForMethods = (str) => {
  /**
   * 给定一个字符串，判断是不是以逗号结尾，如果不是，就加上逗号,如果是，就不加。例如xxxx --> xxxx,
   * 但是由于str会有特殊的情况，如果是有//的，那就需要判断//之前有没有逗号，如果有，就不加，如果没有，就加。例如xxxx//yyyy --> xxxx,//yyyy
   */
  const index = str.lastIndexOf('//');
  if (index === -1) {
    return str.endsWith(',') ? str : `${str},`;
  }
  const str1 = str.substring(0, index);
  const str2 = str.substring(index);
  return str1.endsWith(',') ? `${str1}${str2}` : `${str1},${str2}`;
};
console.log(patchLastCommaForMethods('setOptions({ expectedData, actualData } = {}) {'))