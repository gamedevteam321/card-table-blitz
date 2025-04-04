
import * as React from "react"
import { useScreenSize } from "./use-screen-size"

export function useIsMobile() {
  const { isMobile } = useScreenSize();
  return isMobile;
}
