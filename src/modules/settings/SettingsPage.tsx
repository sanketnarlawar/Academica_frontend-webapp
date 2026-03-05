import { Settings, Bell, Shield } from 'lucide-react';

const settingGroups = [
    {
        icon: Settings, label: 'General', settings: [
            { label: 'School Name', type: 'text', value: 'EduCampus International School' },
            { label: 'Academic Year', type: 'select', options: ['2023-24', '2024-25', '2025-26'] },
            { label: 'School Email', type: 'email', value: 'admin@educampus.edu' },
            { label: 'Contact Phone', type: 'tel', value: '+91 80 4567 8901' },
        ],
    },
    {
        icon: Bell, label: 'Notifications', settings: [
            { label: 'Email Notifications', type: 'toggle', value: true },
            { label: 'SMS Alerts', type: 'toggle', value: false },
            { label: 'Fee Reminders', type: 'toggle', value: true },
            { label: 'Attendance Alerts', type: 'toggle', value: true },
        ],
    },
    {
        icon: Shield, label: 'Security', settings: [
            { label: 'Two-Factor Auth', type: 'toggle', value: false },
            { label: 'Session Timeout (mins)', type: 'number', value: '30' },
            { label: 'Password Policy', type: 'select', options: ['Standard', 'Strong', 'Very Strong'] },
        ],
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage system configuration and preferences</p>
            </div>

            <div className="space-y-6">
                {settingGroups.map(group => {
                    const Icon = group.icon;
                    return (
                        <div key={group.label} className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
                                <div className="p-2 rounded-xl bg-violet-500/15">
                                    <Icon className="w-4 h-4 text-violet-400" />
                                </div>
                                <h2 className="text-base font-semibold text-white">{group.label}</h2>
                            </div>
                            <div className="space-y-5">
                                {group.settings.map(setting => (
                                    <div key={setting.label} className="flex items-center justify-between gap-6">
                                        <div>
                                            <div className="text-sm text-white">{setting.label}</div>
                                        </div>
                                        {setting.type === 'toggle' ? (
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked={setting.value as boolean} className="sr-only peer" />
                                                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5 border border-white/10" />
                                            </label>
                                        ) : setting.type === 'select' ? (
                                            <select className="select-field w-56">
                                                {setting.options?.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type={setting.type} defaultValue={setting.value as string} className="input-field w-56" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                <div className="flex justify-end gap-3">
                    <button className="btn-secondary">Reset Defaults</button>
                    <button className="btn-primary">Save Changes</button>
                </div>
            </div>
        </div>
    );
}
