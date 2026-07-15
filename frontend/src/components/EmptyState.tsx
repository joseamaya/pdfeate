interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = "📄", title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}
