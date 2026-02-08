"use client";

import { useState } from "react";
import {jwtDecode} from "jwt-decode";

type DecodedToken = {
  sub: string;
  email: string;
  exp: number;
};

type Task = {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const BASE_URL = "http://127.0.0.1:8000/api";

  const login = async () => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert("Login failed: " + errData.detail);
        return;
      }

      const data = await res.json();
      const realToken = data.access_token;

      if (!realToken) {
        alert("Login failed: token missing");
        return;
      }

      setToken(realToken);
      localStorage.setItem("token", realToken);

      const decoded: DecodedToken = jwtDecode(realToken);
      setUserId(decoded.sub);

      fetchTasks(decoded.sub, realToken);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const fetchTasks = async (uid: string, tkn: string) => {
    try {
      const res = await fetch(`${BASE_URL}/${uid}/tasks`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (!res.ok) return alert("Fetch tasks failed");

      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Fetch tasks error:", error);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle) return alert("Enter a task title");

    try {
      const res = await fetch(`${BASE_URL}/${userId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          completed: false,
          description: "",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert("Add task failed: " + JSON.stringify(errData));
        return;
      }

      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
    } catch (error) {
      console.error("Add task error:", error);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${userId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return alert("Delete failed");

      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Delete task error:", error);
    }
  };

  const toggleComplete = async (taskId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/${userId}/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return alert("Toggle complete failed");

      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (error) {
      console.error("Toggle complete error:", error);
    }
  };

  const editTask = async (taskId: number) => {
    const newTitle = prompt("Enter new task title");
    if (!newTitle) return;

    const taskToEdit = tasks.find((t) => t.id === taskId);
    if (!taskToEdit) return;

    try {
      const res = await fetch(`${BASE_URL}/${userId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: taskToEdit.description || "",
          completed: taskToEdit.completed,
        }),
      });

      if (!res.ok) return alert("Edit failed");

      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (error) {
      console.error("Edit task error:", error);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input
        className="border p-2 rounded w-full mb-2"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 rounded w-full mb-2"
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={login}
      >
        Login
      </button>

      <p>User ID: {userId}</p>

      {userId && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <div className="flex gap-2 mb-4">
            <input
              className="border p-2 rounded flex-1"
              placeholder="New task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={addTask}
            >
              Add Task
            </button>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`border p-4 rounded shadow flex justify-between items-center ${
                  task.completed ? "bg-green-100" : "bg-white"
                }`}
              >
                <div>
                  <span
                    className={`font-medium ${
                      task.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => toggleComplete(task.id)}
                  >
                    {task.completed ? "Undo" : "Complete"}
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => editTask(task.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
