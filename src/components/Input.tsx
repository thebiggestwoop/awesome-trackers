import { useEffect, useState } from "react";

// TODO: Improve light mode

export default function Input({
  value,
  updateHandler,
}: {
  value: number;
  updateHandler: (value: number) => void;
}) {
  const [content, setContent] = useState(value.toString());

  // Update value when the tracker value changes in parent
  const [valueInputUpdateFlag, setValueInputUpdateFlag] = useState(false);
  if (valueInputUpdateFlag) {
    setContent(value.toString());
    setValueInputUpdateFlag(false);
  }
  useEffect(() => setValueInputUpdateFlag(true), [value]);

  // Update value in parent
  const runUpdateHandler = (
    e:
      | React.FocusEvent<HTMLInputElement, Element>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    let newValue = parseFloat((e.target as HTMLInputElement).value);
    if (isNaN(newValue)) newValue = 0;
    updateHandler(newValue);
    setContent(newValue.toString());
  };

  return (
    <input
      className="h-[32px] w-[54px] rounded-lg bg-black/10 px-[2px] py-[1px] text-center outline-none duration-150 hover:bg-black/15 focus:bg-black/40"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onBlur={(e) => runUpdateHandler(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter") runUpdateHandler(e);
      }}
    ></input>
  );
}
