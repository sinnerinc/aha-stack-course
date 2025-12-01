import type {
  TypedPocketBase,
  ProjectsResponse,
  ProjectsRecord,
  TasksRecord,
  TasksResponse,
} from '@src/data/pocketbase-types'
import { sortAndDeduplicateDiagnostics } from 'typescript';

type TexpandProject = {
  project?: ProjectsResponse
}

//
// Projects
//

function getStatus(project: ProjectsResponse) {
  switch (project.status) {
    case "not started":
      return 4;
    case "on hold":
      return 3;
    case "in progress":
      return 2;
    case "done":
      return 1;
    default:
      return 0;
  }
}

export async function getProject(pb: TypedPocketBase, id: string) {
  const project = await pb.collection('projects').getOne(id)

  return project
}

export async function getProjects(pb: TypedPocketBase) {
  const projects = await pb
    .collection('projects')
    .getFullList()

  return projects.sort(
    (a, b) => getStatus(a) - getStatus(b)
  )
}

export async function addProject(pb: TypedPocketBase, name: string) {
  const newProject = await pb.collection('projects').create({
    name,
    status: 'not started',
  })

  return newProject
}

export async function updateProject(pb: TypedPocketBase, id: string, data: ProjectsRecord) {
  await pb.collection('projects').update(id, data)
}

export async function deleteProject(pb: TypedPocketBase, id: string) {
  await pb.collection('projects').delete(id)
}

//
// Tasks
//

export async function getTasks({ pb, project_id = null, done = false, }: {
  pb: TypedPocketBase
  project_id: string | null
  done: boolean
}) : Promise<TasksResponse<TexpandProject>[]> {
  const options = {
    //filter: `project = "${project_id}"`,
    filter: '',
    sort: '-starred_on, created',
  }

  let filter = `completed = ${done}`
  filter += ` && project = "${project_id}"`

  options.filter = filter;

  let tasks: TasksResponse<TexpandProject>[] = []
  tasks = await pb.collection('tasks').getFullList(options)

  return tasks
}


export async function getStarredTasks(pb: TypedPocketBase): Promise<TasksResponse<TexpandProject>[]> {
  const options = {
    sort: '-starred_on',
    filter: 'starred = true && completed = false',
    expand: 'project',
  }

  let tasks: TasksResponse<TexpandProject>[] = await pb
    .collection('tasks')
    .getFullList(options)

  return tasks
}

export async function addTask(
  pb: TypedPocketBase,
  project_id: string,
  text: string
) {
  const newTask = await pb.collection('tasks').create({
    project: project_id,
    text,
  })

  return newTask
}

export async function updateTask(pb: TypedPocketBase, id: string, data: TasksRecord) {
  await pb.collection('tasks').update(id, data)
}

export async function deleteTask(pb: TypedPocketBase, id: string) {
  await pb.collection('tasks').delete(id)
}
