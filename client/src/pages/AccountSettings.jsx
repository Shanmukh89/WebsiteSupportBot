import React, { useState, useRef, useEffect } from 'react';
import {
    User,
    Shield,
    Bot,
    Palette,
    AlertTriangle,
    UploadCloud,
    Eye,
    EyeOff,
    Sun,
    Moon,
    Laptop,
    Save,
    Loader2,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/ui/CustomSelect';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useChatTheme } from '../context/ChatThemeContext';
import { useAgents } from '../context/AgentContext';
import { supabase } from '../lib/supabase';
import './AccountSettings.css';

export default function AccountSettings() {
    const navigate = useNavigate();
    const { themeSettings, setThemeSettings } = useTheme();
    const { chatTheme, setChatTheme } = useChatTheme();
    const { user, updateUser } = useUser();
    const { agents, clearAllData, clearAllSources } = useAgents();

    // Initial State combining local profile/security/AI with global theme
    const [settings, setSettings] = useState({
        // Profile (Loaded from global user context)
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',

        // Security
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',

        // AI Preferences
        aiTone: 'Professional',
        aiStyle: 'Balanced',
        formality: 50,
        creativity: 50,
        salesIntensity: 30,

        // Appearance
        themeMode: themeSettings.themeMode || 'Dark',
        fontStyle: themeSettings.fontStyle || 'Inter',

        // Chat Theme
        chatPrimaryColor: chatTheme.chatPrimaryColor || '#6366f1',
    });

    const [originalSettings, setOriginalSettings] = useState({ ...settings });
    const [hasChanges, setHasChanges] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const fileInputRef = useRef(null);

    // Profile Picture State
    const [previewImage, setPreviewImage] = useState(user.avatar || null);
    const [avatarHasChanges, setAvatarHasChanges] = useState(false);

    // Deep compare to check for changes
    useEffect(() => {
        const isSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
        setHasChanges(isSettingsChanged || avatarHasChanges);
    }, [settings, originalSettings, avatarHasChanges]);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setPreviewImage(preview);
            setAvatarHasChanges(true);
        }
    };

    const handleRemoveAvatar = () => {
        if (previewImage && previewImage.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage);
        }
        setPreviewImage(null);
        setAvatarHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Update Password in Supabase (if provided)
            if (settings.newPassword) {
                if (settings.newPassword !== settings.confirmPassword) {
                    alert("New passwords do not match.");
                    setIsSaving(false);
                    return;
                }
                const { error } = await supabase.auth.updateUser({
                    password: settings.newPassword
                });
                if (error) {
                    alert(`Failed to update password: ${error.message}`);
                    setIsSaving(false);
                    return;
                }
            }

            // 1. Update Global Theme contexts
            setThemeSettings({
                ...themeSettings,
                themeMode: settings.themeMode,
                fontStyle: settings.fontStyle
            });

            // 2. Update Chat Theme context
            setChatTheme({
                ...chatTheme,
                chatPrimaryColor: settings.chatPrimaryColor
            });

            // 3. Update User Context (global)
            await updateUser({
                name: settings.name,
                avatar: previewImage
            });

            setIsSaving(false);

            // Clear password fields after save
            const nextSettings = { ...settings, currentPassword: '', newPassword: '', confirmPassword: '' };
            setSettings(nextSettings);
            setOriginalSettings(nextSettings);

            setAvatarHasChanges(false);
            setHasChanges(false);

            // Show toast
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } catch (error) {
            console.error("Save error:", error);
            setIsSaving(false);
            alert("An error occurred while saving.");
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm("WARNING: This will permanently delete your account and all agent data. Are you absolutely sure?")) {
            clearAllData();
            navigate('/');
        }
    };

    const handleClearKnowledge = async () => {
        if (window.confirm("Are you sure you want to clear the entire knowledge base for your agents? This will remove all indexed pages and uploaded files.")) {
            for (const agent of agents) {
                await clearAllSources(agent.id);
            }
            alert("Knowledge Base has been cleared.");
        }
    };

    return (
        <div className="dt-dash-layout">
            <aside className="dt-dash-sidebar">
                <div className="dt-dash-logo">Site2Support</div>
                <nav className="dt-dash-nav" style={{ marginTop: '20px' }}>
                    <button
                        className="dt-dash-nav-item"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                </nav>
            </aside>

            {/* Main Settings Area */}
            <main className="dt-settings-container">
                <header className="dt-settings-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2>Account Settings</h2>
                        {hasChanges && <span className="dt-unsaved-badge">Unsaved changes</span>}
                    </div>
                </header>

                <div className="dt-settings-content-scroll">
                    <div className="dt-settings-max-width">

                        {/* PROFILE SETTINGS */}
                        <section className="dt-settings-section">
                            <div className="dt-settings-section-header">
                                <User size={20} className="dt-settings-section-icon" />
                                <h3 className="dt-settings-section-title">Profile Information</h3>
                            </div>
                            <div className="dt-settings-section-body">
                                <div className="dt-profile-pic-container">
                                    <div className="dt-profile-pic-preview" onClick={() => fileInputRef.current?.click()}>
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile Preview" />
                                        ) : (
                                            "A"
                                        )}
                                        <div className="dt-profile-pic-overlay">
                                            <UploadCloud size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="dt-profile-pic-actions">
                                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className="dt-btn-outline" onClick={() => fileInputRef.current?.click()}>Upload New</button>
                                            <button type="button" className="dt-btn-outline hover-red" onClick={handleRemoveAvatar}>Remove</button>
                                        </div>
                                        <span className="text-dt-muted" style={{ fontSize: '12px' }}>JPG, GIF or PNG. Max size of 800K</span>
                                    </div>
                                </div>

                                <div className="dt-settings-form-group" style={{ maxWidth: '50%' }}>
                                    <label className="dt-settings-label">Account Name</label>
                                    <input
                                        type="text"
                                        className="dt-settings-input"
                                        value={settings.name}
                                        onChange={(e) => handleSettingChange('name', e.target.value)}
                                    />
                                </div>

                                <div className="dt-settings-form-group" style={{ maxWidth: '50%' }}>
                                    <label className="dt-settings-label">Email Address</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="email"
                                            className="dt-settings-input"
                                            value={settings.email}
                                            disabled
                                        />
                                        <button type="button" className="dt-btn-outline" style={{ whiteSpace: 'nowrap' }} onClick={() => alert("Verification link sent to your current email address.")}>Change Email</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECURITY SETTINGS */}
                        <section className="dt-settings-section">
                            <div className="dt-settings-section-header">
                                <Shield size={20} className="dt-settings-section-icon" />
                                <h3 className="dt-settings-section-title">Security</h3>
                            </div>
                            <div className="dt-settings-section-body">
                                <div className="dt-settings-form-group">
                                    <label className="dt-settings-label">Change Password</label>
                                    <div className="dt-settings-form-row mb-3">
                                        <div className="dt-password-input-wrap">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="dt-settings-input"
                                                placeholder="Current Password"
                                                value={settings.currentPassword}
                                                onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                                            />
                                            <button type="button" className="dt-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div></div>
                                    </div>
                                    <div className="dt-settings-form-row">
                                        <div className="dt-password-input-wrap">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="dt-settings-input"
                                                placeholder="New Password"
                                                value={settings.newPassword}
                                                onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                                            />
                                            {settings.newPassword && (
                                                <div className="dt-password-strength">
                                                    <div className={`dt-pwd-bar ${settings.newPassword.length > 0 ? 'active-weak' : ''}`}></div>
                                                    <div className={`dt-pwd-bar ${settings.newPassword.length > 5 ? 'active-fair' : ''}`}></div>
                                                    <div className={`dt-pwd-bar ${settings.newPassword.length > 8 ? 'active-good' : ''}`}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="dt-password-input-wrap">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="dt-settings-input"
                                                placeholder="Confirm New Password"
                                                value={settings.confirmPassword}
                                                onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>



                        {/* APPEARANCE CUSTOMIZATION */}
                        <section className="dt-settings-section">
                            <div className="dt-settings-section-header">
                                <Palette size={20} className="dt-settings-section-icon" />
                                <h3 className="dt-settings-section-title">Interface Customization</h3>
                            </div>
                            <div className="dt-settings-section-body">


                                <div className="dt-settings-form-group">
                                    <label className="dt-settings-label" style={{ marginBottom: '8px' }}>Theme Mode</label>
                                    <div className="dt-theme-cards">
                                        <div
                                            className={`dt-theme-card ${settings.themeMode === 'Light' ? 'active' : ''}`}
                                            onClick={() => handleSettingChange('themeMode', 'Light')}
                                        >
                                            <Sun size={24} />
                                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Light</span>
                                        </div>
                                        <div
                                            className={`dt-theme-card ${settings.themeMode === 'Dark' ? 'active' : ''}`}
                                            onClick={() => handleSettingChange('themeMode', 'Dark')}
                                        >
                                            <Moon size={24} />
                                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Dark</span>
                                        </div>
                                        <div
                                            className={`dt-theme-card ${settings.themeMode === 'System' ? 'active' : ''}`}
                                            onClick={() => handleSettingChange('themeMode', 'System')}
                                        >
                                            <Laptop size={24} />
                                            <span style={{ fontSize: '13px', fontWeight: '500' }}>System</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* DANGER ZONE */}
                        <section className="dt-settings-section dt-settings-section-danger mt-4">
                            <div className="dt-settings-section-header">
                                <AlertTriangle size={20} className="dt-settings-section-icon" />
                                <h3 className="dt-settings-section-title">Danger Zone</h3>
                            </div>
                            <div className="dt-settings-section-body">
                                <div className="dt-toggle-row">
                                    <div className="dt-toggle-info">
                                        <span className="dt-toggle-title" style={{ color: '#ef4444' }}>Clear Knowledge Base</span>
                                        <span className="dt-toggle-desc">Remove all indexed pages and files for all agents.</span>
                                    </div>
                                    <button type="button" className="dt-btn-outline hover-red" onClick={handleClearKnowledge}>Clear Data</button>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(239,68,68,0.1)', margin: '4px 0' }}></div>
                                <div className="dt-toggle-row">
                                    <div className="dt-toggle-info">
                                        <span className="dt-toggle-title" style={{ color: '#ef4444' }}>Delete Account</span>
                                        <span className="dt-toggle-desc">Permanently delete your account and all data.</span>
                                    </div>
                                    <button type="button" className="dt-btn-danger" onClick={handleDeleteAccount}>Delete Account</button>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Sticky Save Bar */}
                <div className={`dt-settings-save-bar ${hasChanges ? 'visible' : ''}`}>
                    <span className="dt-unsaved-text">You have unsaved changes.</span>
                    <button
                        type="button"
                        className="dt-btn-primary"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? (
                            <><Loader2 size={16} className="spinner" /> Saving...</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                </div>

                {/* Toast Notification */}
                <div className={`dt-toast ${showToast ? 'show' : ''}`}>
                    <CheckCircle2 size={18} />
                    Settings updated successfully
                </div>

            </main>
        </div>
    );
}
