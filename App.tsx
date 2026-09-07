import { StatusBar, StyleSheet } from "react-native";
import { GameEngine } from "react-native-game-engine";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { entities } from "@entities";
import { GameLoop } from "@systems";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeView />
    </SafeAreaProvider>
  );
}

function SafeView() {
  const { top, bottom, left, right } = useSafeAreaInsets();
  const topInset = top.valueOf();
  global.topInset = topInset;
  global.bottomInset = bottom;
  global.leftInset = left;
  global.rightInset = right;

  return (
      <GameEngine
        style={styles.container}
        entities={entities()}
        systems={[GameLoop]}
      >
        <StatusBar hidden />
      </GameEngine>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
