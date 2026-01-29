'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiUploadCloud, FiType, FiTag, FiFileText } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UploadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [suggestedTags, setSuggestedTags] = useState<{ name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') return;
        axios.get('/api/tags').then(res => setSuggestedTags(res.data)).catch(console.error);
    }, [status]);

    if (status === 'loading') return <div className="container" style={{ marginTop: '4rem', textAlign: 'center' }}>Chargement...</div>;

    if (status === 'unauthenticated') {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Connexion requise</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Connectez-vous pour publier vos propres médias.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="/login" className="btn btn-primary">Se connecter</Link>
                        <Link href="/register" className="btn btn-secondary">S'inscrire</Link>
                    </div>
                </div>
            </div>
        );
    }

    const addTag = (tagName: string) => {
        const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (!currentTags.includes(tagName)) {
            const newTags = [...currentTags, tagName].join(', ');
            setTags(newTags);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', tags);

        try {
            await axios.post('/api/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Échec de l\'upload');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', fontWeight: 800 }}>Publier un Média</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                            borderRadius: '1rem',
                            padding: '2rem',
                            textAlign: 'center',
                            background: dragActive ? 'rgba(255,255,255, 0.1)' : 'transparent',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            position: 'relative',
                            minHeight: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleChange}
                            accept="image/*,video/*"
                            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                        />

                        {file ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                {file.type.startsWith('video') ? (
                                    <video src={preview!} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem' }} />
                                ) : (
                                    <img src={preview!} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem', objectFit: 'contain' }} />
                                )}
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{file.name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cliquez ou glissez pour remplacer</p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ pointerEvents: 'none' }}>
                                <FiUploadCloud style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Glissez & Déposez votre média ici</p>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>ou cliquez pour parcourir</p>
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <FiType style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Titre"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <FiFileText style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem', minHeight: '100px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <FiTag style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Tags (séparés par des virgules)"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>

                    {suggestedTags.length > 0 && (
                        <div style={{ marginTop: '-0.5rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tags populaires :</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {suggestedTags.map(tag => (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={() => addTag(tag.name)}
                                        style={{
                                            background: 'rgba(79, 70, 229, 0.1)',
                                            color: 'var(--secondary)',
                                            border: '1px solid rgba(79, 70, 229, 0.2)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        #{tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!file || loading}
                        style={{ marginTop: '1rem', opacity: (!file || loading) ? 0.7 : 1 }}
                    >
                        {loading ? 'Publication en cours...' : 'Publier'}
                    </button>
                </form>
            </div>
        </div>
    );
}
