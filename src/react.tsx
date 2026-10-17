import type { CSSProperties, ImgHTMLAttributes } from "react";
import {
  createAvatarDataUri,
  type AvatarOptions,
  type AvatarSeed,
} from "./index.js";

export type CrewAvatarProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "children" | "dangerouslySetInnerHTML" | "width" | "height"
> & {
  seed: AvatarSeed;
  options?: AvatarOptions;
  size?: number;
};

/** Decorative by default; pass alt for a meaningful identity label. SSR-safe. */
export function CrewAvatar({
  seed,
  options,
  size = 40,
  alt = "",
  style,
  ...props
}: CrewAvatarProps) {
  const dimensions: CSSProperties = {
    display: "inline-block",
    verticalAlign: "middle",
    borderRadius: "50%",
    flexShrink: 0,
    ...style,
  };
  return (
    <img
      {...props}
      src={createAvatarDataUri(seed, options)}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      style={dimensions}
    />
  );
}
