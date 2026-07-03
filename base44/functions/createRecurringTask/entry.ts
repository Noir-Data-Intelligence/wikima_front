import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id } = await req.json();
    if (!task_id) {
      return Response.json({ error: 'Task ID required' }, { status: 400 });
    }

    // Get the completed task
    const task = await base44.entities.Task.get(task_id);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task is recurring
    if (!task.is_recurring || !task.recurrence_pattern) {
      return Response.json({ message: 'Task is not recurring' });
    }

    // Calculate next deadline based on recurrence pattern
    const currentDeadline = task.deadline ? new Date(task.deadline) : new Date();
    let nextDeadline;

    switch (task.recurrence_pattern) {
      case 'daily':
        nextDeadline = new Date(currentDeadline);
        nextDeadline.setDate(nextDeadline.getDate() + 1);
        break;
      case 'weekly':
        nextDeadline = new Date(currentDeadline);
        nextDeadline.setDate(nextDeadline.getDate() + 7);
        break;
      case 'monthly':
        nextDeadline = new Date(currentDeadline);
        nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        break;
      case 'yearly':
        nextDeadline = new Date(currentDeadline);
        nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
        break;
      default:
        return Response.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
    }

    // Create the next occurrence
    const nextTask = await base44.entities.Task.create({
      workspace_id: task.workspace_id,
      title: task.title,
      description: task.description,
      client_id: task.client_id,
      client_name: task.client_name,
      assigned_to: task.assigned_to,
      assigned_to_name: task.assigned_to_name,
      deadline: nextDeadline.toISOString(),
      priority: task.priority,
      status: 'todo',
      reminder: task.reminder,
      notes: task.notes,
      estimated_hours: task.estimated_hours,
      actual_hours: 0,
      is_recurring: true,
      recurrence_pattern: task.recurrence_pattern,
      parent_task_id: task.parent_task_id || task_id,
    });

    return Response.json({ 
      message: 'Next recurring task created',
      next_task_id: nextTask.id,
      next_deadline: nextDeadline.toISOString()
    });

  } catch (error) {
    console.error('Error creating recurring task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});