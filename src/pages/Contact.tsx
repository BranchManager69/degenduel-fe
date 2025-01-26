import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export const Contact: React.FC = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormState({ name: "", email: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h1 className="text-4xl font-bold text-gray-100 group-hover:animate-glitch relative">
          Contact Us
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
          Have questions? We're here to help!
        </p>
      </div>

      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
        <CardContent className="p-8 relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-200 group-hover:animate-glitch"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-colors group-hover:border-brand-400/20"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200 group-hover:animate-glitch"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formState.email}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 block w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-colors group-hover:border-brand-400/20"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-200 group-hover:animate-glitch"
              >
                Message
              </label>
              <textarea
                id="message"
                required
                value={formState.message}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={4}
                className="mt-1 block w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-colors group-hover:border-brand-400/20"
                placeholder="How can we help?"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center font-medium group-hover:animate-glitch">
                  {isSubmitting ? (
                    <div className="animate-cyber-pulse">Sending...</div>
                  ) : (
                    <>
                      Send Message
                      <svg
                        className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </Button>
            </div>

            {submitStatus === "success" && (
              <div className="text-green-400 text-center animate-cyber-pulse">
                Message sent successfully!
              </div>
            )}
            {submitStatus === "error" && (
              <div className="text-red-400 text-center animate-glitch">
                Failed to send message. Please try again.
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Social Links */}
      <div className="mt-16 text-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
          Connect With Us
        </h2>
        <div className="flex justify-center space-x-6">
          <a
            href="https://twitter.com/degenduel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-brand-400 transition-colors relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative group-hover:animate-cyber-pulse">
              Twitter
            </span>
          </a>
          <a
            href="https://discord.gg/degenduel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-brand-400 transition-colors relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative group-hover:animate-cyber-pulse">
              Discord
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
