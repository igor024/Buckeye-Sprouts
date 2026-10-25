import Image from "next/image";

export function GroupFinderMascot({ variant }: { variant: "trigger" | "welcome" | "avatar" }) {
  return <Image
    className={`finder-mascot finder-mascot-${variant}`}
    src="/brand/study-mascot.webp"
    width={392}
    height={512}
    sizes={variant === "welcome" ? "100px" : "32px"}
    alt=""
    aria-hidden="true"
  />;
}
