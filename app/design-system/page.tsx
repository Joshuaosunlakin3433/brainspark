import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Accessibility,
  BarChart3,
  Bell,
  Bookmark,
  ChevronRight,
  CirclePlay,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  LayoutGrid,
  Search,
  Target,
  User,
} from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  Button,
  CourseCard,
  Input,
  Kbd,
  LessonCard,
  Logo,
  NavLink,
  Pagination,
  ProgressBar,
  ResourceCard,
  Select,
  StatusIndicator,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Design System · BrainSpark" };

function Section({
  n,
  title,
  className,
  children,
}: {
  n: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-md border border-neutral-100 bg-white p-6 shadow-sm", className)}
    >
      <h2 className="mb-5 flex gap-4 text-small font-semibold tracking-[0.14em] uppercase">
        <span className="text-primary-500">{n}</span>
        <span className="text-neutral-900">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-small text-neutral-900">{children}</p>;
}

function SpecList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-4 text-[11px] leading-4 text-neutral-700 marker:text-neutral-500">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

const primary = [
  ["Primary 500", "#F97316", "bg-primary-500"],
  ["Primary 400", "#FB923C", "bg-primary-400"],
  ["Primary 300", "#FDBA74", "bg-primary-300"],
  ["Primary 200", "#FED7AA", "bg-primary-200"],
  ["Primary 100", "#FFEEE5", "bg-primary-100"],
];

const neutral = [
  ["Neutral 900", "#0F172A", "bg-neutral-900"],
  ["Neutral 700", "#334155", "bg-neutral-700"],
  ["Neutral 500", "#64748B", "bg-neutral-500"],
  ["Neutral 300", "#CBD5E1", "bg-neutral-300"],
  ["Neutral 200", "#E2E8F0", "bg-neutral-200"],
  ["Neutral 100", "#F1F5F9", "bg-neutral-100"],
  ["Neutral 50", "#FAFAFC", "bg-neutral-50 border border-neutral-200"],
  ["White", "#FFFFFF", "bg-white border border-neutral-200"],
];

const typeScale = [
  ["Display 1", "font-display font-bold", "Playfair Display", "48 / 56", "Bold", "Page titles"],
  ["Display 2", "font-display font-bold", "Playfair Display", "36 / 44", "Bold", "Section titles"],
  ["Heading 1", "font-semibold", "Inter", "28 / 36", "Semi Bold", "Card titles"],
  ["Heading 2", "font-semibold", "Inter", "22 / 30", "Semi Bold", "Sub section"],
  ["Heading 3", "font-medium", "Inter", "18 / 26", "Medium", "Small titles"],
  ["Body Large", "", "Inter", "16 / 24", "Regular", "Body copy"],
  ["Body", "", "Inter", "14 / 20", "Regular", "Supporting text"],
  ["Small", "", "Inter", "12 / 16", "Regular", "Captions, meta"],
];

const spacing = [
  [4, "0.25rem", "size-1"],
  [8, "0.5rem", "size-2"],
  [12, "0.75rem", "size-3"],
  [16, "1rem", "size-4"],
  [24, "1.5rem", "size-6"],
  [32, "2rem", "size-8"],
  [40, "2.5rem", "size-10"],
  [48, "3rem", "size-12"],
  [64, "4rem", "size-16"],
] as const;

const radii = [
  ["4px", "(xs)", "rounded-xs"],
  ["8px", "(sm)", "rounded-sm"],
  ["12px", "(md)", "rounded-md"],
  ["16px", "(lg)", "rounded-lg"],
  ["24px", "(xl)", "rounded-xl"],
  ["Full", "(circle)", "rounded-full"],
];

const shadows = [
  ["Sm", "0 1px 2px 0", "rgba(15, 23, 42, 0.05)", "shadow-sm"],
  ["Md", "0 4px 12px -2px", "rgba(15, 23, 42, 0.08)", "shadow-md"],
  ["Lg", "0 12px 24px -4px", "rgba(15, 23, 42, 0.10)", "shadow-lg"],
  ["Xl", "0 20px 40px -8px", "rgba(15, 23, 42, 0.12)", "shadow-xl"],
];

const icons = [Bell, Search, CirclePlay, FileText, Bookmark, BarChart3, Clock, User, ChevronRight];

const buttonStates = [
  ["Default", ""],
  ["Hover", "hover"],
  ["Disabled", "disabled"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-[1024px] space-y-3 bg-neutral-50 p-3 sm:p-4">
      {/* Header + 01 Colors */}
      <div className="grid gap-3 rounded-md border border-neutral-100 bg-white shadow-sm lg:grid-cols-[300px_1fr]">
        <div className="p-6 lg:border-r lg:border-neutral-100">
          <Logo size="lg" />
          <h1 className="mt-8 font-display text-[40px] leading-[48px] font-bold text-neutral-900">
            Design System
          </h1>
          <p className="mt-5 text-[13px] leading-[22px] text-neutral-700">
            A unified design language for BrainSpark learning platform. Clean, modern and focused on
            clarity, consistency and intuitive learning experiences.
          </p>
          <p className="mt-8 text-[10px] tracking-[0.12em] text-neutral-700 uppercase">
            Version 1.0 <span className="mx-2">•</span> May 2025
          </p>
        </div>
        <div className="p-6">
          <h2 className="mb-5 flex gap-4 text-small font-semibold tracking-[0.14em] uppercase">
            <span className="text-primary-500">01</span>
            <span>Colors</span>
          </h2>
          <Label>Primary</Label>
          <div className="flex flex-wrap gap-6">
            {primary.map(([name, hex, cls]) => (
              <div key={name} className="text-[10px] leading-4 text-neutral-700">
                <div className={cn("mb-2 h-11 w-[74px] rounded-xs", cls)} />
                {name}
                <br />
                {hex}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Label>Neutral</Label>
          </div>
          <div className="flex flex-wrap gap-5">
            {neutral.map(([name, hex, cls]) => (
              <div key={name} className="text-[10px] leading-4 text-neutral-700">
                <div className={cn("mb-2 h-9 w-[56px] rounded-xs", cls)} />
                {name}
                <br />
                {hex}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 02 Typography + 03 Type scale */}
      <div className="grid gap-3 lg:grid-cols-[416px_1fr]">
        <Section n="02" title="Typography">
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-14">
              <span className="w-16 font-display text-[52px] leading-none">Ag</span>
              <div>
                <p className="font-display text-h3">Playfair Display</p>
                <p className="mt-2 text-small text-neutral-700">
                  Elegant <Dot /> Readable <Dot /> Timeless
                </p>
              </div>
            </div>
            <div className="flex items-center gap-14">
              <span className="w-16 text-[48px] leading-none font-medium">Ag</span>
              <div>
                <p className="text-h3">Inter</p>
                <p className="mt-2 text-small text-neutral-700">
                  Clean <Dot /> Modern <Dot /> Highly legible
                </p>
              </div>
            </div>
          </div>
        </Section>
        <Section n="03" title="Type scale">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[10px] leading-4 text-neutral-700">
              <thead>
                <tr className="text-neutral-900">
                  {["Style", "Font", "Size / Line Height", "Weight", "Use"].map((h) => (
                    <th key={h} className="pb-3 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typeScale.map(([style, cls, font, size, weight, use]) => (
                  <tr key={style}>
                    <td className={cn("py-0.5 text-neutral-900", cls, "text-[12px] leading-5")}>
                      {style}
                    </td>
                    <td>{font}</td>
                    <td>{size}</td>
                    <td>{weight}</td>
                    <td>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* 04 Spacing + 05 Radius & shadows */}
      <div className="grid gap-3 lg:grid-cols-[1fr_456px]">
        <Section n="04" title="Spacing system">
          <p className="-mt-2 mb-6 text-small text-neutral-900">Base unit: 4px</p>
          <div className="flex flex-wrap items-end justify-between gap-y-6">
            {spacing.map(([px, rem, cls]) => (
              <div key={px} className="flex w-12 flex-col items-center gap-3">
                <div className="flex h-16 items-end">
                  <div className={cn("rounded-[2px] bg-primary-100", cls)} />
                </div>
                <p className="text-center text-[10px] leading-4 text-neutral-700">
                  <span className="text-small text-neutral-900">{px}</span>
                  <br />({rem})
                </p>
              </div>
            ))}
          </div>
        </Section>
        <Section n="05" title="Radius & shadows">
          <Label>Radius</Label>
          <div className="flex flex-wrap justify-between gap-y-4">
            {radii.map(([v, n, cls]) => (
              <div key={v} className="flex flex-col items-center gap-2 text-[10px] leading-4">
                <div className={cn("size-9 border border-neutral-200", cls)} />
                <p className="text-center text-neutral-700">
                  {v}
                  <br />
                  {n}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Label>Shadows</Label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shadows.map(([name, offset, rgba, cls]) => (
              <div key={name} className={cn("rounded-sm bg-white p-3", cls)}>
                <p className="text-small text-neutral-900">{name}</p>
                <p className="mt-2 text-[8px] leading-3 text-neutral-700">
                  {offset}
                  <br />
                  {rgba}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* 06 Icons, 07 Buttons, 08 Inputs */}
      <div className="grid gap-3 lg:grid-cols-[300px_1fr_230px]">
        <Section n="06" title="Icons">
          <Label>Outline Style</Label>
          <div className="flex flex-wrap gap-4 text-neutral-900">
            {icons.map((Icon, i) => (
              <Icon key={i} className="size-4" aria-hidden="true" />
            ))}
          </div>
          <div className="mt-6">
            <Label>Filled Style</Label>
          </div>
          <div className="flex flex-wrap gap-4 text-neutral-900">
            {icons.map((Icon, i) => (
              <Icon
                key={i}
                className="size-4 fill-current [&>*:not(:first-child)]:stroke-white"
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="mt-8">
            <Label>Icon Specs</Label>
            <SpecList
              items={[
                "24x24px grid",
                "2px stroke width (outline)",
                "Rounded line caps",
                "Consistent optical balance",
              ]}
            />
          </div>
        </Section>
        <Section n="07" title="Buttons">
          <div className="overflow-x-auto">
            <div className="grid min-w-[440px] grid-cols-[56px_repeat(4,1fr)] items-center gap-x-3 gap-y-3 text-[10px] text-neutral-900">
              <span />
              {["Primary", "Secondary", "Tertiary", "Text"].map((h) => (
                <span key={h}>{h}</span>
              ))}
              {buttonStates.map(([label, state]) => (
                <ButtonRow key={label} label={label} state={state} />
              ))}
            </div>
          </div>
          <div className="mt-6">
            <Label>Button Specs</Label>
            <SpecList
              items={[
                "Height: 44px (default)",
                "Padding: 0 16px (lg), 0 12px (md)",
                "Radius: 12px",
                "Font: Inter Medium (14–16px)",
              ]}
            />
          </div>
        </Section>
        <Section n="08" title="Inputs">
          <Label>Search / Text Input</Label>
          <label className="sr-only" htmlFor="ds-search">
            Search
          </label>
          <Input
            id="ds-search"
            type="search"
            placeholder="Search anything..."
            leadingIcon={<Search />}
            trailing={<Kbd>⌘ K</Kbd>}
          />
          <div className="mt-5">
            <Label>Select</Label>
          </div>
          <label className="sr-only" htmlFor="ds-sort">
            Sort
          </label>
          <Select id="ds-sort" defaultValue="relevant">
            <option value="relevant">Most Relevant</option>
            <option value="newest">Newest</option>
          </Select>
          <div className="mt-5">
            <Label>Field Specs</Label>
            <SpecList
              items={[
                "Height: 44px",
                "Radius: 12px",
                "Border: 1px solid #E2E8F0",
                "Padding: 0 16px",
                "Focus: Border color #FB923C",
              ]}
            />
          </div>
        </Section>
      </div>

      {/* 09 Badges, 10 Status, 11 Progress */}
      <div className="grid gap-3 lg:grid-cols-[300px_1fr_340px]">
        <Section n="09" title="Badges / Tags">
          <div className="flex flex-wrap justify-between gap-4 text-small text-neutral-900">
            <div className="space-y-3">
              <p>Video</p>
              <Badge variant="video">Video</Badge>
            </div>
            <div className="space-y-3">
              <p>Lesson</p>
              <Badge variant="lesson">Lesson</Badge>
            </div>
            <div className="space-y-3">
              <p>Popular</p>
              <Badge variant="popular">Popular</Badge>
            </div>
          </div>
        </Section>
        <Section n="10" title="Status / Indicators">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <StatusIndicator status="in-progress" />
            <StatusIndicator status="completed" />
            <StatusIndicator status="now-playing" />
            <StatusIndicator status="locked" />
          </div>
        </Section>
        <Section n="11" title="Progress bar">
          <ProgressBar value={35} label="Course progress" />
        </Section>
      </div>

      {/* 12 Cards */}
      <Section n="12" title="Cards">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-[10px] text-neutral-700">Course Card</p>
            <CourseCard
              href="#"
              icon={<span className="text-h2 font-semibold">N</span>}
              title="Next.js for Production"
              summary="Build scalable, high-performance web applications with Next.js."
              level="Intermediate"
              duration="18h 24m"
              moduleCount={12}
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] text-neutral-700">Lesson Card (Video)</p>
            <LessonCard
              kind="video"
              href="#"
              title="Data Fetching in Server Components"
              description="Learn how to fetch data on the server using async/await and Next.js best practices."
              lessonLabel="Lesson 5.1"
              timestamp="12:45"
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] text-neutral-700">Lesson Card (Lesson)</p>
            <LessonCard
              kind="lesson"
              href="#"
              title="Data Fetching & Caching"
              description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
              moduleLabel="Module 5"
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] text-neutral-700">Resource Card</p>
            <ResourceCard
              href="https://nextjs.org/docs/app/getting-started/caching"
              title="Caching and Revalidation Guide"
              description="Deep dive into Next.js caching strategies."
              fileType="PDF"
              size="1.2 MB"
            />
          </div>
        </div>
      </Section>

      {/* 13 Navigation */}
      <Section n="13" title="Navigation">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-14">
            <Logo />
            <div className="flex gap-10">
              <NavLink href="#" active>
                Courses
              </NavLink>
              <NavLink href="#">My Learning</NavLink>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[10px] text-neutral-700">Breadcrumbs</p>
            <Breadcrumbs
              items={[
                { label: "All Courses", href: "#" },
                { label: "Next.js for Production", href: "#" },
                { label: "Data Fetching & Caching" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-[10px] text-neutral-700">Pagination</p>
            <Pagination currentPage={1} totalPages={8} hrefForPage={(p) => `?page=${p}`} />
          </div>
        </div>
      </Section>

      {/* 14 Principles */}
      <section className="grid gap-6 rounded-md border border-neutral-100 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-[120px_repeat(4,1fr)] lg:items-center">
        <h2 className="flex gap-4 text-small font-semibold tracking-[0.14em] uppercase">
          <span className="text-primary-500">14</span>
          <span>Principles</span>
        </h2>
        <Principle icon={<Eye />} title="Clarity First" body="Every element should communicate clearly." />
        <Principle
          icon={<LayoutGrid />}
          title="Consistency"
          body="Use components and patterns consistently across the platform."
        />
        <Principle
          icon={<Target />}
          title="Focus & Calm"
          body="Remove noise and help learners focus on what matters."
        />
        <Principle
          icon={<Accessibility />}
          title="Accessible"
          body="Design with accessibility and inclusivity in mind."
        />
      </section>
    </main>
  );
}

function Dot() {
  return <span className="mx-1.5 text-primary-500">•</span>;
}

function ButtonRow({ label, state }: { label: string; state: "" | "hover" | "disabled" }) {
  const disabled = state === "disabled";
  // Hover row previews the hover style statically.
  const hover = state === "hover";
  return (
    <>
      <span>{label}</span>
      <Button
        size="md"
        disabled={disabled}
        className={cn("h-7! text-[10px]!", hover && "bg-primary-600!")}
      >
        Get Started
      </Button>
      <Button
        size="md"
        variant="secondary"
        disabled={disabled}
        className={cn("h-7! text-[10px]!", hover && "bg-primary-100!")}
      >
        Explore Courses
      </Button>
      <Button
        size="md"
        variant="tertiary"
        disabled={disabled}
        className={cn("h-7! text-[10px]!", hover && "bg-neutral-50!")}
        trailingIcon={<ExternalLink className="size-3" aria-hidden="true" />}
      >
        View Lesson
      </Button>
      <Button
        variant="text"
        disabled={disabled}
        className={cn("justify-start text-[10px]!", hover && "text-primary-600!")}
        trailingIcon={<CirclePlay className="size-3" aria-hidden="true" />}
      >
        Watch Video
      </Button>
    </>
  );
}

function Principle({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex text-neutral-700 [&_svg]:size-7 [&_svg]:stroke-[1.5]">{icon}</span>
      <div className="text-[10px] leading-4">
        <p className="font-medium text-neutral-900">{title}</p>
        <p className="text-neutral-700">{body}</p>
      </div>
    </div>
  );
}
