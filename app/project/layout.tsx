export default function ProjectLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">
            {children}
        </div>
    );
}
