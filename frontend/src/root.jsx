import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { supabase } from "./supabaseClient";

const Root = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider user={user}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default Root;
