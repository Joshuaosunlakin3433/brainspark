import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { LessonNotes as LessonNotesValue } from "@/sanity.types";
import { urlFor } from "@/lib/sanity/image";

type NotesImage = Extract<LessonNotesValue[number], { _type: "image" }>;

const SAFE_HREF = /^(https?:|mailto:)/i;

const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: NotesImage }) =>
      value.asset ? (
        <Image
          src={urlFor(value).width(1200).fit("max").url()}
          alt={value.alt ?? ""}
          width={1200}
          height={675}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="h-auto w-full rounded-sm"
        />
      ) : null,
  },
  marks: {
    link: ({ value, children }) => {
      const href = typeof value?.href === "string" ? value.href : "";
      if (!SAFE_HREF.test(href)) return <>{children}</>;
      const external = !href.startsWith("mailto:");
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-primary-600 hover:text-primary-500"
        >
          {children}
        </a>
      );
    },
  },
};

/** Lesson notes (Portable Text). Typography plugin handles the prose rhythm. */
export function LessonNotes({ value }: { value: LessonNotesValue }) {
  return (
    <div className="prose max-w-none text-body leading-6 text-neutral-700 prose-headings:font-display prose-headings:font-medium prose-headings:text-neutral-900 prose-h2:mb-0 prose-h2:text-lg prose-h3:mb-0 prose-h3:text-base prose-p:my-0 prose-p:leading-6 prose-ul:my-0 prose-ol:my-0 prose-li:my-1 prose-li:marker:text-primary-500 prose-code:text-neutral-900 [&>*+*]:mt-4">
      <PortableText value={value} components={components} />
    </div>
  );
}

/**
 * The lesson has no summary field, so its first plain paragraph of notes is the subtitle.
 * Returns that text and the remaining blocks for the Overview.
 */
export function splitLeadParagraph(notes: LessonNotesValue | null | undefined): {
  lead: string | null;
  rest: LessonNotesValue;
} {
  const blocks = notes ?? [];
  const first = blocks[0];
  if (first && first._type === "block" && (first.style ?? "normal") === "normal" && !first.listItem) {
    const text = (first.children ?? []).map((c) => c.text ?? "").join("").trim();
    if (text) return { lead: text, rest: blocks.slice(1) };
  }
  return { lead: null, rest: blocks };
}
