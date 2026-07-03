import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, deadline } = await req.json();

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Use LLM to generate task plan
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert project manager. Based on the following task, create a detailed task plan.

Task Title: ${title}
Task Description: ${description || 'No description provided'}
Target Deadline: ${deadline || 'Not specified'}

Generate a structured plan with:
1. A priority level (low, medium, high, or urgent)
2. Estimated hours to complete the entire task
3. A breakdown into 3-7 subtasks with individual time estimates
4. Suggested deadlines for each subtask (relative to the main deadline)

Return ONLY a valid JSON object with this exact structure:
{
  "priority": "medium",
  "estimated_hours": 8,
  "subtasks": [
    {
      "title": "Subtask 1 title",
      "estimated_hours": 2,
      "order": 1
    },
    {
      "title": "Subtask 2 title",
      "estimated_hours": 3,
      "order": 2
    }
  ],
  "reasoning": "Brief explanation of the plan"
}

Make the subtasks practical, actionable, and appropriate for the task type. Consider administrative, financial, client support, marketing, meeting, internal, or operations tasks.`,
      response_json_schema: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          estimated_hours: { type: "number" },
          subtasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                estimated_hours: { type: "number" },
                order: { type: "number" }
              },
              required: ["title", "estimated_hours", "order"]
            }
          },
          reasoning: { type: "string" }
        },
        required: ["priority", "estimated_hours", "subtasks", "reasoning"]
      }
    });

    return Response.json({ plan: response });
  } catch (error) {
    console.error('Error generating task plan:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});