export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <h2 className="font-display text-[28px] font-bold text-center mb-6">ТамБуду</h2>
        {children}
      </div>
    </div>
  );
}
