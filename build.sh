#!/usr/bin/env bash

emcmake cmake -DCMAKE_BUILD_TYPE=Release -Bbuild
make -Cbuild zlibstatic -j$(nproc)
emcmake cmake -DCMAKE_BUILD_TYPE=Release -Bbuild
make -Cbuild -j$(nproc)
