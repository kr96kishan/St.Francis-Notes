import { generateStudyKit } from "@/lib/ai-assistant.functions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await generateStudyKit({
      data: {
        semester: body.semester || "Semester 1",
        subject: body.subject || "Discrete Structures",
      },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
