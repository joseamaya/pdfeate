interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-start gap-3">
        <span className="text-error text-lg flex-shrink-0 mt-0.5">✕</span>
        <div className="min-w-0 flex-1">
          <p className="text-error text-sm font-medium">Error</p>
          <p className="text-error text-sm mt-0.5 break-words">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          className="mt-3 bg-error text-white rounded-md text-sm font-medium cursor-pointer px-4 py-1.5 transition-colors hover:bg-red-700"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
