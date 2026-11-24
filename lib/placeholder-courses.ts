// TEMPORARY: static stand-in for the course catalog until the Sanity
// catalog task replaces this with a server-side GROQ fetch. Keep the shape
// close to what the course query will return so the UI does not change.

export type CourseSummary = {
  slug: string;
  title: string;
  summary: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  moduleCount: number;
  icon: { src: string; alt: string };
};

export const placeholderCourses: CourseSummary[] = [
  {
    slug: "nextjs-for-production",
    title: "Next.js for Production",
    summary: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    moduleCount: 12,
    icon: { src: "/courses/nextjs.svg", alt: "Next.js" },
  },
  {
    slug: "docker-essentials",
    title: "Docker Essentials",
    summary: "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    moduleCount: 8,
    icon: { src: "/courses/docker.svg", alt: "Docker" },
  },
  {
    slug: "typescript-deep-dive",
    title: "TypeScript Deep Dive",
    summary: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    moduleCount: 10,
    icon: { src: "/courses/typescript.svg", alt: "TypeScript" },
  },
];
