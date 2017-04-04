#!/bin/bash
if [[ $1 == "debug" ]]; then
  echo "Building blockly core in debug mode"
  echo "Outputting to build-output/blockly_uncompressed.js, build-output/javascript_uncompressed.js and build-output/blocks_uncompressed.js"

  echo -e '// Do not edit this generated file\n"use strict";\n' > build-output/blockly_uncompressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar \
  --compilation_level=WHITESPACE_ONLY \
  --entry_point Blockly \
  --formatting=PRETTY_PRINT \
  --js core/ node_modules/google-closure-library/closure/ \
  --only_closure_dependencies \
  >> build-output/blockly_uncompressed.js

  echo -e '// Do not edit this generated file\n"use strict";\n' > build-output/javascript_uncompressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar \
  --formatting=PRETTY_PRINT --flagfile generators/bld_flags.txt \
  >> build-output/javascript_uncompressed.js
  sed -i.bak -e "s/var Blockly = {Generator:{}};//g" build-output/javascript_uncompressed.js
  rm build-output/javascript_uncompressed.js.bak

  echo -e '// Do not edit this generated file\n"use strict";\n' > build-output/blocks_uncompressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar \
  --formatting=PRETTY_PRINT --flagfile blocks/bld_flags.txt \
  >> build-output/blocks_uncompressed.js
  sed -i.bak -e "s/var Blockly = {Blocks:{}};//g" build-output/blocks_uncompressed.js
  rm build-output/blocks_uncompressed.js.bak
  echo "Done building build-output/blockly_uncompressed.js, build-output/javascript_uncompressed.js and build-output/blocks_uncompressed.js"

else
  echo "Building blockly core in production mode"
  echo "Outputting to build-output/blockly_compressed.js, build-output/javascript_compressed.js and build-output/blocks_compressed.js"

  # TODO adding "use strict" to this file breaks apps tests in
  # code-dot-org. Figure out why.
  echo -e '// Do not edit this generated file\n' > build-output/blockly_compressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar \
  --entry_point Blockly \
  --js core/ node_modules/google-closure-library/closure/ \
  --only_closure_dependencies \
  --source_map_include_content \
  --create_source_map build-output/blockly_compressed.js.map \
  >> build-output/blockly_compressed.js

  echo -e '// Do not edit this generated file\n"use strict";\n' > build-output/javascript_compressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar --flagfile generators/bld_flags.txt \
  >> build-output/javascript_compressed.js
  sed -i.bak -e "s/var Blockly={Generator:{}};//g" build-output/javascript_compressed.js
  rm build-output/javascript_compressed.js.bak

  echo -e '// Do not edit this generated file\n"use strict";\n' > build-output/blocks_compressed.js
  java -jar node_modules/google-closure-compiler/compiler.jar --flagfile blocks/bld_flags.txt \
  >> build-output/blocks_compressed.js
  sed -i.bak -e "s/var Blockly={Blocks:{}};//g" build-output/blocks_compressed.js
  rm build-output/blocks_compressed.js.bak
  echo "Done building build-output/blockly_compressed.js, build-output/javascript_compressed.js and build-output/blocks_compressed.js"
fi

# Run blockly-core tests with every build
./test.sh
