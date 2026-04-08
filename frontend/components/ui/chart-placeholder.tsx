export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 flex h-40 items-end gap-2">
        {[30, 60, 45, 80, 55, 70].map((value, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-blue-500" style={{ height: `${value}%` }} />
        ))}
      </div>
    </div>
  );
}
