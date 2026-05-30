import Image from "next/image";

/** FIT365 公式マスコット（透過PNG・トリミング済み） */
export const FIT365_MASCOT_WIDTH = 1024;
export const FIT365_MASCOT_HEIGHT = 344;

type Props = {
  className?: string;
  priority?: boolean;
};

export function Fit365Mascot({ className, priority = false }: Props) {
  return (
    <Image
      src="/fit365-bears.png"
      alt="FIT365 公式マスコット ベアクマ"
      width={FIT365_MASCOT_WIDTH}
      height={FIT365_MASCOT_HEIGHT}
      priority={priority}
      className={className}
    />
  );
}
