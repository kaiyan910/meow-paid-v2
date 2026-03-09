/**
 * Regression test for B04: language dropdown not reflecting the selected language.
 * Verifies the <select> value updates reactively when the user picks a new language.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/store/auth.store", () => ({
  useAuthStore: (selector: (s: { setUser: () => void }) => unknown) =>
    selector({ setUser: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

/** Stub all meta query hooks to return empty idle state */
const emptyQuery = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};
vi.mock("@/hooks/use-meta-queries", () => ({
  useShops: () => emptyQuery,
  useShopCategories: () => emptyQuery,
  usePaymentTypes: () => emptyQuery,
  usePaymentSubtypes: () => emptyQuery,
  useDeleteMeta: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/components/meta/meta-form-dialog", () => ({
  MetaFormDialog: () => null,
}));

vi.mock("@/components/meta/meta-list", () => ({
  MetaList: () => null,
}));

/** Use real i18n so language reactivity is tested end-to-end */
import "@/i18n";

import { MetaTab } from "../tabs/meta-tab";

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("MetaTab language dropdown (B04 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("updates the dropdown value when a new language is selected", async () => {
    const user = userEvent.setup();
    render(<MetaTab />);

    const select = screen.getByLabelText(/language/i) as HTMLSelectElement;
    expect(select.value).toBe("en");

    await user.selectOptions(select, "zh");

    expect(select.value).toBe("zh");
  });
});
