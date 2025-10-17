// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext({ theme: "light", changeTheme: () => {} });

export function ThemeProvider({ children, user }) {
  const [theme, setTheme] = useState("light");

  // create unique key per user (like their email or id)
  const userKey = user?.email || "guest";

  useEffect(() => {
    // get saved theme for this user
    const saved = localStorage.getItem(`theme_${userKey}`);

    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      // default for new user → light
      setTheme("light");
      applyTheme("light");
    }
  }, [userKey]);

  const applyTheme = (themeValue) => {
    const root = document.documentElement;
    if (themeValue === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(`theme_${userKey}`, themeValue);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
