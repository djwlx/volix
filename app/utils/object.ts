// 将普通类转化为静态类
export const makeStaticClass = targetClass => {
  const staticClass = class {};
  Object.getOwnPropertyNames(targetClass.prototype).forEach(method => {
    if (method !== 'constructor') {
      staticClass[method] = targetClass.prototype[method];
    }
  });
  return staticClass;
};
