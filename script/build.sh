#!/usr/bin/env sh
#
# Usage: script/build.sh

set -e

[ -f script/build.sh ] || {
  printf 'Please run from the root DragonBasher directory.'
  exit 200
}

./node_modules/.bin/rollup src/server.js \
  --file dist/server.js \
  --format es \
  --sourcemap

cp -f jquery-*.js dist/
cp -rf 11-gfx/ dist/11-gfx/

if [ -d "${gfx:=11-gfx}" ]
then
 for F in CHATUP CHATDOWN
 do [ -f "$gfx/$F.gif" ]||printf 'Warning: %s.gif not found using --gfx %s.' "$F" "$gfx"
 done
else
 printf 'Warning: --gfx set to %s, but there is no directory there.\n' "$gfx"
 if [ "$gfx" = "11-gfx" ]
 then
  printf 'Warning: Attempting to automatically clone the gfx submodule.\n'
  git submodule update --init \
   && printf 'Successfully cloned the gfx submodule.\n' \
   || printf 'Warning: Failed to automatically clone the gfx submodule!\n'
 fi
fi
if [ -d "${gfx_build:=$gfx/b}" ]
then
 : check building images
else printf 'Warning: --gfx-build set to %s, but there is no directory there, yet.\n' "$gfx_build"
fi
if [ -d "${gfx_char:=$gfx/c}" ]
then
 for F in CHRHne CHRnw
 do [ -f "$gfx_char/$F.gif" ]||printf 'Warning: %s.gif not found using --gfx-char %s.' "$F" "$gfx_char"
 done
else printf 'Warning: --gfx-char set to %s, but there is no directory there, yet.\n' "$gfx_char"
fi
if [ -d "${gfx_item:=$gfx/i}" ]
then
 : check item images
else printf 'Warning: --gfx-item set to %s, but there is no directory there, yet.\n' "$gfx_item"
fi
if [ -d "${gfx_tile:=$gfx/t}" ]
then
 : check tile images
else printf 'Warning: --gfx-tile set to %s, but there is no directory there, yet.\n' "$gfx_tile"
fi
if [ -d "${gfx_keys:=$gfx/k}" ]
then
 : check key images
else printf 'Warning: --gfx-keys set to %s, but there is no directory there, yet.\n' "$gfx_keys"
fi
awk -v width="${width:-13}" -v height="${height:-7}" -v gfx="$gfx" -v DirBuild="$gfx_build" -v DirChar="$gfx_char" -v DirItem="$gfx_item" -v DirTile="$gfx_tile" -v DirKeys="$gfx_keys" -e '$1=="//[configuration];"{
 print "DirBuild=\""DirBuild"\";\nDirChar=\""DirChar"\";\nDirItem=\""DirItem"\";\nDirKeys=\""DirKeys"\";\nDirTile=\""DirTile"\";\nMapSizeX="width";\nMapSizeY="height";\n"
 next
}{ #for all other lines
 gsub(/\[htmlurl\]\/11-gfx/,gfx)
 gsub(/\[htmlurl\]/,".")
 gsub(/(<!-- done loading jQuery -->)/,"&\n<script src=./server.js></script>")
 print
}' src/client.html > dist/index.html
