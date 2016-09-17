#!/bin/bash
if [[ $1 == "debug" ]]; then
  echo "Building blockly core in debug mode"
  echo "Outputting to build-output/blockly_uncompressed.js, build-output/javascript_uncompressed.js and build-output/blocks_uncompressed.js"
  python node_modules/google-closure-library/closure/bin/build/closurebuilder.py \
  --root=node_modules/google-closure-library/ --root=core/ \
  --compiler_jar=node_modules/google-closure-compiler/compiler.jar --compiler_flags="--compilation_level=WHITESPACE_ONLY" \
  --compiler_flags="--formatting=PRETTY_PRINT" \
  --namespace="Blockly" --output_mode=compiled \
  > build-output/blockly_uncompressed.js

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
  python node_modules/google-closure-library/closure/bin/build/closurebuilder.py \
  --root=node_modules/google-closure-library/ --root=core/ \
  --compiler_jar=node_modules/google-closure-compiler/compiler.jar --namespace="Blockly" --output_mode=compiled \
  > build-output/blockly_compressed.js

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

