import { ProjectModel } from "../models/projectModel.js";
import { TaskModel } from "../models/taskModel.js";
import { BadRequestError } from "../utils/errors.js";
import { pubsub } from "../utils/pubsub.js";

export const TASK_CHANGED = "TASK_CHANGED";

export const TaskController = {
  getTasks: async (args) => {
    const { ownerId, project_id, dueDate, priority } = args;
    if(project_id){
      return await TaskModel.getByProject(project_id);
    }
    if (dueDate) {
      const validDate = new Date(dueDate);
      if (!validDate) {
        throw new BadRequestError('dueDate is Invalid Date')
      }
      return await TaskModel.getByDueDate(ownerId, validDate);
    }
    if (priority) {
      return await TaskModel.getByPriority(ownerId, priority);
    }
    return []
  },
  getTasksByProject: async (project) => {
    return await TaskModel.getByProject(project.id);
  },
  createTask: async (ownerId, args) => {
    const { project_id } = args;
    const project = await ProjectModel.getById(ownerId, project_id);
    if (!project)
      throw new BadRequestError('project_id Not Found')
    const task = await TaskModel.add(args);
    await pubsub.publish(TASK_CHANGED, {
      taskChanged: {
        type: "ADDED",
        data: task,
      },
    });
    return task;
  },
  upsertTask: async (ownerId, args) => {
    const { project_id, id } = args;
    const project = await ProjectModel.getById(ownerId, project_id);
    if (!project)
      throw new BadRequestError('project_id Not Found')

    if (id) {
      const existing = await TaskModel.getById(id);
      if (existing) {
        if (existing.project_id !== project_id)
          throw new BadRequestError('project_id Not Match')

        const updateTask = {
          name: args.name || existing.name,
          description: args.description || existing.description,
          due: args.due || existing.due,
          priority: args.priority || existing.priority
        }
        const updated = await TaskModel.update(id, updateTask);
        await pubsub.publish(TASK_CHANGED, {
          taskChanged: {
            type: "UPDATED",
            data: updated,
          },
        });
        return updated;
      }
    }

    const task = await TaskModel.add(args);
    await pubsub.publish(TASK_CHANGED, {
      taskChanged: {
        type: "ADDED",
        data: task,
      },
    });
    return task;
  },
  updateTask: async (ownerId, args) => {
    const { id } = args;
    if (!id)
      throw new BadRequestError('id required')
    const existing = await TaskModel.getById(id);
    if (!existing)
      throw new BadRequestError('task Not Found')
    const project = await ProjectModel.getById(ownerId, existing.project_id);
    if (!project)
      throw new BadRequestError('Unauthorized User')
    const updateTask = {
      name: args.name || existing.name,
      description: args.description || existing.description,
      due: args.due || existing.due,
      priority: args.priority || existing.priority
    }
    const updated = await TaskModel.update(id, updateTask);
    await pubsub.publish(TASK_CHANGED, {
      taskChanged: {
        type: "UPDATED",
        data: updated,
      },
    });
    return updated;
  },
  deleteTask: async (ownerId, args) => {
    const { id } = args
    if (!id)
      throw new BadRequestError('id required')
    const existing = await TaskModel.getById(id);
    if (!existing)
      throw new BadRequestError('task Not Found')
    const project = await ProjectModel.getById(ownerId, existing.project_id);
    if (!project)
      throw new BadRequestError('Unauthorized User')
    await TaskModel.delete(id);
    await pubsub.publish(TASK_CHANGED, {
      taskChanged: {
        type: "DELETED",
        data: existing,
      },
    });
    return existing
  },
  toggleTask: async (id) => await TaskModel.toggle(id),
  subscribeTaskChanged: () => pubsub.asyncIterator([TASK_CHANGED]),
};