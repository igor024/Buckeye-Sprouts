"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { ProfilePreview, UpdateProfileInput } from "@/types/contracts";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  major: string;
  currentCourses: string[];
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: ProfilePreview | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null; emailConfirmationNeeded?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = getSupabaseBrowserClient();
  const isConfigured = Boolean(supabase);

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, major, current_courses, bio")
          .eq("id", userId)
          .single();

        if (error || !data) {
          console.warn("[Auth] Profile not found in Supabase:", error?.message);
          return null;
        }

        const loadedProfile: ProfilePreview = {
          id: data.id,
          name: data.name || "Buckeye Student",
          avatarUrl: data.avatar_url || "",
          major: data.major || "Undeclared",
          currentCourses: Array.isArray(data.current_courses) ? data.current_courses : [],
          bio: data.bio || "",
        };

        setProfile(loadedProfile);
        return loadedProfile;
      } catch (err) {
        console.warn("[Auth] Failed to load profile:", err);
        return null;
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase credentials are not configured on this client." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    setIsModalOpen(false);
    return { error: null };
  };

  const signUp = async (data: SignUpData) => {
    if (!supabase) {
      return { error: "Supabase credentials are not configured on this client." };
    }
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          major: data.major,
          current_courses: data.currentCourses,
          bio: data.bio || "",
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If session is null but user exists, email confirmation is required by Supabase
    const emailConfirmationNeeded = Boolean(authData.user && !authData.session);
    if (!emailConfirmationNeeded) {
      setIsModalOpen(false);
    }

    return { error: null, emailConfirmationNeeded };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (input: UpdateProfileInput) => {
    if (!supabase || !user) {
      return { error: "Must be signed in to update profile." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: input.name,
        major: input.major,
        bio: input.bio,
        avatar_url: input.avatarUrl,
        current_courses: input.currentCourses,
      })
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    await fetchProfile(user.id);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
