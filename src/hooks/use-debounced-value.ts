import { useEffect, useState } from "react";

// Shared by every admin table with a live-typing search field (Session
// Library, and the course workspace's Enrollments/Certificates/Projects
// tabs) so typing doesn't fire a request per keystroke. Pair with a
// minimum-length gate at the call site if the field also needs one — this
// hook only handles the "wait for a pause" half.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
