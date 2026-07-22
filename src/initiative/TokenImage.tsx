import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

/** Token thumbnail with a single retry -- Owlbear's image URLs occasionally
 * fail to load on the very first attempt right after a scene loads. */
export default function TokenImage({
  src,
  outline,
}: {
  src: string;
  outline: boolean;
}): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setRetried(false);
  }, [src]);

  if (!loaded) {
    return (
      <img
        key={retried ? "retry" : "initial"}
        src={src}
        className="hidden"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!retried) setTimeout(() => setRetried(true), 1000);
        }}
      />
    );
  }

  return (
    <img
      src={src}
      className={cn(
        "max-h-11 max-w-[30px] object-scale-down",
        outline && "outline outline-2 outline-offset-1 outline-white/60",
      )}
      onError={() => setLoaded(false)}
    />
  );
}
