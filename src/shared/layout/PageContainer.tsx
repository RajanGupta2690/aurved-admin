import type { ReactNode } from 'react';

/** Standard padding and width for new pages. Old pages bring their own padding. */
export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6 lg:p-8">{children}</div>;
}
