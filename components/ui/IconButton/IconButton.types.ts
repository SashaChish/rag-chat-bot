import type { ActionIconProps } from "@mantine/core";
import type { ReactNode } from "react";

export interface IconButtonProps extends ActionIconProps {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}
