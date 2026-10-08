import { writable } from 'svelte/store';
import * as api from './api.js';

export const auth = writable(null);

export async function checkAuth() {
  try {
    const user = await api.checkAuth();
    auth.set(user);
    return user;
  } catch {
    auth.set(null);
    return null;
  }
}

export async function login(password) {
  const user = await api.login(password);
  auth.set(user);
  return user;
}

export async function logout() {
  await api.logout();
  auth.set(null);
}
