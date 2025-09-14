export default function Interstitial({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold animate-pulse">{message}</h1>
      </div>
    </div>
  );
}
