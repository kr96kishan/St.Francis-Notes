export type Topic = { id: string; title: string; content: string };
export type Chapter = { id: string; title: string; topics: Topic[] };
export type Subject = { id: string; title: string; code: string; chapters: Chapter[] };
export type Semester = { id: string; number: number; title: string; subjects: Subject[] };

const mkChapters = (subjectSlug: string, titles: [string, string]): Chapter[] =>
  titles.map((t, i) => ({
    id: `${subjectSlug}-ch${i + 1}`,
    title: t,
    topics: [
      {
        id: `${subjectSlug}-ch${i + 1}-t1`,
        title: `Introduction to ${t}`,
        content: `This section introduces the foundational concepts of ${t}. Students will explore core definitions, historical context, and the practical relevance of these ideas within modern computer science curriculum.`,
      },
      {
        id: `${subjectSlug}-ch${i + 1}-t2`,
        title: `Advanced Concepts in ${t}`,
        content: `Building on the fundamentals, this topic dives deeper into ${t}, covering advanced techniques, real-world examples, and problem-solving strategies aligned with the university syllabus.`,
      },
    ],
  }));

const subjectDefs: Record<number, Array<{ title: string; code: string; chapters: [string, string] }>> = {
  1: [
    { title: "Discrete Structure", code: "BCA101", chapters: ["Set Theory & Logic", "Graph Theory"] },
    { title: "Problem Solving Techniques (C)", code: "BCA102", chapters: ["C Fundamentals", "Pointers & Structures"] },
    { title: "Data Structures", code: "BCA103", chapters: ["Linear Structures", "Trees & Graphs"] },
  ],
  2: [
    { title: "Computer Architecture", code: "BCA201", chapters: ["CPU Organization", "Memory Hierarchy"] },
    { title: "Object Oriented Programming using Java", code: "BCA202", chapters: ["Classes & Objects", "Inheritance & Polymorphism"] },
    { title: "DBMS", code: "BCA203", chapters: ["Relational Model", "SQL Queries"] },
  ],
  3: [
    { title: "Operating Systems", code: "BCA301", chapters: ["Process Management", "Memory & File Systems"] },
    { title: "Computer Networks", code: "BCA302", chapters: ["OSI & TCP/IP Models", "Routing & Protocols"] },
    { title: "Python Programming", code: "BCA303", chapters: ["Python Basics", "OOP & Libraries"] },
  ],
  4: [
    { title: "Software Engineering", code: "BCA401", chapters: ["SDLC Models", "Testing & Quality"] },
    { title: "Design and Analysis of Algorithms", code: "BCA402", chapters: ["Divide & Conquer", "Dynamic Programming"] },
    { title: "Internet Technologies", code: "BCA403", chapters: ["HTML & CSS Foundations", "Client-Server Architecture"] },
  ],
  5: [
    { title: "Web Programming", code: "BCA501", chapters: ["JavaScript Essentials", "React & Modern Frameworks"] },
    { title: "Data Analytics", code: "BCA502", chapters: ["Data Wrangling", "Visualization & Insights"] },
    { title: "Cyber Security", code: "BCA503", chapters: ["Threats & Vulnerabilities", "Cryptography Basics"] },
  ],
  6: [
    { title: "Theory of Computation", code: "BCA601", chapters: ["Finite Automata", "Turing Machines"] },
    { title: "Machine Learning", code: "BCA602", chapters: ["Supervised Learning", "Neural Networks"] },
    { title: "Mobile App Development", code: "BCA603", chapters: ["Android Fundamentals", "Cross-Platform with React Native"] },
  ],
};

const romans = ["I", "II", "III", "IV", "V", "VI"];

export const syllabus: Semester[] = Array.from({ length: 6 }, (_, i) => {
  const num = i + 1;
  return {
    id: `sem${num}`,
    number: num,
    title: `Semester ${romans[i]}`,
    subjects: subjectDefs[num].map((s) => {
      const slug = s.code.toLowerCase();
      return {
        id: slug,
        title: s.title,
        code: s.code,
        chapters: mkChapters(slug, s.chapters),
      };
    }),
  };
});

export const findSemester = (id: string) => syllabus.find((s) => s.id === id);
export const findSubject = (semId: string, subId: string) =>
  findSemester(semId)?.subjects.find((s) => s.id === subId);
export const findChapter = (semId: string, subId: string, chId: string) =>
  findSubject(semId, subId)?.chapters.find((c) => c.id === chId);
export const findTopic = (semId: string, subId: string, chId: string, tId: string) =>
  findChapter(semId, subId, chId)?.topics.find((t) => t.id === tId);
