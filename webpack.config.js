const path = require('path');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

const DEV = process.env.DEV;

const compilerOptions = {
  jar: 'node_modules/google-closure-compiler/compiler.jar',
  compilation_level: DEV ? 'WHITESPACE_ONLY' : 'SIMPLE',
  entry_point: 'BlocklyModule',
  only_closure_dependencies: true,
  create_source_map: true,
  source_map_include_content: true,
  js: [
    'core/',
    'blocks/',
    'generators/',
    'node_modules/google-closure-library/closure'
  ],
};
if (DEV) {
  compilerOptions.formatting = 'PRETTY_PRINT';
}

module.exports = {
  name: 'blockly',
  mode: DEV ? 'development' : 'production',
  devtool: 'source-map',
  entry: {
    blockly: path.join(__dirname, 'core/module.js'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'blockly.js',
  },
  plugins: [
    new ClosureCompilerPlugin({ compiler: compilerOptions }),
  ],
};
