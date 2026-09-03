package com.lifehub.task;

import com.lifehub.common.exception.ResourceNotFoundException;
import com.lifehub.task.dto.TaskRequest;
import com.lifehub.task.dto.TaskResponse;
import com.lifehub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(User currentUser, TaskStatus statusFilter) {
        List<Task> tasks = statusFilter == null
                ? taskRepository.findByUserId(currentUser.getId())
                : taskRepository.findByUserIdAndStatus(currentUser.getId(), statusFilter);

        return tasks.stream().map(TaskMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(User currentUser, Long taskId) {
        return TaskMapper.toResponse(findOwnedTask(currentUser, taskId));
    }

    @Transactional
    public TaskResponse createTask(User currentUser, TaskRequest request) {
        Task task = new Task(
                currentUser,
                request.title(),
                request.description(),
                request.status(),
                request.priority(),
                request.dueDate()
        );
        task = taskRepository.save(task);
        return TaskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(User currentUser, Long taskId, TaskRequest request) {
        Task task = findOwnedTask(currentUser, taskId);

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());

        return TaskMapper.toResponse(task);
    }

    @Transactional
    public void deleteTask(User currentUser, Long taskId) {
        Task task = findOwnedTask(currentUser, taskId);
        taskRepository.delete(task);
    }

    /**
     * Scoped by owner in the repository query itself: a task that exists but belongs to
     * another user comes back as 404, the same as a task that doesn't exist at all. Never
     * looked up by task id alone, so no client-supplied user id ever enters the picture.
     */
    private Task findOwnedTask(User currentUser, Long taskId) {
        return taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    }
}
