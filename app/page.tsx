import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { CourseGrid } from "@/components/course/course-grid";
import { DecorativeBars } from "@/components/decorative-bars";
import { HomeSearch } from "@/components/home-search";
import { SiteHeader } from "@/components/site-header";
import { getCourses } from "@/lib/sanity/data";

// The home design shows one row of courses; "View all courses" leads to the rest.
const HOME_COURSE_COUNT = 3;

export default async function Home() {
  const courses = (await getCourses())
    .filter((c) => c.slug)
    .slice(0, HOME_COURSE_COUNT);

  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col bg-canvas min-[1080px]:border-x min-[1080px]:border-neutral-200">
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
            <p className="mt-6 max-w-128 text-body-lg text-neutral-700 sm:text-xl sm:leading-8.5">
              BrainSpark understands what you want to learn and finds the exact lessons across all
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
            {courses.length > 0 && (
              <div className="mt-7">
                <CourseGrid courses={courses} />
              </div>
            )}

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
          <DecorativeBars className="mt-auto" />
        </main>
      </div>
    </div>
  );
}
