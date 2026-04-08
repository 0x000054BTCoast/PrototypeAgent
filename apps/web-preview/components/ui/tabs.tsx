export function Tabs({ labels }: { labels: string[] }) {
  return (
    <div className="flex gap-2">
      {labels.map((label, idx) => (
        <button
          key={label}
          className={
            idx === 0
              ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
