// 将普通类转化为静态类
export const makeStaticClass = <T extends new (...args: never[]) => object>(targetClass: T) => {
  const staticClass: Record<string, unknown> = {};
  Object.getOwnPropertyNames(targetClass.prototype).forEach(method => {
    if (method !== 'constructor') {
      staticClass[method] = targetClass.prototype[method];
    }
  });
  return staticClass;
};
