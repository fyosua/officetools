import { describe, expect, it, beforeAll } from "bun:test";

const BASE = "http://127.0.0.1:3002";

let sessionCookie = "";

describe("Auth", () => {
  it("GET /api/health returns ok", async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("GET /api/check-auth returns false when not logged in", async () => {
    const res = await fetch(`${BASE}/api/check-auth`);
    const data = await res.json();
    expect(data.authenticated).toBe(false);
  });

  it("POST /api/login with wrong password returns 401", async () => {
    const res = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/login with correct password sets session", async () => {
    const res = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "linkstart" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Extract session cookie
    const setCookie = res.headers.get("set-cookie") || "";
    sessionCookie = setCookie.split(";")[0] || "";
    expect(sessionCookie).toContain("session=");
  });

  it("GET /api/check-auth returns true with valid session", async () => {
    const res = await fetch(`${BASE}/api/check-auth`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    expect(data.authenticated).toBe(true);
  });
});

describe("Tool endpoints (auth required)", () => {
  it("POST /api/merge without auth returns 401", async () => {
    const form = new FormData();
    const blob = new Blob(["fake"], { type: "application/pdf" });
    form.append("file", blob, "test.pdf");
    const res = await fetch(`${BASE}/api/merge`, { method: "POST", body: form });
    expect(res.status).toBe(401);
  });

  it("POST /api/split without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/split`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/compress without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/compress`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/pdf-to-jpg without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/pdf-to-jpg`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/jpg-to-pdf without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/jpg-to-pdf`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/docx-to-pdf without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/docx-to-pdf`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/pdf-to-docx without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/pdf-to-docx`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/rotate without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/rotate`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/unlock without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/unlock`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/protect without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/protect`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/pdf-to-text without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/pdf-to-text`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /api/pdf-editor without auth returns 401", async () => {
    const res = await fetch(`${BASE}/api/pdf-editor`, { method: "POST" });
    expect(res.status).toBe(401);
  });
});