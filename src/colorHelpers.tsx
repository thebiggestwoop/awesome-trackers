export function getBackgroundColor(colorNumber: number) {
  let color: string;
  switch (colorNumber % 9) {
    default:
    case 0:
      color = "bg-tracker-light-fuchsia  dark:bg-tracker-dark-fuchsia";
      break;
    case 1:
      color = "bg-tracker-light-pink dark:bg-tracker-dark-pink";
      break;
    case 2:
      color = "bg-tracker-light-red dark:bg-tracker-dark-red";
      break;
    case 3:
      color = "bg-tracker-light-orange dark:bg-tracker-dark-orange";
      break;
    case 4:
      color = "bg-tracker-light-yellow dark:bg-tracker-dark-yellow";
      break;
    case 5:
      color = "bg-tracker-light-lime dark:bg-tracker-dark-lime";
      break;
    case 6:
      color = "bg-tracker-light-emerald dark:bg-tracker-dark-emerald";
      break;
    case 7:
      color = "bg-tracker-light-cyan dark:bg-tracker-dark-cyan";
      break;
    case 8:
      color = "bg-tracker-light-blue dark:bg-tracker-dark-blue";
      break;
  }
  return color;
}

export function getOutlineColor(colorNumber: number) {
  let color: string;
  switch (colorNumber % 9) {
    default:
    case 0:
      color = "outline-tracker-light-fuchsia";
      break;
    case 1:
      color = "outline-tracker-light-pink";
      break;
    case 2:
      color = "outline-tracker-light-red";
      break;
    case 3:
      color = "outline-tracker-light-orange";
      break;
    case 4:
      color = "outline-tracker-light-yellow";
      break;
    case 5:
      color = "outline-tracker-light-lime";
      break;
    case 6:
      color = "outline-tracker-light-emerald";
      break;
    case 7:
      color = "outline-tracker-light-cyan";
      break;
    case 8:
      color = "outline-tracker-light-blue";
      break;
  }
  return color;
}

export function getColor(colorNumber: number | string) {
  if (typeof colorNumber === "string") return colorNumber;

  let color: string;
  switch (colorNumber % 9) {
    default:
    case 0:
      color = "#9c43b2";
      break;
    case 1:
      color = "#af2d6c";
      break;
    case 2:
      color = "#ab2022";
      break;
    case 3:
      color = "#c85217";
      break;
    case 4:
      color = "#a58421";
      break;
    case 5:
      color = "#6d9142";
      break;
    case 6:
      color = "#378873";
      break;
    case 7:
      color = "#5092a3";
      break;
    case 8:
      color = "#4064a4";
      break;
  }
  return color;
}
