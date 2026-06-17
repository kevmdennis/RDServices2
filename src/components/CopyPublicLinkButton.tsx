"use client";

import { useState } from "react";

type CopyPublicLinkButtonProps = {
  publicUrl: string | null | undefined;
};

export default function CopyPublicLinkButton({
  publicUrl,
}: CopyPublicLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  if (!publicUrl) {
    return null;
  }

  async function handleCopy() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-left text-xs font-medium text-emerald-700 hover:text-emerald-900"
    >
      {copied ? "Copied!" : "Copy Public Link"}
    </button>
  );
}
