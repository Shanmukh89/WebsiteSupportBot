import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck, X } from "lucide-react";
import { Button } from "../components/ui/Button";

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

// Social buttons — Google + Apple only per reference
const AuthSocialButtons = ({ isLoading }) => (
    <div className="dt-modal-social-row">
        <button className="dt-modal-social-btn" disabled={isLoading} type="button" aria-label="Google">
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Google</span>
        </button>
        <button className="dt-modal-social-btn" disabled={isLoading} type="button" aria-label="Apple">
            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'white' }}>
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.25.68 2.74.68.42 0 1.63-.78 3.22-.78 1.58.02 2.82.72 3.54 1.76-3.22 1.84-2.67 6.13.43 7.37-.73 1.77-1.39 3.11-1.93 3.94M12.03 7.25c-.21-3.29 2.83-5.59 5.3-5.56.32 3.19-2.92 5.56-5.3 5.56z" />
            </svg>
            <span>Apple</span>
        </button>
    </div>
);

// --------------------------------
// Sign In View
// --------------------------------

function AuthSignIn({ onForgotPassword }) {
    const [formState, setFormState] = useState({ isLoading: false, error: null, showPassword: false });
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signInSchema) });

    const onSubmit = async () => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            await new Promise(r => setTimeout(r, 1500));
            setFormState(p => ({ ...p, error: "Invalid email or password" }));
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

    const onSubmit = async () => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        try {
            await new Promise(r => setTimeout(r, 1500));
            setFormState(p => ({ ...p, error: "Email already registered" }));
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

    const onSubmit = async () => {
        setFormState(p => ({ ...p, isLoading: true, error: null }));
        setTimeout(() => onSuccess(), 1500);
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

    const showToggle = view === "sign-in" || view === "sign-up";

    return (
        <div className="dt-modal-card">
            {/* Close button */}
            <button className="dt-modal-close-btn" aria-label="Close">
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
