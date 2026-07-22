import { useState } from "react";
import { useOwlbearStore } from "../useOwlbearStore.ts";
import "../index.css";
import IconButton from "../components/IconButton.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId.ts";
import { Tooltip } from "@mui/material";
import { Tracker } from "../trackerHelpersBasic.ts";
import EditOffIcon from "../icons/EditOffIcon.tsx";
import EditIcon from "../icons/EditIcon.tsx";
import { useTrackerStore } from "../useTrackerStore.ts";
import { useTrackersHidden } from "../useTrackersHidden.ts";
import AddTrackerButton from "../components/AddTrackerButton.tsx";
import TrackerCard from "./TrackerCard.tsx";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";

export default function Editor({
  trackers,
  autofillTrackers,
  title,
}: {
  trackers: Tracker[];
  autofillTrackers: Tracker[];
  title: string;
}): React.JSX.Element {
  const role = useOwlbearStore((state) => state.role);
  const mode = useOwlbearStore((state) => state.themeMode);

  const overWriteTrackers = useTrackerStore((state) => state.overWriteTrackers);

  const [editing, setEditing] = useState(false);

  const trackersHidden = useTrackersHidden();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (trackersHidden.value === true && role === "PLAYER") {
    OBR.popover.close(getPluginId("editor"));
  }

  return (
    <div className={`${mode === "DARK" ? "dark" : ""} over h-screen`}>
      <div className="flex h-full flex-col bg-default dark:bg-default-dark">
        <div className="w-full  bg-paper p-1 pb-0.5 shadow dark:bg-paper-dark/55">
          <div className="text  text-center text-xs font-semibold text-text-secondary dark:text-text-secondary-dark">
            {title}
          </div>
          <div className="grid grid-cols-3">
            <div></div>
            <div className="flex justify-self-center">
              <AddTrackerButton />
            </div>
            <div className="justify-self-end">
              <Tooltip title={"Toggle Edit Mode"} placement="bottom-end">
                <div className="rounded-full">
                  <IconButton
                    Icon={editing ? EditOffIcon : EditIcon}
                    onClick={() => setEditing(!editing)}
                  />
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="h-full overflow-y-auto overflow-x-clip">
          {trackers.length !== 0 ? (
            <div className="grid w-full grid-cols-1 gap-x-2 gap-y-2 px-2 py-3 md:grid-cols-2 lg:grid-cols-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToFirstScrollableAncestor]}
                onDragEnd={(event) => {
                  const { active, over } = event;

                  if (over && active.id !== over.id) {
                    const oldIndex = trackers.findIndex(
                      (tracker) => tracker.id === active.id,
                    );
                    const newIndex = trackers.findIndex(
                      (tracker) => tracker.id === over.id,
                    );

                    overWriteTrackers(arrayMove(trackers, oldIndex, newIndex));
                  }
                }}
              >
                <SortableContext
                  items={trackers.map((tracker) => tracker.id)}
                  strategy={rectSortingStrategy}
                >
                  {trackers.map((tracker) => (
                    <TrackerCard
                      editing={editing}
                      key={tracker.id}
                      tracker={tracker}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          ) : autofillTrackers.length !== 0 ? (
            <div className="flex justify-center">
              <button
                className="mt-3 rounded-lg border-none bg-paper/90 p-[6px] text-center text-text-primary no-underline shadow hover:bg-paper/55 dark:bg-paper-dark/70 dark:text-text-primary-dark dark:hover:bg-paper-dark/50"
                onClick={() => overWriteTrackers(autofillTrackers)}
              >
                Use scene trackers
              </button>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border-none p-[6px] text-center text-text-secondary no-underline dark:text-text-secondary-dark">
              Scene trackers not set
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
