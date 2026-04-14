import axios from "axios";

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api",
});

export const fetchNotes = (tag) =>
  API.get("/notes", { params: tag ? { tag } : {} });

export const createNote = (data) =>
  API.post("/notes", data);

export const updateNote = (id, data) =>
  API.put(`/notes/${id}`, data);

export const deleteNote = (id) =>
  API.delete(`/notes/${id}`);

export const toggleImportant = (id) =>
  API.patch(`/notes/${id}/important`);