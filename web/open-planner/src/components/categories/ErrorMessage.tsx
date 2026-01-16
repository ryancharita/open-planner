interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mb-6 p-4 glass border border-red-500/50 rounded-xl bg-red-500/10 animate-fadeIn">
      <p className="text-red-300 font-semibold">⚠ {message}</p>
    </div>
  )
}
