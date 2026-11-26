import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, ChartNoAxesColumnIncreasing, Clock, File, Users } from "lucide-react";
import { BookmarkButton } from "@/components/course/bookmark-button";
import { CourseModules, type CourseModuleItem } from "@/components/course/course-modules";
import { CourseProgressBar } from "@/components/course/course-progress-bar";
import { OutcomeIcon } from "@/components/course/outcome-icon";
import { DecorativeBars } from "@/components/decorative-bars";
import { SiteHeader } from "@/components/site-header";
import { Badge, Breadcrumbs } from "@/components/ui";
import { capitalize, formatCount, formatDuration } from "@/lib/format";
import { getCourseBySlug, getCourseSlugs } from "@/lib/sanity/data";
import { urlFor } from "@/lib/sanity/image";

export async function generateStaticParams() {
  const courses = await getCourseSlugs();
  return courses.flatMap((c) => (c.slug ? [{ slug: c.slug }] : []));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: `${course.title} | BrainSpark`,
    description: course.summary ?? undefined,
  };
}

// The frame and header render instantly; everything that reads the URL streams in.
export default function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col bg-canvas min-[1080px]:border-x min-[1080px]:border-neutral-200">
        <SiteHeader />
        <Suspense fallback={<CourseSkeleton />}>
          <CourseDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function CourseDetail({ params }: { params: PageProps<"/courses/[slug]">["params"] }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const courseSlug = course.slug ?? slug;
  const lessonHref = (lessonSlug: string | null) =>
    lessonSlug ? `/courses/${courseSlug}/lessons/${lessonSlug}` : null;

  // Module and lesson numbers come from array order (AGENTS.md §8).
  const modules: CourseModuleItem[] = (course.modules ?? []).map((module, m) => {
    const lessons = (module.lessons ?? []).filter((l) => l !== null);
    return {
      key: module._key,
      title: module.title ?? "Untitled module",
      summary: module.summary,
      duration: formatDuration(lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0)),
      lessons: lessons.map((lesson, l) => ({
        key: lesson._id,
        label: `${m + 1}.${l + 1}`,
        title: lesson.title ?? "Untitled lesson",
        href: lessonHref(lesson.slug),
        duration: formatDuration(lesson.duration),
        freePreview: Boolean(lesson.freePreview),
      })),
    };
  });

  // No progress records yet: "continue" starts at the first lesson.
  const continueHref = modules.flatMap((m) => m.lessons).find((l) => l.href)?.href ?? null;
  const moduleCount = course.moduleCount ?? modules.length;
  const totalDuration = formatDuration(course.durationSeconds);
  const outcomes = course.learningOutcomes ?? [];

  return (
        <main className="relative flex flex-1 flex-col">
          <div className="px-5 pt-8 sm:px-6 sm:pt-12">
            <Breadcrumbs
              className="text-body text-neutral-700 sm:text-[15px]"
              items={[{ label: "All Courses", href: "/courses" }, { label: course.title ?? "" }]}
            />

            {/* Hero */}
            <section className="mt-8 flex flex-col gap-8 sm:mt-13 md:flex-row md:gap-17">
              <div className="relative aspect-square w-full max-w-60 shrink-0 self-start md:w-81 md:max-w-none">
                {course.icon?.asset ? (
                  <Image
                    src={urlFor(course.icon).width(648).height(648).fit("crop").url()}
                    alt={course.icon.alt ?? ""}
                    fill
                    priority
                    sizes="(min-width: 768px) 324px, 240px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                {course.popular && (
                  <Badge variant="popular" className="px-3 py-1.5 text-small tracking-[0.15em]">
                    Popular
                  </Badge>
                )}
                <h1 className="mt-5 font-display text-4xl leading-[1.15] font-medium tracking-tight text-neutral-900 sm:text-[3.5rem] sm:leading-17">
                  {course.title}
                </h1>
                {course.summary && (
                  <p className="mt-5 max-w-115 text-body-lg text-neutral-700 sm:text-xl sm:leading-9">
                    {course.summary}
                  </p>
                )}
                <ul className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-3 text-body text-neutral-700 [&_svg]:size-5 [&_svg]:shrink-0">
                  {course.level && (
                    <li className="flex items-center gap-2.5">
                      <ChartNoAxesColumnIncreasing strokeWidth={1.5} aria-hidden="true" />
                      {capitalize(course.level)}
                    </li>
                  )}
                  <li className="flex items-center gap-2.5">
                    <Clock strokeWidth={1.5} aria-hidden="true" />
                    {totalDuration}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <File strokeWidth={1.5} aria-hidden="true" />
                    {moduleCount} {moduleCount === 1 ? "module" : "modules"}
                  </li>
                  {typeof course.studentCount === "number" && (
                    <li className="flex items-center gap-2.5">
                      <Users strokeWidth={1.5} aria-hidden="true" />
                      {formatCount(course.studentCount)} students
                    </li>
                  )}
                </ul>
                <div className="mt-9 flex flex-wrap gap-5">
                  {continueHref && (
                    <Link
                      href={continueHref}
                      className="inline-flex h-15 items-center gap-5 rounded-sm bg-primary-500 px-6.5 text-body-lg font-medium text-white shadow-md transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
                    >
                      Continue Learning
                      <ArrowRight className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  )}
                  <BookmarkButton className="h-15" />
                </div>
              </div>
            </section>

            {/* What you'll learn */}
            {outcomes.length > 0 && (
              <section
                aria-labelledby="what-youll-learn"
                className="mt-12 rounded-md border border-neutral-200 bg-canvas px-4 pt-7 pb-6 sm:mt-14 sm:px-8 sm:pt-9"
              >
                <h2
                  id="what-youll-learn"
                  className="font-display text-2xl font-medium text-neutral-900"
                >
                  What you&rsquo;ll learn
                </h2>
                <ul className="mt-6 grid gap-5 md:grid-cols-2 md:gap-7">
                  {outcomes.map((outcome) => (
                    <li
                      key={outcome._key}
                      className="flex gap-6 rounded-md border border-neutral-200 bg-white px-6 py-7 sm:gap-10 sm:px-8 sm:py-9"
                    >
                      <OutcomeIcon name={outcome.icon} className="size-12 shrink-0 sm:size-14" />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl text-neutral-900">{outcome.title}</h3>
                        {outcome.description && (
                          <p className="mt-2.5 text-body leading-7 text-neutral-700 sm:text-base sm:leading-7">
                            {outcome.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Course content */}
            <section aria-labelledby="course-content" className="mt-12 sm:mt-11">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <h2
                  id="course-content"
                  className="font-display text-2xl font-medium text-neutral-900"
                >
                  Course Content
                </h2>
                <p className="flex items-center gap-3 text-body text-neutral-700">
                  {moduleCount} {moduleCount === 1 ? "module" : "modules"}
                  <span aria-hidden="true" className="size-1 rounded-full bg-neutral-700" />
                  {totalDuration}
                </p>
              </div>
              <div className="mt-6">
                <CourseModules modules={modules} />
              </div>
            </section>
          </div>

          {/* Progress bar sticks to the viewport bottom and rests over the decorative bars. */}
          <DecorativeBars className="absolute inset-x-0 bottom-0" />
          <div className="pointer-events-none sticky bottom-0 z-10 mt-auto flex min-h-28 items-end px-5 pt-16 pb-4 sm:px-6 sm:pb-6">
            <CourseProgressBar percent={0} continueHref={continueHref} />
          </div>
        </main>
  );
}

function CourseSkeleton() {
  const block = "animate-pulse rounded-sm bg-neutral-200/70";
  return (
    <main aria-busy="true" className="flex flex-1 flex-col px-5 pt-8 sm:px-6 sm:pt-12">
      <span className="sr-only">Loading course</span>
      <div className={`${block} h-4 w-56`} />
      <div className="mt-8 flex flex-col gap-8 sm:mt-13 md:flex-row md:gap-17">
        <div className={`${block} aspect-square w-full max-w-60 shrink-0 self-start rounded-md md:w-81 md:max-w-none`} />
        <div className="flex-1">
          <div className={`${block} h-7 w-24`} />
          <div className={`${block} mt-5 h-14 w-4/5`} />
          <div className={`${block} mt-5 h-20 w-full max-w-115`} />
          <div className={`${block} mt-7 h-5 w-3/4`} />
          <div className={`${block} mt-9 h-15 w-80`} />
        </div>
      </div>
      <div className={`${block} mt-12 h-96 rounded-md sm:mt-14`} />
    </main>
  );
}
