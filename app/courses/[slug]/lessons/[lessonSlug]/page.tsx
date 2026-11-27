import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChartNoAxesColumnIncreasing, CircleCheck, Clock, Lightbulb, Users } from "lucide-react";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { BookmarkButton } from "@/components/course/bookmark-button";
import { LessonNotes, splitLeadParagraph } from "@/components/lesson/lesson-notes";
import { LessonPager, type PagerLesson } from "@/components/lesson/lesson-pager";
import { LessonResourceCard } from "@/components/lesson/lesson-resource-card";
import { LessonSidebar, type SidebarModule } from "@/components/lesson/lesson-sidebar";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { LessonVideo, LessonVideoSkeleton } from "@/components/lesson/lesson-video";
import { SiteHeader } from "@/components/site-header";
import { Badge, Breadcrumbs } from "@/components/ui";
import { capitalize, formatDuration } from "@/lib/format";
import { getLessonBySlug, getLessonSlugs } from "@/lib/sanity/data";
import { urlFor } from "@/lib/sanity/image";

type Props = PageProps<"/courses/[slug]/lessons/[lessonSlug]">;

export async function generateStaticParams() {
  const lessons = await getLessonSlugs();
  return lessons.flatMap((l) =>
    l.slug && l.courseSlug ? [{ slug: l.courseSlug, lessonSlug: l.slug }] : [],
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const lesson = await getLessonBySlug(lessonSlug);
  if (!lesson || lesson.course?.slug !== slug) return {};
  const { lead } = splitLeadParagraph(lesson.notes);
  return {
    title: `${lesson.title} | ${lesson.course.title} | BrainSpark`,
    description: lead ?? undefined,
  };
}

// The frame and header render instantly; the lesson streams in, and only the
// video reads searchParams (?t=), inside its own boundary.
export default function LessonPage({ params, searchParams }: Props) {
  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col bg-canvas min-[1080px]:border-x min-[1080px]:border-neutral-200">
        <SiteHeader />
        <Suspense fallback={<LessonSkeleton />}>
          <LessonDetail params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LessonDetail({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { slug, lessonSlug } = await params;
  const lesson = await getLessonBySlug(lessonSlug);
  const course = lesson?.course;
  if (!lesson || !course || course.slug !== slug) notFound();

  const courseHref = `/courses/${course.slug}`;
  const lessonHref = (s: string | null) => (s ? `${courseHref}/lessons/${s}` : null);

  // Module and lesson numbers come from array order (AGENTS.md §8).
  const courseModules = (course.modules ?? []).map((module) => ({
    ...module,
    lessons: (module.lessons ?? []).filter((l) => l !== null),
  }));
  const flat = courseModules.flatMap((module, m) =>
    module.lessons.map((l, i) => ({ ...l, moduleIndex: m, label: `${m + 1}.${i + 1}` })),
  );
  const index = flat.findIndex((l) => l._id === lesson._id);
  const here = flat[index];
  const currentModule = here?.moduleIndex ?? 0;
  const moduleTitle = courseModules[currentModule]?.title;

  const toPager = (l: (typeof flat)[number] | undefined): PagerLesson | null => {
    const href = l ? lessonHref(l.slug) : null;
    return l && href ? { href, title: l.title, duration: formatDuration(l.duration) } : null;
  };

  const sidebarModules: SidebarModule[] = courseModules.map((module) => ({
    key: module._key,
    title: module.title,
    duration: formatDuration(module.lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0)),
    lessons: module.lessons.map((l) => ({
      key: l._id,
      title: l.title,
      href: lessonHref(l.slug),
      duration: formatDuration(l.duration),
      current: l._id === lesson._id,
    })),
  }));

  const { lead, rest } = splitLeadParagraph(lesson.notes);
  const keyPoints = lesson.keyPoints ?? [];
  const resources = lesson.resources ?? [];

  const content = (
    <div className="px-0 sm:px-4.5">
      {rest.length > 0 && (
        <section aria-labelledby="overview" className="border-b border-neutral-200 py-8">
          <h2 id="overview" className="font-display text-xl font-medium text-neutral-900">
            Overview
          </h2>
          <div className="mt-4 max-w-130">
            <LessonNotes value={rest} />
          </div>
        </section>
      )}

      {keyPoints.length > 0 && (
        <section aria-labelledby="key-points" className="pt-8">
          <h2 id="key-points" className="text-body font-medium text-neutral-900">
            In this lesson you will:
          </h2>
          <ul className="mt-5 space-y-3.5">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-4 text-body text-neutral-700">
                <CircleCheck
                  className="size-4.5 shrink-0 text-primary-500"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.proTip && (
        <aside
          aria-label="Pro tip"
          className="mt-8 flex gap-4 rounded-sm border border-primary-100 bg-primary-100/40 px-4 py-5 sm:px-5"
        >
          <Lightbulb className="size-5 shrink-0 text-primary-500" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="font-display text-body-lg text-neutral-900">Pro Tip</p>
            <p className="mt-2.5 text-small leading-5 text-neutral-700 sm:text-[13px]">
              {lesson.proTip}
            </p>
          </div>
        </aside>
      )}

      {resources.length > 0 && (
        <section aria-labelledby="resources" className="mt-6 border-t border-neutral-200 pt-6">
          <h2 id="resources" className="font-display text-body-lg font-medium text-neutral-900">
            Resources
          </h2>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <li key={r._key}>
                <LessonResourceCard
                  type={r.type}
                  title={r.title}
                  description={r.description}
                  url={r.url}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  return (
    <>
      <TrackOnMount
        event="lesson_viewed"
        props={{ lessonSlug: lesson.slug, courseSlug: course.slug }}
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <LessonSidebar
          courseHref={courseHref}
          courseTitle={course.title}
          courseIcon={
            course.icon?.asset
              ? {
                  src: urlFor(course.icon).width(112).height(112).fit("crop").url(),
                  alt: course.icon.alt ?? "",
                }
              : null
          }
          modules={sidebarModules}
          currentModule={currentModule}
        />

        <main className="min-w-0 flex-1 px-5 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-8.5">
          <Breadcrumbs
            className="gap-x-3.5 text-small text-neutral-700"
            items={[
              { label: "All Courses", href: "/courses" },
              { label: course.title, href: courseHref },
              ...(moduleTitle ? [{ label: moduleTitle }] : []),
              { label: lesson.title },
            ]}
          />

          <header className="mt-10">
            {here && (
              <Badge variant="video" className="px-1.5 text-[9.5px] tracking-[0.12em]">
                Lesson {here.label}
              </Badge>
            )}
            <div className="mt-5 flex items-start justify-between gap-6">
              <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-neutral-900 sm:text-[2.75rem] sm:leading-[1.15]">
                {lesson.title}
              </h1>
              <BookmarkButton iconOnly className="shrink-0" />
            </div>
            {lead && (
              <p className="mt-4 max-w-130 text-body-lg leading-7 text-neutral-700 sm:leading-7.5">
                {lead}
              </p>
            )}
            <ul className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-small text-neutral-700 [&_svg]:size-4.5 [&_svg]:shrink-0">
              <li className="flex items-center gap-2.5">
                <Clock strokeWidth={1.5} aria-hidden="true" />
                {formatDuration(lesson.duration)}
              </li>
              {course.level && (
                <li className="flex items-center gap-2.5">
                  <ChartNoAxesColumnIncreasing strokeWidth={1.5} aria-hidden="true" />
                  {capitalize(course.level)}
                </li>
              )}
              {typeof lesson.studentCount === "number" && (
                <li className="flex items-center gap-2.5">
                  <Users strokeWidth={1.5} aria-hidden="true" />
                  {lesson.studentCount.toLocaleString("en-US")} students
                </li>
              )}
            </ul>
          </header>

          <div className="mt-7">
            <Suspense fallback={<LessonVideoSkeleton />}>
              <LessonVideo videoUrl={lesson.videoUrl} title={lesson.title} searchParams={searchParams} />
            </Suspense>
          </div>

          <div className="mt-10">
            <LessonTabs content={content} />
          </div>
        </main>
      </div>

      <LessonPager prev={toPager(flat[index - 1])} next={toPager(flat[index + 1])} />
    </>
  );
}

function LessonSkeleton() {
  const block = "animate-pulse rounded-sm bg-neutral-200/70";
  return (
    <div aria-busy="true" className="flex flex-1 flex-col lg:flex-row">
      <span className="sr-only">Loading lesson</span>
      <div className="hidden border-x border-neutral-200 lg:ml-4 lg:block lg:w-75 lg:shrink-0 lg:px-6 lg:pt-8.5">
        <div className={`${block} h-4 w-32`} />
        <div className={`${block} mt-7 h-14 w-full`} />
        <div className={`${block} mt-8 h-96 w-full`} />
      </div>
      <div className="flex-1 px-5 pt-6 sm:px-6 lg:px-10 lg:pt-8.5">
        <div className={`${block} h-4 w-80 max-w-full`} />
        <div className={`${block} mt-10 h-5 w-20`} />
        <div className={`${block} mt-5 h-12 w-3/4`} />
        <div className={`${block} mt-4 h-14 w-full max-w-130`} />
        <div className={`${block} mt-7 aspect-video w-full rounded-md`} />
      </div>
    </div>
  );
}
