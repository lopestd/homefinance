#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export JAVA_HOME="$ROOT_DIR/.jdk/jdk-17.0.19+10"
export ANDROID_HOME="$ROOT_DIR/.android-sdk"
export ANDROID_SDK_ROOT="$ROOT_DIR/.android-sdk"
export PATH="$JAVA_HOME/bin:$PATH"
export GRADLE_USER_HOME="$ROOT_DIR/.gradle-home"

cd "$ROOT_DIR"
./gradlew :app:testDebugUnitTest
