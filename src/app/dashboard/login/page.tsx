"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStaffSession, setStaffSession } from "@/lib/staff-session";

export default function StaffLoginPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("STAFF-DEMO");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (getStaffSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const canLogin = staffId.trim().length > 0 && password.length > 0;

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!canLogin) return;
    // Prototype log in only: accept any non-empty staff ID and password.
    // Never store or check real passwords.
    setStaffSession(staffId, rememberMe);
    router.push("/dashboard");
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        background: "#EFEDEB",
        color: "#1B1416",
        fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
        overflowX: "hidden",
      }}
    >
      <section
        style={{
          width: "760px",
          maxWidth: "53%",
          flex: "none",
          boxSizing: "border-box",
          background:
            "linear-gradient(115deg,#C8102E 0%,#C8102E 45%,#E8602A 72%,#FFC72C 100%)",
          color: "#fff",
          padding: "56px 72px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "#fff",
              color: "#C8102E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Tolong
          </div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "52px",
              lineHeight: 1.08,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Township staff dashboard
          </h1>
          <p
            style={{
              margin: "20px 0 0",
              fontSize: "18px",
              lineHeight: 1.6,
              fontWeight: 600,
              color: "#fff",
              maxWidth: "560px",
            }}
          >
            See how neighbours are helping each other, follow up on requests
            that wait too long, and keep Tolong safe.
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: "32px 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              Anonymous totals. No names or unit numbers.
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              Only township staff can log in.
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              Points only. No cash, no buying or selling.
            </li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "56px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#fff",
          }}
        >
          DEMO PROTOTYPE · NO REAL ACCOUNTS
        </div>
      </section>

      <section
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "460px",
            maxWidth: "100%",
            background: "#fff",
            borderRadius: "28px",
            padding: "44px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              Staff log in
            </h2>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#6B6063",
                marginTop: "6px",
              }}
            >
              Use your township staff account.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              htmlFor="sid"
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#3B3235",
              }}
            >
              Staff ID
            </label>
            <input
              id="sid"
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              autoComplete="off"
              style={{
                minHeight: "56px",
                boxSizing: "border-box",
                border: "2px solid #E3DEDB",
                borderRadius: "16px",
                background: "#fff",
                padding: "0 18px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#1B1416",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              htmlFor="spw"
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#3B3235",
              }}
            >
              Password
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "2px solid #E3DEDB",
                borderRadius: "16px",
                padding: "0 8px 0 18px",
              }}
            >
              <input
                id="spw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: "52px",
                  border: 0,
                  background: "transparent",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1B1416",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  minHeight: "44px",
                  padding: "0 14px",
                  border: 0,
                  borderRadius: "12px",
                  background: "#EFEDEB",
                  color: "#1B1416",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label
            htmlFor="sremember"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minHeight: "32px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#3B3235",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              id="sremember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                margin: 0,
                accentColor: "#C8102E",
                cursor: "pointer",
              }}
            />
            <span>Remember me on this device</span>
          </label>

          {canLogin ? (
            <button
              type="submit"
              style={{
                minHeight: "60px",
                border: 0,
                borderRadius: "999px",
                background: "#C8102E",
                color: "#fff",
                fontSize: "17px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "6px",
                cursor: "pointer",
              }}
            >
              Log in
            </button>
          ) : (
            <button
              type="button"
              disabled
              style={{
                minHeight: "60px",
                border: 0,
                borderRadius: "999px",
                background: "#C9C2C0",
                color: "#fff",
                fontSize: "17px",
                fontWeight: 800,
                marginTop: "6px",
                cursor: "not-allowed",
              }}
            >
              Enter your staff ID and password
            </button>
          )}

          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.5,
              fontWeight: 500,
              color: "#6B6063",
              textAlign: "center",
            }}
          >
            Forgot your password? Ask your township administrator.
          </div>

          <div
            style={{
              borderTop: "1px solid #E3DEDB",
              paddingTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#6B6063" }}>Not staff?</span>
            <Link
              href="/login"
              style={{ color: "#C8102E", textDecoration: "underline" }}
            >
              Open the resident app
            </Link>
          </div>

          <div
            style={{
              fontSize: "12px",
              lineHeight: 1.5,
              fontWeight: 500,
              color: "#6B6063",
              background: "#EFEDEB",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            Demo only, no real account. The details above are placeholders. No
            real account or password is checked or stored.
          </div>
        </form>
      </section>
    </div>
  );
}
