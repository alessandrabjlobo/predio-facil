import { ReactNode } from "react";

type HeaderProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function Page({ children }: { children: ReactNode }) {
  return <div className="px-6 py-5 max-w-[1200px] mx-auto space-y-6">{children}</div>;
}

Page.Header = function Header({ icon: Icon, title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        {Icon ? <Icon className="h-5 w-5 mt-0.5 text-primary" /> : null}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
};

export function PageSection({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="card-like">
      {(title || subtitle) && (
        <div className="px-4 pt-4 pb-2">
          {title ? <div className="text-sm font-medium">{title}</div> : null}
          {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
