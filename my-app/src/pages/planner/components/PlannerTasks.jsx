import { useRef, useEffect, useState } from "react";
import "./PlannerViewEvent.css";
import { getAuth } from "firebase/auth";
import BASE_URL from "../../apiConfig";

function AddTaskPopup({ isOpen, onClose, onTaskAdd }) {
	const [taskForm, setTaskForm] = useState({ taskName: "" });

	const handleSubmit = (e) => {
		e.preventDefault();
		if (taskForm.taskName.trim()) {
			onTaskAdd({ ...taskForm });
			setTaskForm({ taskName: "" });
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<section className="popup-overlay" onClick={onClose}>
			<section
				className="popup-content"
				onClick={(e) => e.stopPropagation()}
			>
				<section className="popup-header">
					<h3>Add Task</h3>
				</section>
				<form onSubmit={handleSubmit} className="task-form">
					<section className="form-row">
						<label>
							Task Name *
							<input
								type="text"
								value={taskForm.taskName}
								onChange={(e) =>
									setTaskForm({
										...taskForm,
										taskName: e.target.value,
									})
								}
								required
								autoFocus
							/>
						</label>
					</section>
					<section className="form-actions">
						<button
							type="button"
							className="cancel-form-btn"
							onClick={onClose}
						>
							Cancel
						</button>
						<button type="submit" className="save-form-btn">
							Add Task
						</button>
					</section>
				</form>
			</section>
		</section>
	);
}

function EditTaskPopup({ isOpen, onClose, onTaskEdit, taskToEdit }) {
	const [taskForm, setTaskForm] = useState({ taskName: taskToEdit || "" });

	useEffect(() => {
		setTaskForm({ taskName: taskToEdit || "" });
	}, [taskToEdit]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (taskForm.taskName.trim()) {
			onTaskEdit(taskToEdit, taskForm.taskName);
			setTaskForm({ taskName: "" });
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<section className="popup-overlay" onClick={onClose}>
			<section
				className="popup-content"
				onClick={(e) => e.stopPropagation()}
			>
				<section className="popup-header">
					<h3>Edit Task</h3>
				</section>
				<form onSubmit={handleSubmit} className="task-form">
					<section className="form-row">
						<label>
							Task Name *
							<input
								type="text"
								value={taskForm.taskName}
								onChange={(e) =>
									setTaskForm({
										...taskForm,
										taskName: e.target.value,
									})
								}
								required
								autoFocus
							/>
						</label>
					</section>
					<section className="form-actions">
						<button
							type="button"
							className="cancel-form-btn"
							onClick={onClose}
						>
							Cancel
						</button>
						<button type="submit" className="save-form-btn">
							Save
						</button>
					</section>
				</form>
			</section>
		</section>
	);
}

function DeleteTaskPopup({ isOpen, onClose, onTaskDelete, taskToDelete }) {
	const handleSubmit = () => {
		onTaskDelete(taskToDelete);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<section
			className="popup-overlay"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<section
				className="popup-content"
				onClick={(e) => e.stopPropagation()}
			>
				<section className="popup-header">
					<h3>Delete Task?</h3>
				</section>
				<section className="delete-confirmation">
					<p>
						Are you sure you want to delete the task "{taskToDelete}
						"? This action cannot be undone.
					</p>
				</section>
				<button
					type="button"
					className="cancel-form-btn"
					onClick={onClose}
				>
					Cancel
				</button>
				<button
					type="button"
					className="delete-form-btn"
					onClick={handleSubmit}
				>
					Delete
				</button>
			</section>
		</section>
	);
}

function TaskItem({ taskName, taskStatus, onToggle, onEdit, onDelete }) {
	const isCompleted = taskStatus === true;
	return (
		<section className="task-item">
			<section className="task-checkbox">
				<input
					type="checkbox"
					checked={isCompleted}
					onChange={() => onToggle(taskName)}
				/>
			</section>
			<section className="task-content">
				<h4 className={isCompleted ? "completed" : ""}>{taskName}</h4>
			</section>
			<section className="task-actions">
				<button className="task-btn" onClick={() => onEdit(taskName)}>
					Edit
				</button>
				<button className="task-btn" onClick={() => onDelete(taskName)}>
					Delete
				</button>
			</section>
		</section>
	);
}

export default function PlannerTasks({ eventData, eventId, setEventData }) {
	const [showAddTaskPopup, setShowAddTaskPopup] = useState(false);
	const [showEditTaskPopup, setShowEditTaskPopup] = useState(false);
	const [showDeleteTaskPopup, setShowDeleteTaskPopup] = useState(false);
	const [taskToEdit, setTaskToEdit] = useState(null);
	const [taskToDelete, setTaskToDelete] = useState(null);

	console.log("PlannerTasks eventData:", eventData);

	// === CRUD HANDLERS ===
	const onTaskAdd = async (taskInfo) => {
		const currentTasks = Array.isArray(eventData.tasks)
			? eventData.tasks
			: [];
		const updatedEventData = {
			...eventData,
			tasks: [
				...currentTasks,
				{ taskName: taskInfo.taskName, completed: false },
			],
		};
		setEventData(updatedEventData);
		await saveTasks(updatedEventData);
	};

	const onTaskEdit = async (oldName, newName) => {
		const updatedTasks = eventData.tasks.map((task) =>
			task.taskName === oldName ? { ...task, taskName: newName } : task
		);
		const updatedEventData = { ...eventData, tasks: updatedTasks };
		setEventData(updatedEventData);
		await saveTasks(updatedEventData);
	};

	const onTaskToggle = async (taskName) => {
		const updatedTasks = eventData.tasks.map((task) =>
			task.taskName === taskName
				? { ...task, completed: !task.completed }
				: task
		);
		const updatedEventData = { ...eventData, tasks: updatedTasks };
		setEventData(updatedEventData);
		await saveTasks(updatedEventData);
	};

	const onTaskDelete = async (taskName) => {
		const updatedTasks = eventData.tasks.filter(
			(task) => task.taskName !== taskName
		);
		const updatedEventData = { ...eventData, tasks: updatedTasks };
		setEventData(updatedEventData);
		await saveTasks(updatedEventData);
	};

	const saveTasks = async (updatedEventData) => {
		try {
			const auth = getAuth();
			const user = auth.currentUser;
			const token = await user.getIdToken(true);
			const res = await fetch(`${BASE_URL}/planner/me/${eventId}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedEventData),
			});
			if (!res.ok) throw new Error("Update failed");
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<section className="tasks-content">
			<section className="tasks-header">
				<h3>Event Tasks</h3>
				<button
					className="task-btn"
					onClick={() => setShowAddTaskPopup(true)}
				>
					+ Add Task
				</button>
			</section>

			<section className="tasks-list">
				{eventData.tasks && eventData.tasks.length > 0 ? (
					eventData.tasks.map((task, i) => (
						<TaskItem
							key={`${task.taskName}-${i}`}
							taskName={task.taskName}
							taskStatus={task.completed}
							onToggle={onTaskToggle}
							onEdit={() => {
								setTaskToEdit(task.taskName);
								setShowEditTaskPopup(true);
							}}
							onDelete={() => {
								setTaskToDelete(task.taskName);
								setShowDeleteTaskPopup(true);
							}}
						/>
					))
				) : (
					<section className="empty-state">
						<p>
							No tasks added yet. Click "Add Task" to start
							organizing your eventData planning.
						</p>
					</section>
				)}
			</section>

			{showAddTaskPopup && (
				<AddTaskPopup
					isOpen={true}
					onClose={() => setShowAddTaskPopup(false)}
					onTaskAdd={onTaskAdd}
				/>
			)}
			{showEditTaskPopup && (
				<EditTaskPopup
					isOpen={true}
					onClose={() => setShowEditTaskPopup(false)}
					onTaskEdit={onTaskEdit}
					taskToEdit={taskToEdit}
				/>
			)}
			{showDeleteTaskPopup && (
				<DeleteTaskPopup
					isOpen={true}
					onClose={() => setShowDeleteTaskPopup(false)}
					onTaskDelete={onTaskDelete}
					taskToDelete={taskToDelete}
				/>
			)}
		</section>
	);
}
