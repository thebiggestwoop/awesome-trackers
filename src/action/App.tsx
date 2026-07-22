import OBR from "@owlbear-rodeo/sdk";
import { useOwlbearStore } from "../useOwlbearStore.ts";
import { useOwlbearStoreSync } from "../useOwlbearStoreSync.ts";
import { Action } from "./Action.tsx";
import { useSceneSettingsStoreSync } from "../useSceneSettingsStoreSync.ts";

export default function App(): React.JSX.Element {
  useOwlbearStoreSync();
  useSceneSettingsStoreSync();

  const sceneReady = useOwlbearStore((state) => state.sceneReady);
  const mode = useOwlbearStore((state) => state.themeMode);

  if (sceneReady) {
    return <Action></Action>;
  } else {
    OBR.action.setHeight(129);
    return (
      <div
        className={
          "h-screen " + "overflow-y-auto" + (mode === "DARK" ? " dark" : "")
        }
      >
        <div className="grid grid-cols-[minmax(120px,_auto)] items-center p-4">
          <h1 className="m-0 text-lg font-bold tracking-[0px] text-text-primary dark:text-text-primary-dark">
            Initiative
          </h1>
        </div>
        <hr className="mx-4 my-0 border-text-primary dark:border-text-primary-dark/10" />
        <div className="flex w-full flex-col pt-3">
          <h2 className="justify-self-start px-4 py-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            Open a scene to use the initiative tracker.
          </h2>
        </div>
      </div>
    );
  }
}
