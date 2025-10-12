cmake_minimum_required(VERSION 3.18)

project(Shijima-Web)

add_definitions("-fPIC -fexceptions ")
set(SHIJIMA_BUILD_EXAMPLES NO)
set(SHIMEJIFINDER_BUILD_EXAMPLES NO)
set(SHIMEJIFINDER_USE_ICONV YES)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXECUTABLE_SUFFIX ".js")

add_subdirectory(libshimejifinder)

add_subdirectory(libshijima)

set_target_properties(unarr PROPERTIES COMPILE_FLAGS "-DPpmd8_Construct=unarr_Ppmd8_Construct \
    -DPpmd8_Free=unarr_Ppmd8_Free -DPpmd8_Alloc=unarr_Ppmd8_Alloc -DPpmd8_Init=unarr_Ppmd8_Init \
    -DPpmd8_MakeEscFreq=unarr_Ppmd8_MakeEscFreq -DPpmd8_Update1=unarr_Ppmd8_Update1 \
    -DPpmd8_Update1_0=unarr_Ppmd8_Update1_0 -DPpmd8_Update2=unarr_Ppmd8_Update2 \
    -DPpmd8_DecodeSymbol=unarr_Ppmd8_DecodeSymbol")

include_directories(libshijima)
include_directories(libshimejifinder)

add_executable(Shijima-Web bindings.cc)
add_dependencies(Shijima-Web shijima shimejifinder)
target_link_libraries(Shijima-Web shijima shimejifinder embind)

set_target_properties(Shijima-Web PROPERTIES LINK_FLAGS "-s WASM=1 -s MAIN_MODULE=1 \
    -s STANDALONE_WASM -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORT_NAME=createShijima -s MODULARIZE=1 \
    -s FORCE_FILESYSTEM -s EXPORTED_RUNTIME_METHODS=[\"FS\"] -s WASMFS=1 -fPIC -fexceptions --no-entry ")
