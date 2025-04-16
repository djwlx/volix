const config = {
  // 端口号
  port: 3000,
  // 自定义请求头权限认证
  tokenHeader: 'xtoken',
  // qbitapi
  qbitApi: {
    url: 'http://qbittorrent:6801',
    username: 'admin',
    password: '123456',
  },
};
export default config;
