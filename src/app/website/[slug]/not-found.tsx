import { notFound } from "next/navigation";

type WebsiteNotFoundProps = {
  title?: string;
  message?: string;
};

export default function WebsiteNotFound({
  title = "Website not found",
  message = "This business website is unavailable or has not been published yet.",
}: WebsiteNotFoundProps) {
  return (
    <main className="flex min-h-full items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-4 text-zinc-600">{message}</p>
      </div>
    </main>
  );
}
