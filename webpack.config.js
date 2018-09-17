const path = require('path');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

const DEV = process.env.DEV;

const compilerOptions = {
  jar: 'node_modules/google-closure-compiler/compiler.jar',
  compilation_level: 'ADVANCED',
  entry_point: 'BlocklyModule',
  only_closure_dependencies: true,
  generate_exports: true,
  export_local_property_definitions: true,
  create_source_map: true,
  source_map_include_content: true,
  js: [
    'core/',
    'blocks/',
    'generators/',
    'node_modules/google-closure-library/closure',
  ],
  externs: [
    'externs.js',
    'msg/js/en_us.js',
  ],
};
if (DEV) {
  compilerOptions.formatting = 'PRETTY_PRINT';
}

module.exports = {
  name: 'blockly',
  mode: DEV ? 'development' : 'production',
  devtool: 'source-map',
  watch: !!process.env.WATCH,
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
