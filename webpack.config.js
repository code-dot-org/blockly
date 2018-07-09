const path = require('path');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = {
  name: 'blockly',
  mode: 'development',
  devtool: 'source-map',
  entry: {
    blockly: path.join(__dirname, 'core/module.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'blockly.js',
  },
  plugins: [
    new ClosureCompilerPlugin({
      compiler: {
        jar: 'node_modules/google-closure-compiler/compiler.jar',
        compilation_level: 'SIMPLE',
        entry_point: 'BlocklyModule',
        formatting: 'PRETTY_PRINT',
        only_closure_dependencies: true,
        create_source_map: true,
        source_map_include_content: true,
        js: [
          'core/',
          'blocks/',
          'generators/',
          'node_modules/google-closure-library/closure'
        ],
      },
    }),
  ],
};
