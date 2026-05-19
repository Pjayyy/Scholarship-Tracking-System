import { render, screen } from "@testing-library/react";
import App from "./app/App";

test("renders Scholarship Portal login screen", () => {
  render(<App />);

  expect(screen.getByText(/Scholarship Portal/i)).toBeInTheDocument();

  // Inputs have the accessibility labels. The word "Password" also appears as a
  // button aria-label, so query inputs specifically by their role.
  expect(screen.getByRole("textbox", { name: /Email address/i })).toBeInTheDocument();

  const passwordInput = screen.getByLabelText(/Password/i, { selector: "input#password" });
  expect(passwordInput).toBeInTheDocument();

});

