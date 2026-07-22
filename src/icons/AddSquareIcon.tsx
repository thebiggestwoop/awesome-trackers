import { IconProps } from "../components/IconPropsType";

export default function AddSquareIcon(props: IconProps): React.JSX.Element {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 0 24 24"
      width="24px"
      fill="#000000"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path
        d="M19 4h-16c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h18c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2z
        M17 13h-4v4h-2v-4h-4v-2h4v-4h2v4h4v2z"
      />
    </svg>
  );
}
