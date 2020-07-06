const webpackConfig = require("quip-apps-webpack-config");

const appPath = "/Users/sschepis/Development/allclouddevelopment/quip/salesforce-integration-project/",
      libPath = `${appPath}$lib/syncfusion`;

webpackConfig.module.loaders.push = {
  test: /\.tsx?$/,
  use: 'ts-loader',
  exclude: /node_modules/,
};

webpackConfig.resolve.extensions = ['.tsx', '.ts', '.js' , '.jsx' ],

module.exports = webpackConfig;
