interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="glass border border-red-500/50 bg-red-500/10 rounded-xl p-4 mb-6">
      <p className="text-red-300 text-sm">{message}</p>
    </div>
  )
}
