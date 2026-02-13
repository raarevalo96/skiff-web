type SidebarItemProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
};

export function SidebarItem({ label, selected, onClick, badge, disabled }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
        selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span>{label}</span>
      {badge && (
        <span className={`rounded-full px-2 py-0.5 text-xs ${selected ? "bg-white/20" : "bg-white"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function AuthFeature({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/40 px-3 py-3 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
