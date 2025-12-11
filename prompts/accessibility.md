You are an accessibility expert. Analyze the following React component for accessibility issues.

## Component to Analyze
```tsx
{{COMPONENT_CODE}}
```

## Analysis Requirements
Check for:
1. Missing ARIA labels and roles
2. Color contrast issues
3. Keyboard navigation problems
4. Missing alt text for images
5. Form accessibility (labels, error messages)
6. Focus management
7. Screen reader compatibility

## Response Format
Return a JSON object:
```json
{
  "score": 85,
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "element": "button.submit-btn",
      "issue": "Missing aria-label",
      "suggestion": "Add aria-label='Submit form'"
    }
  ],
  "suggestions": [
    "Consider adding skip navigation link",
    "Ensure focus is visible on all interactive elements"
  ]
}
```
