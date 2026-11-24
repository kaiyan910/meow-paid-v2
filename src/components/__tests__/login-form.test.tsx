/**
 * Tests for LoginForm component.
 * Covers email validation, password validation, and form submission flows.
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

/** Mock the app API and Next.js navigation. */
const mockSignIn = vi.fn();
vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => mockSignIn(...args),
}));

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

/** Mock react-i18next to return translation keys as-is */
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "login.title": "System Login",
        "login.description": "Enter your credentials to continue",
        "login.email.label": "Email",
        "login.email.placeholder": "Enter email address",
        "login.email.invalid": "Please enter a valid email address",
        "login.password.label": "Password",
        "login.password.placeholder": "Enter password",
        "login.password.minLength": "Password must be at least 6 characters",
        "login.submit": "Access System",
        "login.submitting": "Accessing...",
        "login.notice": "[ Authorized personnel only ]",
        "login.error": "Invalid email or password. Please try again.",
      };
      return translations[key] ?? key;
    },
    i18n: { language: "en" },
  }),
}));

import { LoginForm } from "../login-form";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function renderLoginForm() {
  return render(<LoginForm />);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /* ---- Rendering ---- */

  it("renders email and password fields with submit button", () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /access system/i }),
    ).toBeInTheDocument();
  });

  /* ---- Email validation ---- */

  describe("email validation", () => {
    it("shows error for invalid email format", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "not-an-email");

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid email address"),
        ).toBeInTheDocument();
      });
    });

    it("does not show error for valid email", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "user@example.com");

      await waitFor(() => {
        expect(
          screen.queryByText("Please enter a valid email address"),
        ).not.toBeInTheDocument();
      });
    });
  });

  /* ---- Password validation ---- */

  describe("password validation", () => {
    it("shows error when password is shorter than 6 characters", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "12345");

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 6 characters"),
        ).toBeInTheDocument();
      });
    });

    it("does not show error when password is 6 or more characters", async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "123456");

      await waitFor(() => {
        expect(
          screen.queryByText("Password must be at least 6 characters"),
        ).not.toBeInTheDocument();
      });
    });
  });

  /* ---- Form submission ---- */

  describe("form submission", () => {
    it("signs in through the app API and navigates on success", async () => {
      mockSignIn.mockResolvedValue(null);

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /access system/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "/api/auth",
          expect.anything(),
          {
            method: "POST",
            body: { email: "user@example.com", password: "password123" },
          },
        );
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/main/transactions");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("displays the login error when the app API rejects", async () => {
      mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

      const user = userEvent.setup();
      renderLoginForm();

      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpass");
      await user.click(screen.getByRole("button", { name: /access system/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Invalid email or password. Please try again."),
        ).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
