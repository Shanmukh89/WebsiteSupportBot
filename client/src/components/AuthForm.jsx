import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";

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

// Social buttons — Google + Github only per reference
const AuthSocialButtons = ({ isLoading }) => {
    const handleSocialLogin = async (provider) => {
        await supabase.auth.signInWithOAuth({ provider });
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
            <button
                className="dt-modal-social-btn"
                disabled={isLoading}
                type="button"
                aria-label="GitHub"
                onClick={() => handleSocialLogin('github')}
            >
                <svg
                    viewBox="0 0 24 24"
                    style={{ width: "20px", height: "20px", fill: "white" }}
                >
                    <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.38-3.37-1.38-.45-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.64-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.33 9.33 0 0112 7.1c.85.01 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.91 0 1.38-.01 2.5-.01 2.84 0 .26.18.58.69.48A10.26 10.26 0 0022 12.26C22 6.58 17.52 2 12 2z" />
                </svg>
                <span>GitHub</span>
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
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                setFormState(p => ({ ...p, error: error.message }));
            } else {
                navigate('/dashboard');
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
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            const { data: signUpData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.firstName,
                        last_name: data.lastName,
                    }
                }
            });

            if (error) {
                setFormState(p => ({ ...p, error: error.message }));
            } else if (signUpData?.user?.identities?.length === 0) {
                // Supabase returns a fake success with empty identities if the user already exists
                setFormState(p => ({ ...p, error: "Account already exists. Please sign in instead." }));
            } else {
                navigate('/dashboard');
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
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: window.location.origin + '/settings',
            });

            if (error) {
                setFormState(p => ({ ...p, error: error.message }));
            } else {
                onSuccess();
            }
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
// Reset Success View
// --------------------------------

function AuthResetSuccess({ onBack }) {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="text-center" style={{ padding: '24px 0' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(91,91,214,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <MailCheck size={32} style={{ color: 'var(--dt-accent-blue)' }} />
            </div>
            <h2 className="dt-modal-title" style={{ marginBottom: '8px' }}>Check your email</h2>
            <p className="dt-modal-subtitle" style={{ marginBottom: '32px' }}>We sent a password reset link to your email.</p>
            <button className="dt-modal-primary-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }} onClick={onBack}>
                Back to sign in
            </button>
        </motion.div>
    );
}

// --------------------------------
// Main Auth Modal Container
// --------------------------------

export default function Auth() {
    const [view, setView] = useState("sign-up");
    const navigate = useNavigate();

    const showToggle = view === "sign-in" || view === "sign-up";

    return (
        <div className="dt-modal-card">
            {/* Close button */}
            <button className="dt-modal-close-btn" aria-label="Close" onClick={() => navigate("/")}>
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
                    {view === "reset-success" && <AuthResetSuccess key="reset-success" onBack={() => setView("sign-in")} />}
                </AnimatePresence>
            </div>
        </div>
    );
}
