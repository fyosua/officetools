import { writable } from 'svelte/store';
import * as api from './api.js';

export const auth = writable(null);

export async function checkAuth() {
  try {
    const res = await api.checkAuth();
    const authenticated = res?.authenticated === true;
    auth.set(authenticated);
    return authenticated;
  } catch {
    auth.set(null);
    return false;
  }
}

export async function login(password) {
  const user = await api.login(password);
  auth.set(true);
  return true;
}

export async function logout() {
  await api.logout();
  auth.set(false);
  return false;
}