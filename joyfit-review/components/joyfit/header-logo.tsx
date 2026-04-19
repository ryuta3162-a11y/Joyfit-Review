import Image from "next/image";

type Props = {
  /** ヘッダー内の余白に合わせて調整 */
  className?: string;
};

export function JoyfitHeaderLogo({ className }: Props) {
  return (
    <div className={`relative z-[1] flex justify-center ${className ?? ""}`}>
      <Image
        src="/joyfit-logo.png"
        alt="JOYFIT24"
        width={360}
        height={90}
        priority
        className="h-9 w-auto max-w-[min(100%,300px)] object-contain object-center drop-shadow-sm md:h-10"
      />
    </div>
  );
}
