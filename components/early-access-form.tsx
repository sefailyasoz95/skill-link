"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const isValidEmail = emailRegex.test(email);
    if (isValidEmail) {
      const { data, error } = await supabase.from("waitlist").insert({ email });
      if (error) {
        toast({
          title: "Error!",
          description: error.message,
        });
        setIsLoading(false);
        return;
      }
      toast({
        title: "Success!",
        description:
          "You've been added to our early access list. We'll be in touch soon!",
      });
      setEmail("");
    } else {
      toast({
        title: "Error!",
        description:
          "Couldn't add you to the waitlist! Please reach us at 'sio@softwarify.co' !",
      });
    }
    setIsLoading(false);
  };

  return (
    <motion.form
      initial={{
        opacity: 0,
        y: 50,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      onSubmit={handleSubmit}
      className="flex w-full max-w-md mx-auto space-x-2"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing
          </span>
        ) : (
          <span className="flex items-center">
            <Send className="mr-2 h-4 w-4" /> Join
          </span>
        )}
      </Button>
    </motion.form>
  );
}
