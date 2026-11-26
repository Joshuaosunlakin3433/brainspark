import type { Metadata } from "next";
import { CourseGrid } from "@/components/course/course-grid";
import { DecorativeBars } from "@/components/decorative-bars";
import { SiteHeader } from "@/components/site-header";
import { Breadcrumbs } from "@/components/ui";
import { getCourses } from "@/lib/sanity/data";

export const metadata: Metadata = {
  title: "All Courses | BrainSpark",
  description: "Browse every BrainSpark course.",
};

export default async function CoursesPage() {
  const courses = (await getCourses()).filter((c) => c.slug);

  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col bg-canvas min-[1080px]:border-x min-[1080px]:border-neutral-200">
        <SiteHeader />

        <main className="flex flex-1 flex-col">
          <section aria-labelledby="all-courses" className="px-5 pt-8 pb-10 sm:px-13 sm:pt-12">
            <Breadcrumbs
              className="text-body text-neutral-700 sm:text-[15px]"
              items={[{ label: "Home", href: "/" }, { label: "All Courses" }]}
            />
            <div className="mt-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h1
                id="all-courses"
                className="font-display text-h1 font-medium tracking-tight text-neutral-900"
              >
                All Courses
              </h1>
              <p className="text-body-lg text-neutral-700">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </p>
            </div>

            {courses.length > 0 ? (
              <div className="mt-7">
                <CourseGrid courses={courses} />
              </div>
            ) : (
              <p className="mt-7 text-body-lg text-neutral-700">No courses yet.</p>
            )}
          </section>

          <DecorativeBars className="mt-auto" />
        </main>
      </div>
    </div>
  );
}
