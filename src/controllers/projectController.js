// controllers/projectController.js
import { ProjectModel } from "../models/projectModel.js";
import { BadRequestError } from "../utils/errors.js";
import { pubsub } from "../utils/pubsub.js";


export const PROJECT_CHANGED = "PROJECT_CHANGED";

export const ProjectController = {
  getProjects: async (ownerId) => await ProjectModel.getAll(ownerId),
  getProject: async (ownerId, id) => {
    return await ProjectModel.getById(ownerId, id)
  }, 
  createProject: async (ownerId, args) => {
    const { id, description, name } = args
    const project = await ProjectModel.create(ownerId, id, name, description);
    await pubsub.publish(PROJECT_CHANGED, {
      projectChanged: {
        type: "ADDED",
        data: project
      },

    })
    return project;
  },
  upsertProject: async (ownerId, args) => {
    const { id, description, name } = args
    if (id) {
      const existing = await ProjectModel.getById(id)
      if (existing) {
        if (existing.owner_id !== ownerId)
          throw new BadRequestError('Unauthorized User')
        const updatedData = {
          name: name ?? existing.name,
          description: description ?? existing.description,
        };
        const updated = await ProjectModel.update(id, updatedData.name, updatedData.description);
        pubsub.publish(PROJECT_CHANGED, {
          projectChanged: {
            type: "UPDATED",
            data: updated
          }
        })
        return project;
      }
    }
    const project = await ProjectModel.create(ownerId, id, name, description);
    await pubsub.publish(PROJECT_CHANGED, {
      projectChanged: {
        type: "ADDED",
        data: project
      },

    })
    return project;
  },
  updateProject: async (ownerId, args) => {
    const { id, description, name } = args
    if (!id)
      throw new BadRequestError('id required')
    const existing = await ProjectModel.getById(id)
    if (!existing || existing.owner_id !== ownerId)
      throw new BadRequestError('Unauthorized User')
    const updatedData = {
      name: name ?? existing.name,
      description: description ?? existing.description,
    };
    const updated = await ProjectModel.update(id, updatedData.name, updatedData.description);
    pubsub.publish(PROJECT_CHANGED, {
      projectChanged: {
        type: "UPDATED",
        data: updated
      }
    })
    return project;
  },
  deleteProject: async (ownerId, args) => {
    const { id } = args    
    if (!id)
      throw new BadRequestError('id required')
    const existing = await ProjectModel.getById(ownerId, id)
    if (!existing)
      throw new BadRequestError('Unauthorized User')
    await ProjectModel.delete(id)
    pubsub.publish(PROJECT_CHANGED, {
      projectChanged: {
        type: "DELETED",
        data: existing
      }
    })
    return existing
  },
  subscribeProjectChanged: () => pubsub.asyncIterator([PROJECT_CHANGED]),
};
