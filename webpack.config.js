/* global require, process, __dirname */
var path = require('path');
var ClosureCompilerPlugin = require('webpack-closure-compiler');

var DEV = process.env.DEV;

var compilerOptions = {
  jar: 'node_modules/google-closure-compiler/compiler.jar',
  compilation_level: 'SIMPLE',
  entry_point: 'BlocklyModule',
  only_closure_dependencies: true,
  create_source_map: true,
  source_map_include_content: true,
  js: [
    'core/',
    'blocks/',
    'generators/',
    'node_modules/google-closure-library/closure'
  ]
};
if (DEV) {
  compilerOptions.formatting = 'PRETTY_PRINT';
}

module.exports = {
  name: 'blockly',
  mode: DEV ? 'development' : 'production',
  devtool: 'source-map',
  entry: {
    blockly: path.join(__dirname, 'core/module.js')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'blockly.js'
  },
  plugins: [new ClosureCompilerPlugin({compiler: compilerOptions})]
};
