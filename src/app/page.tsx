"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((user) => {
        if (user.roles.includes("SUPERVISOR")) router.push("/supervisor");
        else if (user.roles.includes("INSTRUCTOR")) {
          router.push("/instructor"); // מדריכה (גם אם היא גננת אם) תנחת כאן
        } else if (user.roles.includes("MANAGER")) {
          router.push("/manager");
        } else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, []);

  return <LoadingScreen message="מזהה משתמש ומנתב..." />;
}
