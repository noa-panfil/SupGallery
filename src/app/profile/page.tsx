'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiSave, FiLock, FiImage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function ProfilePage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password && !file) {
            setMessage({ type: 'error', text: 'Veuillez modifier au moins un champ.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        if (password) formData.append('password', password);
        if (file) formData.append('file', file);

        try {
            await axios.patch('/api/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });

            // Update session if image changed to reflect automatically in Navbar
            if (file) {
                // A reload or re-fetch session might be needed, handled partially by update()
                await update();
                router.refresh();
            }

            setPassword('');
            setFile(null);
            setPreview(null);

        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Une erreur est survenue.' });
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') return <div className="container" style={{ marginTop: '4rem', textAlign: 'center' }}>Chargement...</div>;

    if (status === 'unauthenticated') {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Connexion requise</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Vous devez être connecté pour accéder à votre profil et modifier vos informations.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="/login" className="btn btn-primary">Se connecter</Link>
                        <Link href="/register" className="btn btn-secondary">S'inscrire</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 800 }}>Mon Profil</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <img
                            src={preview || session?.user?.image || 'https://via.placeholder.com/100'}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }}
                        />
                        <label htmlFor="pfp-upload" style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: 'var(--accent)',
                            color: 'white',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '2px solid var(--background)'
                        }}>
                            <FiImage size={16} />
                        </label>
                        <input type="file" id="pfp-upload" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>{session?.user?.name}</h2>
                        <p style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: message.type === 'success' ? '#34d399' : '#f87171',
                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                        }}>
                            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                            {message.text}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Nouveau mot de passe</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="Laisser vide pour ne pas changer"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FiSave style={{ marginRight: '0.5rem' }} /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </div>
        </div>
    );
}
