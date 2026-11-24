import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { HomeSearch } from "@/components/home-search";
import { SiteHeader } from "@/components/site-header";
import { CourseCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import { placeholderCourses } from "@/lib/placeholder-courses";

// Decorative bar clusters at the bottom of the page: [width px, height px, strength].
const leftBars: [number, number, "soft" | "mid" | "strong"][] = [
  [72, 90, "soft"],
  [60, 130, "mid"],
  [40, 152, "mid"],
  [58, 190, "strong"],
  [90, 132, "mid"],
  [50, 96, "soft"],
];
const rightBars: [number, number, "soft" | "mid" | "strong"][] = [
  [28, 60, "soft"],
  [86, 92, "mid"],
  [78, 114, "mid"],
  [50, 150, "strong"],
  [62, 186, "strong"],
  [50, 94, "mid"],
  [38, 132, "mid"],
  [98, 170, "strong"],
];

const barTone = {
  soft: "from-primary-300/60",
  mid: "from-primary-300/85",
  strong: "from-primary-400/90",
};

function BarCluster({
  bars,
  className,
}: {
  bars: typeof leftBars;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end", className)}>
      {bars.map(([w, h, tone], i) => (
        <div
          key={i}
          className={cn("bg-linear-to-t to-primary-100/0", barTone[tone])}
          style={{ width: w, height: h }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-241 flex-1 flex-col bg-canvas min-[964px]:border-x min-[964px]:border-neutral-200">
        <SiteHeader />

        <main className="flex flex-1 flex-col">
          {/* Hero */}
          <section className="flex flex-col items-center border-b border-neutral-200 px-5 pt-12 pb-12 text-center sm:px-10 sm:pt-17 sm:pb-14">
            <p className="rounded-sm border border-primary-200 bg-primary-100 px-3.5 py-2.5 text-small font-semibold tracking-[0.2em] text-primary-600 uppercase">
              Intelligent Learning
            </p>
            <h1 className="mt-8 font-display text-4xl leading-[1.15] font-medium tracking-tight text-neutral-900 sm:text-[4.125rem] sm:leading-18">
              Search your learning
              <br />
              in plain English.
            </h1>
            <p className="mt-6 max-w-114 text-body-lg text-neutral-700 sm:text-xl sm:leading-8.5">
              Vertex understands what you want to learn and finds the exact lessons across all
              your courses.
            </p>
            <Link
              href="/courses"
              className="mt-9 inline-flex h-15 items-center gap-4 rounded-sm bg-primary-500 px-6 text-lg font-medium text-white shadow-md transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
            >
              Explore Courses
              <ArrowRight className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <div className="mt-11 w-full max-w-186.5">
              <HomeSearch />
            </div>
          </section>

          {/* All Courses */}
          <section aria-labelledby="all-courses" className="px-5 pt-14 pb-10 sm:px-13">
            <div className="flex items-end justify-between gap-4">
              <h2
                id="all-courses"
                className="font-display text-h1 font-medium tracking-tight text-neutral-900"
              >
                All Courses
              </h2>
              <Link
                href="/courses"
                className="flex items-center gap-2.5 text-body-lg text-primary-500 transition-colors hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-400"
              >
                View all courses
                <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-7 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
              {placeholderCourses.map((course) => (
                <li key={course.slug} className="min-h-93">
                  <CourseCard
                    layout="stacked"
                    href={`/courses/${course.slug}`}
                    icon={
                      <Image
                        src={course.icon.src}
                        alt={course.icon.alt}
                        width={72}
                        height={72}
                        className="size-18 object-contain"
                      />
                    }
                    title={course.title}
                    summary={course.summary}
                    level={course.level}
                    duration={course.duration}
                    moduleCount={course.moduleCount}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-16 flex items-center gap-4 sm:gap-8">
              <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
              <p className="flex items-center gap-3 text-center text-body text-neutral-700 sm:gap-5 sm:text-lg">
                <Star
                  className="size-5.5 shrink-0 text-primary-500"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                New courses and lessons added every week.
              </p>
              <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
            </div>
          </section>

          {/* Decorative bars */}
          <div
            aria-hidden="true"
            className="pointer-events-none mt-auto flex h-48 items-end justify-between overflow-hidden"
          >
            <BarCluster bars={leftBars} className="max-sm:scale-x-50 max-sm:origin-left" />
            <BarCluster bars={rightBars} className="max-sm:scale-x-50 max-sm:origin-right" />
          </div>
        </main>
      </div>
    </div>
  );
}
