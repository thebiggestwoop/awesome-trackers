import { useOwlbearStore } from "../useOwlbearStore";
import { useOwlbearStoreSync } from "../useOwlbearStoreSync";
import { useSceneSettingsStoreSync } from "../useSceneSettingsStoreSync";
import { SceneSettings } from "./SceneSettings";

export default function App(): React.JSX.Element {
  useOwlbearStoreSync();
  useSceneSettingsStoreSync();

  const sceneReady = useOwlbearStore((state) => state.sceneReady);

  if (!sceneReady) return <></>;

  return <SceneSettings />;
}
