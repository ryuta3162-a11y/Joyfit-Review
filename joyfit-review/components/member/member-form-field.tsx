import type { ReactNode } from "react";

import {
  memberFormErrorClass,
  memberFormHintClass,
  memberFormLabelClass,
} from "@/components/member/member-form-styles";

type Props = {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

export function MemberFormField({ label, required, hint, error, children }: Props) {
  return (
    <div>
      <p className={memberFormLabelClass}>
        {label}
        {required ? <span className="text-[color:var(--joyfit-red)]"> *</span> : null}
      </p>
      {children}
      {hint ? <p className={memberFormHintClass}>{hint}</p> : null}
      {error ? <p className={memberFormErrorClass}>{error}</p> : null}
    </div>
  );
}
