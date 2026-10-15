export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: "Weak" | "Fair" | "Good" | "Strong";
  rules: PasswordRule[];
  error?: string;
}

export function evaluatePassword(password: string): PasswordValidationResult {
  const p = password || "";

  const rules: PasswordRule[] = [
    {
      id: "length",
      label: "At least 8 characters",
      passed: p.length >= 8,
    },
    {
      id: "cases",
      label: "Both uppercase & lowercase letters (A-Z, a-z)",
      passed: /[A-Z]/.test(p) && /[a-z]/.test(p),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      passed: /[0-9]/.test(p),
    },
    {
      id: "special",
      label: "At least one special character (!@#$%^&*)",
      passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
    },
  ];

  const passedCount = rules.filter((r) => r.passed).length;
  const isValid = passedCount === rules.length;

  let strengthLabel: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  if (passedCount === 4) {
    strengthLabel = "Strong";
  } else if (passedCount === 3) {
    strengthLabel = "Good";
  } else if (passedCount === 2) {
    strengthLabel = "Fair";
  }

  let error: string | undefined;
  if (!isValid) {
    const missing = rules.filter((r) => !r.passed).map((r) => r.label);
    error = `Password does not meet strict security standards. Missing: ${missing.join(", ")}.`;
  }

  return {
    isValid,
    score: passedCount,
    strengthLabel,
    rules,
    error,
  };
}
