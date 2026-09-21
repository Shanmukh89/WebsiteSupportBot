"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "./ui/Button";

// --------------------------------
// Schemas
// --------------------------------

const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

// --------------------------------
// Shared UI
// --------------------------------

const Input = React.forwardRef(({ className, icon, ...props }, ref) => (
    <div className="dt-modal-input-wrapper">
        {icon && <span className="dt-modal-input-icon">{icon}</span>}
        <input
            ref={ref}
            className={`dt-modal-input ${icon ? 'has-icon' : ''} ${className || ""}`}
            {...props}
        />
    </div>
));
Input.displayName = "Input";

const AuthError = ({ message }) => {
    if (!message) return null;
    return (
        <div className="dt-modal-error animate-in fade-in zoom-in-95">
            {message}
        </div>
    );
};

// Pill toggle
const AuthToggle = ({ view, onSwitch }) => (
    <div className="dt-modal-toggle">
        <button
            type="button"
            className={`dt-modal-toggle-btn ${view === 'sign-up' ? 'active' : ''}`}
            onClick={() => onSwitch('sign-up')}
        >
            Sign up
        </button>
        <button
            type="button"
            className={`dt-modal-toggle-btn ${view === 'sign-in' ? 'active' : ''}`}
            onClick={() => onSwitch('sign-in')}
        >
            Sign in
        </button>
    </div>
);

// Divider
const AuthSeparator = ({ text = "OR SIGN IN WITH" }) => (
    <div className="dt-modal-separator">
        <div className="dt-modal-separator-line" />
        <span className="dt-modal-separator-text">{text}</span>
        <div className="dt-modal-separator-line" />
    </div>
);

// Social buttons — Google only
const AuthSocialButtons = ({ isLoading }) => {
    const handleSocialLogin = async (provider) => {
        await signIn(provider, { callbackUrl: "/dashboard" });
    };

    return (
        <div className="dt-modal-social-row">
            <button className="dt-modal-social-btn" disabled={isLoading} type="button" aria-label="Google" onClick={() => handleSocialLogin('google')}>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
            </button>
        </div>
    );
};

// --------------------------------
// Sign In View
// --------------------------------

function AuthSignIn({ onForgotPassword }) {
    const [formState, setFormState] = useState({ isLoading: false, error: null, showPassword: false });
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signInSchema) });
    const router = useRouter();

    const onSubmit = async (data) => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            const res = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (res?.error) {
                setFormState(p => ({ ...p, error: "Invalid email or password" }));
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setFormState(p => ({ ...p, error: "An unexpected error occurred." }));
        } finally {
            setFormState(p => ({ ...p, isLoading: false }));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <h2 className="dt-modal-title">Welcome back</h2>

            <AuthError message={formState.error} />

            <form onSubmit={handleSubmit(onSubmit)} className="dt-modal-form">
                <Input
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail size={16} />}
                    disabled={formState.isLoading}
                    className={errors.email ? "has-error" : ""}
                    {...register("email")}
                />
                {errors.email && <p className="dt-modal-field-error">{errors.email.message}</p>}

                <div className="dt-modal-input-wrapper">
                    <input
                        type={formState.showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        disabled={formState.isLoading}
                        className={`dt-modal-input ${errors.password ? "has-error" : ""}`}
                        style={{ paddingRight: '40px' }}
                        {...register("password")}
                    />
                    <button type="button" className="dt-modal-eye-btn" onClick={() => setFormState(p => ({ ...p, showPassword: !p.showPassword }))}>
                        {formState.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && <p className="dt-modal-field-error">{errors.password.message}</p>}

                <div className="flex justify-end">
                    <button type="button" className="dt-modal-forgot-link" onClick={onForgotPassword} disabled={formState.isLoading}>
                        Forgot password?
                    </button>
                </div>

                <button type="submit" className="dt-modal-primary-btn" disabled={formState.isLoading}>
                    {formState.isLoading ? <><Loader2 className="animate-spin inline mr-8" size={18} /> Signing in...</> : "Sign in"}
                </button>
            </form>

            <AuthSeparator />
            <AuthSocialButtons isLoading={formState.isLoading} />

            <p className="dt-modal-terms">
                By signing in, you agree to our <span className="dt-modal-terms-link">Terms & Service</span>.
            </p>
        </motion.div>
    );
}

// --------------------------------
// Sign Up View
// --------------------------------

function AuthSignUp() {
    const [formState, setFormState] = useState({ isLoading: false, error: null, showPassword: false, showConfirmPassword: false });
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signUpSchema) });
    const router = useRouter();

    const onSubmit = async (data) => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setFormState(p => ({ ...p, error: result.message || "Registration failed" }));
                return;
            }

            // Immediately sign in the user after successful signup
            const signInRes = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (signInRes?.error) {
                setFormState(p => ({ ...p, error: "Account created but sign-in failed. Please sign in manually." }));
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setFormState(p => ({ ...p, error: "An unexpected error occurred." }));
        } finally {
            setFormState(p => ({ ...p, isLoading: false }));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <h2 className="dt-modal-title">Create an account</h2>

            <AuthError message={formState.error} />

            <form onSubmit={handleSubmit(onSubmit)} className="dt-modal-form">
                {/* Side-by-side name inputs */}
                <div className="dt-modal-name-row">
                    <div className="dt-modal-name-field">
                        <Input
                            placeholder="First name"
                            disabled={formState.isLoading}
                            className={errors.firstName ? "has-error" : ""}
                            {...register("firstName")}
                        />
                        {errors.firstName && <p className="dt-modal-field-error">{errors.firstName.message}</p>}
                    </div>
                    <div className="dt-modal-name-field">
                        <Input
                            placeholder="Last name"
                            disabled={formState.isLoading}
                            className={errors.lastName ? "has-error" : ""}
                            {...register("lastName")}
                        />
                        {errors.lastName && <p className="dt-modal-field-error">{errors.lastName.message}</p>}
                    </div>
                </div>

                {/* Email with mail icon */}
                <Input
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail size={16} />}
                    disabled={formState.isLoading}
                    className={errors.email ? "has-error" : ""}
                    {...register("email")}
                />
                {errors.email && <p className="dt-modal-field-error">{errors.email.message}</p>}

                {/* Password */}
                <div className="dt-modal-input-wrapper">
                    <input
                        type={formState.showPassword ? "text" : "password"}
                        placeholder="Password"
                        disabled={formState.isLoading}
                        className={`dt-modal-input ${errors.password ? "has-error" : ""}`}
                        style={{ paddingRight: '40px' }}
                        {...register("password")}
                    />
                    <button type="button" className="dt-modal-eye-btn" onClick={() => setFormState(p => ({ ...p, showPassword: !p.showPassword }))}>
                        {formState.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && <p className="dt-modal-field-error">{errors.password.message}</p>}

                {/* Confirm Password */}
                <div className="dt-modal-input-wrapper">
                    <input
                        type={formState.showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        disabled={formState.isLoading}
                        className={`dt-modal-input ${errors.confirmPassword ? "has-error" : ""}`}
                        style={{ paddingRight: '40px' }}
                        {...register("confirmPassword")}
                    />
                    <button type="button" className="dt-modal-eye-btn" onClick={() => setFormState(p => ({ ...p, showConfirmPassword: !p.showConfirmPassword }))}>
                        {formState.showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmPassword && <p className="dt-modal-field-error">{errors.confirmPassword.message}</p>}

                <button type="submit" className="dt-modal-primary-btn" disabled={formState.isLoading}>
                    {formState.isLoading ? <><Loader2 className="animate-spin inline mr-8" size={18} /> Creating account...</> : "Create an account"}
                </button>
            </form>

            <AuthSeparator />
            <AuthSocialButtons isLoading={formState.isLoading} />

            <p className="dt-modal-terms">
                By creating an account, you agree to our <span className="dt-modal-terms-link">Terms & Service</span>.
            </p>
        </motion.div>
    );
}

// --------------------------------
// Forgot Password View
// --------------------------------

function AuthForgotPassword({ onBack, onSuccess }) {
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

    const onSubmit = async (data) => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            // NOTE: Password reset requires a custom implementation with NextAuth credentials provider.
            // Typically involves sending an email with a unique token and verifying it on a reset page.
            setFormState(p => ({ ...p, error: "Password reset is currently disabled in this demo." }));
        } catch (err) {
            setFormState(p => ({ ...p, error: "An unexpected error occurred." }));
        } finally {
            setFormState(p => ({ ...p, isLoading: false }));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <button type="button" className="dt-modal-back-btn" onClick={onBack} disabled={formState.isLoading}>
                <ArrowLeft size={16} /> Back
            </button>
            <h2 className="dt-modal-title">Reset password</h2>
            <p className="dt-modal-subtitle">Enter your email to receive a reset link.</p>

            <AuthError message={formState.error} />

            <form onSubmit={handleSubmit(onSubmit)} className="dt-modal-form">
                <Input
                    type="email"
                    placeholder="name@company.com"
                    icon={<Mail size={16} />}
                    disabled={formState.isLoading}
                    className={errors.email ? "has-error" : ""}
                    {...register("email")}
                />
                {errors.email && <p className="dt-modal-field-error">{errors.email.message}</p>}

                <button type="submit" className="dt-modal-primary-btn" disabled={formState.isLoading}>
                    {formState.isLoading ? <><Loader2 className="animate-spin inline mr-8" size={18} /> Sending...</> : "Send reset link"}
                </button>
            </form>
        </motion.div>
    );
}

// --------------------------------
// Main Auth Modal Container
// --------------------------------

export default function AuthForm() {
    const [view, setView] = useState("sign-up");
    const router = useRouter();

    const showToggle = view === "sign-in" || view === "sign-up";

    return (
        <div className="dt-modal-card">
            {/* Close button */}
            <button className="dt-modal-close-btn" aria-label="Close" onClick={() => router.push("/")}>
                <X size={18} />
            </button>

            {/* Pill Toggle */}
            {showToggle && (
                <AuthToggle view={view} onSwitch={setView} />
            )}

            {/* Content */}
            <div className="dt-modal-body">
                <AnimatePresence mode="wait">
                    {view === "sign-in" && <AuthSignIn key="sign-in" onForgotPassword={() => setView("forgot-password")} />}
                    {view === "sign-up" && <AuthSignUp key="sign-up" />}
                    {view === "forgot-password" && <AuthForgotPassword key="forgot-password" onBack={() => setView("sign-in")} onSuccess={() => setView("reset-success")} />}
                </AnimatePresence>
            </div>
        </div>
    );
}
