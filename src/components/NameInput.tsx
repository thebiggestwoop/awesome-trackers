// import { TextField } from "@mui/material";
import PartiallyControlledInput from "./PartiallyControlledInput";

export default function NameInput({
  value,
  onUserConfirm,
}: {
  value: string;
  onUserConfirm: (target: HTMLInputElement) => void;
}): React.JSX.Element {
  return (
    <PartiallyControlledInput
      className="w-full bg-transparent text-sm text-text-primary placeholder-text-secondary outline-none duration-100 dark:text-text-primary-dark dark:placeholder-text-secondary-dark"
      placeholder="Name"
      parentValue={value}
      onUserConfirm={onUserConfirm}
    />
  );
}
