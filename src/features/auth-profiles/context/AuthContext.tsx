"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { ProfilePreview, UpdateProfileInput } from "@/types/contracts";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { profileFromAuthUser, resolveAuthenticatedProfile } from "../lib/auth-profile";
import { repairSampleIdentity } from "../lib/sample-profile-repair";

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
  const [profileState, setProfileState] = useState<{ userId: string; profile: ProfilePreview | null } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sampleRepairs = useRef(new Set<string>());

  const supabase = getSupabaseBrowserClient();
  const isConfigured = Boolean(supabase);
  // Never show a previous account's profile while the next account is loading.
  const profile = useMemo(() => user ? resolveAuthenticatedProfile(user,
    profileState?.userId === user.id ? profileState.profile : null) : null, [user, profileState]);
  const isLoading = isAuthLoading || Boolean(user && profileState?.userId !== user.id);

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, major, current_courses, bio")
          .eq("id", userId)
          .single();

        if (error || !data || data.id !== userId) {
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
      setIsAuthLoading(false);
      return;
    }

    // INITIAL_SESSION restores persisted login. Keep this callback synchronous:
    // Supabase awaits auth listeners, and profile queries may need its auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) setProfileState(null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch outside the auth listener so sign-in can finish before database access.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setProfileState({ userId: user.id, profile: profileFromAuthUser(user) });
    void fetchProfile(user.id).then(async (loadedProfile) => {
      if (cancelled) return;
      if (loadedProfile) setProfileState({ userId: user.id, profile: loadedProfile });
      if (!supabase || sampleRepairs.current.has(user.id)) return;
      // Auth metadata updates emit another auth event. Mark this attempt first to avoid a loop.
      sampleRepairs.current.add(user.id);
      try { await repairSampleIdentity(supabase, user, loadedProfile, () => !cancelled); }
      catch (error) { console.warn("[Auth] Sample identity repair failed:", error instanceof Error ? error.message : "Unavailable"); }
    });
    return () => { cancelled = true; };
  }, [user, fetchProfile, supabase]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase credentials are not configured on this client." };
    }
    sampleRepairs.current.clear();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
    setProfileState(null);
    setSession(null);
    sampleRepairs.current.clear();
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

    const updated = await fetchProfile(user.id);
    setProfileState((current) => current?.userId === user.id && updated ? { userId: user.id, profile: updated } : current);
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
