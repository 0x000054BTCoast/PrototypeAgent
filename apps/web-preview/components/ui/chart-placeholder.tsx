export function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-sm">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex h-40 items-end gap-sm">
        {[28, 62, 46, 80, 58, 70].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-accent-from to-accent-to"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
