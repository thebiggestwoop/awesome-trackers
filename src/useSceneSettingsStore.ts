import { create } from "zustand";

interface SceneSettingsState {
  verticalOffset: number;
  trackersAboveToken: boolean;
  barHeightIsReduced: boolean;
  segmentsEnabled: boolean;
  hideLabel: boolean;
  hideEnemyTrackers: boolean;

  setVerticalOffset: (verticalOffset: number) => void;
  setTrackersAboveToken: (trackersAboveToken: boolean) => void;
  setBarHeightIsReduced: (barHeightIsReduced: boolean) => void;
  setSegmentsEnabled: (segmentsEnabled: boolean) => void;
  setHideLabel: (hideLabel: boolean) => void;
  setHideEnemyTrackers: (hideEnemyTrackers: boolean) => void;
}

export const useSceneSettingsStore = create<SceneSettingsState>()((set) => ({
  verticalOffset: 0,
  trackersAboveToken: false,
  barHeightIsReduced: false,
  segmentsEnabled: false,
  hideLabel: false,
  hideEnemyTrackers: false,

  setVerticalOffset: (verticalOffset) =>
    set((state) => ({ ...state, verticalOffset })),
  setTrackersAboveToken: (trackersAboveToken) =>
    set((state) => ({ ...state, trackersAboveToken })),
  setBarHeightIsReduced: (barHeightIsReduced) =>
    set((state) => ({ ...state, barHeightIsReduced })),
  setSegmentsEnabled: (segmentsEnabled) =>
    set((state) => ({ ...state, segmentsEnabled })),
  setHideLabel: (hideLabel) => set((state) => ({ ...state, hideLabel })),
  setHideEnemyTrackers: (hideEnemyTrackers) =>
    set((state) => ({ ...state, hideEnemyTrackers })),
}));
