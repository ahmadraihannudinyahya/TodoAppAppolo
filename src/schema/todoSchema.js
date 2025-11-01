import { gql } from "graphql-tag";
import { ProjectController } from "../controllers/projectController.js";
import { TaskController } from "../controllers/taskController.js";
import { AuthorizationError } from "../utils/errors.js";
import { withFilter } from "graphql-subscriptions";

export const typeDefs = gql(`
  enum Priority {
    HIGH
    MEDIUM
    LOW
  }

  type Project {
    id: ID!
    name: String!
    description: String!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    project_id: ID!
    name: String!
    due: String!
    description: String
    priority: Priority!
    finished: Boolean!
  }

  type Query {
    projects: [Project!]!
    project(id: ID!): Project
    tasks(
      project_id: ID
      dueDate: String
      priority: Priority
    ): [Task!]!
  }

  type Mutation {
    createProject(id:ID, name: String!, description: String!): Project!
    upsertProject(id:ID, name: String!, description: String!): Project!
    updateProject(id: ID!, name: String, description: String): Project!
    deleteProject(id: ID!): Project!
    createTask(
      id: ID
      project_id: ID!
      name: String!
      due: String!
      description: String
      priority: Priority
    ): Task!
    upsertTask(
      id: ID
      project_id: ID!
      name: String!
      due: String!
      description: String
      priority: Priority
    ): Task!
    updateTask(
      id: ID!
      name: String
      description: String
      due: String
      priority: Priority
    ): Task!
    deleteTask(id: ID!): Task!
    toggleTask(id: ID!): Task!
  }

  enum EventType {
    ADDED
    UPDATED
    DELETED
  }

  type TaskEvent {
    type: EventType!
    data: Task!
  }

  type ProjectEvent {
    type: EventType!
    data: Project!
  }

  type Subscription {
    projectChanged: ProjectEvent!
    taskChanged(project_id: ID!): TaskEvent!
  }
`)

export const resolvers = {
  Query: {
    projects: async (_, __, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.getProjects(ctx.user.sub);
    },
    project: async (_, { id }, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.getProject(ctx.user.sub, id);
    },
    tasks: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.getTasks({ ...args, ownerId: ctx.user.sub });
    },
  },

  Mutation: {
    createProject: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.createProject(ctx.user.sub, args);
    },
    upsertProject: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.upsertProject(ctx.user.sub, args);
    },
    updateProject: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.updateProject(ctx.user.sub, args);
    },
    deleteProject: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await ProjectController.deleteProject(ctx.user.sub, args);
    },
    createTask: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.createTask(ctx.user.sub, {
        ...args,
        project_id: args.project_id,
      });
    },
    upsertTask: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.createTask(ctx.user.sub, {
        ...args,
        project_id: args.project_id,
      });
    },
    updateTask: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.updateTask(ctx.user.sub, args)
    },
    deleteTask: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.deleteTask(ctx.user.sub, args);
    },
    toggleTask: async (_, { id }, ctx) => {
      if (!ctx.user) {
        throw new AuthorizationError();
      }
      return await TaskController.toggleTask(ctx.user.sub, id);
    },
  },

  Subscription: {
    projectChanged: {
      subscribe: withFilter(
        () => ProjectController.subscribeProjectChanged(),
        (payload, _, ctx) => payload.projectChanged.data.owner_id == ctx.user.sub
      ),
    },
    taskChanged: {
      subscribe: withFilter(
        () => TaskController.subscribeTaskChanged(),
        (payload, variables) => payload.taskChanged.data.project_id == variables.project_id
      ),
    },
  },

  Project: {
    tasks: async (project) => {
      return await TaskController.getTasksByProject(project);
    },
  },
};
