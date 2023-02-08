const patchLastComma__test__ = (str) => {
  //需要在每一行最后判断是不是加了逗号，如果没有加，就加上，以下是各种情况
  //1.如果是xxxxx这种，就直接加逗号
  //2.如果是xxxxx//...这种，就需要判断//之前有没有逗号
  //3.如果是http://xxx这种,就不需要加逗号,但是如果是http://xxx //...这种，就需要判断第二个//之前有没有逗号
  //开始对每种情况写正则
  const reg1 = /([^,])$/;
  const reg2 = /([^,])\/\/\.\.\./;
  const reg3 = /([^,])http:\/\//;
  const reg4 = /([^,])http:\/\/\.\.\./;
  //开始判断
  if (reg1.test(str)) {
    str = str + ",";
  }
  if (reg2.test(str)) {
    str = str.replace(reg2, "$1, //...");
  }
  if (reg3.test(str)) {
    str = str.replace(reg3, "$1http://");
  }
  if (reg4.test(str)) {
    str = str.replace(reg4, "$1http://...");
  }
  return str;
};

